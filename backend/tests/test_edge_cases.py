"""Tests for listing update edge cases + reservation authz + QR-token pickup + admin reject + suspend auth."""
import pytest
from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.database import SessionLocal
from app.models.enums import ApprovalStatus, ListingStatus, ReservationStatus, UserRole
from app.models.listing import Listing
from app.models.restaurant import Restaurant
from app.models.user import User
from app.services.auth_service import hash_password
from app.services.qr_service import generate_qr_data_url, decode_qr_token

pytestmark = pytest.mark.asyncio


ADMIN_EMAIL = "admin@example.com"
RESTAURANT_EMAIL = "rest@example.com"
RESTAURANT2_EMAIL = "rest2@example.com"
CUSTOMER_EMAIL = "alice@example.com"
CUSTOMER2_EMAIL = "bob@example.com"


async def _register(client, email, role, password="password123", name=None):
    res = await client.post(
        "/api/auth/register",
        json={"name": name or email.split("@")[0].title(), "email": email, "password": password, "role": role},
    )
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def _auth(token): return {"Authorization": f"Bearer {token}"}


async def _approve(client, owner_email):
    """Approve a restaurant via direct DB write; returns (token, restaurant_id, owner_id)."""
    token = await _register(client, RESTAURANT_EMAIL if owner_email == RESTAURANT_EMAIL else RESTAURANT2_EMAIL, "restaurant")
    res = await client.post(
        "/api/restaurants",
        headers=_auth(token),
        json={"name": "Bistro", "description": "", "address": "Moda Cad. No 1, Istanbul",
              "latitude": 40.962, "longitude": 29.06, "cuisine": "Mediterranean"},
    )
    rid = res.json()["id"]
    return token, rid


async def _approve_via_db(restaurant_id: int):
    db = SessionLocal()
    try:
        r = db.get(Restaurant, restaurant_id)
        r.approval_status = ApprovalStatus.approved
        db.add(r); db.commit()
    finally:
        db.close()


async def _create_listing(client, token, qty=5):
    res = await client.post("/api/listings", headers=_auth(token), json={
        "title": "Pizza", "description": "Surplus", "category": "Pizza",
        "original_price": "100.00", "discounted_price": "40.00", "quantity": qty,
        "pickup_start": "2099-01-01T12:00:00Z",
        "pickup_end": "2099-01-01T15:00:00Z",
        "expires_at": "2099-01-01T15:30:00Z",
    })
    assert res.status_code == 201, res.text
    return res.json()["id"]


# ------------ Listing update edge cases ------------

async def test_update_listing_quantity_below_active_reservations_fails(client):
    token, rid = await _approve(client, RESTAURANT_EMAIL)
    await _approve_via_db(rid)
    listing_id = await _create_listing(client, token, qty=5)

    cust = await _register(client, CUSTOMER_EMAIL, "customer")
    res = await client.post("/api/reservations", headers=_auth(cust), json={"listing_id": listing_id, "quantity": 3})
    assert res.status_code == 201

    # Try to lower quantity below held
    upd = await client.put(f"/api/listings/{listing_id}", headers=_auth(token), json={"quantity": 2})
    assert upd.status_code == 409


async def test_update_listing_quantity_above_held_succeeds(client):
    token, rid = await _approve(client, RESTAURANT_EMAIL)
    await _approve_via_db(rid)
    listing_id = await _create_listing(client, token, qty=5)

    cust = await _register(client, CUSTOMER_EMAIL, "customer")
    await client.post("/api/reservations", headers=_auth(cust), json={"listing_id": listing_id, "quantity": 2})

    upd = await client.put(f"/api/listings/{listing_id}", headers=_auth(token), json={"quantity": 4})
    assert upd.status_code == 200
    body = upd.json()
    assert body["quantity"] == 4
    # available = total - held = 4 - 2 = 2
    assert body["available_quantity"] == 2


async def test_update_listing_not_owner_forbidden(client):
    token, rid = await _approve(client, RESTAURANT_EMAIL)
    await _approve_via_db(rid)
    listing_id = await _create_listing(client, token)

    # Another restaurant owner
    other = await _register(client, RESTAURANT2_EMAIL, "restaurant")
    await client.post("/api/restaurants", headers=_auth(other), json={
        "name": "Other", "address": "X", "latitude": 40.0, "longitude": 29.0, "cuisine": "X",
    })
    upd = await client.put(f"/api/listings/{listing_id}", headers=_auth(other), json={"title": "Hacked"})
    assert upd.status_code == 403


