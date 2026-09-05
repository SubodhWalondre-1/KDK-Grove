import asyncio
import logging

from sqlalchemy.orm import Session

from src.core.constants import (
    SARVAM_SUPPORTED_LANGUAGES,
    TRANSLATABLE_SOURCE_TYPES,
)
from src.core.exceptions import TranslationServiceError
from src.features.translation import sarvam_client
from src.models.translation import MedicalTermsGlossary, Translation
from src.schemas.translation import (
    LanguageOption,
    TranslatedItem,
    TranslationItem,
)

logger = logging.getLogger(__name__)


def bulk_translate(
    db: Session,
    items: list[TranslationItem],
    language_code: str,
) -> list[TranslatedItem]:
    """Translate a batch of items using cache → glossary → Sarvam API fallthrough."""
    results: list[TranslatedItem] = []

    for item in items:
        # Step 1: Runtime guard — skip untranslatable types
        if item.source_type not in TRANSLATABLE_SOURCE_TYPES:
            logger.warning("Skipping untranslatable source_type: %s", item.source_type)
            continue

        # If English requested, return original text as-is
        if language_code == "en-IN" or language_code == "en":
            results.append(
                TranslatedItem(
                    source_type=item.source_type,
                    source_key=item.source_key,
                    translated_text=item.source_key,
                    method="identity",
                )
            )
            continue

        # Step 2: Tier 1 — cache check in `translations` table
        cached = (
            db.query(Translation)
            .filter(
                Translation.source_type == item.source_type,
                Translation.source_key == item.source_key,
                Translation.language_code == language_code,
            )
            .first()
        )
        if cached is not None:
            results.append(
                TranslatedItem(
                    source_type=item.source_type,
                    source_key=item.source_key,
                    translated_text=cached.translated_text,
                    method=cached.method,
                )
            )
            continue

        # Step 3: Tier 2 — glossary check (ONLY for test_name)
        if item.source_type == "test_name":
            glossary_entry = (
                db.query(MedicalTermsGlossary)
                .filter(
                    MedicalTermsGlossary.term_en == item.source_key,
                    MedicalTermsGlossary.language_code == language_code,
                )
                .first()
            )
            if glossary_entry is not None:
                _cache_translation(
                    db,
                    source_type=item.source_type,
                    source_key=item.source_key,
                    language_code=language_code,
                    translated_text=glossary_entry.translated_term,
                    method="glossary",
                )
                results.append(
                    TranslatedItem(
                        source_type=item.source_type,
                        source_key=item.source_key,
                        translated_text=glossary_entry.translated_term,
                        method="glossary",
                    )
                )
                continue

        # Step 4: Tier 3 — Sarvam API call
        try:
            translated_text = asyncio.run(
                sarvam_client.translate_text(item.source_key, language_code)
            )
            _cache_translation(
                db,
                source_type=item.source_type,
                source_key=item.source_key,
                language_code=language_code,
                translated_text=translated_text,
                method="sarvam",
            )
            results.append(
                TranslatedItem(
                    source_type=item.source_type,
                    source_key=item.source_key,
                    translated_text=translated_text,
                    method="sarvam",
                )
            )
        except (TranslationServiceError, Exception) as exc:
            logger.error(
                "Translation failed for '%s' (%s) to %s: %s",
                item.source_key,
                item.source_type,
                language_code,
                exc,
            )
            # Fallback to English source text on API failure
            results.append(
                TranslatedItem(
                    source_type=item.source_type,
                    source_key=item.source_key,
                    translated_text=item.source_key,
                    method="fallback",
                )
            )

    return results


def get_supported_languages() -> list[LanguageOption]:
    """Return all supported Indian languages from SARVAM_SUPPORTED_LANGUAGES."""
    return [
        LanguageOption(code=code, name=name)
        for code, name in SARVAM_SUPPORTED_LANGUAGES.items()
    ]


def add_glossary_entry(
    db: Session,
    term_en: str,
    language_code: str,
    translated_term: str,
) -> MedicalTermsGlossary:
    """Upsert a medical term into the glossary (update if exists, insert if not)."""
    entry = (
        db.query(MedicalTermsGlossary)
        .filter(
            MedicalTermsGlossary.term_en == term_en,
            MedicalTermsGlossary.language_code == language_code,
        )
        .first()
    )

    if entry is not None:
        entry.translated_term = translated_term
    else:
        entry = MedicalTermsGlossary(
            term_en=term_en,
            language_code=language_code,
            translated_term=translated_term,
        )
        db.add(entry)

    db.commit()
    db.refresh(entry)
    return entry


def _cache_translation(
    db: Session,
    source_type: str,
    source_key: str,
    language_code: str,
    translated_text: str,
    method: str,
) -> None:
    try:
        row = Translation(
            source_type=source_type,
            source_key=source_key,
            language_code=language_code,
            translated_text=translated_text,
            method=method,
        )
        db.add(row)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.warning(
            "Failed to cache translation for '%s' (%s): %s",
            source_key,
            language_code,
            exc,
        )
