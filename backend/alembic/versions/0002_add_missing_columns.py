"""Add missing is_active and other columns from SoftDeleteMixin

Revision ID: 0002_fix_columns
Revises: 0001_initial
Create Date: 2025-01-01 00:01:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0002_fix_columns"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # schools — SoftDeleteMixin adds is_active
    op.execute("ALTER TABLE schools ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;")

    # users — SoftDeleteMixin adds is_active
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;")

    # students — SoftDeleteMixin adds is_active
    op.execute("ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;")

    # parents — SoftDeleteMixin adds is_active
    op.execute("ALTER TABLE parents ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;")

    # teachers — SoftDeleteMixin adds is_active
    op.execute("ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;")

    # staff — SoftDeleteMixin adds is_active
    op.execute("ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;")

    # admission_leads — SoftDeleteMixin adds is_active
    op.execute("ALTER TABLE admission_leads ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;")

    # homework — SoftDeleteMixin adds is_active
    op.execute("ALTER TABLE homework ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;")

    # SchoolSettings attendance_threshold needs explicit type
    op.execute("""
        ALTER TABLE school_settings
        ALTER COLUMN attendance_threshold TYPE NUMERIC(5,2);
    """)

    # Notifications table (used by communication module)
    op.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(300) NOT NULL,
            body TEXT,
            type VARCHAR(50),
            reference_id UUID,
            reference_type VARCHAR(50),
            is_read BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS ix_notifications_user ON notifications(school_id, user_id, is_read, created_at DESC);
    """)


def downgrade() -> None:
    pass
