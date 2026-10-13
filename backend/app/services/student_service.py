from __future__ import annotations

import math
import random
import string
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.student import Parent, Student, StudentParent
from app.models.user import Role, User, UserRole
from app.schemas.student import ParentCreate, ParentUpdate, StudentCreate, StudentUpdate
from app.services.audit_service import log_action


def _generate_admission_number(db: Session, school_id: UUID) -> str:
    year = __import__("datetime").date.today().year
    prefix = f"ADM{year}"
    last = (
        db.query(Student)
        .filter(Student.school_id == school_id, Student.admission_number.like(f"{prefix}%"))
        .order_by(Student.created_at.desc())
        .first()
    )
    seq = 1
    if last:
        try:
            seq = int(last.admission_number.replace(prefix, "")) + 1
        except ValueError:
            seq = 1
    return f"{prefix}{seq:04d}"


def list_students(
    db: Session,
    school_id: UUID,
    *,
    session_id: Optional[UUID] = None,
    class_id: Optional[UUID] = None,
    section_id: Optional[UUID] = None,
    gender: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 25,
) -> dict:
    q = db.query(Student).filter(Student.school_id == school_id, Student.deleted_at == None)
    if session_id:
        q = q.filter(Student.session_id == session_id)
    if class_id:
        q = q.filter(Student.class_id == class_id)
    if section_id:
        q = q.filter(Student.section_id == section_id)
    if gender:
        q = q.filter(Student.gender == gender)
    if status:
        q = q.filter(Student.status == status)
    if search:
        q = q.filter(
            or_(
                Student.first_name.ilike(f"%{search}%"),
                Student.last_name.ilike(f"%{search}%"),
                Student.admission_number.ilike(f"%{search}%"),
            )
        )
    total = q.count()
    students = q.order_by(Student.first_name).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "data": students,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


