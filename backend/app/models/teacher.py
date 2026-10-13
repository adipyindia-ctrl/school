from __future__ import annotations

import uuid
from datetime import date
from typing import Any

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin


class Teacher(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "teachers"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    employee_id: Mapped[str] = mapped_column(String(50), nullable=False)
    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    qualification: Mapped[str | None] = mapped_column(String(200), nullable=True)
    experience_years: Mapped[int | None] = mapped_column(Integer, nullable=True)
    joining_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    salary: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)

    user: Mapped[Any] = relationship("User", foreign_keys=[user_id])

    __table_args__ = (UniqueConstraint("school_id", "employee_id", name="uq_teacher_employee"),)


class Staff(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "staff"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    employee_id: Mapped[str] = mapped_column(String(50), nullable=False)
    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    joining_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)

    user: Mapped[Any] = relationship("User", foreign_keys=[user_id])

    __table_args__ = (UniqueConstraint("school_id", "employee_id", name="uq_staff_employee"),)
