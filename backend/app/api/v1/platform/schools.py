from __future__ import annotations

import math
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenant import CurrentUser, get_super_admin
from app.schemas.auth import ImpersonationResponse, ImpersonatedUserInfo, ImpersonatedSchoolInfo
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.school import OnboardingCreate, SchoolDetailResponse, SchoolResponse, SchoolUpdate
from app.services import school_service
from app.core.security import create_impersonation_token, IMPERSONATION_EXPIRES_MINUTES

router = APIRouter(prefix="/platform/schools", tags=["Platform – Schools"])


class ImpersonateRequest(BaseModel):
    """Optional body for impersonation — defaults to the school's primary school_admin."""
    user_id: Optional[UUID] = None


@router.get("", response_model=PaginatedResponse[SchoolResponse])
def list_schools(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_super_admin),
):
    result = school_service.list_schools(db, search=search, status=status, page=page, page_size=page_size)
    return PaginatedResponse(
        data=[SchoolResponse.model_validate(s) for s in result["data"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
    )


@router.get("/limit", response_model=SuccessResponse[dict])
def get_school_limit(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_super_admin),
):
    """Returns the school creation limit and current usage for the logged-in super admin."""
    from app.models.user import User as UserModel
    from app.models.school import School

    admin_user = db.query(UserModel).filter(UserModel.id == current_user.user_id).first()
    max_allowed = getattr(admin_user, "max_schools", 1) if admin_user else 1
    current_count = db.query(School).filter(School.deleted_at == None).count()
    return SuccessResponse(data={
        "max_schools": max_allowed,
        "current_count": current_count,
        "can_add_more": current_count < max_allowed,
    })


@router.patch("/limit", response_model=SuccessResponse[dict])
def update_school_limit(
    max_schools: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_super_admin),
):
    """Super admin can update their own school creation limit (min 1, max 1000)."""
    from app.models.user import User as UserModel

    if max_schools < 1 or max_schools > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="max_schools must be between 1 and 1000",
        )
    admin_user = db.query(UserModel).filter(UserModel.id == current_user.user_id).first()
    if not admin_user:
        raise HTTPException(status_code=404, detail="User not found")
    admin_user.max_schools = max_schools
    db.commit()
    return SuccessResponse(data={"max_schools": max_schools}, message=f"School limit updated to {max_schools}")


@router.post("", response_model=SuccessResponse[SchoolResponse], status_code=201)
def create_school(
    payload: OnboardingCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_super_admin),
):
    from app.models.user import User as UserModel
    from app.models.school import School

    # Fetch the super admin's own record to read max_schools
    admin_user = db.query(UserModel).filter(UserModel.id == current_user.user_id).first()
    max_allowed = getattr(admin_user, "max_schools", 1) if admin_user else 1

    # Count non-deleted schools
    current_count = db.query(School).filter(School.deleted_at == None).count()
    if current_count >= max_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"School limit reached. You can manage up to {max_allowed} school(s). "
                   f"Update the limit in your profile settings.",
        )

    school = school_service.create_school_onboarding(db, payload, actor_email=current_user.email)
    return SuccessResponse(data=SchoolResponse.model_validate(school), message="School created successfully")


@router.get("/{school_id}", response_model=SuccessResponse[SchoolDetailResponse])
def get_school(
    school_id: UUID,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_super_admin),
):
    school = school_service.get_school_or_404(db, school_id)
    return SuccessResponse(data=SchoolDetailResponse.model_validate(school))


@router.patch("/{school_id}", response_model=SuccessResponse[SchoolResponse])
def update_school(
    school_id: UUID,
    payload: SchoolUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_super_admin),
):
    school = school_service.update_school(db, school_id, payload, actor_email=current_user.email)
    return SuccessResponse(data=SchoolResponse.model_validate(school))


@router.post("/{school_id}/activate", response_model=SuccessResponse[SchoolResponse])
def activate_school(
    school_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_super_admin),
):
    school = school_service.set_school_status(db, school_id, "active", actor_email=current_user.email)
    return SuccessResponse(data=SchoolResponse.model_validate(school), message="School activated")


@router.post("/{school_id}/suspend", response_model=SuccessResponse[SchoolResponse])
def suspend_school(
    school_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_super_admin),
):
    school = school_service.set_school_status(db, school_id, "suspended", actor_email=current_user.email)
    return SuccessResponse(data=SchoolResponse.model_validate(school), message="School suspended")


