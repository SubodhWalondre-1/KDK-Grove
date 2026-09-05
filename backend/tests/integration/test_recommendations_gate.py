"""Integration tests for Finding-Driven AI Insights Engine, severity gating, and caching."""

import json
from unittest.mock import AsyncMock, patch
import pytest

from src.core.constants import URGENT_CARE_MESSAGE
from src.models.recommendation import Recommendation
from tests.fixtures.seed_data import (
    create_completed_report,
    create_test_profile,
    create_test_reference_ranges,
)

LLM_MOCK_PATH = "src.features.recommendations.service.call_llm"


@pytest.fixture()
def setup_user_and_report(db_session, client):
    # Signup user 1
    resp1 = client.post(
        "/api/auth/signup",
        json={"name": "User One", "email": "user1@mediora.dev", "password": "password123"},
    )
    user1_id = resp1.json()["user"]["id"]
    token1 = resp1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Signup user 2 (for ownership check tests)
    resp2 = client.post(
        "/api/auth/signup",
        json={"name": "User Two", "email": "user2@mediora.dev", "password": "password123"},
    )
    token2 = resp2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    create_test_reference_ranges(db_session)
    profile1 = create_test_profile(db_session, user1_id, species="human")

    return db_session, user1_id, profile1, headers1, headers2


def _make_mock_llm_response(findings_data):
    """Build a mock LLM JSON response in the new finding-driven format."""
    recs = []
    for f in findings_data:
        recs.append({
            "finding_parameter": f["test_name"],
            "why_flagged": f"Value {f['value']} is outside reference range.",
            "simple_explanation": f"{f['test_name']} measures an important health indicator.",
            "general_support": [f"Lifestyle guidance for {f['test_name']}"],
            "discuss_with_clinician": [f"Should {f['test_name']} be retested?"],
            "follow_up": ["Schedule follow-up with your doctor."],
            "evidence_sources": ["diet_general_framework"],
        })
    return json.dumps({"recommendations": recs})


