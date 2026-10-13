from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.student import Student
from app.schemas.attendance import AttendanceBulkCreate, AttendanceSummary


def mark_attendance(
    db: Session,
    school_id: UUID,
    payload: AttendanceBulkCreate,
    marked_by: UUID,
) -> list[Attendance]:
    """Upsert attendance for a section on a given date. No future-date attendance."""
    today = date.today()
    if payload.date > today:
        raise HTTPException(status_code=400, detail="Cannot mark attendance for a future date")

    results = []
    for entry in payload.entries:
        existing = db.query(Attendance).filter(
            Attendance.school_id == school_id,
            Attendance.student_id == entry.student_id,
            Attendance.date == payload.date,
        ).first()

        if existing:
            existing.status = entry.status
            existing.remarks = entry.remarks
            existing.marked_by = marked_by
            results.append(existing)
        else:
            a = Attendance(
                school_id=school_id,
                student_id=entry.student_id,
                class_id=payload.class_id,
                section_id=payload.section_id,
                session_id=payload.session_id,
                date=payload.date,
                status=entry.status,
                remarks=entry.remarks,
                marked_by=marked_by,
            )
            db.add(a)
            results.append(a)

    db.commit()
    for r in results:
        db.refresh(r)
    return results


def get_attendance_for_section(
    db: Session,
    school_id: UUID,
    section_id: UUID,
    attendance_date: date,
) -> list[Attendance]:
    return (
        db.query(Attendance)
        .filter(
            Attendance.school_id == school_id,
            Attendance.section_id == section_id,
            Attendance.date == attendance_date,
        )
        .all()
    )


def get_student_attendance_summary(
    db: Session,
    school_id: UUID,
    student_id: UUID,
    session_id: UUID,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> AttendanceSummary:
    q = db.query(Attendance).filter(
        Attendance.school_id == school_id,
        Attendance.student_id == student_id,
        Attendance.session_id == session_id,
    )
    if from_date:
        q = q.filter(Attendance.date >= from_date)
    if to_date:
        q = q.filter(Attendance.date <= to_date)

    records = q.all()
    counts = {"present": 0, "absent": 0, "late": 0, "half_day": 0, "leave": 0}
    for r in records:
        if r.status in counts:
            counts[r.status] += 1

    total = len(records)
    present_equiv = counts["present"] + counts["late"] + counts["half_day"] * 0.5
    pct = round((present_equiv / total * 100), 2) if total else 0.0

    return AttendanceSummary(
        student_id=student_id,
        total_days=total,
        present=counts["present"],
        absent=counts["absent"],
        late=counts["late"],
        half_day=counts["half_day"],
        leave=counts["leave"],
        percentage=pct,
    )


def get_students_for_section(db: Session, school_id: UUID, section_id: UUID) -> list[Student]:
    return (
        db.query(Student)
        .filter(
            Student.school_id == school_id,
            Student.section_id == section_id,
            Student.status == "active",
            Student.deleted_at == None,
        )
        .order_by(Student.roll_number, Student.first_name)
        .all()
    )
