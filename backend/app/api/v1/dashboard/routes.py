from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Permissions
from app.core.tenant import CurrentUser, require_permission
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=SuccessResponse[dict])
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.STUDENTS_VIEW)),
):
    """School-level dashboard stats scoped to the logged-in user's school."""
    from app.models.student import Student
    from app.models.teacher import Teacher, Staff
    from app.models.attendance import Attendance
    from app.models.fees import FeePayment, StudentFee
    from app.models.communication import Event, Notice

    school_id = current_user.school_id
    today = date.today()

    # ── Counts ────────────────────────────────────────────────────────────────

    total_students = (
        db.query(func.count(Student.id))
        .filter(Student.school_id == school_id, Student.status == "active", Student.deleted_at == None)
        .scalar() or 0
    )

    total_teachers = (
        db.query(func.count(Teacher.id))
        .filter(Teacher.school_id == school_id, Teacher.status == "active", Teacher.deleted_at == None)
        .scalar() or 0
    )

    total_staff = (
        db.query(func.count(Staff.id))
        .filter(Staff.school_id == school_id, Staff.status == "active", Staff.deleted_at == None)
        .scalar() or 0
    )

    # ── Today's attendance percentage ─────────────────────────────────────────

    today_attendance_records = (
        db.query(Attendance)
        .filter(Attendance.school_id == school_id, Attendance.date == today)
        .all()
    )

    if today_attendance_records:
        present_count = sum(
            1 for a in today_attendance_records
            if a.status in ("present", "late", "half_day")
        )
        today_attendance_pct = round(present_count / len(today_attendance_records) * 100, 1)
    else:
        today_attendance_pct = 0.0

    # ── Fees ──────────────────────────────────────────────────────────────────

    fees_collected = (
        db.query(func.coalesce(func.sum(FeePayment.amount), 0))
        .filter(FeePayment.school_id == school_id)
        .scalar() or 0
    )

    pending_fees = (
        db.query(
            func.coalesce(
                func.sum(StudentFee.amount_due - StudentFee.amount_paid - StudentFee.discount), 0
            )
        )
        .filter(
            StudentFee.school_id == school_id,
            StudentFee.status.in_(["unpaid", "partial", "overdue"]),
        )
        .scalar() or 0
    )

    # ── Events & Notices ──────────────────────────────────────────────────────

    upcoming_events = (
        db.query(func.count(Event.id))
        .filter(Event.school_id == school_id, Event.start_date >= today)
        .scalar() or 0
    )

    recent_notices = (
        db.query(func.count(Notice.id))
        .filter(
            Notice.school_id == school_id,
            Notice.status == "active",
            Notice.publish_date <= today,
        )
        .scalar() or 0
    )

    return SuccessResponse(data={
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_staff": total_staff,
        "today_attendance_pct": today_attendance_pct,
        "fees_collected": float(fees_collected),
        "pending_fees": float(pending_fees),
        "upcoming_events": upcoming_events,
        "recent_notices": recent_notices,
    })
