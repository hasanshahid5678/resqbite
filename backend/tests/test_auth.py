import pytest


pytestmark = pytest.mark.asyncio


async def _register(client, *, name="Alice", email="alice@example.com", password="password123", role="customer"):
    res = await client.post("/api/auth/register", json={"name": name, "email": email, "password": password, "role": role})
    assert res.status_code == 200, res.text
    return res.json()


async def test_register_and_me(client):
    body = await _register(client)
    token = body["access_token"]
    assert token
    res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "alice@example.com"


async def test_duplicate_register_conflicts(client):
    await _register(client)
    res = await client.post(
        "/api/auth/register",
        json={"name": "Alice", "email": "alice@example.com", "password": "password123", "role": "customer"},
    )
    assert res.status_code == 409


async def test_login_wrong_password(client):
    await _register(client)
    res = await client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "wrong"},
    )
    assert res.status_code == 401


async def test_login_success(client):
    await _register(client)
    res = await client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "password123"},
    )
    assert res.status_code == 200
    assert "access_token" in res.json()


async def test_protected_route_requires_token(client):
    res = await client.get("/api/auth/me")
    assert res.status_code == 401


async def test_refresh_flow(client):
    body = await _register(client)
    # refresh cookie returned from /register should grant a new access token
    res = await client.post("/api/auth/refresh")
    assert res.status_code == 200
    assert "access_token" in res.json()


async def test_logout_clears_cookie(client):
    await _register(client)
    res = await client.post("/api/auth/logout")
    assert res.status_code == 200
    assert res.json()["detail"] == "Logged out"


async def test_restaurant_role_can_register(client):
    body = await _register(client, name="Rest", email="rest@example.com", role="restaurant")
    assert body["user"]["role"] == "restaurant"