from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base

if TYPE_CHECKING:
    from src.models.profile import Profile
    from src.models.report import Report


class NutritionContext(Base):
    __tablename__ = "nutrition_contexts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id"), nullable=False, unique=True)
    food_preference: Mapped[str] = mapped_column(String, nullable=False, default="no_preference")
    restrictions_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)     # JSON list: ["dairy", "gluten"]
    regional_styles_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # JSON list: ["indian", "south_indian"]
    accessibility: Mapped[str] = mapped_column(String, nullable=False, default="common_household")
    clinician_restrictions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    profile: Mapped["Profile"] = relationship(backref="nutrition_context")


class DietPlan(Base):
    __tablename__ = "diet_plans"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id"), nullable=False, unique=True)
    primary_focus_json: Mapped[str] = mapped_column(Text, nullable=False)   # JSON list of focus parameters
    nutrition_direction: Mapped[str] = mapped_column(Text, nullable=False)
    meal_options_json: Mapped[str] = mapped_column(Text, nullable=False)     # JSON: {breakfast: [], lunch: [], dinner: []}
    foods_to_limit_json: Mapped[str] = mapped_column(Text, nullable=False)   # JSON list of items to limit
    smart_swaps_json: Mapped[str] = mapped_column(Text, nullable=False)      # JSON list: [{instead_of, consider, why}]
    evidence_sources_json: Mapped[str] = mapped_column(Text, nullable=False)  # JSON list of source IDs
    generated_at: Mapped[datetime] = mapped_column(server_default=func.now())

    report: Mapped["Report"] = relationship(backref="diet_plan")