# ------------ Reservation authz ------------

async def test_reservation_detail_other_customer_forbidden(client):
    token, rid = await _approve(client, RESTAURANT_EMAIL)
    await _approve_via_db(rid)
    lid = await _create_listing(client, token)

    cust1 = await _register(client, CUSTOMER_EMAIL, "customer")
    cust2 = await _register(client, CUSTOMER2_EMAIL, "customer")
    res = await client.post("/api/reservations", headers=_auth(cust1), json={"listing_id": lid, "quantity": 1})
    res_id = res.json()["id"]

    detail = await client.get(f"/api/reservations/{res_id}", headers=_auth(cust2))
    assert detail.status_code == 403


async def test_reservation_cancel_other_customer_forbidden(client):
    token, rid = await _approve(client, RESTAURANT_EMAIL)
    await _approve_via_db(rid)
    lid = await _create_listing(client, token)

    cust1 = await _register(client, CUSTOMER_EMAIL, "customer")
    cust2 = await _register(client, CUSTOMER2_EMAIL, "customer")
    res = await client.post("/api/reservations", headers=_auth(cust1), json={"listing_id": lid, "quantity": 1})
    res_id = res.json()["id"]

    cancel = await client.post(f"/api/reservations/{res_id}/cancel", headers=_auth(cust2))
    assert cancel.status_code == 403


# ------------ QR-token pickup path ------------

async def test_pickup_via_qr_token_succeeds(client):
    token, rid = await _approve(client, RESTAURANT_EMAIL)
    await _approve_via_db(rid)
    lid = await _create_listing(client, token)

    cust = await _register(client, CUSTOMER_EMAIL, "customer")
    res = await client.post("/api/reservations", headers=_auth(cust), json={"listing_id": lid, "quantity": 1})
    assert res.status_code == 201
    res_id = UUID(res.json()["id"])

    # Simulate scanned QR — raw token must match HMAC payload
    decoded = {"rid": str(res_id), "cid": res.json()["customer_id"], "lid": lid}
    # Client can submit qr_token by encoding — but in the test, decode path is server-only.
    # Build the token through the same service helper to use in the request.
    token_str, _ = generate_qr_data_url(res_id, res.json()["customer_id"], lid)
    # We use the same JWT signing underlying generate_qr_data_url, so just decode & submit
    decoded_back = decode_qr_token(token_str)
    assert decoded_back["rid"] == str(res_id)

    pickup = await client.patch(
        f"/api/reservations/{res_id}/pickup",
        headers=_auth(token),
        json={"qr_token": token_str},
    )
    assert pickup.status_code == 200, pickup.text
    assert pickup.json()["reservation_status"] == "picked_up"


async def test_pickup_via_wrong_qr_token_rejected(client):
    token, rid = await _approve(client, RESTAURANT_EMAIL)
    await _approve_via_db(rid)
    lid = await _create_listing(client, token)

    cust = await _register(client, CUSTOMER_EMAIL, "customer")
    res = await client.post("/api/reservations", headers=_auth(cust), json={"listing_id": lid, "quantity": 1})
    res_id = UUID(res.json()["id"])

    pickup = await client.patch(
        f"/api/reservations/{res_id}/pickup",
        headers=_auth(token),
        json={"qr_token": "invalid.token.value"},
    )
    assert pickup.status_code == 403


async def test_pickup_other_restaurant_forbidden(client):
    owner1, rid1 = await _approve(client, RESTAURANT_EMAIL)
    await _approve_via_db(rid1)
    lid = await _create_listing(client, owner1)

    # Second restaurant owner
    owner2, rid2 = await _approve(client, RESTAURANT2_EMAIL)
    await client.post("/api/restaurants", headers=_auth(owner2), json={
        "name": "Other", "address": "X", "latitude": 40.0, "longitude": 29.0, "cuisine": "X",
    })

    cust = await _register(client, CUSTOMER_EMAIL, "customer")
    res = await client.post("/api/reservations", headers=_auth(cust), json={"listing_id": lid, "quantity": 1})
    res_id = res.json()["id"]

    pickup = await client.patch(
        f"/api/reservations/{res_id}/pickup",
        headers=_auth(owner2),
        json={"reservation_id": res_id},
    )
    assert pickup.status_code == 403


