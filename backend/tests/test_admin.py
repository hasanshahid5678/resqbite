import pytest

pytestmark = pytest.mark.asyncio


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


async def make_admin(email: str):
    from app.database import SessionLocal
    from app.models.enums import UserRole
    from app.models.user import User
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        user.role = UserRole.admin
        db.add(user)
        db.commit()
    finally:
        db.close()


async def test_admin_stats_requires_admin_role(client):
    await _register(client, email="alice@example.com", role="customer")
    res = await client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "password123"},
    )
    token = res.json()["access_token"]
    res = await client.get("/api/admin/stats", headers=_auth(token))
    assert res.status_code == 403


async def test_admin_stats_returns_expected_fields(client):
    await _register(client, email="admin@example.com", role="customer")
    await make_admin("admin@example.com")
    res = await client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "password123"},
    )
    admin_token = res.json()["access_token"]

    res = await client.get("/api/admin/stats", headers=_auth(admin_token))
    assert res.status_code == 200
    body = res.json()
    for key in (
        "total_restaurants",
        "approved_restaurants",
        "pending_restaurants",
        "total_customers",
        "total_reservations",
        "active_listings",
        "picked_up_reservations",
    ):
        assert key in body


async def test_admin_approves_restaurant(client):
    # Create restaurant owner
    await _register(client, email="rest@example.com", role="restaurant")
    owner_token = (
        await client.post(
            "/api/auth/login",
            json={"email": "rest@example.com", "password": "password123"},
        )
    ).json()["access_token"]

    profile_res = await client.post(
        "/api/restaurants",
        headers=_auth(owner_token),
        json={
            "name": "Test Bistro",
            "description": "",
            "address": "Moda Cad.",
            "latitude": 40.96,
            "longitude": 29.06,
            "cuisine": "Mediterranean",
        },
    )
    restaurant_id = profile_res.json()["id"]

    await _register(client, email="admin@example.com", role="customer")
    await make_admin("admin@example.com")
    admin_token = (
        await client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "password123"},
        )
    ).json()["access_token"]

    res = await client.patch(
        f"/api/admin/restaurants/{restaurant_id}/approve",
        headers=_auth(admin_token),
    )
    assert res.status_code == 200
    assert res.json()["approval_status"] == "approved"


async def test_admin_suspend_user(client):
    await _register(client, email="alice@example.com", role="customer")
    await _register(client, email="admin@example.com", role="customer")
    await make_admin("admin@example.com")
    admin_token = (
        await client.post(
            "/api/auth/login",
            json={"email": "admin@example.com", "password": "password123"},
        )
    ).json()["access_token"]

    users_res = await client.get("/api/admin/users", headers=_auth(admin_token))
    alice = next(u for u in users_res.json() if u["email"] == "alice@example.com")

    res = await client.patch(
        f"/api/admin/users/{alice['id']}/suspend",
        headers=_auth(admin_token),
        json={"is_suspended": True},
    )
    assert res.status_code == 200
    assert res.json()["is_suspended"] is True

    # Suspended user can no longer log in
    login_res = await client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "password123"},
    )
    assert login_res.status_code == 401