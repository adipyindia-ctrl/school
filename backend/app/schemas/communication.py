from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


# ── Homework ──────────────────────────────────────────────────────────────────

class HomeworkCreate(BaseModel):
    class_id: UUID
    section_id: UUID
    subject_id: UUID
    title: str
    description: Optional[str] = None
    assigned_date: date
    due_date: date
    attachment_url: Optional[str] = None


class HomeworkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    attachment_url: Optional[str] = None


class HomeworkResponse(BaseModel):
    id: UUID
    school_id: UUID
    class_id: UUID
    section_id: UUID
    subject_id: UUID
    teacher_id: UUID
    title: str
    description: Optional[str] = None
    assigned_date: date
    due_date: date
    attachment_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Notice ────────────────────────────────────────────────────────────────────

class NoticeCreate(BaseModel):
    title: str
    body: Optional[str] = None
    attachment_url: Optional[str] = None
    target_audience: str = "all"
    class_id: Optional[UUID] = None
    section_id: Optional[UUID] = None
    publish_date: date
    expiry_date: Optional[date] = None


class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    target_audience: Optional[str] = None
    expiry_date: Optional[date] = None
    status: Optional[str] = None


class NoticeResponse(BaseModel):
    id: UUID
    school_id: UUID
    title: str
    body: Optional[str] = None
    target_audience: str
    publish_date: date
    expiry_date: Optional[date] = None
    status: str
    created_by: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Event ─────────────────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: str = "other"
    start_date: date
    end_date: date
    target_audience: str = "all"


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class EventResponse(BaseModel):
    id: UUID
    school_id: UUID
    title: str
    description: Optional[str] = None
    event_type: str
    start_date: date
    end_date: date
    target_audience: str
    created_by: UUID
    created_at: datetime

    model_config = {"from_attributes": True}
