from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.crud.user import create_user, get_user_by_email, get_user_by_id
from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.user import TokenResponse, UserLogin, UserOut, UserRegister
from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.utils.exceptions import ConflictError, UnauthorizedError

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "resqbite_refresh"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=False,  # set True in prod behind HTTPS
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE, path="/api/auth")


@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegister, response: Response, db: Session = Depends(get_db)) -> TokenResponse:
    existing = get_user_by_email(db, payload.email)
    if existing:
        raise ConflictError("Email already registered")
    user = create_user(
        db,
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.commit()
    db.refresh(user)
    access = create_access_token(user.id, user.role)
    refresh = create_refresh_token(user.id, user.role)
    _set_refresh_cookie(response, refresh)
    return TokenResponse(access_token=access, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)) -> TokenResponse:
    user = get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedError("Incorrect email or password")
    if user.is_suspended:
        raise UnauthorizedError("Account suspended")
    access = create_access_token(user.id, user.role)
    refresh = create_refresh_token(user.id, user.role)
    _set_refresh_cookie(response, refresh)
    return TokenResponse(access_token=access, user=UserOut.model_validate(user))


@router.post("/refresh", response_model=TokenResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)) -> TokenResponse:
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise UnauthorizedError("Missing refresh token")
    payload = decode_token(token)
    try:
        user_id = int(payload["sub"])
        role = UserRole(payload["role"])
    except (KeyError, ValueError) as exc:
        raise UnauthorizedError("Invalid refresh token") from exc
    user = get_user_by_id(db, user_id)
    if not user or user.is_suspended:
        raise UnauthorizedError("Invalid refresh token")
    access = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id, user.role)
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=access, user=UserOut.model_validate(user))


@router.post("/logout")
def logout(response: Response) -> JSONResponse:
    _clear_refresh_cookie(response)
    return JSONResponse(status_code=200, content={"detail": "Logged out"})


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user