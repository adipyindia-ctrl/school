from __future__ import annotations

import math
from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Permissions
from app.core.tenant import CurrentUser, require_permission
from app.models.attendance import Attendance
from app.models.fees import FeePayment, FeeStructure, StudentFee
from app.models.student import Student
from app.schemas.common import SuccessResponse
from app.services.crm_service import get_funnel_stats
from app.services.exam_service import get_exam_results

router = APIRouter(prefix="/reports", tags=["Reports"])


# ── Attendance Report ─────────────────────────────────────────────────────────

@router.get("/attendance", response_model=SuccessResponse[dict])
def attendance_report(
    session_id: UUID = Query(...),
    class_id: Optional[UUID] = Query(None),
    section_id: Optional[UUID] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.REPORTS_VIEW)),
):
    """
    Returns per-student attendance summary with present/absent/late counts
    and attendance percentage for the given filters.
    """
    school_id = current_user.school_id

    # Get all students matching the filter
    sq = db.query(Student).filter(
        Student.school_id == school_id,
        Student.session_id == session_id,
        Student.status == "active",
        Student.deleted_at.is_(None),
    )
    if class_id:
        sq = sq.filter(Student.class_id == class_id)
    if section_id:
        sq = sq.filter(Student.section_id == section_id)
    students = sq.order_by(Student.first_name).all()

    rows = []
    for student in students:
        aq = db.query(Attendance).filter(
            Attendance.school_id == school_id,
            Attendance.student_id == student.id,
            Attendance.session_id == session_id,
        )
        if from_date:
            aq = aq.filter(Attendance.date >= from_date)
        if to_date:
            aq = aq.filter(Attendance.date <= to_date)
        records = aq.all()

        counts = {"present": 0, "absent": 0, "late": 0, "half_day": 0, "leave": 0}
        for r in records:
            if r.status in counts:
                counts[r.status] += 1
        total = len(records)
        present_equiv = counts["present"] + counts["late"] + counts["half_day"] * 0.5
        pct = round(present_equiv / total * 100, 1) if total else 0.0

        rows.append({
            "student_id": str(student.id),
            "name": f"{student.first_name} {student.last_name}",
            "admission_number": student.admission_number,
            "total_days": total,
            "present": counts["present"],
            "absent": counts["absent"],
            "late": counts["late"],
            "half_day": counts["half_day"],
            "leave": counts["leave"],
            "percentage": pct,
            "low_attendance": pct < 75,
        })

    return SuccessResponse(data={
        "rows": rows,
        "total_students": len(rows),
        "filters": {
            "session_id": str(session_id),
            "class_id": str(class_id) if class_id else None,
            "section_id": str(section_id) if section_id else None,
            "from_date": str(from_date) if from_date else None,
            "to_date": str(to_date) if to_date else None,
        },
    })


# ── Fees Collection Report ────────────────────────────────────────────────────

@router.get("/fees", response_model=SuccessResponse[dict])
def fees_report(
    session_id: Optional[UUID] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.REPORTS_VIEW)),
):
    """
    Returns fee payment rows and summary totals for the given date range.
    """
    school_id = current_user.school_id

    q = (
        db.query(FeePayment)
        .join(StudentFee, FeePayment.student_fee_id == StudentFee.id)
        .filter(
            FeePayment.school_id == school_id,
            StudentFee.school_id == school_id,
        )
    )
    if from_date:
        q = q.filter(FeePayment.payment_date >= from_date)
    if to_date:
        q = q.filter(FeePayment.payment_date <= to_date)

    total_records = q.count()
    payments = q.order_by(FeePayment.payment_date.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # Totals (across all matching, not just page)
    total_collected_q = (
        db.query(func.sum(FeePayment.amount))
        .join(StudentFee, FeePayment.student_fee_id == StudentFee.id)
        .filter(
            FeePayment.school_id == school_id,
            StudentFee.school_id == school_id,
        )
    )
    if from_date:
        total_collected_q = total_collected_q.filter(FeePayment.payment_date >= from_date)
    if to_date:
        total_collected_q = total_collected_q.filter(FeePayment.payment_date <= to_date)
    total_collected = float(total_collected_q.scalar() or 0)

    # Outstanding across school for the session
    outstanding_q = db.query(func.sum(
        StudentFee.amount_due - StudentFee.discount + StudentFee.fine - StudentFee.amount_paid
    )).filter(StudentFee.school_id == school_id, StudentFee.status.in_(["unpaid", "partial", "overdue"]))
    if session_id:
        outstanding_q = outstanding_q.join(
            FeeStructure, StudentFee.fee_structure_id == FeeStructure.id
        ).filter(FeeStructure.session_id == session_id)
    total_outstanding = float(outstanding_q.scalar() or 0)

    rows = [
        {
            "receipt_number": p.receipt_number,
            "payment_date": str(p.payment_date),
            "amount": float(p.amount),
            "payment_mode": p.payment_mode,
            "student_fee_id": str(p.student_fee_id),
        }
        for p in payments
    ]

    return SuccessResponse(data={
        "rows": rows,
        "total_records": total_records,
        "total_pages": math.ceil(total_records / page_size) if page_size else 1,
        "page": page,
        "page_size": page_size,
        "summary": {
            "total_collected": total_collected,
            "total_outstanding": total_outstanding,
        },
    })


# ── Results Report ────────────────────────────────────────────────────────────

@router.get("/results", response_model=SuccessResponse[dict])
def results_report(
    exam_id: UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.REPORTS_VIEW)),
):
    """Returns ranked results for all students in an exam."""
    results = get_exam_results(db, current_user.school_id, exam_id)
    return SuccessResponse(data={
        "exam_id": str(exam_id),
        "results": [r.model_dump() if hasattr(r, "model_dump") else r.__dict__ for r in results],
        "total_students": len(results),
    })


# ── Admission Funnel Report ───────────────────────────────────────────────────

@router.get("/admissions", response_model=SuccessResponse[dict])
def admissions_report(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.REPORTS_VIEW)),
):
    """Returns admission CRM funnel stats."""
    stats = get_funnel_stats(db, current_user.school_id)
    total = sum(s.count for s in stats)
    rows = []
    for i, s in enumerate(stats):
        prev = stats[i - 1].count if i > 0 and stats[i - 1].count > 0 else None
        conversion = round(s.count / prev * 100, 1) if prev else None
        rows.append({
            "stage": s.stage,
            "label": s.label,
            "count": s.count,
            "percentage_of_total": round(s.count / total * 100, 1) if total else 0,
            "conversion_from_prev": conversion,
        })
    return SuccessResponse(data={"funnel": rows, "total_leads": total})
