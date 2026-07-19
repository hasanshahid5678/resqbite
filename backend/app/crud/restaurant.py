from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import ApprovalStatus
from app.models.restaurant import Restaurant


def get_restaurant_by_id(db: Session, restaurant_id: int) -> Restaurant | None:
    return db.get(Restaurant, restaurant_id)


def get_restaurant_by_owner(db: Session, owner_id: int) -> Restaurant | None:
    return db.scalar(select(Restaurant).where(Restaurant.owner_id == owner_id))


def create_restaurant(db: Session, *, owner_id: int, **fields) -> Restaurant:
    restaurant = Restaurant(owner_id=owner_id, **fields)
    db.add(restaurant)
    db.flush()
    db.refresh(restaurant)
    return restaurant


def update_restaurant(db: Session, restaurant: Restaurant, fields: dict) -> Restaurant:
    for key, value in fields.items():
        if value is not None:
            setattr(restaurant, key, value)
    db.add(restaurant)
    db.flush()
    db.refresh(restaurant)
    return restaurant


def list_restaurants(
    db: Session,
    *,
    cuisine: str | None = None,
    city: str | None = None,
    approval_status: ApprovalStatus | None = ApprovalStatus.approved,
    q: str | None = None,
) -> tuple[list[Restaurant], int]:
    stmt = select(Restaurant)
    count_stmt = select(func.count(Restaurant.id))
    if approval_status is not None:
        stmt = stmt.where(Restaurant.approval_status == approval_status)
        count_stmt = count_stmt.where(Restaurant.approval_status == approval_status)
    if cuisine:
        stmt = stmt.where(Restaurant.cuisine.ilike(f"%{cuisine}%"))
        count_stmt = count_stmt.where(Restaurant.cuisine.ilike(f"%{cuisine}%"))
    if city:
        stmt = stmt.where(Restaurant.city == city)
        count_stmt = count_stmt.where(Restaurant.city == city)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(Restaurant.name.ilike(like) | Restaurant.description.ilike(like))
        count_stmt = count_stmt.where(Restaurant.name.ilike(like) | Restaurant.description.ilike(like))
    total = db.scalar(count_stmt) or 0
    return list(db.scalars(stmt)) or [], total