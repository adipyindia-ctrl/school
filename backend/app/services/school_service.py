from __future__ import annotations

import math
from datetime import date, timedelta
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.permissions import Modules, Permissions
from app.core.security import hash_password
from app.models.school import School, SchoolBranding, SchoolSettings
from app.models.subscription import (
    Module,
    SchoolModule,
    SchoolSubscription,
    SubscriptionPlan,
)
from app.models.user import Permission, Role, RolePermission, User, UserRole
from app.schemas.school import (
    BrandingUpdate,
    OnboardingCreate,
    SchoolCreate,
    SchoolUpdate,
    SettingsUpdate,
)
from app.services.audit_service import log_action


# ── Default roles ─────────────────────────────────────────────────────────────

_DEFAULT_ROLES: dict[str, list[str]] = {
    "School Admin": [
        Permissions.SETTINGS_MANAGE, Permissions.SETTINGS_BRANDING,
        Permissions.USERS_VIEW, Permissions.USERS_CREATE, Permissions.USERS_EDIT, Permissions.USERS_DELETE,
        Permissions.ROLES_MANAGE,
        Permissions.STUDENTS_VIEW, Permissions.STUDENTS_CREATE, Permissions.STUDENTS_EDIT,
        Permissions.STUDENTS_DELETE, Permissions.STUDENTS_IMPORT, Permissions.STUDENTS_EXPORT,
        Permissions.TEACHERS_VIEW, Permissions.TEACHERS_CREATE, Permissions.TEACHERS_EDIT, Permissions.TEACHERS_DELETE,
        Permissions.PARENTS_VIEW, Permissions.PARENTS_CREATE, Permissions.PARENTS_EDIT,
        Permissions.STAFF_VIEW, Permissions.STAFF_CREATE, Permissions.STAFF_EDIT, Permissions.STAFF_DELETE,
        Permissions.ACADEMICS_VIEW, Permissions.ACADEMICS_MANAGE,
        Permissions.ATTENDANCE_VIEW, Permissions.ATTENDANCE_CREATE, Permissions.ATTENDANCE_EDIT, Permissions.ATTENDANCE_REPORT,
        Permissions.TIMETABLE_VIEW, Permissions.TIMETABLE_MANAGE,
        Permissions.HOMEWORK_VIEW, Permissions.HOMEWORK_CREATE, Permissions.HOMEWORK_EDIT,
        Permissions.EXAMS_VIEW, Permissions.EXAMS_MANAGE, Permissions.MARKS_CREATE, Permissions.MARKS_EDIT, Permissions.RESULTS_VIEW,
        Permissions.FEES_VIEW, Permissions.FEES_CREATE, Permissions.FEES_EDIT, Permissions.FEES_COLLECT, Permissions.FEES_REPORT,
        Permissions.CRM_VIEW, Permissions.CRM_CREATE, Permissions.CRM_EDIT, Permissions.CRM_MANAGE,
        Permissions.TRANSPORT_VIEW, Permissions.TRANSPORT_MANAGE,
        Permissions.LIBRARY_VIEW, Permissions.LIBRARY_ISSUE, Permissions.LIBRARY_RETURN, Permissions.LIBRARY_MANAGE,
        Permissions.NOTICES_VIEW, Permissions.NOTICES_CREATE,
        Permissions.EVENTS_VIEW, Permissions.EVENTS_CREATE,
        Permissions.REPORTS_VIEW, Permissions.REPORTS_EXPORT,
        Permissions.WEBSITE_VIEW, Permissions.WEBSITE_MANAGE,
        Permissions.AUDIT_VIEW,
    ],
    "Teacher": [
        Permissions.STUDENTS_VIEW,
        Permissions.ATTENDANCE_VIEW, Permissions.ATTENDANCE_CREATE, Permissions.ATTENDANCE_EDIT,
        Permissions.TIMETABLE_VIEW,
        Permissions.HOMEWORK_VIEW, Permissions.HOMEWORK_CREATE, Permissions.HOMEWORK_EDIT,
        Permissions.EXAMS_VIEW, Permissions.MARKS_CREATE, Permissions.MARKS_EDIT, Permissions.RESULTS_VIEW,
        Permissions.NOTICES_VIEW, Permissions.EVENTS_VIEW,
    ],
    "Student": [
        Permissions.ATTENDANCE_VIEW,
        Permissions.HOMEWORK_VIEW,
        Permissions.TIMETABLE_VIEW,
        Permissions.RESULTS_VIEW,
        Permissions.FEES_VIEW,
        Permissions.NOTICES_VIEW, Permissions.EVENTS_VIEW,
    ],
    "Parent": [
        Permissions.ATTENDANCE_VIEW,
        Permissions.HOMEWORK_VIEW,
        Permissions.TIMETABLE_VIEW,
        Permissions.RESULTS_VIEW,
        Permissions.FEES_VIEW,
        Permissions.NOTICES_VIEW, Permissions.EVENTS_VIEW,
    ],
    "Accountant": [
        Permissions.STUDENTS_VIEW,
        Permissions.FEES_VIEW, Permissions.FEES_CREATE, Permissions.FEES_EDIT,
        Permissions.FEES_COLLECT, Permissions.FEES_REPORT,
        Permissions.REPORTS_VIEW, Permissions.REPORTS_EXPORT,
    ],
    "Librarian": [
        Permissions.STUDENTS_VIEW,
        Permissions.LIBRARY_VIEW, Permissions.LIBRARY_ISSUE, Permissions.LIBRARY_RETURN, Permissions.LIBRARY_MANAGE,
    ],
}


