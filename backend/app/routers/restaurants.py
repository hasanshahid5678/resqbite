from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.crud.restaurant import (
    create_restaurant,
    get_restaurant_by_id,
    get_restaurant_by_owner,
    list_restaurants,
    update_restaurant,
)
from app.database import get_db
from app.deps import get_current_user, require_role
from app.models.enums import ApprovalStatus, UserRole
from app.models.user import User
from app.schemas.restaurant import RestaurantCreate, RestaurantOut, RestaurantUpdate
from app.utils.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.utils.geo import coords_to_float, haversine_km


router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.get("/me", response_model=RestaurantOut)
def my_profile(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.restaurant)),
):
    restaurant = get_restaurant_by_owner(db, user.id)
    if not restaurant:
        raise NotFoundError("Restaurant profile not found")
    return RestaurantOut.model_validate(restaurant)


@router.get("", response_model=list[RestaurantOut])
def list_(
    db: Session = Depends(get_db),
    cuisine: str | None = None,
    city: str | None = None,
    q: str | None = None,
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    radius_km: float | None = Query(default=None, gt=0),
):
    restaurants, _ = list_restaurants(db, cuisine=cuisine, city=city, approval_status=ApprovalStatus.approved, q=q)
    out: list[RestaurantOut] = []
    for r in restaurants:
        # Distance filter only applied if radius_km is explicitly set
        if lat is not None and lng is not None and radius_km is not None:
            r_lat = coords_to_float(r.latitude)
            r_lng = coords_to_float(r.longitude)
            if r_lat is None or r_lng is None:
                continue
            if haversine_km(lat, lng, r_lat, r_lng) > radius_km:
                continue
        out.append(RestaurantOut.model_validate(r))
    return out


@router.get("/{restaurant_id}", response_model=RestaurantOut)
def detail(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = get_restaurant_by_id(db, restaurant_id)
    if not restaurant:
        raise NotFoundError("Restaurant not found")
    return RestaurantOut.model_validate(restaurant)


@router.post("", response_model=RestaurantOut, status_code=201)
def create(
    payload: RestaurantCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.restaurant)),
):
    if get_restaurant_by_owner(db, user.id):
        raise ConflictError("You already have a restaurant profile")
    fields = payload.model_dump()
    restaurant = create_restaurant(db, owner_id=user.id, **fields)
    db.commit()
    db.refresh(restaurant)
    return RestaurantOut.model_validate(restaurant)


@router.patch("", response_model=RestaurantOut)
def update_self(
    payload: RestaurantUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.restaurant)),
):
    restaurant = get_restaurant_by_owner(db, user.id)
    if not restaurant:
        raise NotFoundError("Restaurant profile not found")
    update_restaurant(db, restaurant, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(restaurant)
    return RestaurantOut.model_validate(restaurant)