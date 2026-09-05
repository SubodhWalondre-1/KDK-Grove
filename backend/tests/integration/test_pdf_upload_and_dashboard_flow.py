"""Integration tests for the complete PDF upload and Health Dashboard flow.

Tests:
1. PDF upload with human profile and real PDF structure.
2. Verification of returned report_id.
3. Verification of status endpoint (processing, completed, failed).
4. Both GET /api/reports/{id} and GET /api/reports/{id}/dashboard return the SAME report.
5. Verification of health_score, test_values with status, profile metadata.
6. Health insights endpoint compatibility (/health-insights, /insights).
7. Processing status (409 Conflict) and failed status (400 Bad Request) on dashboard endpoint.
8. Cross-user authorization checks (403 Forbidden).
"""

import io
from datetime import date
from unittest.mock import AsyncMock, patch

import pytest
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from src.core.constants import (
    REPORT_STATUS_COMPLETED,
    REPORT_STATUS_FAILED,
    REPORT_STATUS_PROCESSING,
    STATUS_GREEN,
    STATUS_RED,
)
from src.models.report import Report
from tests.fixtures.seed_data import (
    create_completed_report,
    create_test_profile,
    create_test_reference_ranges,
)


def _generate_test_pdf() -> bytes:
    """Generate a real, valid PDF in memory with medical lab report text."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.drawString(100, 750, "Medical Laboratory Report")
    p.drawString(100, 730, "Patient: Test Human - Male")
    p.drawString(100, 700, "Hemoglobin 14.5 g/dL 13.8 - 17.2")
    p.drawString(100, 680, "Blood Sugar 95.0 mg/dL 70.0 - 100.0")
    p.drawString(100, 660, "Platelet Count 250000 cells/mcL 150000 - 450000")
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer.getvalue()


@pytest.fixture()
def setup_user_and_profile(db_session, client):
    """Create a test user, profile, and auth headers."""
    resp = client.post(
        "/api/auth/signup",
        json={"name": "Alice Patient", "email": "alice@mediora.dev", "password": "securepassword123"},
    )
    data = resp.json()
    user_id = data["user"]["id"]
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    profile = create_test_profile(db_session, user_id, species="human")
    profile.gender = "Male"
    db_session.commit()
    db_session.refresh(profile)
    create_test_reference_ranges(db_session)
    return db_session, profile, headers, user_id


def test_pdf_upload_and_dashboard_end_to_end(client, setup_user_and_profile):
    """Complete acceptance flow:
    Upload PDF -> processing completes -> verify report_id -> check detail and dashboard.
    """
    db, profile, headers, user_id = setup_user_and_profile
    pdf_bytes = _generate_test_pdf()
    pdf_file = ("report.pdf", io.BytesIO(pdf_bytes), "application/pdf")

    # Mock LLM to return structured tests cleanly
    mock_extracted = [
        {"test_name": "Hemoglobin", "value": 14.5, "unit": "g/dL", "ref_low": 13.8, "ref_high": 17.2},
        {"test_name": "Blood Sugar", "value": 95.0, "unit": "mg/dL", "ref_low": 70.0, "ref_high": 100.0},
    ]

    with patch(
        "src.features.report_extraction.service.extract_structured_data",
        new_callable=AsyncMock,
        return_value=mock_extracted,
    ):
        upload_resp = client.post(
            "/api/reports/upload",
            data={"profile_id": str(profile.id)},
            files={"file": pdf_file},
            headers=headers,
        )

    # 1. Verify upload response
    assert upload_resp.status_code == 201
    upload_data = upload_resp.json()
    assert "report_id" in upload_data
    assert upload_data["report_id"] is not None
    assert upload_data["id"] == upload_data["report_id"]
    report_id = upload_data["report_id"]

    # 2. Check status endpoint
    status_resp = client.get(f"/api/reports/{report_id}/status", headers=headers)
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["report_id"] == report_id
    assert status_data["status"] == REPORT_STATUS_COMPLETED

    # 3. Call GET /api/reports/{report_id}
    detail_resp = client.get(f"/api/reports/{report_id}", headers=headers)
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert detail_data["id"] == report_id
    assert detail_data["report_id"] == report_id
    assert detail_data["status"] == REPORT_STATUS_COMPLETED
    assert detail_data["health_score"] is not None
    assert len(detail_data["test_values"]) == 2

    # 4. Call GET /api/reports/{report_id}/dashboard
    dash_resp = client.get(f"/api/reports/{report_id}/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()

    # 5. Confirm both return data for the SAME report
    assert dash_data["report_id"] == report_id
    assert dash_data["id"] == report_id
    assert dash_data["health_score"] == detail_data["health_score"]

    # 6. Confirm profile and test values
    assert dash_data["profile_name"] == profile.profile_name
    assert dash_data["species"] == "human"
    assert len(dash_data["test_values"]) == 2

    for tv in dash_data["test_values"]:
        assert "test_name" in tv
        assert "value" in tv
        assert "unit" in tv
        assert "status" in tv
        assert tv["status"] == STATUS_GREEN

    # 7. Check health insights bundled in dashboard
    assert "health_insights" in dash_data
    assert dash_data["health_insights"] is not None

    # 8. Check dedicated health insights endpoint aliases
    insights_resp1 = client.get(f"/api/reports/{report_id}/health-insights", headers=headers)
    assert insights_resp1.status_code == 200
    assert "findings" in insights_resp1.json()

    insights_resp2 = client.get(f"/api/reports/{report_id}/insights", headers=headers)
    assert insights_resp2.status_code == 200
    assert "findings" in insights_resp2.json()


def test_dashboard_incomplete_processing_handled_correctly(client, setup_user_and_profile):
    """Ensure dashboard endpoint does not return incomplete data when processing or failed."""
    db, profile, headers, _ = setup_user_and_profile

    # Create a report in PROCESSING state
    processing_report = Report(
        profile_id=profile.id,
        original_file_path="dummy/path/report.pdf",
        status=REPORT_STATUS_PROCESSING,
    )
    db.add(processing_report)
    db.commit()
    db.refresh(processing_report)

    resp_proc = client.get(f"/api/reports/{processing_report.id}/dashboard", headers=headers)
    assert resp_proc.status_code == 409
    assert "still processing" in resp_proc.json()["detail"]

    # Create a report in FAILED state
    failed_report = Report(
        profile_id=profile.id,
        original_file_path="dummy/path/failed.pdf",
        status=REPORT_STATUS_FAILED,
    )
    db.add(failed_report)
    db.commit()
    db.refresh(failed_report)

    resp_fail = client.get(f"/api/reports/{failed_report.id}/dashboard", headers=headers)
    assert resp_fail.status_code == 400
    assert "processing failed" in resp_fail.json()["detail"]


def test_dashboard_and_status_ownership_protection(client, setup_user_and_profile):
    """User B cannot access User A's report dashboard or status."""
    db, profile, headers_a, _ = setup_user_and_profile

    # Seed a completed report for User A
    test_values = [
        {"test_name": "Hemoglobin", "value": 14.5, "unit": "g/dL", "ref_low": 12.0, "ref_high": 17.5},
    ]
    report = create_completed_report(db, profile.id, test_values, report_date=date(2025, 6, 1))

    # Create User B
    resp_b = client.post(
        "/api/auth/signup",
        json={"name": "Bob Intruder", "email": "bob@mediora.dev", "password": "password123"},
    )
    token_b = resp_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B requests User A's report dashboard -> 403 Forbidden
    resp = client.get(f"/api/reports/{report.id}/dashboard", headers=headers_b)
    assert resp.status_code == 403

    # User B requests User A's report status -> 403 Forbidden
    resp_status = client.get(f"/api/reports/{report.id}/status", headers=headers_b)
    assert resp_status.status_code == 403

    # User B requests User A's report detail -> 403 Forbidden
    resp_detail = client.get(f"/api/reports/{report.id}", headers=headers_b)
    assert resp_detail.status_code == 403

    # User B requests User A's health-insights -> 403 Forbidden
    resp_insights = client.get(f"/api/reports/{report.id}/health-insights", headers=headers_b)
    assert resp_insights.status_code == 403


