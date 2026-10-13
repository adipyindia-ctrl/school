from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


STAGES = [
    "new_enquiry",
    "contacted",
    "follow_up",
    "school_visit",
    "application_submitted",
    "admission_confirmed",
    "rejected",
]


class LeadCreate(BaseModel):
    student_name: str
    parent_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    interested_class: Optional[str] = None
    source: str = "walk_in"
    stage: str = "new_enquiry"
    assigned_to: Optional[UUID] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None


class LeadUpdate(BaseModel):
    student_name: Optional[str] = None
    parent_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    interested_class: Optional[str] = None
    source: Optional[str] = None
    stage: Optional[str] = None
    assigned_to: Optional[UUID] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None


class LeadResponse(BaseModel):
    id: UUID
    school_id: UUID
    student_name: str
    parent_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    interested_class: Optional[str] = None
    source: str
    stage: str
    assigned_to: Optional[UUID] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FollowUpCreate(BaseModel):
    follow_up_type: str = "call"
    notes: Optional[str] = None
    follow_up_date: date
    next_follow_up: Optional[date] = None


class FollowUpResponse(BaseModel):
    id: UUID
    lead_id: UUID
    school_id: UUID
    follow_up_type: str
    notes: Optional[str] = None
    follow_up_date: date
    next_follow_up: Optional[date] = None
    done_by: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FunnelStats(BaseModel):
    stage: str
    count: int
    label: str
