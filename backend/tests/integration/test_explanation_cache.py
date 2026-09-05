from unittest.mock import AsyncMock, patch

from sqlalchemy.exc import IntegrityError

from src.config import get_settings
from src.core.constants import (
    EXPLANATION_MISSING_REFERENCE_MESSAGE,
    EXPLANATION_NORMAL_VALUE_MESSAGE,
)
from src.features.ai_explanations import service as explanation_service
from src.models.explanation_cache import ExplanationCache
from tests.fixtures.seed_data import (
    create_completed_report,
    create_test_profile,
    create_test_reference_ranges,
)


def setup_users_profile_and_report(db_session, client):
    resp1 = client.post(
        "/api/auth/signup",
        json={"name": "Owner User", "email": "owner@mediora.dev", "password": "password123"},
    )
    user1_id = resp1.json()["user"]["id"]
    token1 = resp1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    resp2 = client.post(
        "/api/auth/signup",
        json={"name": "Other User", "email": "other@mediora.dev", "password": "password123"},
    )
    user2_id = resp2.json()["user"]["id"]
    token2 = resp2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    create_test_reference_ranges(db_session)
    profile = create_test_profile(db_session, user1_id, species="human")

    return db_session, user1_id, user2_id, profile, headers1, headers2


def test_cache_hit_returns_without_llm_call(client, db_session):
    """1. Pre-existing ExplanationCache row is returned directly on cache hit without LLM invocation."""
    db, user1_id, user2_id, profile, headers1, _ = setup_users_profile_and_report(db_session, client)

    # Abnormal Hemoglobin (ref 12-17.5, val 25.0 -> high_severe)
    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Hemoglobin", "value": 25.0, "ref_low": 12.0, "ref_high": 17.5}],
    )
    val_id = report.test_values[0].id

    # Pre-seed cache entry
    cache_row = ExplanationCache(
        canonical_test_name="Hemoglobin",
        severity_bucket="high_severe",
        species_category="human",
        explanation_text="Cached pre-warmed explanation for high hemoglobin.",
    )
    db.add(cache_row)
    db.commit()

    with patch("src.services.openrouter_client.call_llm", new_callable=AsyncMock) as mock_llm:
        resp = client.get(f"/api/reports/{report.id}/values/{val_id}/explanation", headers=headers1)
        assert resp.status_code == 200
        assert resp.json()["explanation_text"] == "Cached pre-warmed explanation for high hemoglobin."
        mock_llm.assert_not_called()


def test_cache_shared_across_different_reports(client, db_session):
    """2. §15 test #20: Explanations generated for one report are cached and reused for other reports/profiles."""
    db, user1_id, user2_id, profile1, headers1, headers2 = setup_users_profile_and_report(db_session, client)

    profile2 = create_test_profile(db, user2_id, species="human")

    # Both profiles have abnormal Creatinine (ref 0.6-1.2, val 3.0 -> high_severe)
    report1 = create_completed_report(
        db, profile1.id, [{"test_name": "Creatinine", "value": 3.0, "ref_low": 0.6, "ref_high": 1.2}]
    )
    report2 = create_completed_report(
        db, profile2.id, [{"test_name": "Creatinine", "value": 3.0, "ref_low": 0.6, "ref_high": 1.2}]
    )

    val_id1 = report1.test_values[0].id
    val_id2 = report2.test_values[0].id

    llm_output = "Creatinine is a waste product filtered by the kidneys. This result is above the typical range."

    with patch("src.services.openrouter_client.call_llm", new_callable=AsyncMock, return_value=llm_output) as mock_llm:
        # First request by User 1 generates & caches
        resp1 = client.get(f"/api/reports/{report1.id}/values/{val_id1}/explanation", headers=headers1)
        assert resp1.status_code == 200
        assert "Creatinine is a waste product" in resp1.json()["explanation_text"]
        assert mock_llm.call_count == 1

        # Second request by User 2 hits cache
        resp2 = client.get(f"/api/reports/{report2.id}/values/{val_id2}/explanation", headers=headers2)
        assert resp2.status_code == 200
        assert resp2.json()["explanation_text"] == resp1.json()["explanation_text"]
        assert mock_llm.call_count == 1  # Still 1 call total!


