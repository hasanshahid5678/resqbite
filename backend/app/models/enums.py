from enum import Enum


class UserRole(str, Enum):
    customer = "customer"
    restaurant = "restaurant"
    admin = "admin"


class ApprovalStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ListingStatus(str, Enum):
    available = "available"
    sold_out = "sold_out"
    expired = "expired"
    inactive = "inactive"


class ReservationStatus(str, Enum):
    reserved = "reserved"
    picked_up = "picked_up"
    cancelled = "cancelled"