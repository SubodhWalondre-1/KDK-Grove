from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SpeciesOption(BaseModel):
    category: str
    display_name: str
    reference_data_available: bool


class SpeciesListResponse(BaseModel):
    species: list[SpeciesOption]


class ProfileCreate(BaseModel):
    profile_name: str
    species: str
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    breed: Optional[str] = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    profile_name: str
    species: str
    species_category: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    breed: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CoverageGap(BaseModel):
    species: str
    test_name: str
    missing_count: int


class CoverageSummary(BaseModel):
    species: str
    test_count: int


class ReferenceRangeCoverageResponse(BaseModel):
    covered: list[CoverageSummary]
    gaps: list[CoverageGap]


class ReferenceRangeBulkItem(BaseModel):
    species: str
    test_name: str
    gender: str = "any"
    unit: Optional[str] = None
    range_low: Optional[float] = None
    range_high: Optional[float] = None


class ReferenceRangeBulkRequest(BaseModel):
    items: list[ReferenceRangeBulkItem]


class TestAliasBulkItem(BaseModel):
    alias_text: str
    canonical_test_name: str
    species_category: Optional[str] = None


class TestAliasBulkRequest(BaseModel):
    items: list[TestAliasBulkItem]


class BulkInsertResponse(BaseModel):
    inserted_count: int
    skipped_count: int
