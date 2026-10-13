"""Add custom_domain column to schools

Revision ID: 0007_custom_domain
Revises: 0006_gallery_table
Create Date: 2025-01-01 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0007_custom_domain"
down_revision = "0006_gallery_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "schools",
        sa.Column("custom_domain", sa.String(253), nullable=True),
    )
    op.create_unique_constraint("uq_schools_custom_domain", "schools", ["custom_domain"])
    op.create_index("ix_schools_custom_domain", "schools", ["custom_domain"])


def downgrade() -> None:
    op.drop_index("ix_schools_custom_domain", table_name="schools")
    op.drop_constraint("uq_schools_custom_domain", "schools", type_="unique")
    op.drop_column("schools", "custom_domain")
