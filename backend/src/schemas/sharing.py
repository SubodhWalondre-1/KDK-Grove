from datetime import date, datetime
from typing import List, Optional

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
    share_url: str = ""
    report_id: int
    report_type: Optional[str] = None
    profile_id: Optional[int] = None
    profile_name: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    status: str
    view_count: int = 0
    is_expired: bool = False
    unseen_count: int = 0
    latest_access_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ShareLinkListResponse(BaseModel):
    share_links: list[ShareLinkResponse]


class SharedReportPreview(BaseModel):
    valid: bool = True
    profile_name: Optional[str] = None
    species: Optional[str] = None
    species_category: Optional[str] = None
    report_type: Optional[str] = None
    report_date: Optional[date] = None
    expires_at: Optional[datetime] = None
    status: Optional[str] = None


class ViewerAccessRequest(BaseModel):
    viewer_name: Optional[str] = None


class SharedTestValue(BaseModel):
    test_name: str
    value: Optional[float] = None
    unit: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None
    status: Optional[str] = None


class SharedShareInfo(BaseModel):
    expires_at: datetime
    view_count: int = 0


class SharedProfileInfo(BaseModel):
    name: str
    species: Optional[str] = None
    breed: Optional[str] = None


class SharedReportInfo(BaseModel):
    report_type: Optional[str] = None
    report_date: Optional[date] = None
    health_score: Optional[float] = None
    status: str


class SharedReportPayload(BaseModel):
    report_id: int
    report_type: Optional[str] = None
    report_date: Optional[date] = None
    profile_name: str
    species_category: Optional[str] = None
    health_score: Optional[float] = None
    test_values: list[SharedTestValue] = []

    share: Optional[SharedShareInfo] = None
    profile: Optional[SharedProfileInfo] = None
    report: Optional[SharedReportInfo] = None
    insights: list[str] = []


class AccessLogEntry(BaseModel):
    id: int
    accessed_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_type: Optional[str] = None
    viewer_name: Optional[str] = None
    seen: bool

    model_config = ConfigDict(from_attributes=True)


class AccessLogListResponse(BaseModel):
    share_link_id: Optional[int] = None
    total_accesses: int = 0
    logs: list[AccessLogEntry]

