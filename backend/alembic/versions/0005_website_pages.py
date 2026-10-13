"""Add website_pages table

Revision ID: 0005_website_pages
Revises: 0004_navigation_menu
Create Date: 2025-01-01 00:00:00.000000
"""
from __future__ import annotations
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0005_website_pages"
down_revision = "0004_navigation_menu"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "website_pages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "school_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("schools.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("slug", sa.String(200), nullable=False),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("featured_image", sa.Text, nullable=True),
        sa.Column("seo_title", sa.String(300), nullable=True),
        sa.Column("seo_description", sa.Text, nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="draft"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("school_id", "slug", name="uq_website_pages_school_slug"),
    )


def downgrade() -> None:
    op.drop_table("website_pages")