def test_severe_value_returns_urgent_care_with_insights(client, setup_user_and_report):
    """Severe deviation triggers urgent care banner alongside finding-driven insights."""
    db, user1_id, profile, headers1, _ = setup_user_and_report

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Hemoglobin", "value": 30.0, "ref_low": 12.0, "ref_high": 17.5}],
    )

    mock_response = _make_mock_llm_response([{"test_name": "Hemoglobin", "value": 30.0}])

    with patch(LLM_MOCK_PATH, new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = mock_response
        response = client.post(
            f"/api/reports/{report.id}/recommendations/generate",
            headers=headers1,
        )

    assert response.status_code == 200
    data = response.json()

    assert data["is_urgent"] is True
    assert data["urgent_care_message"] == URGENT_CARE_MESSAGE
    assert data["severity_gate"] == "critical"
    assert data["has_been_generated"] is True

    # Verify findings structure
    assert len(data["findings"]) >= 1
    hb_finding = next((f for f in data["findings"] if f["parameter"] == "Hemoglobin"), None)
    assert hb_finding is not None
    assert hb_finding["status"] == "high"
    assert hb_finding["priority"] == "attention"

    # Verify recommendations structure
    assert len(data["recommendations"]) >= 1
    hb_rec = next((r for r in data["recommendations"] if r["finding_parameter"] == "Hemoglobin"), None)
    assert hb_rec is not None
    assert "why_flagged" in hb_rec
    assert "general_support" in hb_rec
    assert "discuss_with_clinician" in hb_rec
    assert "follow_up" in hb_rec

    mock_llm.assert_called_once()


def test_moderate_values_produce_finding_driven_insights(client, setup_user_and_report):
    """Moderate deviations trigger LLM synthesis into finding-driven recommendations."""
    db, user1_id, profile, headers1, _ = setup_user_and_report

    report = create_completed_report(
        db,
        profile.id,
        [
            {"test_name": "Blood Sugar", "value": 110.0, "ref_low": 70.0, "ref_high": 100.0},
            {"test_name": "Hemoglobin", "value": 18.5, "ref_low": 12.0, "ref_high": 17.5},
        ],
    )

    mock_response = _make_mock_llm_response([
        {"test_name": "Blood Sugar", "value": 110.0},
        {"test_name": "Hemoglobin", "value": 18.5},
    ])

    with patch(LLM_MOCK_PATH, new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = mock_response
        response = client.post(
            f"/api/reports/{report.id}/recommendations/generate",
            headers=headers1,
        )

    assert response.status_code == 200
    data = response.json()

    assert data["is_urgent"] is False
    assert data["severity_gate"] == "moderate"

    # Verify summary counts
    assert "summary" in data
    assert data["summary"]["attention"] + data["summary"]["monitoring"] >= 2

    # Verify both findings present
    params = [f["parameter"] for f in data["findings"]]
    assert "Blood Sugar" in params
    assert "Hemoglobin" in params

    # Verify recommendations exist for both
    rec_params = [r["finding_parameter"] for r in data["recommendations"]]
    assert "Blood Sugar" in rec_params
    assert "Hemoglobin" in rec_params

    mock_llm.assert_called_once()


def test_second_call_does_not_reinvoke_llm(client, setup_user_and_report):
    """Second POST /generate with force_regenerate=false returns cached insights without re-invoking LLM."""
    db, user1_id, profile, headers1, _ = setup_user_and_report

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Blood Sugar", "value": 110.0, "ref_low": 70.0, "ref_high": 100.0}],
    )

    mock_response = _make_mock_llm_response([{"test_name": "Blood Sugar", "value": 110.0}])

    with patch(LLM_MOCK_PATH, new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = mock_response

        # First call: invokes LLM
        resp1 = client.post(f"/api/reports/{report.id}/recommendations/generate", headers=headers1)
        assert resp1.status_code == 200
        assert mock_llm.call_count == 1

        mock_llm.reset_mock()

        # Second call: uses cache (0 LLM calls)
        resp2 = client.post(f"/api/reports/{report.id}/recommendations/generate", headers=headers1)
        assert resp2.status_code == 200
        assert resp2.json()["has_been_generated"] is True
        mock_llm.assert_not_called()


def test_force_regenerate_bypasses_cache(client, setup_user_and_report):
    """force_regenerate=true deletes existing rows and re-invokes the LLM for fresh insights."""
    db, user1_id, profile, headers1, _ = setup_user_and_report

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Blood Sugar", "value": 110.0, "ref_low": 70.0, "ref_high": 100.0}],
    )

    mock_response_1 = _make_mock_llm_response([{"test_name": "Blood Sugar", "value": 110.0}])
    mock_response_2 = json.dumps({
        "recommendations": [{
            "finding_parameter": "Blood Sugar",
            "why_flagged": "Updated: Value 110.0 is above range.",
            "simple_explanation": "Updated explanation.",
            "general_support": ["Updated guidance"],
            "discuss_with_clinician": ["Updated question?"],
            "follow_up": ["Updated follow-up."],
            "evidence_sources": [],
        }]
    })

    with patch(LLM_MOCK_PATH, new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = mock_response_1

        # Initial call
        client.post(f"/api/reports/{report.id}/recommendations/generate", headers=headers1)

        # Force regenerate call
        mock_llm.return_value = mock_response_2
        resp2 = client.post(
            f"/api/reports/{report.id}/recommendations/generate?force_regenerate=true",
            headers=headers1,
        )

        assert resp2.status_code == 200
        data = resp2.json()
        sugar_rec = next((r for r in data["recommendations"] if r["finding_parameter"] == "Blood Sugar"), None)
        assert sugar_rec is not None
        assert "Updated" in sugar_rec["why_flagged"]
        assert mock_llm.call_count == 2


def test_malformed_llm_response_uses_fallback(client, setup_user_and_report):
    """Unparseable LLM output still returns a valid response with fallback recommendations."""
    db, user1_id, profile, headers1, _ = setup_user_and_report

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Blood Sugar", "value": 110.0, "ref_low": 70.0, "ref_high": 100.0}],
    )

    with patch(LLM_MOCK_PATH, new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = "Sorry, I am an AI and cannot process this request."

        response = client.post(
            f"/api/reports/{report.id}/recommendations/generate",
            headers=headers1,
        )

    assert response.status_code == 200
    data = response.json()

    # Should have fallback recommendations
    assert data["has_been_generated"] is True
    assert len(data["findings"]) >= 1
    assert len(data["recommendations"]) >= 1

    # Verify fallback rec has valid structure
    rec = data["recommendations"][0]
    assert "why_flagged" in rec
    assert "general_support" in rec
    assert len(rec["general_support"]) > 0


def test_all_normal_report_returns_findings_only(client, setup_user_and_report):
    """Report with all normal parameters returns findings with no abnormal recommendations."""
    db, user1_id, profile, headers1, _ = setup_user_and_report

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Hemoglobin", "value": 14.5, "ref_low": 12.0, "ref_high": 17.5}],
    )

    # LLM should NOT be called for all-normal reports
    with patch(LLM_MOCK_PATH, new_callable=AsyncMock) as mock_llm:
        response = client.post(
            f"/api/reports/{report.id}/recommendations/generate",
            headers=headers1,
        )

    assert response.status_code == 200
    data = response.json()

    assert data["severity_gate"] == "normal"
    assert data["has_been_generated"] is True
    assert data["summary"]["normal"] >= 1
    assert data["summary"]["attention"] == 0
    assert len(data["recommendations"]) == 0
    mock_llm.assert_not_called()


def test_get_recommendations_before_generation_returns_empty_state(client, setup_user_and_report):
    """GET /recommendations before generation returns 200 with valid empty state."""
    db, user1_id, profile, headers1, _ = setup_user_and_report

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Hemoglobin", "value": 14.5, "ref_low": 12.0, "ref_high": 17.5}],
    )

    response = client.get(f"/api/reports/{report.id}/recommendations", headers=headers1)
    assert response.status_code == 200
    data = response.json()

    assert data["has_been_generated"] is False
    assert data["is_urgent"] is False
    assert data["findings"] == []
    assert data["recommendations"] == []


