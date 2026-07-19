from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.crud.restaurant import get_restaurant_by_id, list_restaurants
from app.database import get_db
from app.deps import require_role
from app.models.enums import ApprovalStatus, ListingStatus, ReservationStatus, UserRole
from app.models.listing import Listing
from app.models.reservation import Reservation
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.admin import AdminStats, RestaurantAdminView, SuspendUpdate, UserAdminView
from app.utils.exceptions import ForbiddenError, NotFoundError

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminListingOut(BaseModel):
    id: int
    restaurant_id: int
    restaurant_name: str
    title: str
    category: str
    original_price: str
    discounted_price: str
    quantity: int
    available_quantity: int
    status: str


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.admin))):
    total_restaurants = db.scalar(select(func.count(Restaurant.id))) or 0
    approved = db.scalar(select(func.count(Restaurant.id)).where(Restaurant.approval_status == ApprovalStatus.approved)) or 0
    pending = db.scalar(select(func.count(Restaurant.id)).where(Restaurant.approval_status == ApprovalStatus.pending)) or 0
    customers = db.scalar(select(func.count(User.id)).where(User.role == UserRole.customer)) or 0
    total_reservations = db.scalar(select(func.count(Reservation.id))) or 0
    picked_up = db.scalar(
        select(func.count(Reservation.id)).where(Reservation.reservation_status == ReservationStatus.picked_up)
    ) or 0
    active_listings = db.scalar(select(func.count(Listing.id)).where(Listing.status == ListingStatus.available)) or 0
    return AdminStats(
        total_restaurants=total_restaurants,
        approved_restaurants=approved,
        pending_restaurants=pending,
        total_customers=customers,
        total_reservations=total_reservations,
        active_listings=active_listings,
        picked_up_reservations=picked_up,
    )


def _restaurant_admin_view(restaurant: Restaurant, owner: User | None) -> RestaurantAdminView:
    return RestaurantAdminView(
        id=restaurant.id,
        owner_id=restaurant.owner_id,
        name=restaurant.name,
        description=restaurant.description,
        address=restaurant.address,
        cuisine=restaurant.cuisine,
        approval_status=restaurant.approval_status.value,
        owner_email=owner.email if owner else "",
        owner_name=owner.name if owner else "",
    )


@router.get("/restaurants", response_model=list[RestaurantAdminView])
def restaurants_list(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.admin)),
    approval_status: ApprovalStatus | None = Query(default=None),
):
    restaurants, _ = list_restaurants(db, approval_status=approval_status)
    out: list[RestaurantAdminView] = []
    for r in restaurants:
        owner = db.get(User, r.owner_id)
        out.append(_restaurant_admin_view(r, owner))
    return out


@router.patch("/restaurants/{restaurant_id}/approve", response_model=RestaurantAdminView)
def approve_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.admin)),
):
    restaurant = get_restaurant_by_id(db, restaurant_id)
    if not restaurant:
        raise NotFoundError("Restaurant not found")
    restaurant.approval_status = ApprovalStatus.approved
    db.flush()
    db.commit()
    db.refresh(restaurant)
    return _restaurant_admin_view(restaurant, db.get(User, restaurant.owner_id))


@router.patch("/restaurants/{restaurant_id}/reject", response_model=RestaurantAdminView)
def reject_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.admin)),
):
    restaurant = get_restaurant_by_id(db, restaurant_id)
    if not restaurant:
        raise NotFoundError("Restaurant not found")
    restaurant.approval_status = ApprovalStatus.rejected
    db.flush()
    db.commit()
    db.refresh(restaurant)
    return _restaurant_admin_view(restaurant, db.get(User, restaurant.owner_id))


@router.get("/users", response_model=list[UserAdminView])
def users_list(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.admin)),
):
    users = list(db.scalars(select(User).order_by(User.id)))
    return [
        UserAdminView(id=u.id, name=u.name, email=u.email, role=u.role.value, is_suspended=u.is_suspended)
        for u in users
    ]


@router.patch("/users/{user_id}/suspend", response_model=UserAdminView)
def suspend_user(
    user_id: int,
    payload: SuspendUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.admin)),
):
    target = db.get(User, user_id)
    if not target:
        raise NotFoundError("User not found")
    if target.role == UserRole.admin:
        raise ForbiddenError("Cannot suspend admin users")
    target.is_suspended = payload.is_suspended
    db.flush()
    db.commit()
    db.refresh(target)
    return UserAdminView(
        id=target.id, name=target.name, email=target.email, role=target.role.value, is_suspended=target.is_suspended
    )


@router.get("/listings", response_model=list[AdminListingOut])
def listings_list(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.admin)),
):
    listings = list(db.scalars(select(Listing).order_by(Listing.id)))
    return [
        AdminListingOut(
            id=l.id,
            restaurant_id=l.restaurant_id,
            restaurant_name=l.restaurant.name if l.restaurant else "",
            title=l.title,
            category=l.category,
            original_price=str(l.original_price),
            discounted_price=str(l.discounted_price),
            quantity=l.quantity,
            available_quantity=l.available_quantity,
            status=l.status.value,
        )
        for l in listings
    ]