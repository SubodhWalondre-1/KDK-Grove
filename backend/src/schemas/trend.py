from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TrendListItem(BaseModel):
    test_name: str
    report_count: int


class TrendListResponse(BaseModel):
    profile_id: int
    tests: list[TrendListItem]


class TrendPoint(BaseModel):
    report_id: int
    report_date: Optional[date] = None
    value: float
    unit: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None
    status: Optional[str] = None


class TestTrendSeriesResponse(BaseModel):
    profile_id: int
    test_name: str
    unit: Optional[str] = None
    points: list[TrendPoint]
    direction: str
    normalized_slope: Optional[float] = None
    based_on_report_count: int


class TrendOverviewItem(BaseModel):
    test_name: str
    latest_value: float
    latest_unit: Optional[str] = None
    latest_status: Optional[str] = None
    direction: str
    sparkline: list[float]
    report_count: int


class HealthScoreTrendSummary(BaseModel):
    sparkline: list[Optional[float]]
    direction: str
    latest_score: Optional[float] = None
    based_on_report_count: int


class TrendOverviewResponse(BaseModel):
    profile_id: int
    health_score_trend: HealthScoreTrendSummary
    tests: list[TrendOverviewItem]


class TrendInsightResponse(BaseModel):
    profile_id: int
    test_name: str
    insight_text: str
    direction: str
    based_on_report_count: int
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)