@router.delete("/{school_id}", response_model=SuccessResponse[dict])
def archive_school(
    school_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_super_admin),
):
    from datetime import datetime, timezone
    school = school_service.get_school_or_404(db, school_id)
    school.status = "archived"
    school.deleted_at = datetime.now(timezone.utc)
    from app.services.audit_service import log_action
    log_action(db, action="school_deleted", actor_email=current_user.email, school_id=school.id,
               resource_type="School", resource_id=str(school.id))
    db.commit()
    return SuccessResponse(data={}, message="School deleted")


@router.patch("/{school_id}/modules/{module_key}", response_model=SuccessResponse[dict])
def toggle_module(
    school_id: UUID,
    module_key: str,
    enabled: bool,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_super_admin),
):
    school_service.toggle_module(db, school_id, module_key, enabled, actor_email=current_user.email)
    return SuccessResponse(data={}, message=f"Module '{module_key}' {'enabled' if enabled else 'disabled'}")


@router.get("/{school_id}/modules", response_model=SuccessResponse[list])
def get_school_modules(
    school_id: UUID,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_super_admin),
):
    """Returns all modules with their enabled/disabled status for a specific school."""
    from app.models.subscription import Module, SchoolModule
    rows = (
        db.query(Module, SchoolModule.is_enabled)
        .outerjoin(
            SchoolModule,
            (SchoolModule.module_id == Module.id) & (SchoolModule.school_id == school_id),
        )
        .order_by(Module.is_core.desc(), Module.key)
        .all()
    )
    return SuccessResponse(data=[
        {
            "key": mod.key,
            "name": mod.name,
            "description": mod.description,
            "is_core": mod.is_core,
            "is_enabled": is_enabled if is_enabled is not None else False,
        }
        for mod, is_enabled in rows
    ])


@router.get("/{school_id}/subscription", response_model=SuccessResponse[dict])
def get_school_subscription(
    school_id: UUID,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_super_admin),
):
    """Returns the most recent subscription record for a school."""
    from app.models.subscription import SchoolSubscription, SubscriptionPlan
    sub = (
        db.query(SchoolSubscription)
        .filter(SchoolSubscription.school_id == school_id)
        .order_by(SchoolSubscription.created_at.desc())
        .first()
    )
    if not sub:
        return SuccessResponse(data={"subscription": None})
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
    return SuccessResponse(data={
        "subscription": {
            "id": str(sub.id),
            "plan_name": plan.name if plan else None,
            "plan_id": str(sub.plan_id),
            "status": sub.status,
            "start_date": sub.start_date.isoformat(),
            "end_date": sub.end_date.isoformat(),
            "amount": float(sub.amount),
            "payment_status": sub.payment_status,
        }
    })


