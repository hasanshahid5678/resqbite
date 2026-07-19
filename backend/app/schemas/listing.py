from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from app.models.enums import ListingStatus
from app.schemas.common import ORMModel


class ListingBase(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    category: str = Field(min_length=2, max_length=120)
    original_price: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    discounted_price: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    quantity: int = Field(ge=1, le=10000)
    pickup_start: datetime
    pickup_end: datetime
    expires_at: datetime
    image_data: str | None = Field(default=None, description="base64-encoded bytes with data: prefix")


class ListingCreate(ListingBase):
    pass


class ListingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    category: str | None = Field(default=None, min_length=2, max_length=120)
    original_price: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    discounted_price: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    quantity: int | None = Field(default=None, ge=0, le=10000)
    pickup_start: datetime | None = None
    pickup_end: datetime | None = None
    expires_at: datetime | None = None
    image_data: str | None = None


class ListingOut(ORMModel):
    id: int
    restaurant_id: int
    title: str
    description: str | None
    category: str
    original_price: Decimal
    discounted_price: Decimal
    quantity: int
    available_quantity: int
    pickup_start: datetime
    pickup_end: datetime
    expires_at: datetime
    image_data: str | None
    status: ListingStatus
    created_at: datetime


class ListingWithRestaurant(ListingOut):
    restaurant_name: str
    restaurant_address: str
    restaurant_cuisine: str
    restaurant_latitude: Decimal
    restaurant_longitude: Decimal
    distance_km: float | None = None