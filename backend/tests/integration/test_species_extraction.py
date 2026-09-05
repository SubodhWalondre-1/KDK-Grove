"""Integration tests for Feature 4 species-aware LLM prompt construction, alias resolution, and profile creation."""

import io
import json
from unittest.mock import AsyncMock, patch
import pytest

from src.core.constants import REPORT_STATUS_COMPLETED
from src.features.species_support.service import build_extraction_prompt
from src.models.missing_reference_log import MissingReferenceLog
from src.models.report import ReportTestValue
from src.models.test_name_alias import TestNameAlias
from tests.fixtures.seed_data import create_test_profile, create_test_reference_ranges

OCR_MOCK_PATH = "src.features.report_extraction.service.run_ocr"
PREPROCESS_MOCK_PATH = "src.features.report_extraction.service.preprocess_image"
CALL_LLM_MOCK_PATH = "src.features.report_extraction.llm_extraction.call_llm"


def _make_test_image():
    return ("test_report.jpg", io.BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 100), "image/jpeg")


@pytest.fixture()
def species_test_setup(db_session, client):
    resp = client.post(
        "/api/auth/signup",
        json={"name": "Species User", "email": "species@mediora.dev", "password": "pass123"},
    )
    user_id = resp.json()["user"]["id"]
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    create_test_reference_ranges(db_session)
    return db_session, user_id, headers


def test_canine_profile_gets_canine_prompt(client, species_test_setup):
    """§15 test #9: Canine profile receives canine-specific prompt context."""
    db, user_id, headers = species_test_setup
    dog_profile = create_test_profile(db, user_id, species="dog")

    with (
        patch(PREPROCESS_MOCK_PATH, return_value="preprocessed.jpg"),
        patch(OCR_MOCK_PATH, return_value="BUN 25 mg/dL"),
        patch(CALL_LLM_MOCK_PATH, new_callable=AsyncMock) as mock_call_llm,
    ):
        mock_call_llm.return_value = json.dumps([
            {"test_name": "BUN", "value": 25.0, "unit": "mg/dL"}
        ])

        response = client.post(
            "/api/reports/upload",
            data={"profile_id": str(dog_profile.id)},
            files={"file": _make_test_image()},
            headers=headers,
        )

    assert response.status_code == 201
    mock_call_llm.assert_called_once()
    captured_messages = mock_call_llm.call_args.kwargs["messages"]
    system_prompt = captured_messages[0]["content"]

    expected_ctx = build_extraction_prompt("canine")
    assert expected_ctx in system_prompt
    assert "canine" in system_prompt.lower()


def test_human_profile_gets_human_prompt(client, species_test_setup):
    """Human profile receives human-specific prompt context."""
    db, user_id, headers = species_test_setup
    human_profile = create_test_profile(db, user_id, species="human")

    with (
        patch(PREPROCESS_MOCK_PATH, return_value="preprocessed.jpg"),
        patch(OCR_MOCK_PATH, return_value="Hemoglobin 14.5 g/dL"),
        patch(CALL_LLM_MOCK_PATH, new_callable=AsyncMock) as mock_call_llm,
    ):
        mock_call_llm.return_value = json.dumps([
            {"test_name": "Hemoglobin", "value": 14.5, "unit": "g/dL"}
        ])

        response = client.post(
            "/api/reports/upload",
            data={"profile_id": str(human_profile.id)},
            files={"file": _make_test_image()},
            headers=headers,
        )

    assert response.status_code == 201
    mock_call_llm.assert_called_once()
    captured_messages = mock_call_llm.call_args.kwargs["messages"]
    system_prompt = captured_messages[0]["content"]

    expected_ctx = build_extraction_prompt("human")
    assert expected_ctx in system_prompt
    assert "human" in system_prompt.lower()


def test_extraction_uses_resolved_canonical_names(client, species_test_setup):
    """Raw 'BUN' alias returned by LLM resolves to canonical 'Blood Urea Nitrogen' in ReportTestValue."""
    db, user_id, headers = species_test_setup
    profile = create_test_profile(db, user_id, species="dog")

    # Seed alias
    db.add(
        TestNameAlias(
            alias_text="BUN",
            canonical_test_name="Blood Urea Nitrogen",
            species_category=None,
        )
    )
    db.commit()

    with (
        patch(PREPROCESS_MOCK_PATH, return_value="preprocessed.jpg"),
        patch(OCR_MOCK_PATH, return_value="BUN 25.0 mg/dL"),
        patch(CALL_LLM_MOCK_PATH, new_callable=AsyncMock) as mock_call_llm,
    ):
        mock_call_llm.return_value = json.dumps([
            {"test_name": "BUN", "value": 25.0, "unit": "mg/dL"}
        ])

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
    assert tv["test_name"] == "Blood Urea Nitrogen"  # canonical name, not "BUN"


def test_missing_reference_log_written_on_miss(client, species_test_setup):
    """Missing reference range lookup logs canonical test_name to MissingReferenceLog table."""
    db, user_id, headers = species_test_setup
    profile = create_test_profile(db, user_id, species="dog")

    with (
        patch(PREPROCESS_MOCK_PATH, return_value="preprocessed.jpg"),
        patch(OCR_MOCK_PATH, return_value="Unknown Novel Marker 42.0 U/L"),
        patch(CALL_LLM_MOCK_PATH, new_callable=AsyncMock) as mock_call_llm,
    ):
        mock_call_llm.return_value = json.dumps([
            {"test_name": "Unknown Novel Marker", "value": 42.0, "unit": "U/L"}
        ])

        response = client.post(
            "/api/reports/upload",
            data={"profile_id": str(profile.id)},
            files={"file": _make_test_image()},
            headers=headers,
        )

    assert response.status_code == 201

    log_entry = (
        db.query(MissingReferenceLog)
        .filter(MissingReferenceLog.test_name == "Unknown Novel Marker")
        .first()
    )
    assert log_entry is not None
    assert log_entry.species == "dog"


def test_create_profile_derives_species_category(client, species_test_setup):
    """POST /api/profiles derives species_category='other' for 'Labrador' while preserving species='Labrador'."""
    _, _, headers = species_test_setup

    response = client.post(
        "/api/profiles",
        json={"profile_name": "Buddy", "species": "Labrador", "breed": "Retriever"},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["profile_name"] == "Buddy"
    assert data["species"] == "Labrador"
    assert data["species_category"] == "other"