@router.post("/{school_id}/seed-demo", response_model=SuccessResponse[dict])
def seed_demo_data(
    school_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_super_admin),
):
    """
    Super Admin only. Seeds demo data (teachers, students, academic structure)
    into an existing school so it can be used for client demos.
    Idempotent — safe to run multiple times.
    """
    import random
    from datetime import date, timedelta
    from app.core.security import hash_password
    from app.models.user import Role, User, UserRole
    from app.models.academic import AcademicSession, Class, Section, Subject
    from app.models.student import Student
    from app.models.teacher import Teacher
    from app.services.audit_service import log_action

    school = school_service.get_school_or_404(db, school_id)
    results = {}

    # ── Teachers ──────────────────────────────────────────────────────────────
    teacher_role = db.query(Role).filter(Role.school_id == school.id, Role.name == "Teacher").first()
    teachers_data = [
        {"first_name": "Priya",   "last_name": "Sharma"},
        {"first_name": "Amit",    "last_name": "Patel"},
        {"first_name": "Sunita",  "last_name": "Reddy"},
        {"first_name": "Vikram",  "last_name": "Singh"},
        {"first_name": "Meena",   "last_name": "Nair"},
    ]
    teachers_created = 0
    for i, t in enumerate(teachers_data, 1):
        email = f"demo_teacher{i}@{school.slug}.demo"
        if db.query(User).filter(User.email == email).first():
            continue
        user = User(
            school_id=school.id,
            email=email,
            password_hash=hash_password("Teacher@1234"),
            first_name=t["first_name"],
            last_name=t["last_name"],
            user_type="teacher",
        )
        db.add(user)
        db.flush()
        if teacher_role:
            db.add(UserRole(user_id=user.id, role_id=teacher_role.id))
        teachers_created += 1
    db.commit()
    results["teachers_created"] = teachers_created

    # ── Academic Session ──────────────────────────────────────────────────────
    session = db.query(AcademicSession).filter(AcademicSession.school_id == school.id).first()
    if not session:
        session = AcademicSession(
            school_id=school.id,
            name="2025-26",
            start_date=date(2025, 4, 1),
            end_date=date(2026, 3, 31),
            status="active",
            is_current=True,
        )
        db.add(session)
        db.flush()
    results["session"] = session.name

    # ── Classes & Sections ────────────────────────────────────────────────────
    class_names = [f"Class {i}" for i in range(1, 11)]
    classes = {}
    for i, cname in enumerate(class_names):
        cls = db.query(Class).filter(
            Class.school_id == school.id, Class.name == cname, Class.session_id == session.id
        ).first()
        if not cls:
            cls = Class(school_id=school.id, name=cname, display_order=i + 1, session_id=session.id)
            db.add(cls)
            db.flush()
        classes[cname] = cls

    sections = {}
    for cname, cls in classes.items():
        for sec_name in ["A", "B"]:
            sec = db.query(Section).filter(
                Section.school_id == school.id,
                Section.class_id == cls.id,
                Section.name == sec_name,
            ).first()
            if not sec:
                sec = Section(school_id=school.id, class_id=cls.id, name=sec_name, capacity=40)
                db.add(sec)
                db.flush()
            sections[(cname, sec_name)] = sec
    results["classes"] = len(classes)
    results["sections"] = len(sections)

    # ── Subjects ──────────────────────────────────────────────────────────────
    subjects_data = [
        ("Mathematics", "MATH", 100, 35),
        ("Science", "SCI", 100, 35),
        ("English", "ENG", 100, 35),
        ("Hindi", "HIN", 100, 35),
        ("Social Science", "SST", 100, 35),
    ]
    for sname, scode, max_m, pass_m in subjects_data:
        if not db.query(Subject).filter(Subject.school_id == school.id, Subject.code == scode).first():
            db.add(Subject(
                school_id=school.id, name=sname, code=scode,
                subject_type="theory", max_marks=max_m, pass_marks=pass_m,
            ))
    db.commit()
    results["subjects"] = len(subjects_data)

    # ── Teacher records ───────────────────────────────────────────────────────
    teacher_users = db.query(User).filter(
        User.school_id == school.id, User.user_type == "teacher"
    ).all()
    emp_counter = db.query(Teacher).filter(Teacher.school_id == school.id).count() + 1
    for user in teacher_users:
        if not db.query(Teacher).filter(Teacher.user_id == user.id).first():
            db.add(Teacher(
                school_id=school.id, user_id=user.id,
                employee_id=f"EMP{emp_counter:03d}", designation="PGT",
                department="General", joining_date=date(2020, 6, 1), status="active",
            ))
            emp_counter += 1
    db.commit()

    # ── Students ──────────────────────────────────────────────────────────────
    first_names = [
        "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
        "Arnav", "Ishaan", "Kavya", "Ananya", "Pari", "Aadhya", "Diya", "Priya",
        "Nisha", "Riya", "Sneha", "Tanvi", "Shreya", "Anjali", "Megha", "Rohan",
        "Dhruv", "Karan", "Shiv", "Deepa", "Lakshmi", "Pooja",
    ]
    last_names = [
        "Sharma", "Verma", "Patel", "Singh", "Kumar", "Reddy", "Nair",
        "Gupta", "Joshi", "Mehta", "Iyer", "Pillai", "Rao", "Mishra",
    ]
    student_role = db.query(Role).filter(Role.school_id == school.id, Role.name == "Student").first()
    section_list = list(sections.values())
    existing_student_count = db.query(User).filter(
        User.school_id == school.id, User.user_type == "student"
    ).count()
    students_created = 0
    for i in range(1, 51):
        email = f"demo_student{i}@{school.slug}.demo"
        if db.query(User).filter(User.email == email).first():
            continue
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        user = User(
            school_id=school.id,
            email=email,
            password_hash=hash_password("Student@1234"),
            first_name=fname,
            last_name=lname,
            user_type="student",
        )
        db.add(user)
        db.flush()
        if student_role:
            db.add(UserRole(user_id=user.id, role_id=student_role.id))
        adm_num = existing_student_count + students_created + 1
        sec = section_list[adm_num % len(section_list)]
        dob = date(2010, 1, 1) + timedelta(days=random.randint(0, 1825))
        db.add(Student(
            school_id=school.id, session_id=session.id,
            class_id=sec.class_id, section_id=sec.id, user_id=user.id,
            admission_number=f"{school.code}{2025}{adm_num:04d}",
            admission_date=date(2025, 4, 1),
            first_name=fname, last_name=lname,
            date_of_birth=dob,
            gender=random.choice(["male", "female"]),
            status="active",
        ))
        students_created += 1

    db.commit()
    results["students_created"] = students_created

    log_action(
        db, action="demo_data_seeded", actor_email=current_user.email,
        school_id=school.id, resource_type="School", resource_id=str(school.id),
        new_values=results,
    )
    db.commit()

    return SuccessResponse(
        data=results,
        message=f"Demo data seeded: {teachers_created} teachers, {students_created} students, academic structure ready.",
    )