def _seed_roles_for_school(db: Session, school_id: UUID) -> None:
    all_perms = {p.key: p for p in db.query(Permission).all()}
    for role_name, perm_keys in _DEFAULT_ROLES.items():
        role = Role(
            school_id=school_id,
            name=role_name,
            is_system=True,
        )
        db.add(role)
        db.flush()
        for key in perm_keys:
            perm = all_perms.get(key)
            if perm:
                db.add(RolePermission(role_id=role.id, permission_id=perm.id))


def _seed_modules_for_school(
    db: Session, school_id: UUID, enabled_keys: list[str]
) -> None:
    all_modules = db.query(Module).all()
    for mod in all_modules:
        db.add(
            SchoolModule(
                school_id=school_id,
                module_id=mod.id,
                is_enabled=mod.is_core or mod.key in enabled_keys,
            )
        )


# ── Public API ────────────────────────────────────────────────────────────────

def create_school_onboarding(
    db: Session,
    payload: OnboardingCreate,
    actor_email: str = "super_admin",
) -> School:
    """Atomic school creation: school + branding + settings + admin user + roles + modules."""

    # Check unique slug / code
    if db.query(School).filter(School.slug == payload.school.slug).first():
        raise HTTPException(status_code=400, detail="School slug already exists")
    if db.query(School).filter(School.code == payload.school.code).first():
        raise HTTPException(status_code=400, detail="School code already exists")
    if db.query(User).filter(User.email == payload.admin.email).first():
        raise HTTPException(status_code=400, detail="Admin email already in use")

    try:
        # 1. Create school
        school = School(
            name=payload.school.name,
            code=payload.school.code,
            slug=payload.school.slug,
            school_type=payload.school.school_type,
            established_year=payload.school.established_year,
            phone=payload.school.phone,
            email=payload.school.email,
            website=payload.school.website,
            address=payload.school.address,
            city=payload.school.city,
            state=payload.school.state,
            country=payload.school.country,
            pincode=payload.school.pincode,
            status="trial",
        )
        db.add(school)
        db.flush()

        # 2. Branding
        branding_data = payload.branding or BrandingUpdate()
        db.add(SchoolBranding(school_id=school.id, **branding_data.model_dump(exclude_none=True)))

        # 3. Settings
        db.add(SchoolSettings(school_id=school.id))

        # 4. Admin user
        admin_user = User(
            school_id=school.id,
            email=payload.admin.email,
            password_hash=hash_password(payload.admin.password),
            first_name=payload.admin.first_name,
            last_name=payload.admin.last_name,
            phone=payload.admin.phone,
            user_type="school_admin",
        )
        db.add(admin_user)
        db.flush()

        # 5. Default roles + assign school admin role
        _seed_roles_for_school(db, school.id)
        db.flush()

        admin_role = db.query(Role).filter(
            Role.school_id == school.id, Role.name == "School Admin"
        ).first()
        if admin_role:
            db.add(UserRole(user_id=admin_user.id, role_id=admin_role.id))

        # 6. Modules — merge plan's module list with any explicitly chosen modules
        effective_modules = list(payload.enabled_modules)
        if payload.plan_id:
            # Get all module keys assigned to the selected plan
            from app.models.subscription import PlanModule as PlanModuleModel
            plan_module_rows = (
                db.query(Module.key)
                .join(PlanModuleModel, PlanModuleModel.module_id == Module.id)
                .filter(PlanModuleModel.plan_id == payload.plan_id)
                .all()
            )
            if plan_module_rows:
                plan_keys = [row.key for row in plan_module_rows]
                # Merge: plan modules + any explicitly selected modules
                effective_modules = list(set(plan_keys + effective_modules))

        _seed_modules_for_school(db, school.id, effective_modules)

        # 7. Subscription (trial if no plan given)
        if payload.plan_id:
            plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == payload.plan_id).first()
            if plan:
                db.add(SchoolSubscription(
                    school_id=school.id,
                    plan_id=plan.id,
                    start_date=date.today(),
                    end_date=date.today() + timedelta(days=plan.trial_days or 30),
                    status="trial",
                    amount=plan.price,
                    payment_status="pending",
                ))

        log_action(
            db,
            action="school_created",
            actor_email=actor_email,
            school_id=school.id,
            resource_type="School",
            resource_id=str(school.id),
            new_values={"name": school.name, "slug": school.slug},
        )

        db.commit()
        db.refresh(school)
        return school

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"School creation failed: {str(e)}")