def test_guardrail_failure_serves_fallback_without_visible_error(client, db_session):
    """3. §15 test #19: Explanation with disallowed phrase fails guardrail, serves fallback JSON, and avoids caching."""
    db, user1_id, user2_id, profile, headers1, _ = setup_users_profile_and_report(db_session, client)

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Hemoglobin", "value": 25.0, "ref_low": 12.0, "ref_high": 17.5}],
    )
    val_id = report.test_values[0].id

    unsafe_output = "Hemoglobin carries oxygen. You have polycythemia vera."

    with patch("src.services.openrouter_client.call_llm", new_callable=AsyncMock, return_value=unsafe_output):
        resp = client.get(f"/api/reports/{report.id}/values/{val_id}/explanation", headers=headers1)
        assert resp.status_code == 200
        text = resp.json()["explanation_text"]

        assert "Hemoglobin is the protein in red blood cells that carries oxygen" in text
        assert "you have" not in text.lower()

    cached = db.query(ExplanationCache).filter_by(canonical_test_name="Hemoglobin").first()
    assert cached is None


def test_llm_exception_serves_fallback_silently(client, db_session):
    """4. §15 test #21: LLM network exception falls back gracefully to safe text without throwing 500/502 error."""
    db, user1_id, user2_id, profile, headers1, _ = setup_users_profile_and_report(db_session, client)

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Blood Sugar", "value": 250.0, "ref_low": 70.0, "ref_high": 100.0}],
    )
    val_id = report.test_values[0].id

    with patch("src.services.openrouter_client.call_llm", new_callable=AsyncMock, side_effect=RuntimeError("API Timeout")):
        resp = client.get(f"/api/reports/{report.id}/values/{val_id}/explanation", headers=headers1)
        assert resp.status_code == 200
        text = resp.json()["explanation_text"]
        assert "Blood sugar (glucose) measures circulating glucose levels" in text


def test_normal_value_returns_static_message_no_llm_call(client, db_session):
    """5. Normal values (status=green) return EXPLANATION_NORMAL_VALUE_MESSAGE without invoking LLM or creating cache rows."""
    db, user1_id, user2_id, profile, headers1, _ = setup_users_profile_and_report(db_session, client)

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Hemoglobin", "value": 14.5, "ref_low": 12.0, "ref_high": 17.5}],
    )
    val_id = report.test_values[0].id

    with patch("src.services.openrouter_client.call_llm", new_callable=AsyncMock) as mock_llm:
        resp = client.get(f"/api/reports/{report.id}/values/{val_id}/explanation", headers=headers1)
        assert resp.status_code == 200
        assert resp.json()["explanation_text"] == EXPLANATION_NORMAL_VALUE_MESSAGE
        mock_llm.assert_not_called()

    assert db.query(ExplanationCache).count() == 0


def test_missing_reference_range_returns_graceful_message(client, db_session):
    """6. Values missing ref_low/ref_high return EXPLANATION_MISSING_REFERENCE_MESSAGE without calling LLM."""
    db, user1_id, user2_id, profile, headers1, _ = setup_users_profile_and_report(db_session, client)

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Hemoglobin", "value": 14.5, "ref_low": None, "ref_high": 17.5}],
    )
    val_id = report.test_values[0].id

    with patch("src.services.openrouter_client.call_llm", new_callable=AsyncMock) as mock_llm:
        resp = client.get(f"/api/reports/{report.id}/values/{val_id}/explanation", headers=headers1)
        assert resp.status_code == 200
        assert resp.json()["explanation_text"] == EXPLANATION_MISSING_REFERENCE_MESSAGE
        mock_llm.assert_not_called()


def test_value_id_must_belong_to_report_id(client, db_session):
    """7. Fetching an explanation where value_id does not belong to report_id returns 404 Not Found."""
    db, user1_id, user2_id, profile, headers1, _ = setup_users_profile_and_report(db_session, client)

    report1 = create_completed_report(
        db, profile.id, [{"test_name": "Hemoglobin", "value": 14.5, "ref_low": 12.0, "ref_high": 17.5}]
    )
    report2 = create_completed_report(
        db, profile.id, [{"test_name": "Creatinine", "value": 0.9, "ref_low": 0.6, "ref_high": 1.2}]
    )

    val_id2 = report2.test_values[0].id

    resp = client.get(f"/api/reports/{report1.id}/values/{val_id2}/explanation", headers=headers1)
    assert resp.status_code == 404


