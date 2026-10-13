from __future__ import annotations

import math
from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.communication import Event, Homework, Notice
from app.schemas.communication import (
    EventCreate, EventUpdate,
    HomeworkCreate, HomeworkUpdate,
    NoticeCreate, NoticeUpdate,
)


# ── Homework ──────────────────────────────────────────────────────────────────

def list_homework(
    db: Session,
    school_id: UUID,
    class_id: Optional[UUID] = None,
    section_id: Optional[UUID] = None,
    teacher_id: Optional[UUID] = None,
    page: int = 1,
    page_size: int = 25,
) -> dict:
    q = db.query(Homework).filter(
        Homework.school_id == school_id, Homework.deleted_at == None
    )
    if class_id:
        q = q.filter(Homework.class_id == class_id)
    if section_id:
        q = q.filter(Homework.section_id == section_id)
    if teacher_id:
        q = q.filter(Homework.teacher_id == teacher_id)
    total = q.count()
    data = q.order_by(Homework.due_date.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"data": data, "total": total, "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


def create_homework(
    db: Session, school_id: UUID, payload: HomeworkCreate, teacher_id: UUID
) -> Homework:
    hw = Homework(school_id=school_id, teacher_id=teacher_id, **payload.model_dump())
    db.add(hw)
    db.commit()
    db.refresh(hw)
    return hw


def update_homework(
    db: Session, school_id: UUID, hw_id: UUID, payload: HomeworkUpdate, actor_id: UUID
) -> Homework:
    hw = db.query(Homework).filter(
        Homework.id == hw_id, Homework.school_id == school_id, Homework.deleted_at == None
    ).first()
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(hw, k, v)
    db.commit()
    db.refresh(hw)
    return hw


def delete_homework(db: Session, school_id: UUID, hw_id: UUID) -> None:
    from datetime import datetime, timezone
    hw = db.query(Homework).filter(
        Homework.id == hw_id, Homework.school_id == school_id, Homework.deleted_at == None
    ).first()
    if not hw:
        raise HTTPException(status_code=404, detail="Homework not found")
    hw.deleted_at = datetime.now(timezone.utc)
    hw.is_active = False
    db.commit()


# ── Notices ───────────────────────────────────────────────────────────────────

def list_notices(
    db: Session,
    school_id: UUID,
    target_audience: Optional[str] = None,
    status: Optional[str] = "active",
    page: int = 1,
    page_size: int = 25,
) -> dict:
    today = date.today()
    q = db.query(Notice).filter(Notice.school_id == school_id)
    if status == "active":
        q = q.filter(
            Notice.status == "active",
            Notice.publish_date <= today,
        ).filter(
            (Notice.expiry_date == None) | (Notice.expiry_date >= today)
        )
    elif status:
        q = q.filter(Notice.status == status)
    if target_audience:
        q = q.filter(Notice.target_audience == target_audience)
    total = q.count()
    data = q.order_by(Notice.publish_date.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"data": data, "total": total, "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


def create_notice(
    db: Session, school_id: UUID, payload: NoticeCreate, created_by: UUID
) -> Notice:
    notice = Notice(school_id=school_id, created_by=created_by, **payload.model_dump())
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return notice


def update_notice(db: Session, school_id: UUID, notice_id: UUID, payload: NoticeUpdate) -> Notice:
    notice = db.query(Notice).filter(
        Notice.id == notice_id, Notice.school_id == school_id
    ).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(notice, k, v)
    db.commit()
    db.refresh(notice)
    return notice


def delete_notice(db: Session, school_id: UUID, notice_id: UUID) -> None:
    notice = db.query(Notice).filter(
        Notice.id == notice_id, Notice.school_id == school_id
    ).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    notice.status = "archived"
    db.commit()


# ── Events ────────────────────────────────────────────────────────────────────

def list_events(
    db: Session,
    school_id: UUID,
    event_type: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    page: int = 1,
    page_size: int = 50,
) -> dict:
    q = db.query(Event).filter(Event.school_id == school_id)
    if event_type:
        q = q.filter(Event.event_type == event_type)
    if from_date:
        q = q.filter(Event.end_date >= from_date)
    if to_date:
        q = q.filter(Event.start_date <= to_date)
    total = q.count()
    data = q.order_by(Event.start_date).offset((page - 1) * page_size).limit(page_size).all()
    return {"data": data, "total": total, "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


def create_event(
    db: Session, school_id: UUID, payload: EventCreate, created_by: UUID
) -> Event:
    event = Event(school_id=school_id, created_by=created_by, **payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def update_event(db: Session, school_id: UUID, event_id: UUID, payload: EventUpdate) -> Event:
    event = db.query(Event).filter(
        Event.id == event_id, Event.school_id == school_id
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(event, k, v)
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, school_id: UUID, event_id: UUID) -> None:
    event = db.query(Event).filter(
        Event.id == event_id, Event.school_id == school_id
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
