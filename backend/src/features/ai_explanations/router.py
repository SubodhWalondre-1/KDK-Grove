from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from src.core.exceptions import ReportNotFoundError
from src.core.security import get_current_user, require_admin_key
from src.database import get_db
from src.features.ai_explanations import service as explanation_service
from src.models.explanation_cache import ExplanationCache
from src.models.report import Report
from src.models.user import User
from src.schemas.explanation import ExplanationResponse
from seed_scripts.seed_explanation_cache import SEED_TARGETS

router = APIRouter(prefix="/api", tags=["ai-explanations"])


class TargetCombo(BaseModel):
    canonical_test_name: str
    severity_bucket: str
    species_category: str


class SeedExplanationCacheRequest(BaseModel):
    targets: Optional[List[TargetCombo]] = None


class SeedResultResponse(BaseModel):
    generated: int
    already_cached: int
    failed: List[dict]


@router.get("/reports/{report_id}/values/{value_id}/explanation", response_model=ExplanationResponse)
def get_explanation(
    report_id: int,
    value_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve plain-English explanation for an extracted lab value with ownership enforcement."""
    report = (
        db.query(Report)
        .options(joinedload(Report.profile))
        .filter(Report.id == report_id)
        .first()
    )

    if report is None:
        raise ReportNotFoundError(detail=f"Report {report_id} not found")

    if report.profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this report's profile")

    return explanation_service.get_explanation(db, report_id, value_id)


@router.post("/admin/explanation-cache/seed", response_model=SeedResultResponse)
def seed_explanation_cache(
    body: SeedExplanationCacheRequest = SeedExplanationCacheRequest(),
    admin_key: str = Depends(require_admin_key),
    db: Session = Depends(get_db),
):
    """Admin endpoint — pre-populate explanation_cache for specified or standard target combos."""
    raw_targets = (
        [t.model_dump() for t in body.targets] if body.targets else SEED_TARGETS
    )

    generated = 0
    already_cached = 0
    failed = []

    for target in raw_targets:
        test_name = target["canonical_test_name"]
        bucket = target["severity_bucket"]
        species = target["species_category"]

        existing = (
            db.query(ExplanationCache)
            .filter_by(
                canonical_test_name=test_name,
                severity_bucket=bucket,
                species_category=species,
            )
            .first()
        )

        if existing:
            already_cached += 1
            continue

        direction = bucket.split("_")[0]
        try:
            explanation_service._generate_and_cache_explanation(
                db=db,
                canonical_test_name=test_name,
                severity_bucket=bucket,
                species_category=species,
                direction=direction,
            )
            generated += 1
        except Exception as exc:
            failed.append({
                "canonical_test_name": test_name,
                "severity_bucket": bucket,
                "species_category": species,
                "error": str(exc),
            })

    return SeedResultResponse(
        generated=generated,
        already_cached=already_cached,
        failed=failed,
    )
