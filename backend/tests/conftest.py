import asyncio
import os
from collections.abc import AsyncIterator

# Force test defaults *before* importing app modules
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret")
os.environ.setdefault("QR_SECRET_KEY", "test-qr-secret")
os.environ.setdefault("CORS_ORIGINS", '["http://localhost:5173"]')

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

import app.database as database_module
from app.database import Base

# Ensure all models are registered against Base.metadata before create_all
from app.models import listing, reservation, restaurant, user  # noqa: F401,E402


def _build_engine():
    url = os.environ["DATABASE_URL"]
    if url.startswith("sqlite"):
        engine = create_engine(url, connect_args={"check_same_thread": False}, future=True)
        # Enable foreign keys in SQLite
        @event.listens_for(engine, "connect")
        def _fk_on(dbapi_conn, _):
            cur = dbapi_conn.cursor()
            cur.execute("PRAGMA foreign_keys=ON")
            cur.close()
        return engine
    return create_engine(url, pool_pre_ping=True, future=True)


engine = _build_engine()
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


# Patch the module-level engine/Session used by app.deps and crud
database_module.engine = engine
database_module.SessionLocal = TestSessionLocal


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    if engine.url.drivername.startswith("sqlite"):
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_tables():
    from sqlalchemy import text
    db = TestSessionLocal()
    try:
        if engine.dialect.name == "postgresql":
            db.execute(text("TRUNCATE TABLE reservations, listings, restaurants, users RESTART IDENTITY CASCADE;"))
            db.commit()
        else:
            for table_name in ("reservations", "listings", "restaurants", "users"):
                db.execute(text(f"DELETE FROM {table_name};"))
            db.commit()
            # sqlite_sequence may or may not exist; reset autoincrement best-effort
            try:
                db.execute(text("DELETE FROM sqlite_sequence;"))
                db.commit()
            except Exception:
                db.rollback()
    finally:
        db.close()


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def db_session():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()