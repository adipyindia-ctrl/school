"""Add max_schools to users table

Revision ID: 0009_user_max_schools
Revises: 0008_website_sections_created_at
Create Date: 2026-08-06 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0009_user_max_schools"
down_revision = "0008_website_sections_created_at"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("max_schools", sa.Integer(), nullable=False, server_default="1"),
    )


def downgrade() -> None:
    op.drop_column("users", "max_schools")
