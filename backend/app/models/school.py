from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin


class School(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "schools"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    school_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="cbse"
    )  # cbse, icse, state_board, other
    established_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    website: Mapped[str | None] = mapped_column(String(300), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="India")
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="trial", index=True
    )  # active, suspended, trial, expired, archived
    custom_domain: Mapped[str | None] = mapped_column(String(253), nullable=True, unique=True, index=True)

    # Relationships
    branding: Mapped[SchoolBranding | None] = relationship(
        "SchoolBranding", back_populates="school", uselist=False, cascade="all, delete-orphan"
    )
    settings: Mapped[SchoolSettings | None] = relationship(
        "SchoolSettings", back_populates="school", uselist=False, cascade="all, delete-orphan"
    )
    users: Mapped[list] = relationship("User", back_populates="school", lazy="select")
    modules: Mapped[list] = relationship("SchoolModule", back_populates="school", lazy="select")
    subscriptions: Mapped[list] = relationship("SchoolSubscription", back_populates="school", lazy="select")


class SchoolBranding(Base, UUIDMixin):
    __tablename__ = "school_brandings"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    primary_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#1a73e8")
    secondary_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#34a853")
    sidebar_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#1e293b")
    accent_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#f59e0b")
    font_family: Mapped[str] = mapped_column(String(100), nullable=False, default="Inter")
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    favicon_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    login_bg_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    dashboard_logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    welcome_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    footer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    support_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    support_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    school: Mapped[School] = relationship("School", back_populates="branding")


class SchoolSettings(Base, UUIDMixin):
    __tablename__ = "school_settings"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    academic_year_start_month: Mapped[int] = mapped_column(Integer, nullable=False, default=4)
    attendance_threshold: Mapped[float] = mapped_column(nullable=False, default=75.0)
    fee_due_day: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, default="Asia/Kolkata")
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="INR")
    date_format: Mapped[str] = mapped_column(String(20), nullable=False, default="DD/MM/YYYY")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    school: Mapped[School] = relationship("School", back_populates="settings")
