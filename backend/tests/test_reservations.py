import asyncio
import os
from datetime import datetime, timedelta, timezone

import pytest

from app.database import SessionLocal
from app.models.enums import ApprovalStatus
from app.models.listing import Listing
from app.models.restaurant import Restaurant

pytestmark = pytest.mark.asyncio

_IS_POSTGRES = os.environ.get("DATABASE_URL", "").startswith("postgres")


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


async def _approve_restaurant_flow(client):
    token = await _register(client, email="rest@example.com", role="restaurant")
    res = await client.post(
        "/api/restaurants",
        headers=_auth(token),
        json={
            "name": "Test Bistro",
            "description": "",
            "address": "Moda Cad. No 1, Istanbul",
            "latitude": 40.962,
            "longitude": 29.06,
            "cuisine": "Mediterranean",
            "opening_time": "11:00",
            "closing_time": "23:00",
        },
    )
    rid = res.json()["id"]
    db = SessionLocal()
    try:
        r = db.get(Restaurant, rid)
        r.approval_status = ApprovalStatus.approved
        db.add(r)
        db.commit()
    finally:
        db.close()
    return token, rid


async def _create_listing(client, token, rid):
    res = await client.post(
        "/api/listings",
        headers=_auth(token),
        json={
            "title": "Pizza",
            "description": "Surplus",
            "category": "Pizza",
            "original_price": "100.00",
            "discounted_price": "40.00",
            "quantity": 5,
            "pickup_start": "2099-01-01T12:00:00Z",
            "pickup_end": "2099-01-01T15:00:00Z",
            "expires_at": "2099-01-01T15:30:00Z",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["id"]


async def test_reservation_decrements_quantity(client):
    rest_token, rid = await _approve_restaurant_flow(client)
    listing_id = await _create_listing(client, rest_token, rid)

    cust_token = await _register(client, email="alice@example.com", role="customer")
    res = await client.post(
        "/api/reservations",
        headers=_auth(cust_token),
        json={"listing_id": listing_id, "quantity": 2},
    )
    assert res.status_code == 201, res.text
    assert res.json()["quantity"] == 2
    assert "data:image/png;base64," in res.json()["qr_code"]

    listing_res = await client.get(f"/api/listings/{listing_id}")
    assert listing_res.json()["available_quantity"] == 3


async def test_reservation_overbooks_returns_conflict(client):
    rest_token, rid = await _approve_restaurant_flow(client)
    listing_id = await _create_listing(client, rest_token, rid)

    cust_token = await _register(client, email="alice@example.com", role="customer")
    res = await client.post(
        "/api/reservations",
        headers=_auth(cust_token),
        json={"listing_id": listing_id, "quantity": 10},
    )
    assert res.status_code == 409


@pytest.mark.skipif(not _IS_POSTGRES, reason="requires Postgres row locking semantics")
async def test_concurrent_reservations_never_negative(client):
    """Hit a listing with qty=5 using 20 concurrent requests; expect exactly 5 success."""
    rest_token, rid = await _approve_restaurant_flow(client)
    listing_id = await _create_listing(client, rest_token, rid)

    # Register 20 customer accounts
    tokens = []
    for i in range(20):
        res = await client.post(
            "/api/auth/register",
            json={
                "name": f"cust{i}",
                "email": f"cust{i}@example.com",
                "password": "password123",
                "role": "customer",
            },
        )
        assert res.status_code == 200, res.text
        tokens.append(res.json()["access_token"])

    async def attempt(tok):
        return await client.post(
            "/api/reservations",
            headers=_auth(tok),
            json={"listing_id": listing_id, "quantity": 1},
        )

    responses = await asyncio.gather(*[attempt(t) for t in tokens])
    successes = [r for r in responses if r.status_code == 201]
    conflicts = [r for r in responses if r.status_code == 409]
    assert len(successes) == 5
    assert len(conflicts) == 15

    listing_res = await client.get(f"/api/listings/{listing_id}")
    assert listing_res.json()["available_quantity"] == 0
    assert listing_res.json()["status"] == "sold_out"


async def test_cancel_restores_quantity(client):
    rest_token, rid = await _approve_restaurant_flow(client)
    listing_id = await _create_listing(client, rest_token, rid)

    cust_token = await _register(client, email="alice@example.com", role="customer")
    res = await client.post(
        "/api/reservations",
        headers=_auth(cust_token),
        json={"listing_id": listing_id, "quantity": 2},
    )
    assert res.status_code == 201
    res_id = res.json()["id"]
    cancel_res = await client.post(f"/api/reservations/{res_id}/cancel", headers=_auth(cust_token))
    assert cancel_res.status_code == 200

    listing_res = await client.get(f"/api/listings/{listing_id}")
    assert listing_res.json()["available_quantity"] == 5


async def test_pickup_state_transition(client):
    rest_token, rid = await _approve_restaurant_flow(client)
    listing_id = await _create_listing(client, rest_token, rid)

    cust_token = await _register(client, email="alice@example.com", role="customer")
    res = await client.post(
        "/api/reservations",
        headers=_auth(cust_token),
        json={"listing_id": listing_id, "quantity": 1},
    )
    res_id = res.json()["id"]
    pickup_res = await client.patch(
        f"/api/reservations/{res_id}/pickup",
        headers=_auth(rest_token),
        json={"reservation_id": res_id},
    )
    assert pickup_res.status_code == 200
    assert pickup_res.json()["reservation_status"] == "picked_up"

    # Cannot pickup twice
    again = await client.patch(
        f"/api/reservations/{res_id}/pickup",
        headers=_auth(rest_token),
        json={"reservation_id": res_id},
    )
    assert again.status_code == 409