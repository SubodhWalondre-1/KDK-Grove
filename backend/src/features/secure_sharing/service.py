from datetime import datetime, timedelta
import logging
import secrets
from typing import List, Optional, Tuple

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from src.config import get_settings
from src.core.constants import (
    REPORT_STATUS_COMPLETED,
    SHARE_LINK_ALLOWED_EXPIRY_DAYS,
    SHARE_LINK_INVALID_REASON_EXPIRED,
    SHARE_LINK_INVALID_REASON_NOT_FOUND,
    SHARE_LINK_INVALID_REASON_REVOKED,
    SHARE_LINK_STATUS_ACTIVE,
    SHARE_LINK_STATUS_REVOKED,
    SHARE_LINK_TOKEN_BYTES,
)
from src.core.exceptions import (
    ProfileNotFoundError,
    ReportNotFoundError,
    ShareLinkInvalidError,
    ShareLinkNotFoundError,
)
from src.core.severity import get_status_color
from src.models.profile import Profile
from src.models.report import Report, ReportTestValue
from src.models.share_link import AccessLog, ShareLink
from src.schemas.sharing import (
    AccessLogEntry,
    AccessLogListResponse,
    ShareLinkResponse,
    SharedProfileInfo,
    SharedReportInfo,
    SharedReportPayload,
    SharedReportPreview,
    SharedShareInfo,
    SharedTestValue,
)
from src.utils.device_parser import parse_device_type

logger = logging.getLogger(__name__)


def build_share_url(token: str) -> str:
    """Build canonical share URL using configured FRONTEND_BASE_URL."""
    base_url = get_settings().frontend_base_url.rstrip("/")
    return f"{base_url}/shared/{token}"


def generate_share_token() -> str:
    """Generate a cryptographically secure random URL-safe token."""
    return secrets.token_urlsafe(SHARE_LINK_TOKEN_BYTES)


def get_link_validity(link: Optional[ShareLink]) -> Tuple[bool, Optional[str]]:
    """Determine whether a share link is currently valid, returning failure reason if not."""
    if link is None:
        return False, SHARE_LINK_INVALID_REASON_NOT_FOUND

    if link.status == SHARE_LINK_STATUS_REVOKED:
        return False, SHARE_LINK_INVALID_REASON_REVOKED

    now = datetime.utcnow()
    if link.expires_at.tzinfo is not None:
        from datetime import timezone
        now = datetime.now(timezone.utc)

    if now >= link.expires_at:
        return False, SHARE_LINK_INVALID_REASON_EXPIRED

    if link.status != SHARE_LINK_STATUS_ACTIVE:
        return False, SHARE_LINK_INVALID_REASON_REVOKED

    return True, None


def create_share_link(
    db: Session, report_id: int, user_id: int, expires_in_days: int
) -> ShareLinkResponse:
    """Create an active share token for a report with specified expiration days."""
    if expires_in_days not in SHARE_LINK_ALLOWED_EXPIRY_DAYS:
        raise HTTPException(
            status_code=400,
            detail=f"expires_in_days must be one of {sorted(list(SHARE_LINK_ALLOWED_EXPIRY_DAYS))}",
        )

    report = (
        db.query(Report)
        .options(joinedload(Report.profile))
        .filter(Report.id == report_id)
        .first()
    )

    if report is None:
        raise ReportNotFoundError(detail=f"Report {report_id} not found")

    if not report.profile or report.profile.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this report's profile")

    if report.status != REPORT_STATUS_COMPLETED:
        raise HTTPException(status_code=400, detail="Only completed reports can be shared")

    # Defensively generate token ensuring zero collision
    while True:
        token = generate_share_token()
        existing = db.query(ShareLink).filter(ShareLink.token == token).first()
        if not existing:
            break

    expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

    share_link = ShareLink(
        token=token,
        report_id=report_id,
        created_by_user_id=user_id,
        created_at=datetime.utcnow(),
        expires_at=expires_at,
        status=SHARE_LINK_STATUS_ACTIVE,
        view_count=0,
    )
    db.add(share_link)
    db.commit()
    db.refresh(share_link)

    return ShareLinkResponse(
        id=share_link.id,
        token=share_link.token,
        share_url=build_share_url(share_link.token),
        report_id=share_link.report_id,
        report_type=report.report_type,
        profile_id=report.profile.id if report.profile else None,
        profile_name=report.profile.profile_name if report.profile else None,
        created_at=share_link.created_at,
        expires_at=share_link.expires_at,
        status=share_link.status,
        view_count=share_link.view_count,
        is_expired=False,
        unseen_count=0,
        latest_access_at=None,
    )


