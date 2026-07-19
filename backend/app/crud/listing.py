from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import ApprovalStatus, ListingStatus
from app.models.listing import Listing
from app.models.restaurant import Restaurant


def get_listing(db: Session, listing_id: int) -> Listing | None:
    return db.get(Listing, listing_id)


def list_listings_filtered(
    db: Session,
    *,
    restaurant_id: int | None = None,
    category: str | None = None,
    city: str | None = None,
    min_discount_pct: float | None = None,
    pickup_after: datetime | None = None,
    q: str | None = None,
    include_expired: bool = False,
) -> tuple[list[Listing], int]:
    stmt = select(Listing).join(Restaurant, Listing.restaurant_id == Restaurant.id)
    count_stmt = select(func.count(Listing.id)).join(Restaurant, Listing.restaurant_id == Restaurant.id)

    stmt = stmt.where(Restaurant.approval_status == ApprovalStatus.approved)
    count_stmt = count_stmt.where(Restaurant.approval_status == ApprovalStatus.approved)

    if restaurant_id is not None:
        stmt = stmt.where(Listing.restaurant_id == restaurant_id)
        count_stmt = count_stmt.where(Listing.restaurant_id == restaurant_id)
    if category:
        stmt = stmt.where(Listing.category.ilike(f"%{category}%"))
        count_stmt = count_stmt.where(Listing.category.ilike(f"%{category}%"))
    if city:
        stmt = stmt.where(Restaurant.city == city)
        count_stmt = count_stmt.where(Restaurant.city == city)
    if not include_expired:
        now = datetime.now(timezone.utc)
        stmt = stmt.where(Listing.expires_at > now)
        count_stmt = count_stmt.where(Listing.expires_at > now)
    if pickup_after:
        stmt = stmt.where(Listing.pickup_end >= pickup_after)
        count_stmt = count_stmt.where(Listing.pickup_end >= pickup_after)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(Listing.title.ilike(like) | Listing.description.ilike(like))
        count_stmt = count_stmt.where(Listing.title.ilike(like) | Listing.description.ilike(like))
    if min_discount_pct is not None:
        stmt = stmt.where(
            (Listing.original_price > 0)
            & ((Listing.original_price - Listing.discounted_price) * 100 / Listing.original_price >= min_discount_pct)
        )
        count_stmt = count_stmt.where(
            (Listing.original_price > 0)
            & ((Listing.original_price - Listing.discounted_price) * 100 / Listing.original_price >= min_discount_pct)
        )

    return list(db.scalars(stmt)) or [], (db.scalar(count_stmt) or 0)