from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Permissions
from app.core.tenant import CurrentUser, require_permission
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.fees import (
    FeeCategoryCreate, FeeCategoryResponse,
    FeePaymentCreate, FeePaymentResponse,
    FeeStructureCreate, FeeStructureResponse,
    StudentFeeAssign, StudentFeeResponse,
)
from app.services import fees_service

router = APIRouter(prefix="/fees", tags=["Fees"])


# ── Categories ────────────────────────────────────────────────────────────────

@router.get("/categories", response_model=SuccessResponse[list[FeeCategoryResponse]])
def list_categories(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.FEES_VIEW)),
):
    cats = fees_service.list_categories(db, current_user.school_id)
    return SuccessResponse(data=[FeeCategoryResponse.model_validate(c) for c in cats])


@router.post("/categories", response_model=SuccessResponse[FeeCategoryResponse], status_code=201)
def create_category(
    payload: FeeCategoryCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.FEES_CREATE)),
):
    cat = fees_service.create_category(db, current_user.school_id, payload)
    return SuccessResponse(data=FeeCategoryResponse.model_validate(cat), message="Category created")


@router.delete("/categories/{cat_id}", response_model=SuccessResponse[dict])
def delete_category(
    cat_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.FEES_EDIT)),
):
    fees_service.delete_category(db, current_user.school_id, cat_id)
    return SuccessResponse(data={}, message="Category deleted")


# ── Structures ────────────────────────────────────────────────────────────────

@router.get("/structures", response_model=SuccessResponse[list[FeeStructureResponse]])
def list_structures(
    session_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.FEES_VIEW)),
):
    structs = fees_service.list_structures(db, current_user.school_id, session_id=session_id)
    return SuccessResponse(data=[FeeStructureResponse.model_validate(s) for s in structs])


@router.post("/structures", response_model=SuccessResponse[FeeStructureResponse], status_code=201)
def create_structure(
    payload: FeeStructureCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.FEES_CREATE)),
):
    fs = fees_service.create_structure(db, current_user.school_id, payload)
    return SuccessResponse(data=FeeStructureResponse.model_validate(fs), message="Fee structure created")


# ── Student Fees ──────────────────────────────────────────────────────────────

@router.post("/student-fees", response_model=SuccessResponse[StudentFeeResponse], status_code=201)
def assign_fee(
    payload: StudentFeeAssign,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.FEES_CREATE)),
):
    sf = fees_service.assign_fee(db, current_user.school_id, payload)
    return SuccessResponse(data=StudentFeeResponse.model_validate(sf), message="Fee assigned")


@router.get("/student-fees/{student_id}/ledger", response_model=SuccessResponse[list[dict]])
def get_ledger(
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.FEES_VIEW)),
):
    ledger = fees_service.get_student_ledger(db, current_user.school_id, student_id)
    return SuccessResponse(data=ledger)


# ── Payments ──────────────────────────────────────────────────────────────────

@router.post("/payments", response_model=SuccessResponse[FeePaymentResponse], status_code=201)
def record_payment(
    payload: FeePaymentCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.FEES_COLLECT)),
):
    payment = fees_service.record_payment(
        db, current_user.school_id, payload, current_user.user_id
    )
    return SuccessResponse(
        data=FeePaymentResponse.model_validate(payment),
        message=f"Payment recorded. Receipt: {payment.receipt_number}",
    )


@router.get("/payments", response_model=PaginatedResponse[FeePaymentResponse])
def list_payments(
    student_id: Optional[UUID] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.FEES_VIEW)),
):
    result = fees_service.list_payments(
        db, current_user.school_id,
        page=page, page_size=page_size,
        student_id=student_id, from_date=from_date, to_date=to_date,
    )
    return PaginatedResponse(
        data=[FeePaymentResponse.model_validate(p) for p in result["data"]],
        total=result["total"], page=result["page"],
        page_size=result["page_size"], total_pages=result["total_pages"],
    )
