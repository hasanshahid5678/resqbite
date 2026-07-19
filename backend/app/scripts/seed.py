"""Seed script: populate dev database with sample users, restaurants, listings and reservations.

Usage:  python -m app.scripts.seed
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import text

from app.database import Base, SessionLocal, engine
from app.models.enums import ApprovalStatus, ListingStatus, ReservationStatus, UserRole
from app.models.listing import Listing
from app.models.reservation import Reservation
from app.models.restaurant import Restaurant
from app.models.user import User
from app.services.auth_service import hash_password
from app.services.qr_service import generate_qr_data_url


def _now_plus(hours: float) -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=hours)


def _now_minus(hours: float) -> datetime:
    return datetime.now(timezone.utc) - timedelta(hours=hours)


def _wipe(db) -> None:
    if "postgresql" in db.bind.dialect.name:
        db.execute(text("TRUNCATE TABLE reservations, listings, restaurants, users RESTART IDENTITY CASCADE;"))
    else:
        for table_name in ("reservations", "listings", "restaurants", "users"):
            db.execute(text(f"DELETE FROM {table_name};"))
    db.commit()


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _wipe(db)

        # Users
        admin = User(name="Admin User", email="admin@example.com", password_hash=hash_password("password123"), role=UserRole.admin)
        owner_approved = User(name="Green Bistro Owner", email="green@example.com", password_hash=hash_password("password123"), role=UserRole.restaurant)
        owner_pending = User(name="Pending Bistro Owner", email="pending@example.com", password_hash=hash_password("password123"), role=UserRole.restaurant)
        customer1 = User(name="Alice Customer", email="alice@example.com", password_hash=hash_password("password123"), role=UserRole.customer)
        customer2 = User(name="Bob Customer", email="bob@example.com", password_hash=hash_password("password123"), role=UserRole.customer)
        db.add_all([admin, owner_approved, owner_pending, customer1, customer2])
        db.flush()

        # Restaurants
        r1 = Restaurant(
            owner_id=owner_approved.id,
            name="Green Bistro",
            description="Mediterranean seasonal kitchen reducing food waste nightly.",
            address="Moda Cad. No 12, Kadıköy, Istanbul",
            city="Istanbul",
            latitude=Decimal("40.962700"),
            longitude=Decimal("29.060400"),
            cuisine="Mediterranean",
            opening_time=datetime.strptime("11:00", "%H:%M").time(),
            closing_time=datetime.strptime("23:00", "%H:%M").time(),
            approval_status=ApprovalStatus.approved,
        )
        r2 = Restaurant(
            owner_id=owner_pending.id,
            name="Pending Bistro",
            description="Awaiting admin review.",
            address="Bağdat Cad. No 200, Istanbul",
            city="Istanbul",
            latitude=Decimal("40.971000"),
            longitude=Decimal("29.065000"),
            cuisine="Turkish",
            opening_time=datetime.strptime("10:00", "%H:%M").time(),
            closing_time=datetime.strptime("22:00", "%H:%M").time(),
            approval_status=ApprovalStatus.pending,
        )
        db.add_all([r1, r2])
        db.flush()

        # Listings
        listings = [
            Listing(
                restaurant_id=r1.id,
                title="Margherita Pizza (Surplus)",
                description="Two slices left from dinner service.",
                category="Pizza",
                original_price=Decimal("180.00"),
                discounted_price=Decimal("80.00"),
                quantity=2,
                available_quantity=2,
                pickup_start=_now_plus(1),
                pickup_end=_now_plus(5),
                expires_at=_now_plus(5.5),
                image_data=None,
                status=ListingStatus.available,
            ),
            Listing(
                restaurant_id=r1.id,
                title="Veggie Mezze Platter",
                description="Fresh meze boxes meant for tonight.",
                category="Mezze",
                original_price=Decimal("240.00"),
                discounted_price=Decimal("120.00"),
                quantity=4,
                available_quantity=4,
                pickup_start=_now_plus(2),
                pickup_end=_now_plus(6),
                expires_at=_now_plus(6.5),
                image_data=None,
                status=ListingStatus.available,
            ),
            Listing(
                restaurant_id=r1.id,
                title="Soup of the Day",
                description="Todays leftover lentil soup, two portions.",
                category="Soup",
                original_price=Decimal("90.00"),
                discounted_price=Decimal("30.00"),
                quantity=2,
                available_quantity=2,
                pickup_start=_now_plus(0.5),
                pickup_end=_now_plus(3),
                expires_at=_now_plus(3.5),
                image_data=None,
                status=ListingStatus.available,
            ),
            Listing(
                restaurant_id=r1.id,
                title="Sold Out Baklava",
                description="Sold-out listing for dashboard demo.",
                category="Dessert",
                original_price=Decimal("150.00"),
                discounted_price=Decimal("60.00"),
                quantity=5,
                available_quantity=0,
                pickup_start=_now_plus(1),
                pickup_end=_now_plus(4),
                expires_at=_now_plus(4.5),
                image_data=None,
                status=ListingStatus.sold_out,
            ),
            Listing(
                restaurant_id=r1.id,
                title="Expired Pasta",
                description="Listing for expired listing demo.",
                category="Pasta",
                original_price=Decimal("200.00"),
                discounted_price=Decimal("50.00"),
                quantity=3,
                available_quantity=3,
                pickup_start=_now_minus(8),
                pickup_end=_now_minus(2),
                expires_at=_now_minus(1.5),
                image_data=None,
                status=ListingStatus.expired,
            ),
            Listing(
                restaurant_id=r1.id,
                title="Inactive Sample",
                description="Inactive listing demo.",
                category="Other",
                original_price=Decimal("100.00"),
                discounted_price=Decimal("40.00"),
                quantity=2,
                available_quantity=2,
                pickup_start=_now_plus(1),
                pickup_end=_now_plus(5),
                expires_at=_now_plus(5.5),
                image_data=None,
                status=ListingStatus.inactive,
            ),
        ]
        db.add_all(listings)
        db.flush()

        # Reservations
        target_listing = listings[0]
        res = Reservation(
            customer_id=customer1.id,
            listing_id=target_listing.id,
            quantity=1,
            qr_code="",
            reservation_status=ReservationStatus.reserved,
        )
        db.add(res)
        db.flush()
        _token, qr = generate_qr_data_url(res.id, customer1.id, target_listing.id)
        res.qr_code = qr
        target_listing.available_quantity -= 1

        picked = Reservation(
            customer_id=customer2.id,
            listing_id=listings[1].id,
            quantity=2,
            qr_code="",
            reservation_status=ReservationStatus.picked_up,
            picked_up_at=_now_minus(0.5),
        )
        db.add(picked)
        db.flush()
        _token2, qr2 = generate_qr_data_url(picked.id, customer2.id, listings[1].id)
        picked.qr_code = qr2
        listings[1].available_quantity -= 2

        cancelled = Reservation(
            customer_id=customer1.id,
            listing_id=listings[2].id,
            quantity=1,
            qr_code="",
            reservation_status=ReservationStatus.cancelled,
        )
        db.add(cancelled)
        db.flush()
        _token3, qr3 = generate_qr_data_url(cancelled.id, customer1.id, listings[2].id)
        cancelled.qr_code = qr3

        db.commit()
        print(f"Seed complete: users=5, restaurants=2, listings={len(listings)}, reservations=3")
        print("Logins (password=password123):")
        print("  admin@example.com")
        print("  green@example.com (approved restaurant owner)")
        print("  pending@example.com (pending restaurant owner)")
        print("  alice@example.com (customer, has reservations)")
        print("  bob@example.com (customer, has 1 picked up)")
    finally:
        db.close()


if __name__ == "__main__":
    seed()