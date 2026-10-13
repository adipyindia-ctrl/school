from __future__ import annotations

import uuid
from datetime import date, datetime, time

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text, Time, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin


class ExamType(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "exam_types"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)   # Fully dynamic

    __table_args__ = (UniqueConstraint("school_id", "name", name="uq_exam_type_school_name"),)


class Exam(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "exams"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    exam_type_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("exam_types.id"), nullable=False
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("academic_sessions.id"), nullable=False
    )
    class_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    # draft, published, completed
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft", index=True)


class ExamSubject(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "exam_subjects"

    exam_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False
    )
    exam_date: Mapped[date] = mapped_column(Date, nullable=False)
    max_marks: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=100)
    pass_marks: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=35)
    room: Mapped[str | None] = mapped_column(String(20), nullable=True)
    teacher_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    __table_args__ = (UniqueConstraint("exam_id", "subject_id", name="uq_exam_subject"),)


class GradeRule(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "grade_rules"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    min_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    max_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    grade: Mapped[str] = mapped_column(String(5), nullable=False)        # A+, A, B+, B, C, D, F
    grade_point: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False, default=0)
    is_pass: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Mark(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "marks"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    exam_subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("exam_subjects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    marks_obtained: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    grade: Mapped[str | None] = mapped_column(String(5), nullable=True)
    is_absent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    entered_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    __table_args__ = (UniqueConstraint("exam_subject_id", "student_id", name="uq_mark_student_subject"),)
