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
from app.schemas.communication import (
    EventCreate, EventResponse, EventUpdate,
    HomeworkCreate, HomeworkResponse, HomeworkUpdate,
    NoticeCreate, NoticeResponse, NoticeUpdate,
)
from app.services import communication_service

# ── Homework ──────────────────────────────────────────────────────────────────

homework_router = APIRouter(prefix="/homework", tags=["Homework"])


@homework_router.get("", response_model=PaginatedResponse[HomeworkResponse])
def list_homework(
    class_id: Optional[UUID] = Query(None),
    section_id: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.HOMEWORK_VIEW)),
):
    teacher_filter = current_user.user_id if current_user.user_type == "teacher" else None
    result = communication_service.list_homework(
        db, current_user.school_id,
        class_id=class_id, section_id=section_id,
        teacher_id=teacher_filter,
        page=page, page_size=page_size,
    )
    return PaginatedResponse(
        data=[HomeworkResponse.model_validate(h) for h in result["data"]],
        total=result["total"], page=result["page"],
        page_size=result["page_size"], total_pages=result["total_pages"],
    )


@homework_router.post("", response_model=SuccessResponse[HomeworkResponse], status_code=201)
def create_homework(
    payload: HomeworkCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.HOMEWORK_CREATE)),
):
    hw = communication_service.create_homework(
        db, current_user.school_id, payload, current_user.user_id
    )
    return SuccessResponse(data=HomeworkResponse.model_validate(hw), message="Homework created")


@homework_router.patch("/{hw_id}", response_model=SuccessResponse[HomeworkResponse])
def update_homework(
    hw_id: UUID,
    payload: HomeworkUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.HOMEWORK_EDIT)),
):
    hw = communication_service.update_homework(
        db, current_user.school_id, hw_id, payload, current_user.user_id
    )
    return SuccessResponse(data=HomeworkResponse.model_validate(hw))


@homework_router.delete("/{hw_id}", response_model=SuccessResponse[dict])
def delete_homework(
    hw_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.HOMEWORK_EDIT)),
):
    communication_service.delete_homework(db, current_user.school_id, hw_id)
    return SuccessResponse(data={}, message="Homework deleted")


# ── Notices ───────────────────────────────────────────────────────────────────

notices_router = APIRouter(prefix="/notices", tags=["Notices"])


@notices_router.get("", response_model=PaginatedResponse[NoticeResponse])
def list_notices(
    target_audience: Optional[str] = Query(None),
    status: Optional[str] = Query("active"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.NOTICES_VIEW)),
):
    result = communication_service.list_notices(
        db, current_user.school_id,
        target_audience=target_audience, status=status,
        page=page, page_size=page_size,
    )
    return PaginatedResponse(
        data=[NoticeResponse.model_validate(n) for n in result["data"]],
        total=result["total"], page=result["page"],
        page_size=result["page_size"], total_pages=result["total_pages"],
    )


@notices_router.post("", response_model=SuccessResponse[NoticeResponse], status_code=201)
def create_notice(
    payload: NoticeCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.NOTICES_CREATE)),
):
    notice = communication_service.create_notice(
        db, current_user.school_id, payload, current_user.user_id
    )
    return SuccessResponse(data=NoticeResponse.model_validate(notice), message="Notice published")


@notices_router.patch("/{notice_id}", response_model=SuccessResponse[NoticeResponse])
def update_notice(
    notice_id: UUID,
    payload: NoticeUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.NOTICES_CREATE)),
):
    notice = communication_service.update_notice(db, current_user.school_id, notice_id, payload)
    return SuccessResponse(data=NoticeResponse.model_validate(notice))


@notices_router.delete("/{notice_id}", response_model=SuccessResponse[dict])
def delete_notice(
    notice_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.NOTICES_CREATE)),
):
    communication_service.delete_notice(db, current_user.school_id, notice_id)
    return SuccessResponse(data={}, message="Notice archived")


# ── Events ────────────────────────────────────────────────────────────────────

events_router = APIRouter(prefix="/events", tags=["Events"])


@events_router.get("", response_model=PaginatedResponse[EventResponse])
def list_events(
    event_type: Optional[str] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EVENTS_VIEW)),
):
    result = communication_service.list_events(
        db, current_user.school_id,
        event_type=event_type, from_date=from_date, to_date=to_date,
        page=page, page_size=page_size,
    )
    return PaginatedResponse(
        data=[EventResponse.model_validate(e) for e in result["data"]],
        total=result["total"], page=result["page"],
        page_size=result["page_size"], total_pages=result["total_pages"],
    )


@events_router.post("", response_model=SuccessResponse[EventResponse], status_code=201)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EVENTS_CREATE)),
):
    event = communication_service.create_event(
        db, current_user.school_id, payload, current_user.user_id
    )
    return SuccessResponse(data=EventResponse.model_validate(event), message="Event created")


@events_router.patch("/{event_id}", response_model=SuccessResponse[EventResponse])
def update_event(
    event_id: UUID,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EVENTS_CREATE)),
):
    event = communication_service.update_event(db, current_user.school_id, event_id, payload)
    return SuccessResponse(data=EventResponse.model_validate(event))


@events_router.delete("/{event_id}", response_model=SuccessResponse[dict])
def delete_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EVENTS_CREATE)),
):
    communication_service.delete_event(db, current_user.school_id, event_id)
    return SuccessResponse(data={}, message="Event deleted")