def test_recommendations_wrong_owner_rejected(client, setup_user_and_report):
    """GET and POST for a report owned by another user return 403 Forbidden."""
    db, user1_id, profile, _, headers2 = setup_user_and_report

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Hemoglobin", "value": 14.5, "ref_low": 12.0, "ref_high": 17.5}],
    )

    get_resp = client.get(f"/api/reports/{report.id}/recommendations", headers=headers2)
    assert get_resp.status_code == 403

    post_resp = client.post(
        f"/api/reports/{report.id}/recommendations/generate",
        headers=headers2,
    )
    assert post_resp.status_code == 403


def test_insights_response_has_evidence_sources(client, setup_user_and_report):
    """Verify the response includes RAG evidence sources metadata."""
    db, user1_id, profile, headers1, _ = setup_user_and_report

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Blood Sugar", "value": 150.0, "ref_low": 70.0, "ref_high": 100.0}],
    )

    mock_response = _make_mock_llm_response([{"test_name": "Blood Sugar", "value": 150.0}])

    with patch(LLM_MOCK_PATH, new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = mock_response
        response = client.post(
            f"/api/reports/{report.id}/recommendations/generate",
            headers=headers1,
        )

    assert response.status_code == 200
    data = response.json()

    # Verify sources are populated from RAG
    assert "sources" in data
    assert isinstance(data["sources"], list)

    # Verify recommendation has evidence_sources
    if data["recommendations"]:
        rec = data["recommendations"][0]
        assert "evidence_sources" in rec


def test_findings_sorted_by_priority(client, setup_user_and_report):
    """Verify findings are sorted: attention first, then monitoring, then normal."""
    db, user1_id, profile, headers1, _ = setup_user_and_report

    report = create_completed_report(
        db,
        profile.id,
        [
            {"test_name": "Hemoglobin", "value": 14.5, "ref_low": 12.0, "ref_high": 17.5},  # normal
            {"test_name": "Blood Sugar", "value": 200.0, "ref_low": 70.0, "ref_high": 100.0},  # severe
            {"test_name": "WBC", "value": 12.0, "ref_low": 4.0, "ref_high": 11.0},  # borderline
        ],
    )

    mock_response = _make_mock_llm_response([
        {"test_name": "Blood Sugar", "value": 200.0},
        {"test_name": "WBC", "value": 12.0},
    ])

    with patch(LLM_MOCK_PATH, new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = mock_response
        response = client.post(
            f"/api/reports/{report.id}/recommendations/generate",
            headers=headers1,
        )

    assert response.status_code == 200
    data = response.json()

    findings = data["findings"]
    priorities = [f["priority"] for f in findings]

    # Attention/monitoring should come before normal
    normal_idx = next((i for i, p in enumerate(priorities) if p == "normal"), len(priorities))
    for i in range(normal_idx):
        assert priorities[i] in ("attention", "monitoring")
