import json
import logging
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from src.config import get_settings
from src.core.constants import (
    DEFAULT_SPECIES_CATEGORY,
    EXPLANATION_GENERIC_FALLBACK_TEMPLATE,
    EXPLANATION_LLM_TEMPERATURE,
    EXPLANATION_MISSING_REFERENCE_MESSAGE,
    EXPLANATION_NORMAL_VALUE_MESSAGE,
)
from src.core.severity import get_severity_bucket, get_status_color
from src.features.ai_explanations import guardrail, prompts
from src.models.explanation_cache import ExplanationCache
from src.models.report import Report, ReportTestValue
from src.schemas.explanation import ExplanationResponse
from src.services import openrouter_client

logger = logging.getLogger(__name__)

# Load fallback_explanations.json once at module import time
FALLBACK_FILE_PATH = Path(__file__).parent / "fallback_explanations.json"
try:
    with open(FALLBACK_FILE_PATH, "r", encoding="utf-8") as f:
        FALLBACK_DATA = json.load(f)
except Exception as exc:
    logger.error("Failed to load fallback_explanations.json at startup", exc_info=exc)
    FALLBACK_DATA = {}


def _serve_fallback(canonical_test_name: str, severity_bucket: str) -> str:
    direction = severity_bucket.split("_")[0]
    entry = FALLBACK_DATA.get(canonical_test_name, {}).get(direction)
    if entry:
        return entry
    return EXPLANATION_GENERIC_FALLBACK_TEMPLATE.format(direction=direction)


import asyncio

def _generate_and_cache_explanation(
    db: Session,
    canonical_test_name: str,
    severity_bucket: str,
    species_category: str,
    direction: str,
) -> str:
    raw = asyncio.run(
        openrouter_client.call_llm(
            messages=[
                {"role": "system", "content": prompts.EXPLANATION_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": prompts.build_user_message(
                        canonical_test_name, direction, species_category
                    ),
                },
            ],
            model_slug=get_settings().recommendation_model_slug,
            json_mode=False,
            temperature=EXPLANATION_LLM_TEMPERATURE,
        )
    )

    text = prompts.normalize_explanation_text(raw)
    if not text.strip() or not guardrail.passes_guardrail(text):
        raise ValueError(f"F8 explanation failed guardrail or was empty: {text!r}")

    try:
        cache_entry = ExplanationCache(
            canonical_test_name=canonical_test_name,
            severity_bucket=severity_bucket,
            species_category=species_category,
            explanation_text=text,
        )
        db.add(cache_entry)
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = (
            db.query(ExplanationCache)
            .filter_by(
                canonical_test_name=canonical_test_name,
                severity_bucket=severity_bucket,
                species_category=species_category,
            )
            .first()
        )
        if existing:
            return existing.explanation_text

    return text


def get_explanation(
    db: Session, report_id: int, value_id: int
) -> ExplanationResponse:
    """Orchestrate per-test plain-English explanation lookup via cache, fresh LLM generation, or safety fallbacks."""
    test_value = (
        db.query(ReportTestValue)
        .options(joinedload(ReportTestValue.report).joinedload(Report.profile))
        .filter(ReportTestValue.id == value_id)
        .first()
    )

    if test_value is None or test_value.report_id != report_id:
        raise HTTPException(
            status_code=404,
            detail=f"Test value {value_id} not found for report {report_id}",
        )

    # 2. Missing reference values guard
    if (
        test_value.value is None
        or test_value.ref_low is None
        or test_value.ref_high is None
    ):
        return ExplanationResponse(
            report_id=report_id,
            value_id=value_id,
            canonical_test_name=test_value.test_name,
            explanation_text=EXPLANATION_MISSING_REFERENCE_MESSAGE,
        )

    # 3 & 4. Normal green value guard
    status = get_status_color(test_value.value, test_value.ref_low, test_value.ref_high)
    if status == "green":
        return ExplanationResponse(
            report_id=report_id,
            value_id=value_id,
            canonical_test_name=test_value.test_name,
            explanation_text=EXPLANATION_NORMAL_VALUE_MESSAGE,
        )

    # 5 & 6. Calculate severity bucket and species category for abnormal parameters
    severity_bucket = get_severity_bucket(
        test_value.value, test_value.ref_low, test_value.ref_high
    )
    report = test_value.report
    species_category = (
        report.profile.species_category
        if report and report.profile and report.profile.species_category
        else DEFAULT_SPECIES_CATEGORY
    )
    canonical_test_name = test_value.test_name

    # 8. ExplanationCache hit check
    cached = (
        db.query(ExplanationCache)
        .filter_by(
            canonical_test_name=canonical_test_name,
            severity_bucket=severity_bucket,
            species_category=species_category,
        )
        .first()
    )
    if cached:
        return ExplanationResponse(
            report_id=report_id,
            value_id=value_id,
            canonical_test_name=canonical_test_name,
            explanation_text=cached.explanation_text,
        )

    # 9. ExplanationCache miss check
    direction = severity_bucket.split("_")[0]
    try:
        text = _generate_and_cache_explanation(
            db=db,
            canonical_test_name=canonical_test_name,
            severity_bucket=severity_bucket,
            species_category=species_category,
            direction=direction,
        )
    except Exception as exc:
        logger.warning(
            "F8 generation failed, serving fallback",
            exc_info=exc,
            extra={
                "canonical_test_name": canonical_test_name,
                "severity_bucket": severity_bucket,
                "species_category": species_category,
            },
        )
        text = _serve_fallback(canonical_test_name, severity_bucket)

    return ExplanationResponse(
        report_id=report_id,
        value_id=value_id,
        canonical_test_name=canonical_test_name,
        explanation_text=text,
    )
