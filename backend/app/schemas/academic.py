from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


# ── Academic Session ──────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    status: str = "inactive"

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v: date, info) -> date:
        if "start_date" in (info.data or {}) and v <= info.data["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v


class SessionUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None


class SessionResponse(BaseModel):
    id: UUID
    school_id: UUID
    name: str
    start_date: date
    end_date: date
    status: str
    is_current: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Class ─────────────────────────────────────────────────────────────────────

class ClassCreate(BaseModel):
    name: str
    session_id: UUID
    display_order: int = 0


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    display_order: Optional[int] = None


class ClassResponse(BaseModel):
    id: UUID
    school_id: UUID
    session_id: UUID
    name: str
    display_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Section ───────────────────────────────────────────────────────────────────

class SectionCreate(BaseModel):
    name: str
    class_id: UUID
    capacity: Optional[int] = None
    room_number: Optional[str] = None
    class_teacher_id: Optional[UUID] = None


class SectionUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    room_number: Optional[str] = None
    class_teacher_id: Optional[UUID] = None


class SectionResponse(BaseModel):
    id: UUID
    school_id: UUID
    class_id: UUID
    name: str
    capacity: Optional[int] = None
    room_number: Optional[str] = None
    class_teacher_id: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Subject ───────────────────────────────────────────────────────────────────

class SubjectCreate(BaseModel):
    name: str
    code: str
    subject_type: str = "theory"
    max_marks: Optional[float] = None
    pass_marks: Optional[float] = None


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    subject_type: Optional[str] = None
    max_marks: Optional[float] = None
    pass_marks: Optional[float] = None


class SubjectResponse(BaseModel):
    id: UUID
    school_id: UUID
    name: str
    code: str
    subject_type: str
    max_marks: Optional[float] = None
    pass_marks: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── ClassSubject ──────────────────────────────────────────────────────────────

class ClassSubjectCreate(BaseModel):
    class_id: UUID
    subject_id: UUID
    session_id: UUID
    teacher_id: Optional[UUID] = None


class ClassSubjectResponse(BaseModel):
    id: UUID
    class_id: UUID
    subject_id: UUID
    session_id: UUID
    teacher_id: Optional[UUID] = None

    model_config = {"from_attributes": True}
