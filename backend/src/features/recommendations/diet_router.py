from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.core.security import get_current_user
from src.database import get_db
from src.features.recommendations import diet_service
from src.models.profile import Profile
from src.models.report import Report
from src.models.user import User
from src.schemas.nutrition import (
    DietPlanResponse,
    NutritionContextRequest,
    NutritionContextResponse,
)

router = APIRouter(prefix="/api", tags=["diet_plan"])


def _verify_profile_ownership(db: Session, profile_id: int, user_id: int) -> Profile:
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Profile {profile_id} not found")
    if profile.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this profile")
    return profile


def _verify_report_ownership(db: Session, report_id: int, user_id: int) -> Report:
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
    if report.profile.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this report's profile")
    return report


# --- Nutrition Context Endpoints ---


@router.get("/profiles/{profile_id}/nutrition-context", response_model=NutritionContextResponse)
def get_nutrition_context(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch stored user nutrition context (dietary preferences, restrictions, regional style)."""
    _verify_profile_ownership(db, profile_id, current_user.id)
    return diet_service.get_nutrition_context(db, profile_id)


@router.post("/profiles/{profile_id}/nutrition-context", response_model=NutritionContextResponse)
def update_nutrition_context(
    profile_id: int,
    request: NutritionContextRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save or update user nutrition context."""
    _verify_profile_ownership(db, profile_id, current_user.id)
    return diet_service.update_nutrition_context(db, profile_id, request)


# --- Diet Plan Endpoints ---


@router.get("/reports/{report_id}/diet-plan", response_model=Optional[DietPlanResponse])
def get_diet_plan(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch stored finding-driven diet plan for a report."""
    _verify_report_ownership(db, report_id, current_user.id)
    return diet_service.get_diet_plan(db, report_id)


@router.post("/reports/{report_id}/diet-plan/generate", response_model=DietPlanResponse)
def generate_diet_plan(
    report_id: int,
    context_override: Optional[NutritionContextRequest] = None,
    force_regenerate: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate personalized finding-driven diet plan."""
    _verify_report_ownership(db, report_id, current_user.id)
    return diet_service.generate_diet_plan(
        db, report_id, context_override=context_override, force_regenerate=force_regenerate
    )