# ------------ Admin reject flow ------------

async def _promote_to_admin(email):
    db = SessionLocal()
    try:
        u = db.query(User).filter(User.email == email).first()
        u.role = UserRole.admin
        db.add(u); db.commit()
    finally:
        db.close()


async def test_admin_reject_then_reapprove(client):
    # Restaurant setup
    owner = await _register(client, RESTAURANT_EMAIL, "restaurant")
    profile = await client.post("/api/restaurants", headers=_auth(owner), json={
        "name": "Bistro", "address": "Moda 1", "latitude": 40.9, "longitude": 29.0, "cuisine": "Mediterranean",
    })
    rid = profile.json()["id"]

    # Admin setup
    await _register(client, ADMIN_EMAIL, "customer")
    await _promote_to_admin(ADMIN_EMAIL)
    admin_token = (await client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": "password123"})).json()["access_token"]

    # Reject
    reject = await client.patch(f"/api/admin/restaurants/{rid}/reject", headers=_auth(admin_token))
    assert reject.status_code == 200
    assert reject.json()["approval_status"] == "rejected"

    # Try to publish — should fail because not approved
    listing = await client.post("/api/listings", headers=_auth(owner), json={
        "title": "Test Pizza", "category": "Pizza",
        "original_price": "10.00", "discounted_price": "5.00", "quantity": 1,
        "pickup_start": "2099-01-01T12:00:00Z",
        "pickup_end": "2099-01-01T15:00:00Z",
        "expires_at": "2099-01-01T15:30:00Z",
    })
    assert listing.status_code == 403

    # Re-approve
    reapprove = await client.patch(f"/api/admin/restaurants/{rid}/approve", headers=_auth(admin_token))
    assert reapprove.status_code == 200
    assert reapprove.json()["approval_status"] == "approved"


# ------------ Suspended user cannot authenticate ------------

async def test_suspended_user_cannot_login_nor_access_me(client):
    # Register a customer
    cust_tok = await _register(client, CUSTOMER_EMAIL, "customer")
    # Verify we can hit /me before suspension
    me = await client.get("/api/auth/me", headers=_auth(cust_tok))
    assert me.status_code == 200

    # Admin setup + suspend
    await _register(client, ADMIN_EMAIL, "customer")
    await _promote_to_admin(ADMIN_EMAIL)
    admin_token = (await client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": "password123"})).json()["access_token"]

    users = await client.get("/api/admin/users", headers=_auth(admin_token))
    alice_db = next(u for u in users.json() if u["email"] == CUSTOMER_EMAIL)
    suspended = await client.patch(
        f"/api/admin/users/{alice_db['id']}/suspend",
        headers=_auth(admin_token),
        json={"is_suspended": True},
    )
    assert suspended.status_code == 200
    assert suspended.json()["is_suspended"] is True

    # Login should fail now
    login = await client.post("/api/auth/login", json={"email": CUSTOMER_EMAIL, "password": "password123"})
    assert login.status_code == 401

    # Using the existing token should also fail on /auth/me (get_current_user checks suspended)
    me2 = await client.get("/api/auth/me", headers=_auth(cust_tok))
    assert me2.status_code == 403


# ------------ Expired listing cannot be reserved ------------

async def test_expired_listing_cannot_be_reserved(client):
    token, rid = await _approve(client, RESTAURANT_EMAIL)
    await _approve_via_db(rid)

    # Create an already-expired listing directly via DB
    db = SessionLocal()
    try:
        listing = Listing(
            restaurant_id=rid,
            title="Expired Pasta",
            description="",
            category="Pasta",
            original_price=50, discounted_price=20,
            quantity=2, available_quantity=2,
            pickup_start=datetime.now(timezone.utc) - timedelta(hours=10),
            pickup_end=datetime.now(timezone.utc) - timedelta(hours=2),
            expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
            image_data=None,
            status=ListingStatus.available,  # status not yet reconciled
        )
        db.add(listing); db.commit(); db.refresh(listing)
        listing_id = listing.id
    finally:
        db.close()

    cust = await _register(client, CUSTOMER_EMAIL, "customer")
    res = await client.post("/api/reservations", headers=_auth(cust), json={"listing_id": listing_id, "quantity": 1})
    assert res.status_code == 409