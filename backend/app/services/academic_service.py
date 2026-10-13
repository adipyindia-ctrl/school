from __future__ import annotations

import math
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.academic import AcademicSession, Class, ClassSubject, Section, Subject
from app.schemas.academic import (
    ClassCreate, ClassUpdate,
    ClassSubjectCreate,
    SectionCreate, SectionUpdate,
    SessionCreate, SessionUpdate,
    SubjectCreate, SubjectUpdate,
)
from app.services.audit_service import log_action


# ── Academic Session ──────────────────────────────────────────────────────────

def list_sessions(db: Session, school_id: UUID) -> list[AcademicSession]:
    return (
        db.query(AcademicSession)
        .filter(AcademicSession.school_id == school_id)
        .order_by(AcademicSession.start_date.desc())
        .all()
    )


def get_session_or_404(db: Session, school_id: UUID, session_id: UUID) -> AcademicSession:
    s = db.query(AcademicSession).filter(
        AcademicSession.id == session_id,
        AcademicSession.school_id == school_id,
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Academic session not found")
    return s


def create_session(db: Session, school_id: UUID, payload: SessionCreate, actor_email: str) -> AcademicSession:
    if db.query(AcademicSession).filter(
        AcademicSession.school_id == school_id,
        AcademicSession.name == payload.name,
    ).first():
        raise HTTPException(status_code=400, detail="Session name already exists")

    session = AcademicSession(school_id=school_id, **payload.model_dump())
    db.add(session)

    # If setting to active, deactivate all others
    if payload.status == "active":
        db.query(AcademicSession).filter(
            AcademicSession.school_id == school_id,
            AcademicSession.id != session.id,
        ).update({"is_current": False, "status": "inactive"})
        session.is_current = True

    log_action(db, action="session_created", actor_email=actor_email,
               school_id=school_id, resource_type="AcademicSession")
    db.commit()
    db.refresh(session)
    return session


def update_session(db: Session, school_id: UUID, session_id: UUID,
                   payload: SessionUpdate, actor_email: str) -> AcademicSession:
    s = get_session_or_404(db, school_id, session_id)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(s, k, v)
    if payload.status == "active":
        db.query(AcademicSession).filter(
            AcademicSession.school_id == school_id,
            AcademicSession.id != session_id,
        ).update({"is_current": False, "status": "inactive"})
        s.is_current = True
    db.commit()
    db.refresh(s)
    return s


# ── Classes ───────────────────────────────────────────────────────────────────

def list_classes(db: Session, school_id: UUID, session_id: Optional[UUID] = None) -> list[Class]:
    q = db.query(Class).filter(Class.school_id == school_id, Class.deleted_at == None)
    if session_id:
        q = q.filter(Class.session_id == session_id)
    return q.order_by(Class.display_order).all()


def get_class_or_404(db: Session, school_id: UUID, class_id: UUID) -> Class:
    c = db.query(Class).filter(
        Class.id == class_id, Class.school_id == school_id, Class.deleted_at == None
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Class not found")
    return c


def create_class(db: Session, school_id: UUID, payload: ClassCreate, actor_email: str) -> Class:
    # Validate session belongs to school
    get_session_or_404(db, school_id, payload.session_id)
    if db.query(Class).filter(
        Class.school_id == school_id,
        Class.session_id == payload.session_id,
        Class.name == payload.name,
        Class.deleted_at == None,
    ).first():
        raise HTTPException(status_code=400, detail="Class name already exists in this session")
    c = Class(school_id=school_id, **payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def update_class(db: Session, school_id: UUID, class_id: UUID,
                 payload: ClassUpdate, actor_email: str) -> Class:
    c = get_class_or_404(db, school_id, class_id)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


def delete_class(db: Session, school_id: UUID, class_id: UUID, actor_email: str) -> None:
    c = get_class_or_404(db, school_id, class_id)
    # Block deletion if students enrolled
    from app.models.student import Student
    student_count = db.query(func.count(Student.id)).filter(
        Student.class_id == class_id, Student.deleted_at == None
    ).scalar()
    if student_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete class: {student_count} student(s) enrolled",
        )
    from datetime import datetime, timezone
    c.deleted_at = datetime.now(timezone.utc)
    c.is_active = False
    db.commit()


# ── Sections ──────────────────────────────────────────────────────────────────

def list_sections(db: Session, school_id: UUID, class_id: Optional[UUID] = None) -> list[Section]:
    q = db.query(Section).filter(Section.school_id == school_id, Section.deleted_at == None)
    if class_id:
        q = q.filter(Section.class_id == class_id)
    return q.order_by(Section.name).all()


def get_section_or_404(db: Session, school_id: UUID, section_id: UUID) -> Section:
    s = db.query(Section).filter(
        Section.id == section_id, Section.school_id == school_id, Section.deleted_at == None
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Section not found")
    return s


def create_section(db: Session, school_id: UUID, payload: SectionCreate, actor_email: str) -> Section:
    get_class_or_404(db, school_id, payload.class_id)
    if db.query(Section).filter(
        Section.school_id == school_id,
        Section.class_id == payload.class_id,
        Section.name == payload.name,
        Section.deleted_at == None,
    ).first():
        raise HTTPException(status_code=400, detail="Section name already exists in this class")
    s = Section(school_id=school_id, **payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def update_section(db: Session, school_id: UUID, section_id: UUID,
                   payload: SectionUpdate, actor_email: str) -> Section:
    s = get_section_or_404(db, school_id, section_id)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


# ── Subjects ──────────────────────────────────────────────────────────────────

def list_subjects(db: Session, school_id: UUID) -> list[Subject]:
    return (
        db.query(Subject)
        .filter(Subject.school_id == school_id, Subject.deleted_at == None)
        .order_by(Subject.name)
        .all()
    )


def get_subject_or_404(db: Session, school_id: UUID, subject_id: UUID) -> Subject:
    s = db.query(Subject).filter(
        Subject.id == subject_id, Subject.school_id == school_id, Subject.deleted_at == None
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Subject not found")
    return s


def create_subject(db: Session, school_id: UUID, payload: SubjectCreate, actor_email: str) -> Subject:
    if db.query(Subject).filter(
        Subject.school_id == school_id, Subject.code == payload.code, Subject.deleted_at == None
    ).first():
        raise HTTPException(status_code=400, detail="Subject code already exists")
    s = Subject(school_id=school_id, **payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def update_subject(db: Session, school_id: UUID, subject_id: UUID,
                   payload: SubjectUpdate, actor_email: str) -> Subject:
    s = get_subject_or_404(db, school_id, subject_id)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


def assign_class_subject(db: Session, school_id: UUID,
                         payload: ClassSubjectCreate, actor_email: str) -> ClassSubject:
    existing = db.query(ClassSubject).filter(
        ClassSubject.class_id == payload.class_id,
        ClassSubject.subject_id == payload.subject_id,
        ClassSubject.session_id == payload.session_id,
    ).first()
    if existing:
        return existing
    cs = ClassSubject(school_id=school_id, **payload.model_dump())
    db.add(cs)
    db.commit()
    db.refresh(cs)
    return cs
