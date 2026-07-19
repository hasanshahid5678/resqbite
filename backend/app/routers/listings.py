from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.config import settings
from app.crud.listing import get_listing, list_listings_filtered
from app.crud.restaurant import get_restaurant_by_id, get_restaurant_by_owner
from app.database import get_db
from app.deps import require_role
from app.models.enums import ApprovalStatus, ListingStatus, UserRole
from app.models.user import User
from app.schemas.listing import ListingCreate, ListingOut, ListingUpdate, ListingWithRestaurant
from app.services.listing_expiry import reconcile_listing_status, reconcile_many
from app.utils.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.utils.geo import coords_to_float, haversine_km
from app.utils.pagination import build_page, pagination_params

router = APIRouter(prefix="/listings", tags=["listings"])


def _validate_image(payload_data: str | None) -> None:
    if payload_data is None:
        return
    if not payload_data.startswith("data:image/"):
        raise HTTPException(status_code=400, detail="Image must be a data URL starting with data:image/")
    # Approximate base64 payload size: "data:image/png;base64," prefix stripped, decoded ~ payload*3/4
    header_idx = payload_data.find("base64,")
    if header_idx > 0:
        encoded = payload_data[header_idx + len("base64,") :]
    else:
        encoded = ""
    approx_bytes = len(encoded) * 3 // 4
    if approx_bytes > settings.MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail=f"Image exceeds {settings.MAX_IMAGE_BYTES} bytes")


def _to_with_restaurant(listing) -> ListingWithRestaurant:
    return ListingWithRestaurant(
        id=listing.id,
        restaurant_id=listing.restaurant_id,
        title=listing.title,
        description=listing.description,
        category=listing.category,
        original_price=listing.original_price,
        discounted_price=listing.discounted_price,
        quantity=listing.quantity,
        available_quantity=listing.available_quantity,
        pickup_start=listing.pickup_start,
        pickup_end=listing.pickup_end,
        expires_at=listing.expires_at,
        image_data=listing.image_data,
        status=listing.status,
        created_at=listing.created_at,
        restaurant_name=listing.restaurant.name,
        restaurant_address=listing.restaurant.address,
        restaurant_cuisine=listing.restaurant.cuisine,
        restaurant_latitude=listing.restaurant.latitude,
        restaurant_longitude=listing.restaurant.longitude,
    )


@router.get("", response_model=list[ListingWithRestaurant])
def list_(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    restaurant_id: int | None = None,
    category: str | None = None,
    city: str | None = None,
    min_discount: float | None = Query(default=None, ge=0, le=100),
    pickup_after: datetime | None = None,
    q: str | None = None,
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    radius_km: float | None = Query(default=None, gt=0),
):
    listings, total = list_listings_filtered(
        db,
        restaurant_id=restaurant_id,
        category=category,
        city=city,
        min_discount_pct=min_discount,
        pickup_after=pickup_after,
        q=q,
        include_expired=False,
    )
    reconcile_many(db, listings)
    result: list = []
    for listing in listings:
        # skip inactive listings
        if listing.status == ListingStatus.inactive:
            continue
        out = _to_with_restaurant(listing)
        # Distance display works whenever lat/lng are present (no radius required).
        if lat is not None and lng is not None:
            r_lat = coords_to_float(listing.restaurant.latitude)
            r_lng = coords_to_float(listing.restaurant.longitude)
            if r_lat is not None and r_lng is not None:
                out.distance_km = round(haversine_km(lat, lng, r_lat, r_lng), 2)
                # Only filter by radius if explicitly asked.
                if radius_km is not None and out.distance_km > radius_km:
                    continue
        result.append(out)
    return result[(page - 1) * page_size : page * page_size]


@router.get("/{listing_id}", response_model=ListingWithRestaurant)
def detail(listing_id: int, db: Session = Depends(get_db)):
    listing = get_listing(db, listing_id)
    if not listing:
        raise NotFoundError("Listing not found")
    reconcile_listing_status(listing)
    db.flush()
    if listing.restaurant.approval_status != ApprovalStatus.approved:
        raise NotFoundError("Listing not found")
    return _to_with_restaurant(listing)


