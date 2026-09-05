import logging
from fastapi import APIRouter, Depends, Form, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from src.core.exceptions import ReportNotFoundError
from src.core.security import get_current_user, get_optional_current_user
from src.database import get_db
from src.models.profile import Profile
from src.models.reference_range import ReferenceRange
from src.models.user import User
from src.features.report_extraction import service as report_service
from src.features.report_extraction.pdf_protection import (
    build_or_get_report_pdf,
    encrypt_pdf,
    generate_pdf_password,
)
from src.schemas.report import (
    ReportCorrectionRequest,
    ReportDetailResponse,
    ReportStatusResponse,
    ReportUploadResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reports", tags=["reports"])
root_router = APIRouter(prefix="/reports", tags=["reports"])
reference_router = APIRouter(prefix="/api", tags=["debug"])


@router.post("/upload", response_model=ReportUploadResponse, status_code=201)
def upload_report(
    profile_id: int = Form(...),
    file: UploadFile = UploadFile(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if profile is None or profile.user_id != current_user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Profile does not belong to the current user")

    report = report_service.process_report_upload(db, profile_id, current_user.id, file)
    return ReportUploadResponse(
        report_id=report.id,
        id=report.id,
        status=report.status,
        uploaded_at=report.uploaded_at,
    )


@router.get("/{report_id}/status", response_model=ReportStatusResponse)
def get_report_status(
    report_id: int,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(report_service.Report).filter(report_service.Report.id == report_id).first()
    if report is None:
        raise ReportNotFoundError(detail=f"Report {report_id} not found")
    if current_user and report.profile and report.profile.user_id != current_user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this report's profile")

    status = report_service.get_report_status(db, report_id)
    return ReportStatusResponse(report_id=report_id, id=report_id, status=status)


@router.get("/{report_id}", response_model=ReportDetailResponse)
def get_report_detail(
    report_id: int,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    report = report_service.get_report_detail(db, report_id)
    if current_user and report.profile and report.profile.user_id != current_user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this report's profile")

    resp = ReportDetailResponse.model_validate(report)
    resp.report_id = report.id
    return resp


@router.put("/{report_id}/correct", response_model=ReportDetailResponse)
def correct_report(
    report_id: int,
    body: ReportCorrectionRequest,
    db: Session = Depends(get_db),
):
    corrections = [tv.model_dump() for tv in body.test_values]
    report = report_service.correct_report_values(db, report_id, corrections)
    return ReportDetailResponse.model_validate(report)


@router.post("/{report_id}/reprocess", response_model=ReportStatusResponse)
def reprocess_report(
    report_id: int,
    db: Session = Depends(get_db),
):
    report = report_service.reprocess_report(db, report_id)
    return ReportStatusResponse(report_id=report.id, status=report.status)


@router.get("/{report_id}/download")
@root_router.get("/{report_id}/download")
def download_protected_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download password-protected report PDF.

    Password Rule: FIRST 4 CHARACTERS OF NAME (UPPERCASE) + 4-DIGIT BIRTH YEAR.
    """
    logger.info("Encrypted PDF download requested for report_id=%s by user_id=%s", report_id, current_user.id)
    report = db.query(report_service.Report).filter(report_service.Report.id == report_id).first()
    if report is None:
        raise ReportNotFoundError(detail=f"Report {report_id} not found")

    profile = report.profile
    if profile is None:
        raise HTTPException(status_code=400, detail="Report has no associated patient profile.")

    if profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this report's profile")

    # Generate patient password (NEVER logged or stored in database)
    password = generate_pdf_password(profile.profile_name, profile.date_of_birth, user_name=current_user.name)

    # Obtain original or dynamically generated PDF bytes
    raw_pdf_bytes = build_or_get_report_pdf(report)

    # Encrypt PDF bytes with user password
    encrypted_bytes = encrypt_pdf(raw_pdf_bytes, password)

    logger.info("Encrypted PDF generated successfully for report_id=%s", report_id)
    return Response(
        content=encrypted_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Mediora_Report_{report_id}.pdf"',
            "Content-Type": "application/pdf",
            "X-Password-Hint": password,
            "Access-Control-Expose-Headers": "Content-Disposition, X-Password-Hint",
        },
    )


@reference_router.get("/reference-ranges", tags=["debug"])
def list_reference_ranges(db: Session = Depends(get_db)):
    ranges = db.query(ReferenceRange).all()
    return [
        {
            "id": r.id,
            "species": r.species,
            "test_name": r.test_name,
            "gender": r.gender,
            "unit": r.unit,
            "range_low": r.range_low,
            "range_high": r.range_high,
        }
        for r in ranges
    ]