def get_share_preview(db: Session, token: str) -> SharedReportPreview:
    """Return non-sensitive report metadata preview for valid share tokens."""
    link = db.query(ShareLink).filter(ShareLink.token == token).first()
    valid, reason = get_link_validity(link)

    if not valid:
        if reason == SHARE_LINK_INVALID_REASON_NOT_FOUND:
            raise ShareLinkNotFoundError()
        raise ShareLinkInvalidError(reason=reason)

    report = (
        db.query(Report)
        .options(joinedload(Report.profile))
        .filter(Report.id == link.report_id)
        .first()
    )

    profile_name = report.profile.profile_name if report and report.profile else None
    species = report.profile.species_category if report and report.profile else None

    return SharedReportPreview(
        valid=True,
        profile_name=profile_name,
        species=species,
        species_category=species,
        report_type=report.report_type if report else None,
        report_date=report.report_date if report else None,
        expires_at=link.expires_at,
        status=link.status,
    )


def record_access_and_get_payload(
    db: Session,
    token: str,
    viewer_name: Optional[str],
    ip_address: str,
    user_agent: Optional[str],
) -> SharedReportPayload:
    """Log an audit access record and return the sanitized shared report payload."""
    link = db.query(ShareLink).filter(ShareLink.token == token).first()
    valid, reason = get_link_validity(link)

    if not valid:
        if reason == SHARE_LINK_INVALID_REASON_NOT_FOUND:
            raise ShareLinkNotFoundError()
        raise ShareLinkInvalidError(reason=reason)

    # Record access log
    device_type = parse_device_type(user_agent)
    clean_viewer_name = viewer_name.strip() if viewer_name and viewer_name.strip() else None
    access_log = AccessLog(
        share_link_id=link.id,
        accessed_at=datetime.utcnow(),
        ip_address=ip_address,
        user_agent=user_agent,
        device_type=device_type,
        viewer_name=clean_viewer_name,
        seen=False,
    )
    db.add(access_log)

    # Transaction-safe atomic update on view_count
    db.query(ShareLink).filter(ShareLink.id == link.id).update(
        {ShareLink.view_count: ShareLink.view_count + 1}
    )
    db.commit()
    db.refresh(link)

    # Load report payload data
    report = (
        db.query(Report)
        .options(
            joinedload(Report.profile),
            joinedload(Report.test_values),
            joinedload(Report.recommendations),
        )
        .filter(Report.id == link.report_id)
        .first()
    )

    shared_test_values = []
    if report and report.test_values:
        for tv in report.test_values:
            status = get_status_color(tv.value, tv.ref_low, tv.ref_high)
            shared_test_values.append(
                SharedTestValue(
                    test_name=tv.test_name,
                    value=tv.value,
                    unit=tv.unit,
                    ref_low=tv.ref_low,
                    ref_high=tv.ref_high,
                    status=status,
                )
            )

    profile_name = report.profile.profile_name if report and report.profile else "Patient"
    species = report.profile.species_category if report and report.profile else "human"
    breed = report.profile.breed if report and report.profile else None

    insights = [rec.content for rec in report.recommendations] if report and report.recommendations else []

    return SharedReportPayload(
        report_id=report.id,
        report_type=report.report_type,
        report_date=report.report_date,
        profile_name=profile_name,
        species_category=species,
        health_score=report.health_score,
        test_values=shared_test_values,
        share=SharedShareInfo(
            expires_at=link.expires_at,
            view_count=link.view_count,
        ),
        profile=SharedProfileInfo(
            name=profile_name,
            species=species,
            breed=breed,
        ),
        report=SharedReportInfo(
            report_type=report.report_type,
            report_date=report.report_date,
            health_score=report.health_score,
            status=report.status,
        ),
        insights=insights,
    )


