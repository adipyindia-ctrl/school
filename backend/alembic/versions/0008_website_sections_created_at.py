"""Add created_at to website_sections

Revision ID: 0008_website_sections_created_at
Revises: 0007_custom_domain
Create Date: 2025-01-01 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0008_website_sections_created_at"
down_revision = "0007_custom_domain"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "website_sections",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("website_sections", "created_at")
