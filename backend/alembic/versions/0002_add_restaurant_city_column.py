"""add restaurant city column

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-19
"""
import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("restaurants", sa.Column("city", sa.String(120), nullable=False, server_default="Istanbul"))
    op.create_index("ix_restaurants_city", "restaurants", ["city"])


def downgrade() -> None:
    op.drop_index("ix_restaurants_city", table_name="restaurants")
    op.drop_column("restaurants", "city")