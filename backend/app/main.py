from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.deps import app_exception_handler, generic_exception_handler
from app.utils.exceptions import AppException
from app.routers import admin, auth, listings, reservations, restaurants


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Import models so SQLAlchemy metadata is populated
    from app.models import listing, reservation, restaurant, user  # noqa: F401
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="Marketplace for restaurants to sell surplus food at discounted prices.",
    lifespan=lifespan,
    openapi_url="/api/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


PREFIX = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=PREFIX)
app.include_router(restaurants.router, prefix=PREFIX)
app.include_router(listings.router, prefix=PREFIX)
app.include_router(reservations.router, prefix=PREFIX)
app.include_router(admin.router, prefix=PREFIX)


@app.get("/")
def root() -> dict:
    return {"app": settings.APP_NAME, "docs": "/docs"}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}