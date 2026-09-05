from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class RecommendationItemResponse(BaseModel):
    """Individual recommendation row response (legacy / admin use)."""

    id: int
    category: str
    content: str
    severity_gate: str
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- New Finding-Driven Insights Response ---


class FindingResponse(BaseModel):
    """A single lab parameter finding with its clinical status and priority."""

    parameter: str
    value: Optional[float | str] = None
    unit: Optional[str] = None
    reference_range: str
    status: str            # "high" | "low" | "normal"
    priority: str          # "attention" | "monitoring" | "normal"


class FindingRecommendation(BaseModel):
    """AI-generated recommendation anchored to a specific lab finding."""

    finding_parameter: str
    why_flagged: str
    simple_explanation: str
    general_support: list[str] = []
    discuss_with_clinician: list[str] = []
    follow_up: list[str] = []
    evidence_sources: list[str] = []


class InsightsResponse(BaseModel):
    """Complete AI Report Insights response with findings, recommendations, and evidence trail."""

    report_id: int
    has_been_generated: bool
    is_urgent: bool = False
    urgent_care_message: Optional[str] = None
    summary: dict = {}               # {"attention": int, "monitoring": int, "normal": int}
    findings: list[FindingResponse] = []
    recommendations: list[FindingRecommendation] = []
    sources: list[dict] = []         # [{"id": "...", "title": "...", "category": "..."}]
    severity_gate: Optional[str] = None
    generated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Legacy compat alias (used by existing tests) ---
RecommendationsResponse = InsightsResponse
