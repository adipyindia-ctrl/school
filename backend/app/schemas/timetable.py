from __future__ import annotations

from datetime import datetime, time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PeriodCreate(BaseModel):
    class_id: UUID
    section_id: UUID
    session_id: UUID
    day_of_week: int         # 1-7
    period_number: int
    start_time: time
    end_time: time
    subject_id: Optional[UUID] = None
    teacher_id: Optional[UUID] = None
    room: Optional[str] = None
    is_break: bool = False


class PeriodUpdate(BaseModel):
    subject_id: Optional[UUID] = None
    teacher_id: Optional[UUID] = None
    room: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None


class PeriodResponse(BaseModel):
    id: UUID
    school_id: UUID
    class_id: UUID
    section_id: UUID
    session_id: UUID
    day_of_week: int
    period_number: int
    start_time: time
    end_time: time
    subject_id: Optional[UUID] = None
    teacher_id: Optional[UUID] = None
    room: Optional[str] = None
    is_break: bool
    created_at: datetime

    model_config = {"from_attributes": True}
