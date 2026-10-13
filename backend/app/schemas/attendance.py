from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class AttendanceEntry(BaseModel):
    student_id: UUID
    status: str  # present, absent, late, half_day, leave
    remarks: Optional[str] = None


class AttendanceBulkCreate(BaseModel):
    """Mark attendance for multiple students in one section/date call."""
    class_id: UUID
    section_id: UUID
    session_id: UUID
    date: date
    entries: list[AttendanceEntry]


class AttendanceResponse(BaseModel):
    id: UUID
    school_id: UUID
    student_id: UUID
    class_id: UUID
    section_id: UUID
    session_id: UUID
    date: date
    status: str
    remarks: Optional[str] = None
    marked_by: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AttendanceSummary(BaseModel):
    student_id: UUID
    total_days: int
    present: int
    absent: int
    late: int
    half_day: int
    leave: int
    percentage: float
