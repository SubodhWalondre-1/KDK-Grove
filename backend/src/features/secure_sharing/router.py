from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from src.core.security import get_current_user
from src.database import get_db
from src.features.secure_sharing import service as sharing_service
from src.models.user import User
from src.schemas.sharing import (
    AccessLogListResponse,
    CreateShareLinkRequest,
    ShareLinkListResponse,
    ShareLinkResponse,
    SharedReportPayload,
    SharedReportPreview,
    ViewerAccessRequest,
)

owner_router = APIRouter(prefix="/api", tags=["secure-sharing"])
public_router = APIRouter(prefix="/api/shared", tags=["public-sharing"])


def _extract_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


# --- OWNER-AUTHENTICATED ENDPOINTS ---

@owner_router.post("/reports/{report_id}/share", response_model=ShareLinkResponse)
def create_share_link(
    report_id: int,
    body: CreateShareLinkRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create an active share link for a report owned by the authenticated user."""
    link = sharing_service.create_share_link(
        db=db,
        report_id=report_id,
        user_id=current_user.id,
        expires_in_days=body.expires_in_days,
    )
    return ShareLinkResponse(
        id=link.id,
        token=link.token,
        report_id=link.report_id,
        status=link.status,
        expires_at=link.expires_at,
        view_count=link.view_count,
        created_at=link.created_at,
        unseen_count=0,
        latest_access_at=None,
    )


@owner_router.get("/profiles/{profile_id}/share-links", response_model=ShareLinkListResponse)
def list_share_links_for_profile(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all active and revoked share links for a patient profile."""
    links = sharing_service.list_share_links_for_profile(db, profile_id, current_user.id)
    return ShareLinkListResponse(share_links=links)


@owner_router.get("/share-links/{share_link_id}/logs", response_model=AccessLogListResponse)
def get_share_link_logs(
    share_link_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve audit access logs for a share link and mark unseen logs as read."""
    logs = sharing_service.get_share_link_logs(db, share_link_id, current_user.id)
    return AccessLogListResponse(logs=logs)


@owner_router.post("/share-links/{share_link_id}/revoke", response_model=ShareLinkResponse)
def revoke_share_link(
    share_link_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke an active share link, blocking future guest access attempts."""
    link = sharing_service.revoke_share_link(db, share_link_id, current_user.id)
    return ShareLinkResponse(
        id=link.id,
        token=link.token,
        report_id=link.report_id,
        status=link.status,
        expires_at=link.expires_at,
        view_count=link.view_count,
        created_at=link.created_at,
        unseen_count=0,
        latest_access_at=None,
    )


# --- PUBLIC GUEST ENDPOINTS (NO AUTH REQUIRED) ---

@public_router.get("/{token}", response_model=SharedReportPreview)
def get_share_preview(
    token: str,
    db: Session = Depends(get_db),
):
    """Public endpoint — check share token validity and return preview metadata."""
    return sharing_service.get_share_preview(db, token)


@public_router.post("/{token}/access", response_model=SharedReportPayload)
def record_access_and_get_payload(
    token: str,
    request: Request,
    body: ViewerAccessRequest = ViewerAccessRequest(),
    db: Session = Depends(get_db),
):
    """Public endpoint — record guest audit access log and return shared report payload."""
    ip_address = _extract_client_ip(request)
    user_agent = request.headers.get("User-Agent")

    return sharing_service.record_access_and_get_payload(
        db=db,
        token=token,
        viewer_name=body.viewer_name,
        ip_address=ip_address,
        user_agent=user_agent,
    )
