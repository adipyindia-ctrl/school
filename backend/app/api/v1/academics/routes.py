from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Permissions
from app.core.tenant import CurrentUser, get_current_user, require_permission
from app.schemas.academic import (
    ClassCreate, ClassResponse, ClassSubjectCreate, ClassSubjectResponse, ClassUpdate,
    SectionCreate, SectionResponse, SectionUpdate,
    SessionCreate, SessionResponse, SessionUpdate,
    SubjectCreate, SubjectResponse, SubjectUpdate,
)
from app.schemas.common import SuccessResponse
from app.services import academic_service

router = APIRouter(prefix="/academics", tags=["Academics"])


# ── Sessions ──────────────────────────────────────────────────────────────────

@router.get("/sessions", response_model=SuccessResponse[list[SessionResponse]])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_VIEW)),
):
    sessions = academic_service.list_sessions(db, current_user.school_id)
    return SuccessResponse(data=[SessionResponse.model_validate(s) for s in sessions])


@router.post("/sessions", response_model=SuccessResponse[SessionResponse], status_code=201)
def create_session(
    payload: SessionCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_MANAGE)),
):
    s = academic_service.create_session(db, current_user.school_id, payload, current_user.email)
    return SuccessResponse(data=SessionResponse.model_validate(s), message="Session created")


@router.get("/sessions/{session_id}", response_model=SuccessResponse[SessionResponse])
def get_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_VIEW)),
):
    s = academic_service.get_session_or_404(db, current_user.school_id, session_id)
    return SuccessResponse(data=SessionResponse.model_validate(s))


@router.patch("/sessions/{session_id}", response_model=SuccessResponse[SessionResponse])
def update_session(
    session_id: UUID,
    payload: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_MANAGE)),
):
    s = academic_service.update_session(db, current_user.school_id, session_id, payload, current_user.email)
    return SuccessResponse(data=SessionResponse.model_validate(s))


# ── Classes ───────────────────────────────────────────────────────────────────

@router.get("/classes", response_model=SuccessResponse[list[ClassResponse]])
def list_classes(
    session_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_VIEW)),
):
    classes = academic_service.list_classes(db, current_user.school_id, session_id=session_id)
    return SuccessResponse(data=[ClassResponse.model_validate(c) for c in classes])


@router.post("/classes", response_model=SuccessResponse[ClassResponse], status_code=201)
def create_class(
    payload: ClassCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_MANAGE)),
):
    c = academic_service.create_class(db, current_user.school_id, payload, current_user.email)
    return SuccessResponse(data=ClassResponse.model_validate(c), message="Class created")


@router.patch("/classes/{class_id}", response_model=SuccessResponse[ClassResponse])
def update_class(
    class_id: UUID,
    payload: ClassUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_MANAGE)),
):
    c = academic_service.update_class(db, current_user.school_id, class_id, payload, current_user.email)
    return SuccessResponse(data=ClassResponse.model_validate(c))


@router.delete("/classes/{class_id}", response_model=SuccessResponse[dict])
def delete_class(
    class_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_MANAGE)),
):
    academic_service.delete_class(db, current_user.school_id, class_id, current_user.email)
    return SuccessResponse(data={}, message="Class deleted")


# ── Sections ──────────────────────────────────────────────────────────────────

@router.get("/sections", response_model=SuccessResponse[list[SectionResponse]])
def list_sections(
    class_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_VIEW)),
):
    sections = academic_service.list_sections(db, current_user.school_id, class_id=class_id)
    return SuccessResponse(data=[SectionResponse.model_validate(s) for s in sections])


@router.post("/sections", response_model=SuccessResponse[SectionResponse], status_code=201)
def create_section(
    payload: SectionCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_MANAGE)),
):
    s = academic_service.create_section(db, current_user.school_id, payload, current_user.email)
    return SuccessResponse(data=SectionResponse.model_validate(s), message="Section created")


@router.patch("/sections/{section_id}", response_model=SuccessResponse[SectionResponse])
def update_section(
    section_id: UUID,
    payload: SectionUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_MANAGE)),
):
    s = academic_service.update_section(db, current_user.school_id, section_id, payload, current_user.email)
    return SuccessResponse(data=SectionResponse.model_validate(s))


# ── Subjects ──────────────────────────────────────────────────────────────────

@router.get("/subjects", response_model=SuccessResponse[list[SubjectResponse]])
def list_subjects(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_VIEW)),
):
    subjects = academic_service.list_subjects(db, current_user.school_id)
    return SuccessResponse(data=[SubjectResponse.model_validate(s) for s in subjects])


@router.post("/subjects", response_model=SuccessResponse[SubjectResponse], status_code=201)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_MANAGE)),
):
    s = academic_service.create_subject(db, current_user.school_id, payload, current_user.email)
    return SuccessResponse(data=SubjectResponse.model_validate(s), message="Subject created")


@router.patch("/subjects/{subject_id}", response_model=SuccessResponse[SubjectResponse])
def update_subject(
    subject_id: UUID,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_MANAGE)),
):
    s = academic_service.update_subject(db, current_user.school_id, subject_id, payload, current_user.email)
    return SuccessResponse(data=SubjectResponse.model_validate(s))


@router.delete("/subjects/{subject_id}", response_model=SuccessResponse[dict])
def delete_subject(
    subject_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_MANAGE)),
):
    from datetime import datetime, timezone
    s = academic_service.get_subject_or_404(db, current_user.school_id, subject_id)
    s.deleted_at = datetime.now(timezone.utc)
    s.is_active = False
    db.commit()
    return SuccessResponse(data={}, message="Subject deleted")


# ── Class-Subject assignments ─────────────────────────────────────────────────

@router.post("/class-subjects", response_model=SuccessResponse[ClassSubjectResponse], status_code=201)
def assign_subject(
    payload: ClassSubjectCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.ACADEMICS_MANAGE)),
):
    cs = academic_service.assign_class_subject(db, current_user.school_id, payload, current_user.email)
    return SuccessResponse(data=ClassSubjectResponse.model_validate(cs), message="Subject assigned")
