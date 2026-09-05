from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.core.security import get_current_user, require_admin_key
from src.database import get_db
from src.models.report import Report
from src.models.profile import Profile
from src.models.user import User
from src.features.species_support import service as species_service
from src.schemas.species import (
    BulkInsertResponse,
    ProfileCreate,
    ProfileResponse,
    ReferenceRangeBulkRequest,
    ReferenceRangeCoverageResponse,
    SpeciesListResponse,
    TestAliasBulkRequest,
)

router = APIRouter(prefix="/api", tags=["species-support"])


@router.get("/species", response_model=SpeciesListResponse)
def get_supported_species(db: Session = Depends(get_db)):
    """Public endpoint — return supported species categories and reference data availability."""
    species = species_service.get_supported_species(db)
    return SpeciesListResponse(species=species)


@router.post("/profiles", response_model=ProfileResponse)
def create_profile(
    body: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """User-authenticated endpoint — create a new user profile with normalized species category."""
    profile = species_service.create_profile(db, current_user.id, body)
    return profile


@router.get("/profiles", response_model=list[ProfileResponse])
def get_user_profiles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """User-authenticated endpoint — return all profiles created by the current user."""
    return species_service.get_user_profiles(db, current_user.id)


@router.get("/profiles/{profile_id}/reports")
def get_profile_reports(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all completed reports for a given profile, newest first."""
    from fastapi import HTTPException

    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if profile is None or profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Profile does not belong to the current user")

    reports = (
        db.query(Report)
        .filter(Report.profile_id == profile_id, Report.status == "completed")
        .order_by(Report.uploaded_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "profile_id": r.profile_id,
            "report_type": r.report_type,
            "report_date": r.report_date.isoformat() if r.report_date else None,
            "status": r.status,
            "health_score": r.health_score,
            "uploaded_at": r.uploaded_at.isoformat(),
        }
        for r in reports
    ]

@router.get(
    "/reference-ranges/coverage",
    response_model=ReferenceRangeCoverageResponse,
    tags=["species-support-admin"],
)
def get_reference_coverage(
    admin_key: str = Depends(require_admin_key),
    db: Session = Depends(get_db),
):
    """Admin endpoint — query reference range coverage counts and missing reference gaps."""
    return species_service.get_reference_coverage(db)


@router.post(
    "/admin/reference-ranges/bulk",
    response_model=BulkInsertResponse,
    tags=["species-support-admin"],
)
def bulk_add_reference_ranges(
    body: ReferenceRangeBulkRequest,
    admin_key: str = Depends(require_admin_key),
    db: Session = Depends(get_db),
):
    """Admin endpoint — bulk insert reference range records."""
    return species_service.bulk_add_reference_ranges(db, body.items)


@router.post(
    "/admin/test-aliases",
    response_model=BulkInsertResponse,
    tags=["species-support-admin"],
)
def bulk_add_test_aliases(
    body: TestAliasBulkRequest,
    admin_key: str = Depends(require_admin_key),
    db: Session = Depends(get_db),
):
    """Admin endpoint — bulk insert test name aliases."""
    return species_service.bulk_add_test_aliases(db, body.items)
