from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class TeacherCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    joining_date: Optional[date] = None
    salary: Optional[float] = None
    password: str = "Teacher@1234"


class TeacherUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    joining_date: Optional[date] = None
    salary: Optional[float] = None
    status: Optional[str] = None


class TeacherResponse(BaseModel):
    id: UUID
    school_id: UUID
    user_id: UUID
    employee_id: str
    designation: Optional[str] = None
    department: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    joining_date: Optional[date] = None
    status: str
    created_at: datetime
    # Flattened from User
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    phone: Optional[str] = None
    photo_url: Optional[str] = None

    model_config = {"from_attributes": True}


class StaffCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    joining_date: Optional[date] = None
    password: str = "Staff@1234"


class StaffUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None


class StaffResponse(BaseModel):
    id: UUID
    school_id: UUID
    user_id: UUID
    employee_id: str
    designation: Optional[str] = None
    department: Optional[str] = None
    status: str
    created_at: datetime
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    phone: Optional[str] = None

    model_config = {"from_attributes": True}
