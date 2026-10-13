"""Add navigation_menus table

Revision ID: 0004_navigation_menu
Revises: 0003_transport
Create Date: 2025-01-01 00:00:00.000000
"""
from __future__ import annotations
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004_navigation_menu"
down_revision = "0003_transport"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "navigation_menus",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("school_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("label", sa.String(100), nullable=False),
        sa.Column("url", sa.String(500), nullable=True),
        sa.Column("page_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("navigation_menus.id", ondelete="SET NULL"), nullable=True),
        sa.Column("display_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("navigation_menus")
