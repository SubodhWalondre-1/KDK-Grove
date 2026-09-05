from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from src.core.security import create_access_token
from src.database import get_db
from src.features.auth import service as auth_service
from src.schemas.auth import LoginResponse, SignupRequest, SignupResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=SignupResponse, status_code=201)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    user = auth_service.signup(db, body.name, body.email, body.password)
    access_token = create_access_token(user.id)
    return SignupResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=LoginResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = auth_service.authenticate(db, form_data.username, form_data.password)
    access_token = create_access_token(user.id)
    return LoginResponse(access_token=access_token)
