"""Add role_modules table for role-based module access control

Revision ID: 0010_role_modules
Revises: 0009_user_max_schools
Create Date: 2026-09-13 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0010_role_modules"
down_revision = "0009_user_max_schools"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "role_modules",
        sa.Column("role_id", UUID(as_uuid=True), nullable=False),
        sa.Column("module_key", sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("role_id", "module_key"),
    )
    op.create_index("ix_role_modules_role_id", "role_modules", ["role_id"])


def downgrade() -> None:
    op.drop_index("ix_role_modules_role_id", table_name="role_modules")
    op.drop_table("role_modules")
