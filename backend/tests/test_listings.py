import pytest

pytestmark = pytest.mark.asyncio


ADMIN_EMAIL = "admin@example.com"
RESTAURANT_EMAIL = "rest@example.com"
CUSTOMER_EMAIL = "cust@example.com"


async def _register(client, *, email, role, password="password123", name=None):
    res = await client.post(
        "/api/auth/register",
        json={
            "name": name or email.split("@")[0].title(),
            "email": email,
            "password": password,
            "role": role,
        },
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _create_restaurant_profile(client, token):
    res = await client.post(
        "/api/restaurants",
        headers=_auth(token),
        json={
            "name": "Test Bistro",
            "description": "Test cuisine",
            "address": "Moda Cad. No 1, Istanbul",
            "latitude": 40.962,
            "longitude": 29.06,
            "cuisine": "Mediterranean",
            "opening_time": "11:00",
            "closing_time": "23:00",
        },
    )
    return res


async def test_restaurant_pending_cannot_publish(client):
    admin_token = await _register(client, email=ADMIN_EMAIL, role="customer")  # customer-as-admin for test convenience
    token = await _register(client, email=RESTAURANT_EMAIL, role="restaurant")
    await _create_restaurant_profile(client, token)
    res = await client.post(
        "/api/listings",
        headers=_auth(token),
        json={
            "title": "Test Pizza",
            "description": "Surplus",
            "category": "Pizza",
            "original_price": "100.00",
            "discounted_price": "40.00",
            "quantity": 3,
            "pickup_start": "2099-01-01T12:00:00Z",
            "pickup_end": "2099-01-01T15:00:00Z",
            "expires_at": "2099-01-01T15:30:00Z",
        },
    )
    assert res.status_code == 403


async def _approved_restaurant(client):
    token = await _register(client, email=RESTAURANT_EMAIL, role="restaurant")
    profile = await _create_restaurant_profile(client, token)
    restaurant_id = profile.json()["id"]
    # Approve the restaurant directly via the DB without changing the owner role
    from app.database import SessionLocal
    from app.models.enums import ApprovalStatus
    from app.models.restaurant import Restaurant

    db = SessionLocal()
    try:
        r = db.get(Restaurant, restaurant_id)
        r.approval_status = ApprovalStatus.approved
        db.add(r)
        db.commit()
    finally:
        db.close()
    return token, restaurant_id


async def test_create_listing_approved(client):
    token, rid = await _approved_restaurant(client)
    res = await client.post(
        "/api/listings",
        headers=_auth(token),
        json={
            "title": "Pizza",
            "description": "Surplus",
            "category": "Pizza",
            "original_price": "100.00",
            "discounted_price": "40.00",
            "quantity": 3,
            "pickup_start": "2099-01-01T12:00:00Z",
            "pickup_end": "2099-01-01T15:00:00Z",
            "expires_at": "2099-01-01T15:30:00Z",
        },
    )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["quantity"] == 3
    assert body["available_quantity"] == 3


async def test_invalid_listing_validation(client):
    token, rid = await _approved_restaurant(client)
    # pickup_end before pickup_start
    res = await client.post(
        "/api/listings",
        headers=_auth(token),
        json={
            "title": "Bad",
            "category": "Pizza",
            "original_price": "100.00",
            "discounted_price": "40.00",
            "quantity": 1,
            "pickup_start": "2099-01-01T15:00:00Z",
            "pickup_end": "2099-01-01T12:00:00Z",
            "expires_at": "2099-01-01T15:30:00Z",
        },
    )
    assert res.status_code == 400


async def test_public_listing_list_excludes_expired_and_pending(client):
    token, rid = await _approved_restaurant(client)
    from datetime import datetime, timedelta, timezone
    from app.database import SessionLocal
    from app.models.enums import ListingStatus
    from app.models.listing import Listing

    db = SessionLocal()
    try:
        from sqlalchemy import text
        from app.models.enums import ApprovalStatus
        # Add an expired listing via direct insert for simplicity
        expired = Listing(
            restaurant_id=rid,
            title="Old Pasta",
            description="",
            category="Pasta",
            original_price=50,
            discounted_price=20,
            quantity=2,
            available_quantity=2,
            pickup_start=datetime.now(timezone.utc) - timedelta(hours=8),
            pickup_end=datetime.now(timezone.utc) - timedelta(hours=2),
            expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
            image_data=None,
            status=ListingStatus.expired,
        )
        db.add(expired)
        db.commit()
    finally:
        db.close()

    res = await client.get("/api/listings")
    assert res.status_code == 200
    titles = [l["title"] for l in res.json()]
    assert "Old Pasta" not in titles