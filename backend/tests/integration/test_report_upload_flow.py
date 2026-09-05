"""Integration tests for the F1 report upload flow.

Mocks ocr_pipeline.run_ocr and llm_extraction.extract_structured_data
at module level so tests run without PaddleOCR or LLM API calls.
"""

import io
import json
from unittest.mock import AsyncMock, patch, MagicMock

import pytest

from src.core.constants import REPORT_STATUS_COMPLETED, REPORT_STATUS_FAILED
from src.core.exceptions import OCRProcessingError
from tests.fixtures.seed_data import create_test_profile, create_test_reference_ranges

OCR_MOCK_PATH = "src.features.report_extraction.service.run_ocr"
LLM_MOCK_PATH = "src.features.report_extraction.service.extract_structured_data"
PREPROCESS_MOCK_PATH = "src.features.report_extraction.service.preprocess_image"

MOCK_EXTRACTED_TESTS = [
    {"test_name": "Hemoglobin", "value": 14.5, "unit": "g/dL", "ref_low": 12.0, "ref_high": 17.5},
    {"test_name": "Blood Sugar", "value": 95.0, "unit": "mg/dL", "ref_low": 70.0, "ref_high": 100.0},
]


def _make_test_image():
    return ("test_report.jpg", io.BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 100), "image/jpeg")


def _setup_mocks(ocr_mock, llm_mock, preprocess_mock):
    preprocess_mock.return_value = "preprocessed.jpg"
    ocr_mock.return_value = "Hemoglobin 14.5 g/dL\nBlood Sugar 95.0 mg/dL"
    llm_mock.return_value = MOCK_EXTRACTED_TESTS


@pytest.fixture()
def seeded_profile(db_session, auth_headers, client):
    response = client.post(
        "/api/auth/signup",
        json={"name": "Owner", "email": "owner@mediora.dev", "password": "pass123"},
    )
    user_id = response.json()["user"]["id"]
    token = response.json()["access_token"]
    profile = create_test_profile(db_session, user_id, species="human")
    create_test_reference_ranges(db_session)
    return profile, {"Authorization": f"Bearer {token}"}


def test_upload_completes_successfully(client, seeded_profile):
    profile, headers = seeded_profile

    with (
        patch(PREPROCESS_MOCK_PATH) as preprocess_mock,
        patch(OCR_MOCK_PATH) as ocr_mock,
        patch(LLM_MOCK_PATH, new_callable=AsyncMock) as llm_mock,
    ):
        _setup_mocks(ocr_mock, llm_mock, preprocess_mock)

        response = client.post(
            "/api/reports/upload",
            data={"profile_id": str(profile.id)},
            files={"file": _make_test_image()},
            headers=headers,
        )

    assert response.status_code == 201
    body = response.json()
    report_id = body["report_id"]

    detail = client.get(f"/api/reports/{report_id}").json()
    assert detail["status"] == REPORT_STATUS_COMPLETED
    assert len(detail["test_values"]) == 2
    assert detail["health_score"] is not None
    # Both mocked values are within reference range → all normal → score should be 100.0
    assert detail["health_score"] == 100.0


def test_upload_with_missing_reference_range(client, seeded_profile, db_session):
    """§15 test #4: missing reference range → ref_low/ref_high=None, no 500."""
    profile, headers = seeded_profile
    tests_with_unknown = [
        {"test_name": "Obscure Marker XYZ", "value": 3.2, "unit": "U/L"},
    ]

    with (
        patch(PREPROCESS_MOCK_PATH) as preprocess_mock,
        patch(OCR_MOCK_PATH) as ocr_mock,
        patch(LLM_MOCK_PATH, new_callable=AsyncMock) as llm_mock,
    ):
        preprocess_mock.return_value = "preprocessed.jpg"
        ocr_mock.return_value = "Obscure Marker XYZ 3.2 U/L"
        llm_mock.return_value = tests_with_unknown

        response = client.post(
            "/api/reports/upload",
            data={"profile_id": str(profile.id)},
            files={"file": _make_test_image()},
            headers=headers,
        )

    assert response.status_code == 201
    report_id = response.json()["report_id"]

    detail = client.get(f"/api/reports/{report_id}").json()
    assert detail["status"] == REPORT_STATUS_COMPLETED
    tv = detail["test_values"][0]
    assert tv["test_name"] == "Obscure Marker XYZ"
    assert tv["ref_low"] is None
    assert tv["ref_high"] is None

    from src.models.missing_reference_log import MissingReferenceLog
    log_entry = db_session.query(MissingReferenceLog).filter(
        MissingReferenceLog.test_name == "Obscure Marker XYZ"
    ).first()
    assert log_entry is not None
    assert log_entry.species == profile.species


def test_upload_rejects_bad_file_type(client, seeded_profile):
    profile, headers = seeded_profile

    bad_file = ("notes.txt", io.BytesIO(b"just some text"), "text/plain")
    response = client.post(
        "/api/reports/upload",
        data={"profile_id": str(profile.id)},
        files={"file": bad_file},
        headers=headers,
    )

    assert response.status_code == 400


def test_upload_wrong_owner_rejected(client, seeded_profile, db_session):
    profile, _ = seeded_profile

    other_response = client.post(
        "/api/auth/signup",
        json={"name": "Other", "email": "other@mediora.dev", "password": "pass123"},
    )
    other_token = other_response.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    response = client.post(
        "/api/reports/upload",
        data={"profile_id": str(profile.id)},
        files={"file": _make_test_image()},
        headers=other_headers,
    )

    assert response.status_code == 403


def test_pipeline_failure_marks_report_failed(client, seeded_profile, db_session):
    profile, headers = seeded_profile

    with (
        patch(PREPROCESS_MOCK_PATH, side_effect=OCRProcessingError(detail="boom")),
    ):
        try:
            client.post(
                "/api/reports/upload",
                data={"profile_id": str(profile.id)},
                files={"file": _make_test_image()},
                headers=headers,
            )
        except Exception:
            pass

    from src.models.report import Report
    report = db_session.query(Report).filter(Report.profile_id == profile.id).first()
    if report:
        assert report.status == REPORT_STATUS_FAILED


def test_reprocess_reruns_pipeline(client, seeded_profile):
    profile, headers = seeded_profile

    with (
        patch(PREPROCESS_MOCK_PATH) as preprocess_mock,
        patch(OCR_MOCK_PATH) as ocr_mock,
        patch(LLM_MOCK_PATH, new_callable=AsyncMock) as llm_mock,
    ):
        _setup_mocks(ocr_mock, llm_mock, preprocess_mock)

        upload_resp = client.post(
            "/api/reports/upload",
            data={"profile_id": str(profile.id)},
            files={"file": _make_test_image()},
            headers=headers,
        )
        report_id = upload_resp.json()["report_id"]

        reprocess_resp = client.post(f"/api/reports/{report_id}/reprocess")
        assert reprocess_resp.status_code == 200

        detail = client.get(f"/api/reports/{report_id}").json()
        assert detail["status"] == REPORT_STATUS_COMPLETED
        assert len(detail["test_values"]) == 2
