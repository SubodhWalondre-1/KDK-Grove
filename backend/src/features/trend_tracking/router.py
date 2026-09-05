from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.core.security import get_current_user
from src.database import get_db
from src.features.trend_tracking import service as trend_service
from src.models.profile import Profile
from src.models.user import User
from src.schemas.trend import (
    TestTrendSeriesResponse,
    TrendInsightResponse,
    TrendListResponse,
    TrendOverviewResponse,
)

router = APIRouter(prefix="/api/profiles", tags=["trend-tracking"])


def _verify_profile_ownership(db: Session, profile_id: int, user_id: int) -> Profile:
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Profile {profile_id} not found")
    if profile.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this profile")
    return profile


# IMPORTANT: /overview must be registered BEFORE /{test_name} to prevent path param shadowing!

@router.get("/{profile_id}/trends/overview", response_model=TrendOverviewResponse)
def get_trend_overview(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return trend overview summary for all parameters and overall health score for a profile."""
    _verify_profile_ownership(db, profile_id, current_user.id)
    return trend_service.get_trend_overview(db, profile_id)


@router.get("/{profile_id}/trends", response_model=TrendListResponse)
def get_trend_list(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all distinct test names present in completed reports for a profile."""
    _verify_profile_ownership(db, profile_id, current_user.id)
    return trend_service.get_trend_list(db, profile_id)


@router.get("/{profile_id}/trends/{test_name}", response_model=TestTrendSeriesResponse)
def get_test_trend_series(
    profile_id: int,
    test_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the chronological series of data points and trend calculation for a test parameter."""
    _verify_profile_ownership(db, profile_id, current_user.id)
    return trend_service.get_test_trend_series(db, profile_id, test_name)


@router.get("/{profile_id}/trends/{test_name}/insight", response_model=TrendInsightResponse)
def get_trend_insight(
    profile_id: int,
    test_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return template-based narrative health insight for a test parameter trend."""
    _verify_profile_ownership(db, profile_id, current_user.id)
    return trend_service.get_trend_insight(db, profile_id, test_name)
