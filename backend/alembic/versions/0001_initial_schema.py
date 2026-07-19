"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-07-18
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("customer", "restaurant", "admin", name="userrole", create_type=True, native_enum=False),
            nullable=False,
            server_default="customer",
        ),
        sa.Column("is_suspended", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role", "users", ["role"])

    op.create_table(
        "restaurants",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("owner_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(2000), nullable=True),
        sa.Column("address", sa.String(500), nullable=False),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=False),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=False),
        sa.Column("cuisine", sa.String(120), nullable=False),
        sa.Column("opening_time", sa.Time, nullable=True),
        sa.Column("closing_time", sa.Time, nullable=True),
        sa.Column(
            "approval_status",
            sa.Enum("pending", "approved", "rejected", name="approvalstatus", native_enum=False),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_restaurants_owner_id", "restaurants", ["owner_id"])
    op.create_index("ix_restaurants_cuisine", "restaurants", ["cuisine"])
    op.create_index("ix_restaurants_approval_status", "restaurants", ["approval_status"])

    op.create_table(
        "listings",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "restaurant_id",
            sa.Integer,
            sa.ForeignKey("restaurants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("category", sa.String(120), nullable=False),
        sa.Column("original_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("discounted_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("available_quantity", sa.Integer, nullable=False),
        sa.Column("pickup_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("pickup_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("image_data", sa.Text, nullable=True),
        sa.Column(
            "status",
            sa.Enum("available", "sold_out", "expired", "inactive", name="listingstatus", native_enum=False),
            nullable=False,
            server_default="available",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_listings_restaurant_id", "listings", ["restaurant_id"])
    op.create_index("ix_listings_category", "listings", ["category"])
    op.create_index("ix_listings_expires_at", "listings", ["expires_at"])
    op.create_index("ix_listings_status", "listings", ["status"])

    op.create_table(
        "reservations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("customer_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("listing_id", sa.Integer, sa.ForeignKey("listings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("qr_code", sa.Text, nullable=False),
        sa.Column(
            "reservation_status",
            sa.Enum("reserved", "picked_up", "cancelled", name="reservationstatus", native_enum=False),
            nullable=False,
            server_default="reserved",
        ),
        sa.Column("reserved_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("picked_up_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_reservations_customer_id", "reservations", ["customer_id"])
    op.create_index("ix_reservations_listing_id", "reservations", ["listing_id"])
    op.create_index("ix_reservations_reservation_status", "reservations", ["reservation_status"])


def downgrade() -> None:
    op.drop_index("ix_reservations_reservation_status", table_name="reservations")
    op.drop_index("ix_reservations_listing_id", table_name="reservations")
    op.drop_index("ix_reservations_customer_id", table_name="reservations")
    op.drop_table("reservations")

    op.drop_index("ix_listings_status", table_name="listings")
    op.drop_index("ix_listings_expires_at", table_name="listings")
    op.drop_index("ix_listings_category", table_name="listings")
    op.drop_index("ix_listings_restaurant_id", table_name="listings")
    op.drop_table("listings")

    op.drop_index("ix_restaurants_approval_status", table_name="restaurants")
    op.drop_index("ix_restaurants_cuisine", table_name="restaurants")
    op.drop_index("ix_restaurants_owner_id", table_name="restaurants")
    op.drop_table("restaurants")

    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")