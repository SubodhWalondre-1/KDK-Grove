from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class NutritionContextRequest(BaseModel):
    food_preference: str = "no_preference"   # "vegetarian" | "non_vegetarian" | "vegan" | "no_preference"
    restrictions: list[str] = []               # ["dairy", "gluten", "nuts", "seafood", "eggs"]
    regional_styles: list[str] = ["indian"]     # ["indian", "north_indian", "south_indian", "maharashtrian", "gujarati", "bengali", "other"]
    accessibility: str = "common_household"    # "common_household" | "budget_friendly" | "flexible"
    clinician_restrictions: Optional[str] = None


class NutritionContextResponse(BaseModel):
    id: int
    profile_id: int
    food_preference: str
    restrictions: list[str] = []
    regional_styles: list[str] = []
    accessibility: str
    clinician_restrictions: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PrimaryFocusItem(BaseModel):
    parameter: str
    value: str | float
    unit: Optional[str] = ""
    reference_range: str
    status: str
    priority: str


class MealOptionItem(BaseModel):
    title: str
    description: str
    highlights: list[str] = []


class MealOptions(BaseModel):
    breakfast: list[MealOptionItem] = []
    lunch: list[MealOptionItem] = []
    dinner: list[MealOptionItem] = []


class LimitItem(BaseModel):
    category: str
    items: list[str] = []
    reason: str
    evidence_source: Optional[str] = None


class SmartSwapItem(BaseModel):
    instead_of: str
    consider: str
    why: str


class DietPlanResponse(BaseModel):
    id: int
    report_id: int
    has_been_generated: bool = True
    primary_focus: list[PrimaryFocusItem] = []
    nutrition_direction: str
    meal_options: MealOptions
    foods_to_limit: list[LimitItem] = []
    smart_swaps: list[SmartSwapItem] = []
    evidence_sources: list[dict] = []
    generated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
