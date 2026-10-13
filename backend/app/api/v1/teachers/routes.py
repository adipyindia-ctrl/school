from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Permissions
from app.core.tenant import CurrentUser, require_permission
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.teacher import (
    StaffCreate, StaffResponse, StaffUpdate,
    TeacherCreate, TeacherResponse, TeacherUpdate,
)
from app.services import teacher_service

router = APIRouter(prefix="/teachers", tags=["Teachers"])


@router.get("", response_model=PaginatedResponse[TeacherResponse])
def list_teachers(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TEACHERS_VIEW)),
):
    result = teacher_service.list_teachers(
        db, current_user.school_id, search=search, page=page, page_size=page_size
    )
    return PaginatedResponse(
        data=[TeacherResponse.model_validate(r) for r in result["data"]],
        total=result["total"], page=result["page"],
        page_size=result["page_size"], total_pages=result["total_pages"],
    )


@router.post("", response_model=SuccessResponse[TeacherResponse], status_code=201)
def create_teacher(
    payload: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TEACHERS_CREATE)),
):
    from app.services.subscription_service import check_teacher_limit
    check_teacher_limit(db, current_user.school_id)
    d = teacher_service.create_teacher(db, current_user.school_id, payload, current_user.email)
    return SuccessResponse(data=TeacherResponse.model_validate(d), message="Teacher created")


@router.get("/{teacher_id}", response_model=SuccessResponse[TeacherResponse])
def get_teacher(
    teacher_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TEACHERS_VIEW)),
):
    teacher, user = teacher_service.get_teacher_or_404(db, current_user.school_id, teacher_id)
    from app.models.teacher import Teacher
    d = {c.name: getattr(teacher, c.name) for c in Teacher.__table__.columns}
    d.update(first_name=user.first_name, last_name=user.last_name,
             email=user.email, phone=user.phone, photo_url=user.photo_url)
    return SuccessResponse(data=TeacherResponse.model_validate(d))


@router.patch("/{teacher_id}", response_model=SuccessResponse[TeacherResponse])
def update_teacher(
    teacher_id: UUID,
    payload: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TEACHERS_EDIT)),
):
    d = teacher_service.update_teacher(db, current_user.school_id, teacher_id, payload, current_user.email)
    return SuccessResponse(data=TeacherResponse.model_validate(d))


@router.delete("/{teacher_id}", response_model=SuccessResponse[dict])
def delete_teacher(
    teacher_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TEACHERS_DELETE)),
):
    teacher_service.delete_teacher(db, current_user.school_id, teacher_id, current_user.email)
    return SuccessResponse(data={}, message="Teacher deactivated")


# ── Staff ─────────────────────────────────────────────────────────────────────

staff_router = APIRouter(prefix="/staff", tags=["Staff"])


@staff_router.get("", response_model=PaginatedResponse[StaffResponse])
def list_staff(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.STAFF_VIEW)),
):
    result = teacher_service.list_staff(
        db, current_user.school_id, search=search, page=page, page_size=page_size
    )
    return PaginatedResponse(
        data=[StaffResponse.model_validate(r) for r in result["data"]],
        total=result["total"], page=result["page"],
        page_size=result["page_size"], total_pages=result["total_pages"],
    )


@staff_router.post("", response_model=SuccessResponse[StaffResponse], status_code=201)
def create_staff(
    payload: StaffCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.STAFF_CREATE)),
):
    d = teacher_service.create_staff_member(db, current_user.school_id, payload, current_user.email)
    return SuccessResponse(data=StaffResponse.model_validate(d), message="Staff member created")
