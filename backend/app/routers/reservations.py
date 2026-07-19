from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.crud.reservation import (
    get_reservation,
    list_customer_reservations,
    list_restaurant_reservations,
)
from app.crud.restaurant import get_restaurant_by_owner
from app.database import get_db
from app.deps import get_current_user, require_role
from app.models.enums import ApprovalStatus, ListingStatus, ReservationStatus, UserRole
from app.models.listing import Listing
from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.reservation import (
    PickupRequest,
    ReservationCreate,
    ReservationWithDetails,
)
from app.services.listing_expiry import reconcile_listing_status
from app.services.qr_service import decode_qr_token, generate_qr_data_url
from app.utils.exceptions import ConflictError, ForbiddenError, NotFoundError

router = APIRouter(prefix="/reservations", tags=["reservations"])


def _enrich(reservation: Reservation) -> ReservationWithDetails:
    listing = reservation.listing
    return ReservationWithDetails(
        id=reservation.id,
        customer_id=reservation.customer_id,
        listing_id=reservation.listing_id,
        quantity=reservation.quantity,
        qr_code=reservation.qr_code,
        reservation_status=reservation.reservation_status,
        reserved_at=reservation.reserved_at,
        picked_up_at=reservation.picked_up_at,
        listing_title=listing.title,
        listing_image_data=listing.image_data,
        restaurant_name=listing.restaurant.name,
        restaurant_address=listing.restaurant.address,
        listing_pickup_start=listing.pickup_start,
        listing_pickup_end=listing.pickup_end,
    )


@router.post("", response_model=ReservationWithDetails, status_code=201)
def create(
    payload: ReservationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.customer)),
):
    listing = db.execute(
        select(Listing).where(Listing.id == payload.listing_id).with_for_update()
    ).scalar_one_or_none()
    if not listing:
        raise NotFoundError("Listing not found")
    reconcile_listing_status(listing)
    if listing.restaurant.approval_status != ApprovalStatus.approved:
        raise NotFoundError("Listing not found")
    if listing.status == ListingStatus.inactive:
        raise ConflictError("Listing not available")
    if listing.status in (ListingStatus.expired, ListingStatus.sold_out):
        raise ConflictError("Listing not reservable")
    if listing.available_quantity < payload.quantity:
        raise ConflictError("Not enough quantity available")
    pickup_end = listing.pickup_end
    if pickup_end is not None and pickup_end.tzinfo is None:
        pickup_end = pickup_end.replace(tzinfo=timezone.utc)
    if pickup_end is not None and pickup_end <= datetime.now(timezone.utc):
        raise ConflictError("Pickup window has ended")

    listing.available_quantity -= payload.quantity
    reconcile_listing_status(listing)

    reservation = Reservation(
        customer_id=user.id,
        listing_id=listing.id,
        quantity=payload.quantity,
        qr_code="",
        reservation_status=ReservationStatus.reserved,
    )
    db.add(reservation)
    db.flush()
    _token, qr_data_url = generate_qr_data_url(reservation.id, user.id, listing.id)
    reservation.qr_code = qr_data_url
    db.flush()
    db.commit()
    db.refresh(reservation)
    return _enrich(reservation)


@router.get("/me", response_model=list[ReservationWithDetails])
def my_reservations(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.customer)),
    status: ReservationStatus | None = Query(default=None),
):
    items, _ = list_customer_reservations(db, user.id, status=status)
    return [_enrich(r) for r in items]


@router.get("/restaurant", response_model=list[ReservationWithDetails])
def restaurant_reservations(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.restaurant)),
    status: ReservationStatus | None = Query(default=None),
):
    restaurant = get_restaurant_by_owner(db, user.id)
    if not restaurant:
        raise NotFoundError("Restaurant profile not found")
    items, _ = list_restaurant_reservations(db, restaurant.id, status=status)
    return [_enrich(r) for r in items]


@router.get("/{reservation_id}", response_model=ReservationWithDetails)
def detail(
    reservation_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    reservation = get_reservation(db, reservation_id)
    if not reservation:
        raise NotFoundError("Reservation not found")
    if (
        reservation.customer_id != user.id
        and reservation.listing.restaurant.owner_id != user.id
        and user.role != UserRole.admin
    ):
        raise ForbiddenError("Not allowed to view this reservation")
    return _enrich(reservation)


@router.patch("/{reservation_id}/pickup", response_model=ReservationWithDetails)
def pickup(
    reservation_id: UUID,
    payload: PickupRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.restaurant)),
):
    if payload.qr_token:
        try:
            decoded = decode_qr_token(payload.qr_token)
        except Exception as exc:
            raise ForbiddenError("Invalid QR code") from exc
        try:
            target_id = UUID(decoded["rid"])
        except (KeyError, ValueError) as exc:
            raise ForbiddenError("Invalid QR code") from exc
        if target_id != reservation_id:
            raise ForbiddenError("QR does not match reservation")
    elif payload.reservation_id is not None and payload.reservation_id != reservation_id:
        raise ForbiddenError("Reservation id mismatch")

    reservation = db.execute(
        select(Reservation).where(Reservation.id == reservation_id).with_for_update()
    ).scalar_one_or_none()
    if not reservation:
        raise NotFoundError("Reservation not found")
    restaurant = get_restaurant_by_owner(db, user.id)
    if not restaurant or reservation.listing.restaurant_id != restaurant.id:
        raise ForbiddenError("Not the owner of this listing")
    if reservation.reservation_status != ReservationStatus.reserved:
        raise ConflictError("Reservation is not in reserved state")
    reservation.reservation_status = ReservationStatus.picked_up
    reservation.picked_up_at = datetime.now(timezone.utc)
    db.flush()
    db.commit()
    db.refresh(reservation)
    return _enrich(reservation)


@router.post("/{reservation_id}/cancel", response_model=ReservationWithDetails)
def cancel(
    reservation_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.customer)),
):
    reservation = db.execute(
        select(Reservation).where(Reservation.id == reservation_id).with_for_update()
    ).scalar_one_or_none()
    if not reservation:
        raise NotFoundError("Reservation not found")
    if reservation.customer_id != user.id:
        raise ForbiddenError("Not your reservation")
    if reservation.reservation_status != ReservationStatus.reserved:
        raise ConflictError("Cannot cancel reservation in its current state")
    listing = db.execute(
        select(Listing).where(Listing.id == reservation.listing_id).with_for_update()
    ).scalar_one_or_none()
    if listing:
        listing.available_quantity += reservation.quantity
        reconcile_listing_status(listing)
    reservation.reservation_status = ReservationStatus.cancelled
    db.flush()
    db.commit()
    db.refresh(reservation)
    return _enrich(reservation)