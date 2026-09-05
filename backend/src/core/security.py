import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from src.config import get_settings
from src.core.exceptions import AuthenticationError
from src.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

JWT_ALGORITHM = "HS256"


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: int) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiry_minutes)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError(detail="Token has expired")
    except jwt.InvalidTokenError:
        raise AuthenticationError(detail="Invalid authentication token")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """FastAPI dependency — decodes the JWT bearer token and returns the authenticated User."""
    from src.models.user import User

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise AuthenticationError(detail="Token payload missing user identifier")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise AuthenticationError(detail="User no longer exists")

    return user


def get_optional_current_user(
    token: str | None = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
):
    """FastAPI dependency — returns authenticated User if Bearer token present, else None."""
    if not token:
        return None
    try:
        from src.models.user import User

        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is not None:
            return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        pass
    return None


def require_admin_key(x_admin_key: str | None = Header(None)) -> str:
    """FastAPI dependency — validates X-Admin-Key header using constant-time comparison."""
    if not x_admin_key:
        raise AuthenticationError(detail="Missing admin API key header")
    settings = get_settings()
    if not secrets.compare_digest(x_admin_key, settings.admin_api_key):
        raise AuthenticationError(detail="Invalid admin API key")
    return x_admin_key
