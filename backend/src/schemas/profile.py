from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


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
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    breed: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
