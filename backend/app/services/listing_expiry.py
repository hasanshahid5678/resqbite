from datetime import datetime, timezone
from typing import Iterable

from sqlalchemy.orm import Session

from app.models.enums import ListingStatus
from app.models.listing import Listing


def _ensure_aware(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def reconcile_listing_status(listing: Listing) -> Listing:
    """Mutate listing.status in-memory based on current time. Caller is expected to flush."""
    now = datetime.now(timezone.utc)
    if listing.status == ListingStatus.inactive:
        return listing
    if listing.expires_at and _ensure_aware(listing.expires_at) <= now:
        listing.status = ListingStatus.expired
        return listing
    if listing.available_quantity <= 0:
        listing.status = ListingStatus.sold_out
    elif listing.status == ListingStatus.sold_out and listing.available_quantity > 0:
        listing.status = ListingStatus.available
    return listing


def reconcile_many(db: Session, listings: Iterable[Listing]) -> None:
    changed = False
    for listing in listings:
        before = listing.status
        reconcile_listing_status(listing)
        if listing.status != before:
            db.add(listing)
            changed = True
    if changed:
        db.flush()