@router.post("", response_model=ListingOut, status_code=201)
def create(
    payload: ListingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.restaurant)),
):
    restaurant = get_restaurant_by_owner(db, user.id)
    if not restaurant:
        raise NotFoundError("Restaurant profile not found")
    if restaurant.approval_status != ApprovalStatus.approved:
        raise ForbiddenError("Restaurant pending admin approval")
    if payload.pickup_end < payload.pickup_start:
        raise HTTPException(status_code=400, detail="pickup_end must be after pickup_start")
    if payload.expires_at < payload.pickup_end:
        raise HTTPException(status_code=400, detail="expires_at must be after pickup_end")
    if payload.discounted_price > payload.original_price:
        raise HTTPException(status_code=400, detail="discounted_price cannot exceed original_price")
    _validate_image(payload.image_data)

    from app.models.listing import Listing

    listing = Listing(
        restaurant_id=restaurant.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        original_price=payload.original_price,
        discounted_price=payload.discounted_price,
        quantity=payload.quantity,
        available_quantity=payload.quantity,
        pickup_start=payload.pickup_start,
        pickup_end=payload.pickup_end,
        expires_at=payload.expires_at,
        image_data=payload.image_data,
        status=ListingStatus.available,
    )
    db.add(listing)
    db.flush()
    db.refresh(listing)
    db.commit()
    db.refresh(listing)
    return ListingOut.model_validate(listing)


@router.put("/{listing_id}", response_model=ListingOut)
def update(
    listing_id: int,
    payload: ListingUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.restaurant)),
):
    listing = get_listing(db, listing_id)
    if not listing:
        raise NotFoundError("Listing not found")
    if listing.restaurant.owner_id != user.id:
        raise ForbiddenError("Not the owner of this listing")
    data = payload.model_dump(exclude_unset=True)
    _validate_image(data.get("image_data"))
    if "quantity" in data and data["quantity"] is not None:
        new_qty = data["quantity"]
        held = sum(
            r.quantity
            for r in listing.reservations
            if r.reservation_status.value == "reserved"
        )
        if new_qty < held:
            raise ConflictError("quantity cannot be below active reservations")
        listing.available_quantity = new_qty - held
        listing.quantity = new_qty
    for key in ("title", "description", "category", "original_price", "discounted_price", "pickup_start", "pickup_end", "expires_at", "image_data"):
        if key in data and data[key] is not None:
            setattr(listing, key, data[key])
    reconcile_listing_status(listing)
    db.flush()
    db.commit()
    db.refresh(listing)
    return ListingOut.model_validate(listing)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    listing_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.restaurant)),
):
    listing = get_listing(db, listing_id)
    if not listing:
        raise NotFoundError("Listing not found")
    if listing.restaurant.owner_id != user.id:
        raise ForbiddenError("Not the owner of this listing")
    db.delete(listing)
    db.commit()


@router.patch("/{listing_id}/deactivate", response_model=ListingOut)
def deactivate(
    listing_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.restaurant)),
):
    listing = get_listing(db, listing_id)
    if not listing:
        raise NotFoundError("Listing not found")
    if listing.restaurant.owner_id != user.id:
        raise ForbiddenError("Not the owner of this listing")
    listing.status = ListingStatus.inactive
    db.flush()
    db.commit()
    db.refresh(listing)
    return ListingOut.model_validate(listing)


@router.get("/me/listings", response_model=list[ListingOut])
def my_listings(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.restaurant)),
):
    restaurant = get_restaurant_by_owner(db, user.id)
    if not restaurant:
        raise NotFoundError("Restaurant profile not found")
    listings = list(restaurant.listings)
    reconcile_many(db, listings)
    return [ListingOut.model_validate(l) for l in listings]