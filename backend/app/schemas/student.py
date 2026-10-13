from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ── Student ───────────────────────────────────────────────────────────────────

class StudentCreate(BaseModel):
    session_id: UUID
    class_id: UUID
    section_id: UUID
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    admission_number: Optional[str] = None      # auto-generated if omitted
    admission_date: Optional[date] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    category: Optional[str] = None
    religion: Optional[str] = None
    nationality: Optional[str] = None
    roll_number: Optional[str] = None
    previous_school: Optional[str] = None
    transport_required: bool = False
    photo_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class StudentUpdate(BaseModel):
    class_id: Optional[UUID] = None
    section_id: Optional[UUID] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    category: Optional[str] = None
    religion: Optional[str] = None
    nationality: Optional[str] = None
    roll_number: Optional[str] = None
    previous_school: Optional[str] = None
    transport_required: Optional[bool] = None
    photo_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    status: Optional[str] = None


class StudentResponse(BaseModel):
    id: UUID
    school_id: UUID
    session_id: UUID
    class_id: UUID
    section_id: UUID
    admission_number: str
    admission_date: Optional[date] = None
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    roll_number: Optional[str] = None
    transport_required: bool
    status: str
    photo_url: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentDetailResponse(StudentResponse):
    middle_name: Optional[str] = None
    category: Optional[str] = None
    religion: Optional[str] = None
    nationality: Optional[str] = None
    previous_school: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    parents: list["ParentSummary"] = []


class ParentSummary(BaseModel):
    """Minimal parent info embedded in StudentDetailResponse."""
    id: UUID
    first_name: str
    last_name: str
    relationship_type: str
    phone: Optional[str] = None
    email: Optional[str] = None
    is_primary: bool = False

    model_config = {"from_attributes": True}


# ── Parent ────────────────────────────────────────────────────────────────────

class ParentCreate(BaseModel):
    first_name: str
    last_name: str
    relationship_type: str = Field("father", alias="relationship")
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    occupation: Optional[str] = None
    photo_url: Optional[str] = None
    address: Optional[str] = None
    student_ids: list[UUID] = []            # Link parent to these students

    model_config = {"populate_by_name": True}


class ParentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    relationship_type: Optional[str] = Field(None, alias="relationship")
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    occupation: Optional[str] = None
    address: Optional[str] = None

    model_config = {"populate_by_name": True}


class LinkedStudentInfo(BaseModel):
    """Minimal student info embedded inside a ParentResponse."""
    id: UUID
    first_name: str
    last_name: str
    admission_number: str
    class_id: UUID
    section_id: UUID
    is_primary: bool = False

    model_config = {"from_attributes": True}


class ParentResponse(BaseModel):
    id: UUID
    school_id: UUID
    first_name: str
    last_name: str
    relationship_type: str = Field(alias="relationship_type")
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    email: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
    created_at: datetime
    students: list[LinkedStudentInfo] = []

    model_config = {"from_attributes": True, "populate_by_name": True}


class ParentStudentLink(BaseModel):
    """Used for PATCH /parents/{id}/students/{student_id}."""
    is_primary: bool = False
