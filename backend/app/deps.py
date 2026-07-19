from typing import Callable

from fastapi import Depends, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.services.auth_service import decode_token
from app.utils.exceptions import AppException, ForbiddenError, UnauthorizedError


CREDENTIALS_EXCEPTION = UnauthorizedError("Could not validate credentials")


def _extract_access_token(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise UnauthorizedError("Missing bearer token")
    return auth.split(" ", 1)[1].strip()


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = _extract_access_token(request)
    payload = decode_token(token)
    user_id_raw = payload.get("sub")
    role = payload.get("role")
    if not user_id_raw or not role:
        raise CREDENTIALS_EXCEPTION
    try:
        user_id = int(user_id_raw)
    except ValueError as exc:
        raise CREDENTIALS_EXCEPTION from exc

    user = db.get(User, user_id)
    if not user:
        raise UnauthorizedError("User not found")
    if user.is_suspended:
        raise ForbiddenError("Account suspended")
    return user


def require_role(*roles: UserRole) -> Callable[..., User]:
    if not roles:
        raise ValueError("require_role requires at least one role")

    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise ForbiddenError("Insufficient permissions")
        return user

    return dependency


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    auth = request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        return None
    try:
        token = auth.split(" ", 1)[1].strip()
        payload = decode_token(token)
        user_id = int(payload.get("sub", 0))
    except (UnauthorizedError, ValueError):
        return None
    user = db.get(User, user_id)
    if user and user.is_suspended:
        return None
    return user


async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


async def generic_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"detail": "Internal server error"})