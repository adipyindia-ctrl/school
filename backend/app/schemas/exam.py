from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ExamTypeCreate(BaseModel):
    name: str


class ExamTypeResponse(BaseModel):
    id: UUID
    school_id: UUID
    name: str
    created_at: datetime
    model_config = {"from_attributes": True}


class ExamCreate(BaseModel):
    exam_type_id: UUID
    session_id: UUID
    class_id: UUID
    name: str
    start_date: date
    end_date: date


class ExamUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None


class ExamResponse(BaseModel):
    id: UUID
    school_id: UUID
    exam_type_id: UUID
    session_id: UUID
    class_id: UUID
    name: str
    start_date: date
    end_date: date
    status: str
    created_at: datetime
    model_config = {"from_attributes": True}


class ExamSubjectCreate(BaseModel):
    subject_id: UUID
    exam_date: date
    max_marks: float = 100
    pass_marks: float = 35
    room: Optional[str] = None
    teacher_id: Optional[UUID] = None


class ExamSubjectResponse(BaseModel):
    id: UUID
    exam_id: UUID
    subject_id: UUID
    exam_date: date
    max_marks: float
    pass_marks: float
    room: Optional[str] = None
    teacher_id: Optional[UUID] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class GradeRuleCreate(BaseModel):
    min_percent: float
    max_percent: float
    grade: str
    grade_point: float = 0
    is_pass: bool = True


class GradeRuleResponse(BaseModel):
    id: UUID
    school_id: UUID
    min_percent: float
    max_percent: float
    grade: str
    grade_point: float
    is_pass: bool
    model_config = {"from_attributes": True}


class MarkEntry(BaseModel):
    student_id: UUID
    marks_obtained: Optional[float] = None
    is_absent: bool = False
    remarks: Optional[str] = None


class MarksBulkCreate(BaseModel):
    exam_subject_id: UUID
    entries: list[MarkEntry]


class MarkResponse(BaseModel):
    id: UUID
    school_id: UUID
    exam_subject_id: UUID
    student_id: UUID
    marks_obtained: Optional[float] = None
    grade: Optional[str] = None
    is_absent: bool
    remarks: Optional[str] = None
    entered_by: Optional[UUID] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class StudentResult(BaseModel):
    student_id: UUID
    student_name: str
    admission_number: str
    subjects: list[dict]
    total_marks: float
    max_marks: float
    percentage: float
    grade: Optional[str] = None
    is_pass: bool
    rank: Optional[int] = None
