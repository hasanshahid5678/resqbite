from datetime import time
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from app.models.enums import ApprovalStatus
from app.schemas.common import ORMModel


def _to_time(value: str | time | None) -> time | None:
    if value is None or value == "":
        return None
    if isinstance(value, time):
        return value
    return time.fromisoformat(value)


class RestaurantCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    address: str = Field(min_length=3, max_length=500)
    city: str = Field(default="Istanbul", min_length=2, max_length=120)
    latitude: Decimal = Field(ge=-90, le=90, max_digits=9, decimal_places=6)
    longitude: Decimal = Field(ge=-180, le=180, max_digits=9, decimal_places=6)
    cuisine: str = Field(min_length=2, max_length=120)
    opening_time: str | None = None
    closing_time: str | None = None

    def model_dump(self, **kwargs):
        data = super().model_dump(**kwargs)
        for key in ("opening_time", "closing_time"):
            data[key] = _to_time(data.get(key))
        return data


class RestaurantUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    address: str | None = Field(default=None, min_length=3, max_length=500)
    city: str | None = Field(default=None, min_length=2, max_length=120)
    latitude: Decimal | None = Field(default=None, ge=-90, le=90, max_digits=9, decimal_places=6)
    longitude: Decimal | None = Field(default=None, ge=-180, le=180, max_digits=9, decimal_places=6)
    cuisine: str | None = Field(default=None, min_length=2, max_length=120)
    opening_time: str | None = None
    closing_time: str | None = None

    def model_dump(self, **kwargs):
        data = super().model_dump(**kwargs)
        for key in ("opening_time", "closing_time"):
            if key in data and data[key] is not None:
                data[key] = _to_time(data[key])
        return data


class RestaurantOut(ORMModel):
    id: int
    owner_id: int
    name: str
    description: str | None
    address: str
    city: str
    latitude: Decimal
    longitude: Decimal
    cuisine: str
    opening_time: time | None
    closing_time: time | None
    approval_status: ApprovalStatus