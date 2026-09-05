from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict

from src.schemas.recommendation import InsightsResponse


class TestValueWithStatus(BaseModel):
    id: int
    test_name: str
    value: Optional[float] = None
    unit: Optional[str] = None
    ref_low: Optional[float] = None
    ref_high: Optional[float] = None
    status: Optional[str] = None
    is_manually_corrected: bool

    model_config = ConfigDict(from_attributes=True)


class StatusRatio(BaseModel):
    normal: int
    borderline: int
    abnormal: int


class TrendSeries(BaseModel):
    labels: list[str]
    datasets: list[dict]


class DashboardResponse(BaseModel):
    report_id: int
    id: Optional[int] = None
    profile_id: int
    profile_name: Optional[str] = None
    species: Optional[str] = None
    species_category: Optional[str] = None
    gender: Optional[str] = None
    report_date: Optional[date] = None
    health_score: Optional[float] = None
    health_score_label: str
    test_values: list[TestValueWithStatus]
    abnormal_values: list[TestValueWithStatus]
    status_ratio: StatusRatio
    parameter_trend: TrendSeries
    health_insights: Optional[InsightsResponse] = None
    insights: Optional[InsightsResponse] = None


class ProfileHealthScoreResponse(BaseModel):
    profile_id: int
    latest_report_id: Optional[int] = None
    latest_health_score: Optional[float] = None
    latest_report_date: Optional[date] = None
