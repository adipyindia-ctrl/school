"""Subscription enforcement helpers — limit checks and expiry."""
from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.subscription import SchoolSubscription, SubscriptionPlan
from app.models.student import Student
from app.models.teacher import Teacher


def get_active_subscription(db: Session, school_id: UUID) -> Optional[SchoolSubscription]:
    """Returns the most recent active or trial subscription for a school that has not expired."""
    return (
        db.query(SchoolSubscription)
        .filter(
            SchoolSubscription.school_id == school_id,
            SchoolSubscription.status.in_(["active", "trial"]),
            SchoolSubscription.end_date >= date.today(),
        )
        .order_by(SchoolSubscription.created_at.desc())
        .first()
    )


def check_student_limit(db: Session, school_id: UUID) -> None:
    """Raises HTTP 422 if adding a student would exceed the plan's max_students."""
    sub = get_active_subscription(db, school_id)
    if not sub or not sub.plan_id:
        return  # no plan = no limit enforced

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
    if not plan or plan.max_students <= 0:
        return  # unlimited

    current_count = (
        db.query(Student)
        .filter(Student.school_id == school_id, Student.status == "active")
        .count()
    )
    if current_count >= plan.max_students:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Student limit reached ({current_count}/{plan.max_students}). "
                "Upgrade your plan to add more students."
            ),
        )


def check_teacher_limit(db: Session, school_id: UUID) -> None:
    """Raises HTTP 422 if adding a teacher would exceed the plan's max_teachers."""
    sub = get_active_subscription(db, school_id)
    if not sub or not sub.plan_id:
        return

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
    if not plan or plan.max_teachers <= 0:
        return

    current_count = (
        db.query(Teacher)
        .filter(Teacher.school_id == school_id, Teacher.status == "active")
        .count()
    )
    if current_count >= plan.max_teachers:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Teacher limit reached ({current_count}/{plan.max_teachers}). "
                "Upgrade your plan to add more teachers."
            ),
        )


def get_usage_summary(db: Session, school_id: UUID) -> dict:
    """Returns current subscription status and usage vs plan limits."""
    sub = get_active_subscription(db, school_id)
    if not sub:
        return {"subscription": None, "students": None, "teachers": None}

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()

    today = date.today()
    days_remaining = (sub.end_date - today).days if sub.end_date else None
    is_expired = sub.end_date < today if sub.end_date else False

    student_count = (
        db.query(Student)
        .filter(Student.school_id == school_id, Student.status == "active")
        .count()
    )
    teacher_count = (
        db.query(Teacher)
        .filter(Teacher.school_id == school_id, Teacher.status == "active")
        .count()
    )

    max_s = plan.max_students if plan else 0
    max_t = plan.max_teachers if plan else 0

    return {
        "subscription": {
            "status": sub.status,
            "end_date": sub.end_date.isoformat() if sub.end_date else None,
            "days_remaining": days_remaining,
            "is_expired": is_expired,
            "plan_name": plan.name if plan else None,
        },
        "students": {
            "current": student_count,
            "max": max_s,
            "percentage": round(student_count / max_s * 100, 1) if max_s > 0 else 0.0,
        },
        "teachers": {
            "current": teacher_count,
            "max": max_t,
            "percentage": round(teacher_count / max_t * 100, 1) if max_t > 0 else 0.0,
        },
    }
