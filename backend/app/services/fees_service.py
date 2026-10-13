from __future__ import annotations

import math
import uuid
from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.fees import FeeCategory, FeePayment, FeeStructure, StudentFee
from app.schemas.fees import (
    FeeCategoryCreate, FeePaymentCreate, FeeStructureCreate, StudentFeeAssign
)


def _receipt_number(db: Session, school_id: UUID) -> str:
    year = date.today().year
    prefix = f"RCP{year}"
    count = db.query(func.count(FeePayment.id)).filter(
        FeePayment.school_id == school_id
    ).scalar() or 0
    return f"{prefix}{count + 1:05d}"


# ── Categories ────────────────────────────────────────────────────────────────

def list_categories(db: Session, school_id: UUID) -> list[FeeCategory]:
    return db.query(FeeCategory).filter(
        FeeCategory.school_id == school_id, FeeCategory.deleted_at == None
    ).order_by(FeeCategory.name).all()


def create_category(db: Session, school_id: UUID, payload: FeeCategoryCreate) -> FeeCategory:
    if db.query(FeeCategory).filter(
        FeeCategory.school_id == school_id,
        FeeCategory.name == payload.name,
        FeeCategory.deleted_at == None,
    ).first():
        raise HTTPException(status_code=400, detail="Fee category already exists")
    cat = FeeCategory(school_id=school_id, **payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def delete_category(db: Session, school_id: UUID, cat_id: UUID) -> None:
    from datetime import datetime, timezone
    cat = db.query(FeeCategory).filter(
        FeeCategory.id == cat_id, FeeCategory.school_id == school_id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.deleted_at = datetime.now(timezone.utc)
    cat.is_active = False
    db.commit()


# ── Structures ────────────────────────────────────────────────────────────────

def list_structures(db: Session, school_id: UUID, session_id: Optional[UUID] = None) -> list[FeeStructure]:
    q = db.query(FeeStructure).filter(
        FeeStructure.school_id == school_id, FeeStructure.deleted_at == None
    )
    if session_id:
        q = q.filter(FeeStructure.session_id == session_id)
    return q.all()


def create_structure(db: Session, school_id: UUID, payload: FeeStructureCreate) -> FeeStructure:
    fs = FeeStructure(school_id=school_id, **payload.model_dump())
    db.add(fs)
    db.commit()
    db.refresh(fs)
    return fs


# ── Student Fees ──────────────────────────────────────────────────────────────

def assign_fee(db: Session, school_id: UUID, payload: StudentFeeAssign) -> StudentFee:
    existing = db.query(StudentFee).filter(
        StudentFee.school_id == school_id,
        StudentFee.student_id == payload.student_id,
        StudentFee.fee_structure_id == payload.fee_structure_id,
    ).first()
    if existing:
        return existing
    sf = StudentFee(
        school_id=school_id,
        student_id=payload.student_id,
        fee_structure_id=payload.fee_structure_id,
        amount_due=payload.amount_due,
        discount=payload.discount,
        due_date=payload.due_date,
    )
    db.add(sf)
    db.commit()
    db.refresh(sf)
    return sf


def get_student_ledger(
    db: Session, school_id: UUID, student_id: UUID
) -> list[dict]:
    fees = db.query(StudentFee).filter(
        StudentFee.school_id == school_id,
        StudentFee.student_id == student_id,
    ).all()
    result = []
    for sf in fees:
        payments = db.query(FeePayment).filter(
            FeePayment.student_fee_id == sf.id
        ).all()
        result.append({
            "student_fee_id": str(sf.id),
            "fee_structure_id": str(sf.fee_structure_id),
            "amount_due": float(sf.amount_due),
            "discount": float(sf.discount),
            "fine": float(sf.fine),
            "amount_paid": float(sf.amount_paid),
            "outstanding": float(sf.amount_due - sf.discount + sf.fine - sf.amount_paid),
            "status": sf.status,
            "due_date": str(sf.due_date) if sf.due_date else None,
            "payments": [
                {
                    "receipt_number": p.receipt_number,
                    "amount": float(p.amount),
                    "payment_date": str(p.payment_date),
                    "payment_mode": p.payment_mode,
                }
                for p in payments
            ],
        })
    return result


# ── Payments ──────────────────────────────────────────────────────────────────

def record_payment(
    db: Session, school_id: UUID, payload: FeePaymentCreate, collected_by: UUID
) -> FeePayment:
    sf = db.query(StudentFee).filter(
        StudentFee.id == payload.student_fee_id, StudentFee.school_id == school_id
    ).first()
    if not sf:
        raise HTTPException(status_code=404, detail="Student fee record not found")

    outstanding = float(sf.amount_due) - float(sf.discount) + float(sf.fine) - float(sf.amount_paid)
    if payload.amount > outstanding + 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Payment ₹{payload.amount} exceeds outstanding ₹{outstanding:.2f}"
        )

    receipt = _receipt_number(db, school_id)
    payment = FeePayment(
        school_id=school_id,
        student_fee_id=sf.id,
        receipt_number=receipt,
        amount=payload.amount,
        payment_date=payload.payment_date,
        payment_mode=payload.payment_mode,
        transaction_ref=payload.transaction_ref,
        collected_by=collected_by,
        remarks=payload.remarks,
    )
    db.add(payment)

    # Update StudentFee
    sf.amount_paid = float(sf.amount_paid) + payload.amount
    new_outstanding = float(sf.amount_due) - float(sf.discount) + float(sf.fine) - float(sf.amount_paid)
    if new_outstanding <= 0:
        sf.status = "paid"
    elif float(sf.amount_paid) > 0:
        sf.status = "partial"

    db.commit()
    db.refresh(payment)
    return payment


def get_payment_or_404(db: Session, school_id: UUID, payment_id: UUID) -> FeePayment:
    p = db.query(FeePayment).filter(
        FeePayment.id == payment_id, FeePayment.school_id == school_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    return p


def list_payments(
    db: Session, school_id: UUID,
    page: int = 1, page_size: int = 25,
    student_id: Optional[UUID] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> dict:
    q = db.query(FeePayment).filter(FeePayment.school_id == school_id)
    if student_id:
        q = q.join(StudentFee, FeePayment.student_fee_id == StudentFee.id).filter(
            StudentFee.student_id == student_id
        )
    if from_date:
        q = q.filter(FeePayment.payment_date >= from_date)
    if to_date:
        q = q.filter(FeePayment.payment_date <= to_date)
    total = q.count()
    data = q.order_by(FeePayment.payment_date.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"data": data, "total": total, "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}
