from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class ReportUploadResponse(BaseModel):
    report_id: int
    id: Optional[int] = None
    status: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportStatusResponse(BaseModel):
    report_id: int
    id: Optional[int] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


class TestValueResponse(BaseModel):
    id: int
    test_name: str
    value: Optional[float] = None
    unit: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None
    status: Optional[str] = None
    is_manually_corrected: bool

    model_config = ConfigDict(from_attributes=True)


class ReportDetailResponse(BaseModel):
    id: int
    report_id: Optional[int] = None
    profile_id: int
    report_type: Optional[str] = None
    report_date: Optional[date] = None
    status: str
    health_score: Optional[float] = None
    test_values: List[TestValueResponse]

    model_config = ConfigDict(from_attributes=True)


class TestValueCorrection(BaseModel):
    id: int
    value: Optional[float] = None
    unit: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None


class ReportCorrectionRequest(BaseModel):
    test_values: List[TestValueCorrection]
