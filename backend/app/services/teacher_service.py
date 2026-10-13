from __future__ import annotations

import math
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.teacher import Staff, Teacher
from app.models.user import Role, User, UserRole
from app.schemas.teacher import StaffCreate, StaffUpdate, TeacherCreate, TeacherUpdate
from app.services.audit_service import log_action


def _next_employee_id(db: Session, school_id: UUID, prefix: str) -> str:
    from app.models.teacher import Teacher as T
    count = db.query(T).filter(T.school_id == school_id).count()
    return f"{prefix}{count + 1:04d}"


# ── Teachers ──────────────────────────────────────────────────────────────────

def list_teachers(
    db: Session,
    school_id: UUID,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 25,
) -> dict:
    q = (
        db.query(Teacher, User)
        .join(User, Teacher.user_id == User.id)
        .filter(Teacher.school_id == school_id, Teacher.deleted_at == None)
    )
    if search:
        q = q.filter(
            or_(
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                Teacher.employee_id.ilike(f"%{search}%"),
            )
        )
    total = q.count()
    rows = q.order_by(User.first_name).offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for teacher, user in rows:
        d = {c.name: getattr(teacher, c.name) for c in teacher.__table__.columns}
        d["first_name"] = user.first_name
        d["last_name"] = user.last_name
        d["email"] = user.email
        d["phone"] = user.phone
        d["photo_url"] = user.photo_url
        result.append(d)

    return {"data": result, "total": total, "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


def get_teacher_or_404(db: Session, school_id: UUID, teacher_id: UUID) -> tuple[Teacher, User]:
    row = (
        db.query(Teacher, User)
        .join(User, Teacher.user_id == User.id)
        .filter(Teacher.id == teacher_id, Teacher.school_id == school_id, Teacher.deleted_at == None)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return row


def create_teacher(db: Session, school_id: UUID, payload: TeacherCreate, actor_email: str) -> dict:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already in use")

    user = User(
        school_id=school_id,
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        user_type="teacher",
    )
    db.add(user)
    db.flush()

    employee_id = payload.employee_id or _next_employee_id(db, school_id, "TCH")
    teacher = Teacher(
        school_id=school_id,
        user_id=user.id,
        employee_id=employee_id,
        designation=payload.designation,
        department=payload.department,
        qualification=payload.qualification,
        experience_years=payload.experience_years,
        joining_date=payload.joining_date,
        salary=payload.salary,
    )
    db.add(teacher)
    db.flush()

    # Assign Teacher role
    role = db.query(Role).filter(Role.school_id == school_id, Role.name == "Teacher").first()
    if role:
        db.add(UserRole(user_id=user.id, role_id=role.id))

    log_action(db, action="teacher_created", actor_email=actor_email,
               school_id=school_id, resource_type="Teacher", resource_id=str(teacher.id))
    db.commit()
    db.refresh(teacher)
    db.refresh(user)

    d = {c.name: getattr(teacher, c.name) for c in teacher.__table__.columns}
    d.update(first_name=user.first_name, last_name=user.last_name,
             email=user.email, phone=user.phone, photo_url=user.photo_url)
    return d


def update_teacher(db: Session, school_id: UUID, teacher_id: UUID,
                   payload: TeacherUpdate, actor_email: str) -> dict:
    teacher, user = get_teacher_or_404(db, school_id, teacher_id)
    for k, v in payload.model_dump(exclude_none=True).items():
        if k in ("first_name", "last_name", "phone"):
            setattr(user, k, v)
        elif hasattr(teacher, k):
            setattr(teacher, k, v)
    db.commit()
    db.refresh(teacher)
    db.refresh(user)
    d = {c.name: getattr(teacher, c.name) for c in teacher.__table__.columns}
    d.update(first_name=user.first_name, last_name=user.last_name,
             email=user.email, phone=user.phone, photo_url=user.photo_url)
    return d


def delete_teacher(db: Session, school_id: UUID, teacher_id: UUID, actor_email: str) -> None:
    from datetime import datetime, timezone
    teacher, user = get_teacher_or_404(db, school_id, teacher_id)
    teacher.deleted_at = datetime.now(timezone.utc)
    teacher.is_active = False
    teacher.status = "inactive"
    user.is_active = False
    db.commit()


# ── Staff ─────────────────────────────────────────────────────────────────────

def list_staff(db: Session, school_id: UUID, search: Optional[str] = None,
               page: int = 1, page_size: int = 25) -> dict:
    q = (
        db.query(Staff, User)
        .join(User, Staff.user_id == User.id)
        .filter(Staff.school_id == school_id, Staff.deleted_at == None)
    )
    if search:
        q = q.filter(
            or_(User.first_name.ilike(f"%{search}%"), User.last_name.ilike(f"%{search}%"))
        )
    total = q.count()
    rows = q.offset((page - 1) * page_size).limit(page_size).all()
    result = []
    for staff, user in rows:
        d = {c.name: getattr(staff, c.name) for c in staff.__table__.columns}
        d.update(first_name=user.first_name, last_name=user.last_name,
                 email=user.email, phone=user.phone)
        result.append(d)
    return {"data": result, "total": total, "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


def create_staff_member(db: Session, school_id: UUID, payload: StaffCreate, actor_email: str) -> dict:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already in use")
    user = User(
        school_id=school_id,
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone=payload.phone,
        user_type="staff",
    )
    db.add(user)
    db.flush()
    employee_id = payload.employee_id or _next_employee_id(db, school_id, "STF")
    staff = Staff(
        school_id=school_id,
        user_id=user.id,
        employee_id=employee_id,
        designation=payload.designation,
        department=payload.department,
        joining_date=payload.joining_date,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    d = {c.name: getattr(staff, c.name) for c in staff.__table__.columns}
    d.update(first_name=user.first_name, last_name=user.last_name,
             email=user.email, phone=user.phone)
    return d
