from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Permissions
from app.core.tenant import CurrentUser, require_permission
from app.schemas.common import SuccessResponse
from app.schemas.timetable import PeriodCreate, PeriodResponse, PeriodUpdate
from app.services import timetable_service

router = APIRouter(prefix="/timetable", tags=["Timetable"])


@router.get("", response_model=SuccessResponse[list[PeriodResponse]])
def list_periods(
    section_id: Optional[UUID] = Query(None),
    teacher_id: Optional[UUID] = Query(None),
    session_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TIMETABLE_VIEW)),
):
    periods = timetable_service.list_periods(
        db, current_user.school_id,
        section_id=section_id, teacher_id=teacher_id, session_id=session_id,
    )
    return SuccessResponse(data=[PeriodResponse.model_validate(p) for p in periods])


@router.post("", response_model=SuccessResponse[PeriodResponse], status_code=201)
def create_period(
    payload: PeriodCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TIMETABLE_MANAGE)),
):
    period = timetable_service.create_period(db, current_user.school_id, payload, current_user.email)
    return SuccessResponse(data=PeriodResponse.model_validate(period), message="Period created")


@router.patch("/{period_id}", response_model=SuccessResponse[PeriodResponse])
def update_period(
    period_id: UUID,
    payload: PeriodUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TIMETABLE_MANAGE)),
):
    period = timetable_service.update_period(db, current_user.school_id, period_id, payload)
    return SuccessResponse(data=PeriodResponse.model_validate(period))


@router.delete("/{period_id}", response_model=SuccessResponse[dict])
def delete_period(
    period_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TIMETABLE_MANAGE)),
):
    timetable_service.delete_period(db, current_user.school_id, period_id)
    return SuccessResponse(data={}, message="Period deleted")
