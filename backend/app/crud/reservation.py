from datetime import datetime, timezone
from typing import Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import ReservationStatus
from app.models.reservation import Reservation


def get_reservation(db: Session, reservation_id: UUID) -> Reservation | None:
    return db.get(Reservation, reservation_id)


def list_customer_reservations(
    db: Session,
    customer_id: int,
    *,
    status: ReservationStatus | None = None,
) -> tuple[list[Reservation], int]:
    stmt = select(Reservation).where(Reservation.customer_id == customer_id)
    count_stmt = select(func.count(Reservation.id)).where(Reservation.customer_id == customer_id)
    if status is not None:
        stmt = stmt.where(Reservation.reservation_status == status)
        count_stmt = count_stmt.where(Reservation.reservation_status == status)
    stmt = stmt.order_by(Reservation.reserved_at.desc())
    return list(db.scalars(stmt)) or [], (db.scalar(count_stmt) or 0)


def list_restaurant_reservations(
    db: Session,
    restaurant_id: int,
    *,
    status: ReservationStatus | None = None,
) -> tuple[list[Reservation], int]:
    from app.models.listing import Listing

    stmt = (
        select(Reservation)
        .join(Listing, Reservation.listing_id == Listing.id)
        .where(Listing.restaurant_id == restaurant_id)
    )
    count_stmt = (
        select(func.count(Reservation.id))
        .join(Listing, Reservation.listing_id == Listing.id)
        .where(Listing.restaurant_id == restaurant_id)
    )
    if status is not None:
        stmt = stmt.where(Reservation.reservation_status == status)
        count_stmt = count_stmt.where(Reservation.reservation_status == status)
    stmt = stmt.order_by(Reservation.reserved_at.desc())
    return list(db.scalars(stmt)) or [], (db.scalar(count_stmt) or 0)


def count_picked_up_by_customer(db: Session, customer_id: int) -> int:
    return db.scalar(
        select(func.count(Reservation.id)).where(
            Reservation.customer_id == customer_id,
            Reservation.reservation_status == ReservationStatus.picked_up,
        )
    ) or 0