@router.post("/{school_id}/impersonate", response_model=SuccessResponse[dict])
def impersonate_school_admin(
    school_id: UUID,
    request: Request,
    payload: ImpersonateRequest = ImpersonateRequest(),
    db: Session = Depends(get_db),
    super_admin: CurrentUser = Depends(get_super_admin),
):
    """
    Super Admin only. Issues a short-lived (15-min) impersonation access token
    scoped to the target school user. No refresh token is issued.

    - If ``user_id`` is omitted the primary ``school_admin`` of the school is used.
    - The school must be ``active`` or ``trial`` (not suspended / archived / expired).
    - The target user must be active (``is_active=True``).
    - The action is recorded in the AuditLog with ``impersonated_by`` in ``new_values``.
    """
    from app.models.user import User, UserRole, Role, RolePermission, Permission
    from app.services.audit_service import log_action

    school = school_service.get_school_or_404(db, school_id)

    # School must be in an operable state
    if school.status not in ("active", "trial"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cannot impersonate users of a school with status '{school.status}'.",
        )

    # Resolve target user
    if payload.user_id:
        target_user = (
            db.query(User)
            .filter(
                User.id == payload.user_id,
                User.school_id == school_id,
                User.is_active == True,
                User.deleted_at == None,
            )
            .first()
        )
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target user not found, inactive, or does not belong to this school.",
            )
    else:
        # Default: primary school_admin
        target_user = (
            db.query(User)
            .filter(
                User.school_id == school_id,
                User.user_type == "school_admin",
                User.is_active == True,
                User.deleted_at == None,
            )
            .first()
        )
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active school admin found for this school.",
            )

    # Gather the target user's effective permissions
    perm_keys = (
        db.query(Permission.key)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == target_user.id)
        .all()
    )
    permissions = [p.key for p in perm_keys]

    # Issue impersonation token (no refresh token)
    token = create_impersonation_token(
        target_user_id=str(target_user.id),
        target_email=target_user.email,
        target_user_type=target_user.user_type,
        school_id=str(school_id),
        permissions=permissions,
        impersonated_by=str(super_admin.user_id),
    )

    # Audit log
    ip = request.client.host if request.client else None
    log_action(
        db,
        action="impersonation_started",
        actor_id=super_admin.user_id,
        actor_email=super_admin.email,
        school_id=school_id,
        resource_type="User",
        resource_id=str(target_user.id),
        new_values={
            "school_id": str(school_id),
            "impersonated_by": str(super_admin.user_id),
            "target_user_email": target_user.email,
            "target_user_type": target_user.user_type,
        },
        ip_address=ip,
    )
    db.commit()

    return SuccessResponse(
        data={
            "access_token": token,
            "token_type": "bearer",
            "expires_in": IMPERSONATION_EXPIRES_MINUTES * 60,
            "impersonated_user": {
                "id": str(target_user.id),
                "email": target_user.email,
                "name": f"{target_user.first_name} {target_user.last_name}".strip(),
                "role": target_user.user_type,
            },
            "school": {
                "id": str(school.id),
                "name": school.name,
                "slug": school.slug,
            },
        },
        message=f"Impersonating {target_user.email} at {school.name}",
    )
