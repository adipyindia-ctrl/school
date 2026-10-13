from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin


class AcademicSession(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "academic_sessions"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)          # e.g. 2025-26
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="inactive")  # active, inactive, archived
    is_current: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    classes: Mapped[list[Class]] = relationship("Class", back_populates="session", lazy="select")

    __table_args__ = (UniqueConstraint("school_id", "name", name="uq_session_school_name"),)


class Class(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "classes"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("academic_sessions.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)         # Fully dynamic — no hardcoding
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    session: Mapped[AcademicSession] = relationship("AcademicSession", back_populates="classes")
    sections: Mapped[list[Section]] = relationship(
        "Section", back_populates="class_", lazy="select", cascade="all, delete-orphan"
    )
    class_subjects: Mapped[list[ClassSubject]] = relationship(
        "ClassSubject", back_populates="class_", lazy="select"
    )

    __table_args__ = (UniqueConstraint("school_id", "session_id", "name", name="uq_class_school_session_name"),)


class Section(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "sections"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    class_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(20), nullable=False)          # A, B, C …
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    room_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    class_teacher_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    class_: Mapped[Class] = relationship("Class", back_populates="sections")

    __table_args__ = (UniqueConstraint("school_id", "class_id", "name", name="uq_section_class_name"),)


class Subject(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "subjects"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    subject_type: Mapped[str] = mapped_column(String(20), nullable=False, default="theory")  # theory, practical
    max_marks: Mapped[float | None] = mapped_column(nullable=True)
    pass_marks: Mapped[float | None] = mapped_column(nullable=True)

    class_subjects: Mapped[list[ClassSubject]] = relationship(
        "ClassSubject", back_populates="subject", lazy="select"
    )

    __table_args__ = (UniqueConstraint("school_id", "code", name="uq_subject_school_code"),)


class ClassSubject(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "class_subjects"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    class_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("academic_sessions.id", ondelete="CASCADE"), nullable=False
    )
    teacher_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    class_: Mapped[Class] = relationship("Class", back_populates="class_subjects")
    subject: Mapped[Subject] = relationship("Subject", back_populates="class_subjects")

    __table_args__ = (
        UniqueConstraint("class_id", "subject_id", "session_id", name="uq_class_subject_session"),
    )
