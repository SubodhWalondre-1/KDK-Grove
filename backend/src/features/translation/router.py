from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.core.security import get_current_user, require_admin_key
from src.database import get_db
from src.models.user import User
from src.features.translation import service as translation_service
from src.schemas.translation import (
    BulkTranslationRequest,
    BulkTranslationResponse,
    GlossaryEntryCreate,
    LanguagesResponse,
)

router = APIRouter(prefix="/api", tags=["translation"])


@router.post("/translations/bulk", response_model=BulkTranslationResponse)
def bulk_translate(
    body: BulkTranslationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Batch translation endpoint with 3-tier fallthrough (Cache -> Glossary -> Sarvam AI)."""
    translations = translation_service.bulk_translate(db, body.items, body.language_code)
    return BulkTranslationResponse(
        language_code=body.language_code,
        translations=translations,
    )


@router.get("/languages", response_model=LanguagesResponse)
def get_supported_languages():
    """Return all supported Indian languages for translation."""
    languages = translation_service.get_supported_languages()
    return LanguagesResponse(languages=languages)


@router.post("/glossary")
def create_glossary_entry(
    body: GlossaryEntryCreate,
    admin_key: str = Depends(require_admin_key),
    db: Session = Depends(get_db),
):
    """Admin endpoint — add or update a medical term translation in the glossary."""
    entry = translation_service.add_glossary_entry(
        db,
        term_en=body.term_en,
        language_code=body.language_code,
        translated_term=body.translated_term,
    )
    return {
        "status": "success",
        "id": entry.id,
        "term_en": entry.term_en,
        "language_code": entry.language_code,
        "translated_term": entry.translated_term,
    }
