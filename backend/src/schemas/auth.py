from datetime import datetime

from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    date_of_birth: str | None = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SignupResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
