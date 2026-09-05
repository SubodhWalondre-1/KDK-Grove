from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from src.core.constants import (
    SHARE_LINK_ALLOWED_EXPIRY_DAYS,
    SHARE_LINK_DEFAULT_EXPIRY_DAYS,
)


class CreateShareLinkRequest(BaseModel):
    expires_in_days: int = SHARE_LINK_DEFAULT_EXPIRY_DAYS

    @field_validator("expires_in_days")
    @classmethod
    def validate_expiry_days(cls, v: int) -> int:
        if v not in SHARE_LINK_ALLOWED_EXPIRY_DAYS:
            raise ValueError(
                f"expires_in_days must be one of {sorted(list(SHARE_LINK_ALLOWED_EXPIRY_DAYS))}"
            )
        return v


class ShareLinkResponse(BaseModel):
    id: int
    token: str
    report_id: int
    status: str
    expires_at: datetime
    view_count: int
    created_at: datetime
    unseen_count: int = 0
    latest_access_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ShareLinkListResponse(BaseModel):
    share_links: list[ShareLinkResponse]


class SharedReportPreview(BaseModel):
    valid: bool
    report_type: Optional[str] = None
    species_category: Optional[str] = None


class ViewerAccessRequest(BaseModel):
    viewer_name: Optional[str] = None


class SharedTestValue(BaseModel):
    test_name: str
    value: Optional[float] = None
    unit: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None
    status: Optional[str] = None


class SharedReportPayload(BaseModel):
    report_id: int
    report_type: Optional[str] = None
    report_date: Optional[date] = None
    profile_name: str
    species_category: Optional[str] = None
    health_score: Optional[float] = None
    test_values: list[SharedTestValue]


class AccessLogEntry(BaseModel):
    id: int
    accessed_at: datetime
    device_type: Optional[str] = None
    viewer_name: Optional[str] = None
    seen: bool

    model_config = ConfigDict(from_attributes=True)


class AccessLogListResponse(BaseModel):
    logs: list[AccessLogEntry]
