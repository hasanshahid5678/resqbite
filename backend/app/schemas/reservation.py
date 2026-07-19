from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import ReservationStatus
from app.schemas.common import ORMModel


class ReservationCreate(BaseModel):
    listing_id: int
    quantity: int = Field(ge=1, le=100)


class ReservationOut(ORMModel):
    id: UUID
    customer_id: int
    listing_id: int
    quantity: int
    qr_code: str
    reservation_status: ReservationStatus
    reserved_at: datetime
    picked_up_at: datetime | None


class ReservationWithDetails(ReservationOut):
    listing_title: str
    listing_image_data: str | None
    restaurant_name: str
    restaurant_address: str
    listing_pickup_start: datetime
    listing_pickup_end: datetime


class PickupRequest(BaseModel):
    qr_token: str | None = None
    reservation_id: UUID | None = None


class CancelRequest(BaseModel):
    pass