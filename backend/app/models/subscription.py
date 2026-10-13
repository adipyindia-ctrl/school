from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class SubscriptionPlan(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "subscription_plans"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    billing_cycle: Mapped[str] = mapped_column(String(20), nullable=False, default="monthly")
    max_students: Mapped[int] = mapped_column(Integer, nullable=False, default=500)
    max_teachers: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    storage_mb: Mapped[int] = mapped_column(Integer, nullable=False, default=1024)
    sms_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    trial_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    plan_modules: Mapped[list[PlanModule]] = relationship("PlanModule", back_populates="plan", cascade="all, delete-orphan")
    subscriptions: Mapped[list[SchoolSubscription]] = relationship("SchoolSubscription", back_populates="plan")


class Module(Base, UUIDMixin):
    __tablename__ = "modules"

    key: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_core: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    plan_modules: Mapped[list[PlanModule]] = relationship("PlanModule", back_populates="module")
    school_modules: Mapped[list[SchoolModule]] = relationship("SchoolModule", back_populates="module")


class PlanModule(Base):
    __tablename__ = "plan_modules"

    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subscription_plans.id", ondelete="CASCADE"), primary_key=True
    )
    module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), primary_key=True
    )

    plan: Mapped[SubscriptionPlan] = relationship("SubscriptionPlan", back_populates="plan_modules")
    module: Mapped[Module] = relationship("Module", back_populates="plan_modules")


class SchoolSubscription(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "school_subscriptions"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="trial")
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    payment_status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")

    school: Mapped[Any] = relationship("School", back_populates="subscriptions")
    plan: Mapped[SubscriptionPlan] = relationship("SubscriptionPlan", back_populates="subscriptions")


class SchoolModule(Base, UUIDMixin):
    __tablename__ = "school_modules"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    enabled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    school: Mapped[Any] = relationship("School", back_populates="modules")
    module: Mapped[Module] = relationship("Module", back_populates="school_modules")

    from sqlalchemy import UniqueConstraint
    __table_args__ = (UniqueConstraint("school_id", "module_id", name="uq_school_module"),)