def get_student_or_404(db: Session, school_id: UUID, student_id: UUID) -> Student:
    s = db.query(Student).filter(
        Student.id == student_id, Student.school_id == school_id, Student.deleted_at == None
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    return s


def create_student(db: Session, school_id: UUID, payload: StudentCreate, actor_email: str) -> Student:
    admission_number = payload.admission_number or _generate_admission_number(db, school_id)
    if db.query(Student).filter(
        Student.school_id == school_id, Student.admission_number == admission_number
    ).first():
        raise HTTPException(status_code=400, detail="Admission number already exists")

    data = payload.model_dump()
    data["admission_number"] = admission_number
    student = Student(school_id=school_id, **data)
    db.add(student)
    db.flush()

    log_action(db, action="student_created", actor_email=actor_email,
               school_id=school_id, resource_type="Student", resource_id=str(student.id))
    db.commit()
    db.refresh(student)
    return student


def update_student(db: Session, school_id: UUID, student_id: UUID,
                   payload: StudentUpdate, actor_email: str) -> Student:
    student = get_student_or_404(db, school_id, student_id)
    old = {k: getattr(student, k) for k in payload.model_dump(exclude_none=True)}
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(student, k, v)
    log_action(db, action="student_updated", actor_email=actor_email,
               school_id=school_id, resource_type="Student", resource_id=str(student_id),
               old_values=old, new_values=payload.model_dump(exclude_none=True))
    db.commit()
    db.refresh(student)
    return student


def delete_student(db: Session, school_id: UUID, student_id: UUID, actor_email: str) -> None:
    from datetime import datetime, timezone
    student = get_student_or_404(db, school_id, student_id)
    student.deleted_at = datetime.now(timezone.utc)
    student.is_active = False
    student.status = "inactive"
    log_action(db, action="student_deleted", actor_email=actor_email,
               school_id=school_id, resource_type="Student", resource_id=str(student_id))
    db.commit()


# ── Parents ───────────────────────────────────────────────────────────────────

def list_parents(db: Session, school_id: UUID, search: Optional[str] = None,
                 page: int = 1, page_size: int = 25) -> dict:
    q = db.query(Parent).filter(Parent.school_id == school_id, Parent.deleted_at == None)
    if search:
        q = q.filter(
            or_(
                Parent.first_name.ilike(f"%{search}%"),
                Parent.last_name.ilike(f"%{search}%"),
                Parent.phone.ilike(f"%{search}%"),
            )
        )
    total = q.count()
    data = q.order_by(Parent.first_name).offset((page - 1) * page_size).limit(page_size).all()
    return {"data": data, "total": total, "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


def get_parent_or_404(db: Session, school_id: UUID, parent_id: UUID) -> Parent:
    p = db.query(Parent).filter(
        Parent.id == parent_id, Parent.school_id == school_id, Parent.deleted_at == None
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Parent not found")
    return p


def create_parent(db: Session, school_id: UUID, payload: ParentCreate, actor_email: str) -> Parent:
    data = payload.model_dump(exclude={"student_ids"})
    parent = Parent(school_id=school_id, **data)
    db.add(parent)
    db.flush()

    for sid in payload.student_ids:
        student = db.query(Student).filter(
            Student.id == sid, Student.school_id == school_id
        ).first()
        if student:
            # Avoid duplicate links
            existing = db.query(StudentParent).filter(
                StudentParent.student_id == student.id,
                StudentParent.parent_id == parent.id,
            ).first()
            if not existing:
                db.add(StudentParent(student_id=student.id, parent_id=parent.id))

    log_action(db, action="parent_created", actor_email=actor_email,
               school_id=school_id, resource_type="Parent", resource_id=str(parent.id))
    db.commit()
    db.refresh(parent)
    return parent


def update_parent(db: Session, school_id: UUID, parent_id: UUID,
                  payload: ParentUpdate, actor_email: str) -> Parent:
    parent = get_parent_or_404(db, school_id, parent_id)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(parent, k, v)
    log_action(db, action="parent_updated", actor_email=actor_email,
               school_id=school_id, resource_type="Parent", resource_id=str(parent_id))
    db.commit()
    db.refresh(parent)
    return parent


def delete_parent(db: Session, school_id: UUID, parent_id: UUID, actor_email: str) -> None:
    from datetime import datetime, timezone
    parent = get_parent_or_404(db, school_id, parent_id)
    parent.deleted_at = datetime.now(timezone.utc)
    parent.is_active = False
    log_action(db, action="parent_deleted", actor_email=actor_email,
               school_id=school_id, resource_type="Parent", resource_id=str(parent_id))
    db.commit()


def link_student_to_parent(
    db: Session, school_id: UUID, parent_id: UUID, student_id: UUID,
    is_primary: bool, actor_email: str
) -> StudentParent:
    parent = get_parent_or_404(db, school_id, parent_id)
    student = get_student_or_404(db, school_id, student_id)

    link = db.query(StudentParent).filter(
        StudentParent.parent_id == parent_id,
        StudentParent.student_id == student_id,
    ).first()

    if link:
        link.is_primary = is_primary
    else:
        link = StudentParent(parent_id=parent_id, student_id=student_id, is_primary=is_primary)
        db.add(link)

    log_action(db, action="student_parent_linked", actor_email=actor_email,
               school_id=school_id, resource_type="StudentParent",
               resource_id=f"{student_id}/{parent_id}")
    db.commit()
    db.refresh(link)
    return link


def unlink_student_from_parent(
    db: Session, school_id: UUID, parent_id: UUID, student_id: UUID, actor_email: str
) -> None:
    get_parent_or_404(db, school_id, parent_id)
    get_student_or_404(db, school_id, student_id)

    link = db.query(StudentParent).filter(
        StudentParent.parent_id == parent_id,
        StudentParent.student_id == student_id,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    db.delete(link)
    log_action(db, action="student_parent_unlinked", actor_email=actor_email,
               school_id=school_id, resource_type="StudentParent",
               resource_id=f"{student_id}/{parent_id}")
    db.commit()


def get_student_parents(db: Session, school_id: UUID, student_id: UUID) -> list:
    """Returns list of (Parent, is_primary) tuples for a student."""
    student = get_student_or_404(db, school_id, student_id)
    rows = (
        db.query(Parent, StudentParent.is_primary)
        .join(StudentParent, StudentParent.parent_id == Parent.id)
        .filter(
            StudentParent.student_id == student_id,
            Parent.school_id == school_id,
            Parent.deleted_at == None,
        )
        .all()
    )
    return rows


def build_parent_response(db: Session, parent: Parent):
    """Build ParentResponse including linked students with is_primary flag."""
    from app.schemas.student import LinkedStudentInfo, ParentResponse
    rows = (
        db.query(Student, StudentParent.is_primary)
        .join(StudentParent, StudentParent.student_id == Student.id)
        .filter(
            StudentParent.parent_id == parent.id,
            Student.deleted_at == None,
        )
        .all()
    )
    students = [
        LinkedStudentInfo(
            id=s.id,
            first_name=s.first_name,
            last_name=s.last_name,
            admission_number=s.admission_number,
            class_id=s.class_id,
            section_id=s.section_id,
            is_primary=is_primary,
        )
        for s, is_primary in rows
    ]
    resp = ParentResponse.model_validate(parent)
    resp.students = students
    return resp
