from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.timetable import TimetablePeriod
from app.schemas.timetable import PeriodCreate, PeriodUpdate


def list_periods(
    db: Session,
    school_id: UUID,
    section_id: Optional[UUID] = None,
    teacher_id: Optional[UUID] = None,
    session_id: Optional[UUID] = None,
) -> list[TimetablePeriod]:
    q = db.query(TimetablePeriod).filter(TimetablePeriod.school_id == school_id)
    if section_id:
        q = q.filter(TimetablePeriod.section_id == section_id)
    if teacher_id:
        q = q.filter(TimetablePeriod.teacher_id == teacher_id)
    if session_id:
        q = q.filter(TimetablePeriod.session_id == session_id)
    return q.order_by(TimetablePeriod.day_of_week, TimetablePeriod.period_number).all()


def create_period(db: Session, school_id: UUID, payload: PeriodCreate, actor_email: str) -> TimetablePeriod:
    # Check teacher conflict: same teacher, same day, same time slot
    if payload.teacher_id and not payload.is_break:
        conflict = (
            db.query(TimetablePeriod)
            .filter(
                TimetablePeriod.school_id == school_id,
                TimetablePeriod.teacher_id == payload.teacher_id,
                TimetablePeriod.session_id == payload.session_id,
                TimetablePeriod.day_of_week == payload.day_of_week,
                TimetablePeriod.is_break == False,
                TimetablePeriod.start_time < payload.end_time,
                TimetablePeriod.end_time > payload.start_time,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=409,
                detail=f"Teacher conflict: already assigned to period {conflict.period_number} on day {conflict.day_of_week}",
            )

    period = TimetablePeriod(school_id=school_id, **payload.model_dump())
    db.add(period)
    db.commit()
    db.refresh(period)
    return period


def update_period(db: Session, school_id: UUID, period_id: UUID, payload: PeriodUpdate) -> TimetablePeriod:
    period = db.query(TimetablePeriod).filter(
        TimetablePeriod.id == period_id, TimetablePeriod.school_id == school_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(period, k, v)
    db.commit()
    db.refresh(period)
    return period


def delete_period(db: Session, school_id: UUID, period_id: UUID) -> None:
    period = db.query(TimetablePeriod).filter(
        TimetablePeriod.id == period_id, TimetablePeriod.school_id == school_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    db.delete(period)
    db.commit()
