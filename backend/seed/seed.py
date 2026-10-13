#!/usr/bin/env python3
"""
Demo seed script — idempotent.
Creates Green Valley Public School with realistic demo data.

Usage:
    cd backend
    python -m seed.seed
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.core.database import SessionLocal
from app.startup import run_startup


def main() -> None:
    db = SessionLocal()
    try:
        print("▶  Running startup (permissions + modules + super admin)...")
        run_startup(db)

        print("▶  Seeding subscription plans...")
        _seed_plans(db)

        print("▶  Seeding demo school...")
        school = _seed_school(db)
        if school:
            print(f"   School: {school.name} (slug: {school.slug})")

        print("✅  Seed complete.")
        print("\n── Demo Credentials ──────────────────────────────────")
        print("Super Admin:  admin@schoolerp.com  /  SuperAdmin@123")
        print("School Admin: principal@greenvalley.edu  /  Admin@1234")
        print("Teacher 1:    teacher1@greenvalley.edu  /  Teacher@1234")
        print("─────────────────────────────────────────────────────")
    finally:
        db.close()


def _seed_plans(db) -> None:
    from app.models.subscription import SubscriptionPlan
    plans_data = [
        {"name": "Starter", "price": 999, "max_students": 200, "max_teachers": 20, "trial_days": 30, "display_order": 1},
        {"name": "Standard", "price": 2499, "max_students": 1000, "max_teachers": 80, "trial_days": 30, "display_order": 2},
        {"name": "Premium", "price": 4999, "max_students": 3000, "max_teachers": 200, "trial_days": 30, "display_order": 3},
        {"name": "Enterprise", "price": 9999, "max_students": 10000, "max_teachers": 500, "trial_days": 30, "display_order": 4},
    ]
    for p in plans_data:
        if not db.query(SubscriptionPlan).filter(SubscriptionPlan.name == p["name"]).first():
            db.add(SubscriptionPlan(**p))
    db.commit()


def _seed_school(db):
    from app.models.school import School
    from app.schemas.school import (
        AdminAccountCreate, BrandingUpdate, OnboardingCreate, SchoolCreate
    )
    from app.services.school_service import create_school_onboarding

    slug = "greenvalley"
    if db.query(School).filter(School.slug == slug).first():
        print("   Demo school already exists, skipping.")
        return db.query(School).filter(School.slug == slug).first()

    from app.models.subscription import SubscriptionPlan
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == "Standard").first()

    payload = OnboardingCreate(
        school=SchoolCreate(
            name="Green Valley Public School",
            code="GVPS",
            slug=slug,
            school_type="cbse",
            established_year=2001,
            phone="+91-9876543210",
            email="info@greenvalley.edu",
            website="https://greenvalley.edu",
            address="123, Green Valley Road",
            city="Bengaluru",
            state="Karnataka",
            country="India",
            pincode="560001",
        ),
        branding=BrandingUpdate(
            primary_color="#1a73e8",
            secondary_color="#34a853",
            sidebar_color="#0f172a",
            accent_color="#f59e0b",
            font_family="Inter",
            welcome_message="Welcome to Green Valley Public School Portal",
            footer_text="© 2025 Green Valley Public School. All rights reserved.",
            support_phone="+91-9876543210",
            support_email="support@greenvalley.edu",
        ),
        admin=AdminAccountCreate(
            first_name="Rajesh",
            last_name="Kumar",
            email="principal@greenvalley.edu",
            phone="+91-9876543211",
            password="Admin@1234",
        ),
        enabled_modules=[
            "students", "parents", "teachers", "staff",
            "admissions", "academics", "attendance", "timetable",
            "homework", "exams", "fees", "transport", "library",
            "certificates", "notices", "events", "communication",
            "reports", "website",
        ],
        plan_id=plan.id if plan else None,
    )
    school = create_school_onboarding(db, payload, actor_email="seed_script")
    db.refresh(school)

    # Activate it
    school.status = "active"
    db.commit()

    # Create additional teacher users
    _seed_teachers(db, school)
    _seed_students(db, school)
    _seed_academic_structure(db, school)

    return school


def _seed_teachers(db, school) -> None:
    from app.core.security import hash_password
    from app.models.user import Role, User, UserRole

    teachers_data = [
        {"first_name": "Priya", "last_name": "Sharma", "email": "teacher1@greenvalley.edu"},
        {"first_name": "Amit", "last_name": "Patel", "email": "teacher2@greenvalley.edu"},
        {"first_name": "Sunita", "last_name": "Reddy", "email": "teacher3@greenvalley.edu"},
        {"first_name": "Vikram", "last_name": "Singh", "email": "teacher4@greenvalley.edu"},
        {"first_name": "Meena", "last_name": "Nair", "email": "teacher5@greenvalley.edu"},
    ]
    teacher_role = db.query(Role).filter(Role.school_id == school.id, Role.name == "Teacher").first()
    for t in teachers_data:
        if db.query(User).filter(User.email == t["email"]).first():
            continue
        user = User(
            school_id=school.id,
            email=t["email"],
            password_hash=hash_password("Teacher@1234"),
            first_name=t["first_name"],
            last_name=t["last_name"],
            user_type="teacher",
        )
        db.add(user)
        db.flush()
        if teacher_role:
            db.add(UserRole(user_id=user.id, role_id=teacher_role.id))
    db.commit()
    print(f"   Seeded {len(teachers_data)} teachers.")


def _seed_students(db, school) -> None:
    from app.core.security import hash_password
    from app.models.user import Role, User, UserRole
    import random

    first_names = [
        "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
        "Arnav", "Ishaan", "Dhruv", "Karan", "Rohan", "Shiv", "Kavya", "Ananya",
        "Pari", "Aadhya", "Diya", "Priya", "Nisha", "Pooja", "Riya", "Sneha",
        "Tanvi", "Shreya", "Anjali", "Megha", "Deepa", "Lakshmi",
    ]
    last_names = [
        "Sharma", "Verma", "Patel", "Singh", "Kumar", "Reddy", "Nair",
        "Gupta", "Joshi", "Mehta", "Iyer", "Pillai", "Rao", "Mishra",
    ]

    student_role = db.query(Role).filter(Role.school_id == school.id, Role.name == "Student").first()
    count = 0
    for i in range(1, 51):
        email = f"student{i}@greenvalley.edu"
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
        count += 1
    db.commit()
    print(f"   Seeded {count} students.")


if __name__ == "__main__":
    main()


def _seed_academic_structure(db, school) -> None:
    """Create academic session, classes, sections, Teacher records, Student records."""
    import random
    from datetime import date, timedelta
    from app.models.academic import AcademicSession, Class, Section, Subject, ClassSubject
    from app.models.student import Student
    from app.models.teacher import Teacher
    from app.models.user import User

    # --- Academic Session ---
    session = db.query(AcademicSession).filter(
        AcademicSession.school_id == school.id
    ).first()
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
        print("   Created academic session 2025-26.")

    # --- Classes ---
    class_names = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
                   "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"]
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
    print(f"   Created/verified {len(classes)} classes.")

    # --- Sections (A, B for each class) ---
    sections = {}
    for cname, cls in classes.items():
        for sec_name in ["A", "B"]:
            sec = db.query(Section).filter(
                Section.school_id == school.id,
                Section.class_id == cls.id,
                Section.name == sec_name
            ).first()
            if not sec:
                sec = Section(
                    school_id=school.id,
                    class_id=cls.id,
                    name=sec_name,
                    capacity=40,
                )
                db.add(sec)
                db.flush()
            sections[(cname, sec_name)] = sec
    print(f"   Created/verified {len(sections)} sections.")

    # --- Subjects ---
    subjects_data = [
        ("Mathematics", "MATH", "theory", 100, 35),
        ("Science", "SCI", "theory", 100, 35),
        ("English", "ENG", "theory", 100, 35),
        ("Hindi", "HIN", "theory", 100, 35),
        ("Social Science", "SST", "theory", 100, 35),
    ]
    subjects = {}
    for sname, scode, stype, max_m, pass_m in subjects_data:
        subj = db.query(Subject).filter(
            Subject.school_id == school.id, Subject.code == scode
        ).first()
        if not subj:
            subj = Subject(
                school_id=school.id,
                name=sname,
                code=scode,
                subject_type=stype,
                max_marks=max_m,
                pass_marks=pass_m,
            )
            db.add(subj)
            db.flush()
        subjects[scode] = subj
    print(f"   Created/verified {len(subjects)} subjects.")

    db.commit()

    # --- Teacher records ---
    teacher_users = db.query(User).filter(
        User.school_id == school.id,
        User.user_type == "teacher"
    ).all()

    emp_counter = 1
    for user in teacher_users:
        existing = db.query(Teacher).filter(Teacher.user_id == user.id).first()
        if not existing:
            t = Teacher(
                school_id=school.id,
                user_id=user.id,
                employee_id=f"EMP{emp_counter:03d}",
                designation="PGT",
                department="General",
                joining_date=date(2020, 6, 1),
                status="active",
            )
            db.add(t)
            emp_counter += 1
    db.commit()
    print(f"   Created Teacher records for {len(teacher_users)} teachers.")

    # --- Student records ---
    student_users = db.query(User).filter(
        User.school_id == school.id,
        User.user_type == "student"
    ).all()

    section_list = list(sections.values())
    adm_counter = 1
    created = 0
    for user in student_users:
        existing = db.query(Student).filter(Student.user_id == user.id).first()
        if not existing:
            sec = section_list[adm_counter % len(section_list)]
            dob = date(2010, 1, 1) + timedelta(days=random.randint(0, 1825))
            s = Student(
                school_id=school.id,
                session_id=session.id,
                class_id=sec.class_id,
                section_id=sec.id,
                user_id=user.id,
                admission_number=f"GVPS{2025}{adm_counter:04d}",
                admission_date=date(2025, 4, 1),
                first_name=user.first_name,
                last_name=user.last_name,
                date_of_birth=dob,
                gender=random.choice(["male", "female"]),
                status="active",
            )
            db.add(s)
            adm_counter += 1
            created += 1
    db.commit()
    print(f"   Created {created} Student records.")


if __name__ == "__main__":
    main()