def list_share_links_for_profile(
    db: Session, profile_id: int, user_id: int
) -> List[ShareLinkResponse]:
    """List all active and revoked share links for reports under a patient profile, newest first."""
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if profile is None:
        raise ProfileNotFoundError(detail=f"Profile {profile_id} not found")

    if profile.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this profile")

    links = (
        db.query(ShareLink, Report)
        .join(Report, ShareLink.report_id == Report.id)
        .filter(Report.profile_id == profile_id)
        .order_by(ShareLink.created_at.desc(), ShareLink.id.desc())
        .all()
    )

    result = []
    now = datetime.utcnow()
    for link, report in links:
        is_expired = now >= link.expires_at
        effective_status = (
            SHARE_LINK_STATUS_REVOKED
            if link.status == SHARE_LINK_STATUS_REVOKED
            else ("expired" if is_expired else link.status)
        )

        unseen_count = (
            db.query(func.count(AccessLog.id))
            .filter(AccessLog.share_link_id == link.id, AccessLog.seen == False)
            .scalar()
            or 0
        )

        latest_access_at = (
            db.query(func.max(AccessLog.accessed_at))
            .filter(AccessLog.share_link_id == link.id)
            .scalar()
        )

        result.append(
            ShareLinkResponse(
                id=link.id,
                token=link.token,
                share_url=build_share_url(link.token),
                report_id=link.report_id,
                report_type=report.report_type,
                profile_id=profile.id,
                profile_name=profile.profile_name,
                status=effective_status,
                expires_at=link.expires_at,
                view_count=link.view_count,
                created_at=link.created_at,
                is_expired=is_expired,
                unseen_count=unseen_count,
                latest_access_at=latest_access_at,
            )
        )

    return result


def get_share_link_logs(
    db: Session, share_link_id: int, user_id: int
) -> AccessLogListResponse:
    """Retrieve audit access logs for a share link and mark all unseen logs as read."""
    link = (
        db.query(ShareLink)
        .options(joinedload(ShareLink.report).joinedload(Report.profile))
        .filter(ShareLink.id == share_link_id)
        .first()
    )
    if link is None:
        raise ShareLinkNotFoundError(detail=f"Share link {share_link_id} not found")

    # Ownership check: verify authenticated user owns the profile owning the report
    is_owner = (link.created_by_user_id == user_id)
    if link.report and link.report.profile and link.report.profile.user_id != user_id:
        is_owner = False
    if not is_owner:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this share link")

    # Side effect: Mark unseen logs as seen
    db.query(AccessLog).filter(
        AccessLog.share_link_id == share_link_id, AccessLog.seen == False
    ).update({"seen": True})
    db.commit()

    logs = (
        db.query(AccessLog)
        .filter(AccessLog.share_link_id == share_link_id)
        .order_by(AccessLog.accessed_at.desc(), AccessLog.id.desc())
        .all()
    )

    log_entries = [AccessLogEntry.model_validate(log) for log in logs]
    return AccessLogListResponse(
        share_link_id=share_link_id,
        total_accesses=len(log_entries),
        logs=log_entries,
    )


def revoke_share_link(db: Session, share_link_id: int, user_id: int) -> ShareLinkResponse:
    """Revoke an active share link, preventing all future guest access attempts."""
    link = (
        db.query(ShareLink)
        .options(joinedload(ShareLink.report).joinedload(Report.profile))
        .filter(ShareLink.id == share_link_id)
        .first()
    )
    if link is None:
        raise ShareLinkNotFoundError(detail=f"Share link {share_link_id} not found")

    is_owner = (link.created_by_user_id == user_id)
    if link.report and link.report.profile and link.report.profile.user_id != user_id:
        is_owner = False
    if not is_owner:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this share link")

    link.status = SHARE_LINK_STATUS_REVOKED
    db.commit()
    db.refresh(link)

    now = datetime.utcnow()
    is_expired = now >= link.expires_at

    return ShareLinkResponse(
        id=link.id,
        token=link.token,
        share_url=build_share_url(link.token),
        report_id=link.report_id,
        report_type=link.report.report_type if link.report else None,
        profile_id=link.report.profile.id if link.report and link.report.profile else None,
        profile_name=link.report.profile.profile_name if link.report and link.report.profile else None,
        created_at=link.created_at,
        expires_at=link.expires_at,
        status=link.status,
        view_count=link.view_count,
        is_expired=is_expired,
        unseen_count=0,
        latest_access_at=None,
    )

