from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.academic import AcademicSession, Class, Section
from app.models.school import School, SchoolBranding
from app.models.student import Parent, Student, StudentParent


def _get_student_or_404(db: Session, school_id: UUID, student_id: UUID) -> Student:
    s = db.query(Student).filter(
        Student.id == student_id,
        Student.school_id == school_id,
        Student.deleted_at.is_(None),
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    return s


def get_certificate_data(
    db: Session,
    school_id: UUID,
    student_id: UUID,
    cert_type: str,
    issue_date: Optional[date] = None,
    reason: Optional[str] = None,
) -> dict:
    """
    Assembles all data needed to render any certificate type.
    cert_type: bonafide | transfer | character
    """
    student = _get_student_or_404(db, school_id, student_id)

    # School info
    school = db.query(School).filter(School.id == school_id).first()
    branding = db.query(SchoolBranding).filter(SchoolBranding.school_id == school_id).first()

    # Academic context
    cls = db.query(Class).filter(Class.id == student.class_id).first()
    section = db.query(Section).filter(Section.id == student.section_id).first()
    session = db.query(AcademicSession).filter(AcademicSession.id == student.session_id).first()

    # Primary parent
    sp = (
        db.query(StudentParent)
        .filter(StudentParent.student_id == student.id, StudentParent.is_primary == True)  # noqa: E712
        .first()
    )
    parent: Optional[Parent] = None
    if sp:
        parent = db.query(Parent).filter(Parent.id == sp.parent_id).first()
    if not parent:
        # Fall back to any parent
        any_sp = db.query(StudentParent).filter(StudentParent.student_id == student.id).first()
        if any_sp:
            parent = db.query(Parent).filter(Parent.id == any_sp.parent_id).first()

    student_name = f"{student.first_name} {(student.middle_name + ' ') if student.middle_name else ''}{student.last_name}".strip()
    parent_name = f"{parent.first_name} {parent.last_name}" if parent else "—"
    parent_relation = (parent.relationship_type.capitalize() if parent else "Guardian")

    return {
        "cert_type": cert_type,
        "issue_date": (issue_date or date.today()).isoformat(),
        "reason": reason or "",
        # School
        "school_name": school.name if school else "",
        "school_address": school.address if school else "",
        "school_phone": school.phone if school else "",
        "school_email": school.email if school else "",
        "school_code": school.code if school else "",
        "logo_url": branding.logo_url if branding else None,
        "primary_color": branding.primary_color if branding else "#1a73e8",
        # Student
        "student_id": str(student.id),
        "student_name": student_name,
        "admission_number": student.admission_number,
        "date_of_birth": student.date_of_birth.isoformat() if student.date_of_birth else "—",
        "gender": student.gender or "—",
        "nationality": student.nationality or "Indian",
        "religion": student.religion or "—",
        "category": student.category or "—",
        "address": student.address or "—",
        "class_name": cls.name if cls else "—",
        "section_name": section.name if section else "—",
        "session_name": session.name if session else "—",
        "admission_date": student.admission_date.isoformat() if student.admission_date else "—",
        # Parent
        "parent_name": parent_name,
        "parent_relation": parent_relation,
        "parent_phone": parent.phone if parent else "—",
    }
