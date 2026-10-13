from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin


class AdmissionLead(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "admission_leads"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    student_name: Mapped[str] = mapped_column(String(200), nullable=False)
    parent_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    interested_class: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # walk_in, website, referral, social_media, other
    source: Mapped[str] = mapped_column(String(30), nullable=False, default="walk_in")
    # new_enquiry, contacted, follow_up, school_visit, application_submitted, admission_confirmed, rejected
    stage: Mapped[str] = mapped_column(String(30), nullable=False, default="new_enquiry", index=True)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class FollowUp(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "follow_ups"

    lead_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("admission_leads.id", ondelete="CASCADE"), nullable=False, index=True
    )
    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False
    )
    # call, email, visit, message
    follow_up_type: Mapped[str] = mapped_column(String(20), nullable=False, default="call")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    follow_up_date: Mapped[date] = mapped_column(Date, nullable=False)
    next_follow_up: Mapped[date | None] = mapped_column(Date, nullable=True)
    done_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
