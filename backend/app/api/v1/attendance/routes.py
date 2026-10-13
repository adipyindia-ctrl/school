from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Permissions
from app.core.tenant import CurrentUser, require_permission
from app.schemas.attendance import (
    AttendanceBulkCreate, AttendanceResponse, AttendanceSummary
)
from app.schemas.common import SuccessResponse
from app.services import attendance_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("", response_model=SuccessResponse[list[AttendanceResponse]])
def mark_attendance(
    payload: AttendanceBulkCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ATTENDANCE_CREATE)),
):
    records = attendance_service.mark_attendance(
        db, current_user.school_id, payload, current_user.user_id
    )
    return SuccessResponse(
        data=[AttendanceResponse.model_validate(r) for r in records],
        message=f"Attendance marked for {len(records)} students",
    )


@router.get("/section", response_model=SuccessResponse[list[AttendanceResponse]])
def get_section_attendance(
    section_id: UUID = Query(...),
    attendance_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ATTENDANCE_VIEW)),
):
    records = attendance_service.get_attendance_for_section(
        db, current_user.school_id, section_id, attendance_date
    )
    return SuccessResponse(data=[AttendanceResponse.model_validate(r) for r in records])


@router.get("/students", response_model=SuccessResponse[list[dict]])
def get_students_for_marking(
    section_id: UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ATTENDANCE_VIEW)),
):
    """Returns list of active students in a section — used to pre-populate the attendance form."""
    students = attendance_service.get_students_for_section(
        db, current_user.school_id, section_id
    )
    return SuccessResponse(data=[
        {
            "id": str(s.id),
            "admission_number": s.admission_number,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "roll_number": s.roll_number,
        }
        for s in students
    ])


@router.get("/summary/{student_id}", response_model=SuccessResponse[AttendanceSummary])
def student_summary(
    student_id: UUID,
    session_id: UUID = Query(...),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ATTENDANCE_VIEW)),
):
    summary = attendance_service.get_student_attendance_summary(
        db, current_user.school_id, student_id, session_id, from_date, to_date
    )
    return SuccessResponse(data=summary)