def list_schools(
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 25,
) -> dict:
    query = db.query(School).filter(School.deleted_at == None)
    if search:
        query = query.filter(
            School.name.ilike(f"%{search}%") | School.slug.ilike(f"%{search}%")
        )
    if status:
        query = query.filter(School.status == status)
    total = query.count()
    schools = query.order_by(School.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "data": schools,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


def get_school_or_404(db: Session, school_id: UUID) -> School:
    school = db.query(School).filter(School.id == school_id, School.deleted_at == None).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school


def get_school_by_slug(db: Session, slug: str) -> Optional[School]:
    return db.query(School).filter(School.slug == slug, School.deleted_at == None).first()


def get_school_by_custom_domain(db: Session, domain: str) -> Optional[School]:
    return db.query(School).filter(
        School.custom_domain == domain.lower(),
        School.deleted_at == None
    ).first()


def update_school(db: Session, school_id: UUID, payload: SchoolUpdate, actor_email: str) -> School:
    school = get_school_or_404(db, school_id)
    old = {k: getattr(school, k) for k in payload.model_dump(exclude_none=True)}
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(school, k, v)
    log_action(db, action="school_updated", actor_email=actor_email, school_id=school.id,
               resource_type="School", resource_id=str(school.id), old_values=old,
               new_values=payload.model_dump(exclude_none=True))
    db.commit()
    db.refresh(school)
    return school


def set_school_status(db: Session, school_id: UUID, new_status: str, actor_email: str) -> School:
    school = get_school_or_404(db, school_id)
    old_status = school.status
    school.status = new_status
    log_action(db, action=f"school_{new_status}", actor_email=actor_email, school_id=school.id,
               resource_type="School", resource_id=str(school.id),
               old_values={"status": old_status}, new_values={"status": new_status})
    db.commit()
    db.refresh(school)
    return school


def update_branding(db: Session, school_id: UUID, payload: BrandingUpdate, actor_email: str) -> SchoolBranding:
    school = get_school_or_404(db, school_id)
    branding = school.branding
    if not branding:
        branding = SchoolBranding(school_id=school_id)
        db.add(branding)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(branding, k, v)
    log_action(db, action="branding_updated", actor_email=actor_email, school_id=school_id,
               resource_type="SchoolBranding", resource_id=str(branding.id) if branding.id else None)
    db.commit()
    db.refresh(branding)
    return branding


def update_settings(db: Session, school_id: UUID, payload: SettingsUpdate, actor_email: str) -> SchoolSettings:
    school = get_school_or_404(db, school_id)
    s = school.settings
    if not s:
        s = SchoolSettings(school_id=school_id)
        db.add(s)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


def toggle_module(db: Session, school_id: UUID, module_key: str, enabled: bool, actor_email: str) -> SchoolModule:
    from datetime import datetime, timezone
    school = get_school_or_404(db, school_id)
    mod = db.query(Module).filter(Module.key == module_key).first()
    if not mod:
        raise HTTPException(status_code=404, detail=f"Module '{module_key}' not found")
    if mod.is_core and not enabled:
        raise HTTPException(status_code=400, detail="Core modules cannot be disabled")
    sm = (
        db.query(SchoolModule)
        .filter(SchoolModule.school_id == school_id, SchoolModule.module_id == mod.id)
        .first()
    )
    if not sm:
        sm = SchoolModule(school_id=school_id, module_id=mod.id)
        db.add(sm)
    sm.is_enabled = enabled
    if enabled:
        sm.enabled_at = datetime.now(timezone.utc)
    log_action(db, action="module_toggled", actor_email=actor_email, school_id=school_id,
               resource_type="SchoolModule", description=f"{module_key} {'enabled' if enabled else 'disabled'}")
    db.commit()
    db.refresh(sm)
    return sm


def get_platform_stats(db: Session) -> dict:
    from app.models.user import User
    from sqlalchemy import case, cast, Float

    total_schools = db.query(func.count(School.id)).filter(School.deleted_at == None).scalar()
    active_schools = db.query(func.count(School.id)).filter(School.status == "active", School.deleted_at == None).scalar()
    trial_schools = db.query(func.count(School.id)).filter(School.status == "trial", School.deleted_at == None).scalar()
    suspended_schools = db.query(func.count(School.id)).filter(School.status == "suspended", School.deleted_at == None).scalar()

    # Only count users belonging to live (non-deleted) schools
    total_users = (
        db.query(func.count(User.id))
        .join(School, School.id == User.school_id)
        .filter(User.is_active == True, User.deleted_at == None, School.deleted_at == None)
        .scalar()
    )
    total_teachers = (
        db.query(func.count(User.id))
        .join(School, School.id == User.school_id)
        .filter(User.user_type == "teacher", User.is_active == True, User.deleted_at == None, School.deleted_at == None)
        .scalar()
    )
    total_students = (
        db.query(func.count(User.id))
        .join(School, School.id == User.school_id)
        .filter(User.user_type == "student", User.is_active == True, User.deleted_at == None, School.deleted_at == None)
        .scalar()
    )

    # ── Per-school usage ──────────────────────────────────────────────────────

    # Subquery: student counts per school (only live schools)
    student_sq = (
        db.query(User.school_id, func.count(User.id).label("student_count"))
        .join(School, School.id == User.school_id)
        .filter(User.user_type == "student", User.is_active == True, User.deleted_at == None, School.deleted_at == None)
        .group_by(User.school_id)
        .subquery()
    )

    # Subquery: teacher counts per school (only live schools)
    teacher_sq = (
        db.query(User.school_id, func.count(User.id).label("teacher_count"))
        .join(School, School.id == User.school_id)
        .filter(User.user_type == "teacher", User.is_active == True, User.deleted_at == None, School.deleted_at == None)
        .group_by(User.school_id)
        .subquery()
    )

    # Subquery: latest subscription per school (pick the most recently created)
    latest_sub_sq = (
        db.query(
            SchoolSubscription.school_id,
            func.max(SchoolSubscription.created_at).label("max_created_at"),
        )
        .group_by(SchoolSubscription.school_id)
        .subquery()
    )

    # Main query: schools + their latest subscription + plan + user counts
    rows = (
        db.query(
            School.id,
            School.name,
            SubscriptionPlan.name.label("plan_name"),
            SchoolSubscription.status.label("sub_status"),
            SchoolSubscription.end_date,
            SubscriptionPlan.max_students,
            SubscriptionPlan.max_teachers,
            func.coalesce(student_sq.c.student_count, 0).label("student_count"),
            func.coalesce(teacher_sq.c.teacher_count, 0).label("teacher_count"),
        )
        .outerjoin(
            latest_sub_sq, latest_sub_sq.c.school_id == School.id
        )
        .outerjoin(
            SchoolSubscription,
            (SchoolSubscription.school_id == School.id)
            & (SchoolSubscription.created_at == latest_sub_sq.c.max_created_at),
        )
        .outerjoin(SubscriptionPlan, SubscriptionPlan.id == SchoolSubscription.plan_id)
        .outerjoin(student_sq, student_sq.c.school_id == School.id)
        .outerjoin(teacher_sq, teacher_sq.c.school_id == School.id)
        .filter(School.deleted_at == None, School.status != "archived")
        .order_by(School.name)
        .all()
    )

    schools_usage = []
    for row in rows:
        s_count = row.student_count or 0
        t_count = row.teacher_count or 0
        max_s = row.max_students or 0
        max_t = row.max_teachers or 0
        s_pct = (s_count / max_s * 100.0) if max_s > 0 else 0.0
        t_pct = (t_count / max_t * 100.0) if max_t > 0 else 0.0
        schools_usage.append({
            "school_id": str(row.id),
            "school_name": row.name,
            "plan_name": row.plan_name,
            "subscription_status": row.sub_status,
            "end_date": row.end_date.isoformat() if row.end_date else None,
            "student_count": s_count,
            "max_students": max_s,
            "teacher_count": t_count,
            "max_teachers": max_t,
            "student_usage_pct": round(s_pct, 2),
            "teacher_usage_pct": round(t_pct, 2),
        })

    # ── Plan breakdown ────────────────────────────────────────────────────────
    plan_breakdown_rows = (
        db.query(SubscriptionPlan.name, func.count(SchoolSubscription.id).label("count"))
        .join(SchoolSubscription, SchoolSubscription.plan_id == SubscriptionPlan.id)
        .join(School, School.id == SchoolSubscription.school_id)
        .filter(School.deleted_at == None, SchoolSubscription.status.in_(["active", "trial"]))
        .group_by(SubscriptionPlan.name)
        .all()
    )
    plan_breakdown = [{"plan_name": r.name, "count": r.count} for r in plan_breakdown_rows]

    return {
        "total_schools": total_schools,
        "active_schools": active_schools,
        "trial_schools": trial_schools,
        "suspended_schools": suspended_schools,
        "total_users": total_users,
        "total_teachers": total_teachers,
        "total_students": total_students,
        "plan_breakdown": plan_breakdown,
        "schools_usage": schools_usage,
    }
