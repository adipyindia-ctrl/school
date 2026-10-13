from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class FeeCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class FeeCategoryResponse(BaseModel):
    id: UUID
    school_id: UUID
    name: str
    description: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class FeeStructureCreate(BaseModel):
    session_id: UUID
    class_id: Optional[UUID] = None
    category_id: UUID
    amount: float
    frequency: str = "monthly"
    due_day: Optional[int] = None


class FeeStructureResponse(BaseModel):
    id: UUID
    school_id: UUID
    session_id: UUID
    class_id: Optional[UUID] = None
    category_id: UUID
    amount: float
    frequency: str
    due_day: Optional[int] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class StudentFeeAssign(BaseModel):
    student_id: UUID
    fee_structure_id: UUID
    amount_due: float
    discount: float = 0
    due_date: Optional[date] = None


class StudentFeeResponse(BaseModel):
    id: UUID
    school_id: UUID
    student_id: UUID
    fee_structure_id: UUID
    amount_due: float
    discount: float
    fine: float
    amount_paid: float
    due_date: Optional[date] = None
    status: str
    created_at: datetime
    model_config = {"from_attributes": True}


class FeePaymentCreate(BaseModel):
    student_fee_id: UUID
    amount: float
    payment_date: date
    payment_mode: str = "cash"
    transaction_ref: Optional[str] = None
    remarks: Optional[str] = None


class FeePaymentResponse(BaseModel):
    id: UUID
    school_id: UUID
    student_fee_id: UUID
    receipt_number: str
    amount: float
    payment_date: date
    payment_mode: str
    transaction_ref: Optional[str] = None
    collected_by: Optional[UUID] = None
    created_at: datetime
    model_config = {"from_attributes": True}
