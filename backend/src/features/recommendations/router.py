from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.core.security import get_current_user
from src.database import get_db
from src.features.recommendations import service as recommendations_service
from src.models.report import Report
from src.models.user import User
from src.schemas.recommendation import InsightsResponse

router = APIRouter(prefix="/api/reports", tags=["recommendations"])
root_router = APIRouter(prefix="/reports", tags=["recommendations"])


def _verify_report_ownership(db: Session, report_id: int, user_id: int) -> Report:
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
    if report.profile.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this report's profile")
    return report


@router.get("/{report_id}/recommendations", response_model=InsightsResponse)
@router.get("/{report_id}/health-insights", response_model=InsightsResponse)
@router.get("/{report_id}/insights", response_model=InsightsResponse)
@router.get("/{report_id}/health-insight", response_model=InsightsResponse)
@root_router.get("/{report_id}/recommendations", response_model=InsightsResponse)
@root_router.get("/{report_id}/health-insights", response_model=InsightsResponse)
@root_router.get("/{report_id}/insights", response_model=InsightsResponse)
@root_router.get("/{report_id}/health-insight", response_model=InsightsResponse)
def get_recommendations(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch stored AI health insights for a report, enforcing profile ownership."""
    _verify_report_ownership(db, report_id, current_user.id)
    return recommendations_service.get_recommendations(db, report_id)


@router.post("/{report_id}/recommendations/generate", response_model=InsightsResponse)
@router.post("/{report_id}/recommendations", response_model=InsightsResponse)
@router.post("/{report_id}/health-insights/generate", response_model=InsightsResponse)
@router.post("/{report_id}/health-insights", response_model=InsightsResponse)
@router.post("/{report_id}/insights/generate", response_model=InsightsResponse)
@router.post("/{report_id}/insights", response_model=InsightsResponse)
@router.post("/{report_id}/health-insight/generate", response_model=InsightsResponse)
@router.post("/{report_id}/health-insight", response_model=InsightsResponse)
@router.post("/{report_id}/analyze", response_model=InsightsResponse)
@root_router.post("/{report_id}/recommendations/generate", response_model=InsightsResponse)
@root_router.post("/{report_id}/recommendations", response_model=InsightsResponse)
@root_router.post("/{report_id}/health-insights/generate", response_model=InsightsResponse)
@root_router.post("/{report_id}/health-insights", response_model=InsightsResponse)
@root_router.post("/{report_id}/insights/generate", response_model=InsightsResponse)
@root_router.post("/{report_id}/insights", response_model=InsightsResponse)
@root_router.post("/{report_id}/health-insight/generate", response_model=InsightsResponse)
@root_router.post("/{report_id}/health-insight", response_model=InsightsResponse)
@root_router.post("/{report_id}/analyze", response_model=InsightsResponse)
def generate_recommendations(
    report_id: int,
    force_regenerate: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate finding-driven AI health insights for a report, enforcing profile ownership."""
    _verify_report_ownership(db, report_id, current_user.id)
    return recommendations_service.generate_recommendations(db, report_id, force_regenerate)
