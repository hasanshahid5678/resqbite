from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def create_user(db: Session, *, name: str, email: str, password_hash: str, role) -> User:
    user = User(name=name, email=email, password_hash=password_hash, role=role)
    db.add(user)
    db.flush()
    db.refresh(user)
    return user


def list_users(db: Session, role=None) -> list[User]:
    stmt = select(User)
    if role:
        stmt = stmt.where(User.role == role)
    return list(db.scalars(stmt))