def test_status_endpoint_returns_all_statuses(client, setup_user_and_profile):
    """Verify GET /api/reports/{report_id}/status for processing, completed, and failed."""
    db, profile, headers, _ = setup_user_and_profile

    for expected_status in [REPORT_STATUS_PROCESSING, REPORT_STATUS_COMPLETED, REPORT_STATUS_FAILED]:
        r = Report(
            profile_id=profile.id,
            original_file_path=f"dummy/{expected_status}.pdf",
            status=expected_status,
        )
        db.add(r)
        db.commit()
        db.refresh(r)

        res = client.get(f"/api/reports/{r.id}/status", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["report_id"] == r.id
        assert data["id"] == r.id
        assert data["status"] == expected_status


def test_actual_pdf_upload_with_heuristic_fallback(client, setup_user_and_profile):
    """Verify that when LLM is unavailable (e.g. 402 / offline), real PDF processing succeeds via fallback."""
    db, profile, headers, _ = setup_user_and_profile
    pdf_bytes = _generate_test_pdf()
    pdf_file = ("cbc_report.pdf", io.BytesIO(pdf_bytes), "application/pdf")

    with patch(
        "src.features.report_extraction.llm_extraction.call_llm",
        side_effect=Exception("OpenRouter 402 Payment Required"),
    ):
        upload_resp = client.post(
            "/api/reports/upload",
            data={"profile_id": str(profile.id)},
            files={"file": pdf_file},
            headers=headers,
        )

    assert upload_resp.status_code == 201
    upload_data = upload_resp.json()
    report_id = upload_data["report_id"]
    assert report_id is not None

    # Verify status is completed
    status_resp = client.get(f"/api/reports/{report_id}/status", headers=headers)
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == REPORT_STATUS_COMPLETED

    # Verify dashboard returns valid health insight data
    dash_resp = client.get(f"/api/reports/{report_id}/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()

    assert dash_data["report_id"] == report_id
    assert dash_data["health_score"] is not None
    assert len(dash_data["test_values"]) >= 2
    for tv in dash_data["test_values"]:
        assert tv["test_name"] in ["Hemoglobin", "Blood Sugar", "Platelet Count"]
        assert tv["value"] is not None
        assert tv["status"] is not None