def test_wrong_owner_rejected(client, db_session):
    """8. User B attempting to fetch explanation for User A's report gets 403 Forbidden."""
    db, user1_id, user2_id, profile, headers1, headers2 = setup_users_profile_and_report(db_session, client)

    report = create_completed_report(
        db,
        profile.id,
        [{"test_name": "Hemoglobin", "value": 14.5, "ref_low": 12.0, "ref_high": 17.5}],
    )
    val_id = report.test_values[0].id

    resp = client.get(f"/api/reports/{report.id}/values/{val_id}/explanation", headers=headers2)
    assert resp.status_code == 403


def test_concurrent_cache_miss_recovers_from_integrity_error(client, db_session):
    """9. Race condition raising IntegrityError on db.commit() recovers by re-querying existing cache row."""
    db, user1_id, user2_id, profile, headers1, _ = setup_users_profile_and_report(db_session, client)

    # Pre-seed target cache row
    existing_row = ExplanationCache(
        canonical_test_name="ALT",
        severity_bucket="high_severe",
        species_category="human",
        explanation_text="Existing ALT explanation from concurrent insert.",
    )
    db.add(existing_row)
    db.commit()

    # Simulate IntegrityError on db.commit() during _generate_and_cache_explanation
    with patch.object(db, "commit", side_effect=IntegrityError("statement", {}, None)):
        llm_output = "Fresh ALT explanation."
        with patch("src.services.openrouter_client.call_llm", new_callable=AsyncMock, return_value=llm_output):
            result = explanation_service._generate_and_cache_explanation(
                db=db,
                canonical_test_name="ALT",
                severity_bucket="high_severe",
                species_category="human",
                direction="high",
            )
            assert result == "Existing ALT explanation from concurrent insert."


def test_admin_seed_requires_admin_key(client, db_session):
    """10. POST /api/admin/explanation-cache/seed without valid X-Admin-Key is rejected."""
    # Missing header
    resp1 = client.post("/api/admin/explanation-cache/seed", json={})
    assert resp1.status_code in (401, 403)

    # Wrong key header
    resp2 = client.post(
        "/api/admin/explanation-cache/seed",
        json={},
        headers={"X-Admin-Key": "invalid_admin_secret"},
    )
    assert resp2.status_code in (401, 403)


def test_admin_seed_populates_cache(client, db_session):
    """11. Admin seed endpoint pre-populates target combos with valid X-Admin-Key header."""
    db, user1_id, user2_id, profile, headers1, _ = setup_users_profile_and_report(db_session, client)

    admin_headers = {"X-Admin-Key": get_settings().admin_api_key}

    target = {
        "canonical_test_name": "Albumin",
        "severity_bucket": "low_severe",
        "species_category": "human",
    }

    llm_output = "Albumin is a liver protein. This value is below the typical range."

    with patch("src.services.openrouter_client.call_llm", new_callable=AsyncMock, return_value=llm_output):
        resp = client.post("/api/admin/explanation-cache/seed", json={"targets": [target]}, headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["generated"] == 1
        assert resp.json()["already_cached"] == 0

    cached = db.query(ExplanationCache).filter_by(canonical_test_name="Albumin").first()
    assert cached is not None
    assert cached.explanation_text == "Albumin is a liver protein. This value is below the typical range."


def test_admin_seed_is_idempotent(client, db_session):
    """12. Running admin seed endpoint twice skips already cached entries cleanly."""
    db, user1_id, user2_id, profile, headers1, _ = setup_users_profile_and_report(db_session, client)

    admin_headers = {"X-Admin-Key": get_settings().admin_api_key}

    target = {
        "canonical_test_name": "Potassium",
        "severity_bucket": "high_severe",
        "species_category": "human",
    }

    llm_output = "Potassium regulates heart rhythm. This value is above the typical range."

    with patch("src.services.openrouter_client.call_llm", new_callable=AsyncMock, return_value=llm_output):
        # 1st Run: Generates 1
        resp1 = client.post("/api/admin/explanation-cache/seed", json={"targets": [target]}, headers=admin_headers)
        assert resp1.status_code == 200
        assert resp1.json()["generated"] == 1
        assert resp1.json()["already_cached"] == 0

        # 2nd Run: Idempotent (already_cached = 1)
        resp2 = client.post("/api/admin/explanation-cache/seed", json={"targets": [target]}, headers=admin_headers)
        assert resp2.status_code == 200
        assert resp2.json()["generated"] == 0
        assert resp2.json()["already_cached"] == 1
