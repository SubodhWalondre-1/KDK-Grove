"""Integration tests for Feature 3 translation endpoints and 3-tier fallthrough service."""

from unittest.mock import AsyncMock, patch
import pytest

from src.config import get_settings
from src.core.constants import SARVAM_SUPPORTED_LANGUAGES
from src.core.exceptions import TranslationServiceError
from src.features.translation import service as translation_service
from src.models.translation import MedicalTermsGlossary, Translation
from src.schemas.translation import TranslationItem

SARVAM_MOCK_PATH = "src.features.translation.service.sarvam_client.translate_text"


def test_bulk_all_glossary_hit_makes_zero_sarvam_calls(client, auth_headers, db_session):
    """§15 test #6: pre-seeded cache/glossary entries return immediately with zero Sarvam API calls."""
    # Seed cache
    db_session.add(
        Translation(
            source_type="test_name",
            source_key="Hemoglobin",
            language_code="hi-IN",
            translated_text="हीमोग्लोबिन",
            method="glossary",
        )
    )
    db_session.commit()

    with patch(SARVAM_MOCK_PATH, new_callable=AsyncMock) as mock_sarvam:
        response = client.post(
            "/api/translations/bulk",
            json={
                "language_code": "hi-IN",
                "items": [
                    {"source_type": "test_name", "source_key": "Hemoglobin"}
                ],
            },
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data["translations"]) == 1
    assert data["translations"][0]["translated_text"] == "हीमोग्लोबिन"
    mock_sarvam.assert_not_called()


