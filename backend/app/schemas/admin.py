from pydantic import BaseModel

from app.schemas.common import ORMModel


class AdminStats(BaseModel):
    total_restaurants: int
    approved_restaurants: int
    pending_restaurants: int
    total_customers: int
    total_reservations: int
    active_listings: int
    picked_up_reservations: int


class RestaurantAdminView(ORMModel):
    id: int
    owner_id: int
    name: str
    description: str | None
    address: str
    city: str | None = None
    cuisine: str
    approval_status: str
    owner_email: str
    owner_name: str


class UserAdminView(ORMModel):
    id: int
    name: str
    email: str
    role: str
    is_suspended: bool


class SuspendUpdate(BaseModel):
    is_suspended: bool