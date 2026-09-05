from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.core.security import get_current_user
from src.database import get_db
from src.models.profile import Profile
from src.models.report import Report
from src.models.user import User
from src.features.health_dashboard import service as dashboard_service
from src.schemas.dashboard import DashboardResponse, ProfileHealthScoreResponse

router = APIRouter(prefix="/api", tags=["health-dashboard"])
root_router = APIRouter(tags=["health-dashboard"])


@router.get("/reports/{report_id}/dashboard", response_model=DashboardResponse)
@router.get("/reports/{report_id}/results", response_model=DashboardResponse)
@root_router.get("/reports/{report_id}/dashboard", response_model=DashboardResponse)
@root_router.get("/reports/{report_id}/results", response_model=DashboardResponse)
def get_report_dashboard(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        from src.core.exceptions import ReportNotFoundError
        raise ReportNotFoundError(detail=f"Report {report_id} not found")

    profile = db.query(Profile).filter(Profile.id == report.profile_id).first()
    if profile is None or profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Report does not belong to the current user")

    return dashboard_service.get_dashboard_data(db, report_id)


@router.get("/profiles/{profile_id}/health-score", response_model=ProfileHealthScoreResponse)
def get_profile_health_score(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if profile is None or profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Profile does not belong to the current user")

    return dashboard_service.get_profile_health_score(db, profile_id)