def test_bulk_unit_source_type_rejected_by_schema(client, auth_headers):
    """source_type="unit" is invalid according to Pydantic schema -> 422 Unprocessable Entity."""
    response = client.post(
        "/api/translations/bulk",
        json={
            "language_code": "hi-IN",
            "items": [
                {"source_type": "unit", "source_key": "mg/dL"}
            ],
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_bulk_unit_never_reaches_sarvam_even_if_schema_bypassed(db_session):
    """§15 test #7: bypassing Pydantic validation still hits runtime guard in service.py -> silently skipped."""
    item = TranslationItem.model_construct(source_type="unit", source_key="mg/dL")

    with patch(SARVAM_MOCK_PATH, new_callable=AsyncMock) as mock_sarvam:
        results = translation_service.bulk_translate(db_session, [item], "hi-IN")

    assert len(results) == 0
    mock_sarvam.assert_not_called()


def test_bulk_cache_miss_glossary_hit(client, auth_headers, db_session):
    """Item not in translations cache but in medical_terms_glossary -> tier 2 hit, writes Translation row."""
    db_session.add(
        MedicalTermsGlossary(
            term_en="Cholesterol",
            language_code="hi-IN",
            translated_term="कोलेस्ट्रॉल",
        )
    )
    db_session.commit()

    with patch(SARVAM_MOCK_PATH, new_callable=AsyncMock) as mock_sarvam:
        response = client.post(
            "/api/translations/bulk",
            json={
                "language_code": "hi-IN",
                "items": [
                    {"source_type": "test_name", "source_key": "Cholesterol"}
                ],
            },
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["translations"][0]["translated_text"] == "कोलेस्ट्रॉल"
    assert data["translations"][0]["method"] == "glossary"
    mock_sarvam.assert_not_called()

    # Verify new Translation row was written to cache
    cached = (
        db_session.query(Translation)
        .filter(
            Translation.source_type == "test_name",
            Translation.source_key == "Cholesterol",
            Translation.language_code == "hi-IN",
        )
        .first()
    )
    assert cached is not None
    assert cached.method == "glossary"


def test_bulk_cache_and_glossary_miss_calls_sarvam(client, auth_headers, db_session):
    """Misses cache and glossary -> calls Sarvam API, writes Translation row with method="sarvam"."""
    with patch(SARVAM_MOCK_PATH, new_callable=AsyncMock) as mock_sarvam:
        mock_sarvam.return_value = "क्रिएटिनिन स्तर"
        response = client.post(
            "/api/translations/bulk",
            json={
                "language_code": "hi-IN",
                "items": [
                    {"source_type": "test_name", "source_key": "Novel Test Marker"}
                ],
            },
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["translations"][0]["translated_text"] == "क्रिएटिनिन स्तर"
    assert data["translations"][0]["method"] == "sarvam"
    mock_sarvam.assert_called_once_with("Novel Test Marker", "hi-IN")

    # Verify cached row written with method="sarvam"
    cached = (
        db_session.query(Translation)
        .filter(
            Translation.source_type == "test_name",
            Translation.source_key == "Novel Test Marker",
            Translation.language_code == "hi-IN",
        )
        .first()
    )
    assert cached is not None
    assert cached.method == "sarvam"


def test_bulk_status_label_skips_glossary_tier(client, auth_headers, db_session):
    """status_label items skip tier 2 (glossary) and go straight to Sarvam if missing from cache."""
    # Put term in medical_terms_glossary with source_key matching
    db_session.add(
        MedicalTermsGlossary(
            term_en="Abnormal",
            language_code="hi-IN",
            translated_term="असामान्य",
        )
    )
    db_session.commit()

    with patch(SARVAM_MOCK_PATH, new_callable=AsyncMock) as mock_sarvam:
        mock_sarvam.return_value = "असामान्य (Sarvam)"
        response = client.post(
            "/api/translations/bulk",
            json={
                "language_code": "hi-IN",
                "items": [
                    {"source_type": "status_label", "source_key": "Abnormal"}
                ],
            },
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["translations"][0]["method"] == "sarvam"
    assert mock_sarvam.call_count == 1


def test_bulk_partial_sarvam_failure_doesnt_500_whole_batch(client, auth_headers):
    """If Sarvam fails for 1 item out of 2, the endpoint returns 200 with fallback text for the failed item."""
    async def mock_translate(text, lang):
        if text == "Failing Item":
            raise TranslationServiceError("API error")
        return "सफल आइटम"

    with patch(SARVAM_MOCK_PATH, side_effect=mock_translate):
        response = client.post(
            "/api/translations/bulk",
            json={
                "language_code": "hi-IN",
                "items": [
                    {"source_type": "test_name", "source_key": "Success Item"},
                    {"source_type": "test_name", "source_key": "Failing Item"},
                ],
            },
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data["translations"]) == 2
    assert data["translations"][0]["translated_text"] == "सफल आइटम"
    assert data["translations"][1]["translated_text"] == "Failing Item"
    assert data["translations"][1]["method"] == "fallback"


def test_languages_endpoint_returns_static_list(client):
    """GET /api/languages returns supported languages matching SARVAM_SUPPORTED_LANGUAGES."""
    response = client.get("/api/languages")
    assert response.status_code == 200

    data = response.json()
    languages = {item["code"]: item["name"] for item in data["languages"]}
    assert languages == SARVAM_SUPPORTED_LANGUAGES


def test_glossary_admin_endpoint_requires_key(client):
    """POST /api/glossary without X-Admin-Key header returns 401."""
    response = client.post(
        "/api/glossary",
        json={
            "term_en": "Hemoglobin",
            "language_code": "hi-IN",
            "translated_term": "हीमोग्लोबिन",
        },
    )
    assert response.status_code == 401


def test_glossary_admin_endpoint_upserts(client):
    """POST /api/glossary with valid X-Admin-Key updates existing entry on duplicate pair without raising error."""
    settings = get_settings()
    admin_headers = {"X-Admin-Key": settings.admin_api_key}

    # First call: insert
    resp1 = client.post(
        "/api/glossary",
        json={
            "term_en": "Creatinine",
            "language_code": "hi-IN",
            "translated_term": "क्रिएटिनिन",
        },
        headers=admin_headers,
    )
    assert resp1.status_code == 200
    assert resp1.json()["translated_term"] == "क्रिएटिनिन"

    # Second call: update (upsert)
    resp2 = client.post(
        "/api/glossary",
        json={
            "term_en": "Creatinine",
            "language_code": "hi-IN",
            "translated_term": "क्रिएटिनिन स्तर",
        },
        headers=admin_headers,
    )
    assert resp2.status_code == 200
    assert resp2.json()["translated_term"] == "क्रिएटिनिन स्तर"
