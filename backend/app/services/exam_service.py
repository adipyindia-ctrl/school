from __future__ import annotations

import math
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.exam import Exam, ExamSubject, ExamType, GradeRule, Mark
from app.models.student import Student
from app.schemas.exam import (
    ExamCreate, ExamSubjectCreate, ExamTypeCreate, ExamUpdate,
    GradeRuleCreate, MarksBulkCreate, StudentResult,
)


def _compute_grade(db: Session, school_id: UUID, percentage: float) -> tuple[str, bool]:
    rules = (
        db.query(GradeRule)
        .filter(GradeRule.school_id == school_id)
        .order_by(GradeRule.min_percent.desc())
        .all()
    )
    for rule in rules:
        if float(rule.min_percent) <= percentage <= float(rule.max_percent):
            return rule.grade, rule.is_pass
    return "F", False


# ── Exam Types ────────────────────────────────────────────────────────────────

def list_exam_types(db: Session, school_id: UUID) -> list[ExamType]:
    return db.query(ExamType).filter(ExamType.school_id == school_id).order_by(ExamType.name).all()


def create_exam_type(db: Session, school_id: UUID, payload: ExamTypeCreate) -> ExamType:
    if db.query(ExamType).filter(
        ExamType.school_id == school_id, ExamType.name == payload.name
    ).first():
        raise HTTPException(status_code=400, detail="Exam type already exists")
    et = ExamType(school_id=school_id, **payload.model_dump())
    db.add(et)
    db.commit()
    db.refresh(et)
    return et


# ── Exams ─────────────────────────────────────────────────────────────────────

def list_exams(
    db: Session, school_id: UUID,
    session_id: Optional[UUID] = None,
    class_id: Optional[UUID] = None,
    page: int = 1, page_size: int = 25,
) -> dict:
    q = db.query(Exam).filter(Exam.school_id == school_id)
    if session_id:
        q = q.filter(Exam.session_id == session_id)
    if class_id:
        q = q.filter(Exam.class_id == class_id)
    total = q.count()
    data = q.order_by(Exam.start_date.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"data": data, "total": total, "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


def get_exam_or_404(db: Session, school_id: UUID, exam_id: UUID) -> Exam:
    exam = db.query(Exam).filter(Exam.id == exam_id, Exam.school_id == school_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam


def create_exam(db: Session, school_id: UUID, payload: ExamCreate) -> Exam:
    exam = Exam(school_id=school_id, **payload.model_dump())
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


def update_exam(db: Session, school_id: UUID, exam_id: UUID, payload: ExamUpdate) -> Exam:
    exam = get_exam_or_404(db, school_id, exam_id)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(exam, k, v)
    db.commit()
    db.refresh(exam)
    return exam


# ── Exam Subjects ─────────────────────────────────────────────────────────────

def add_exam_subject(
    db: Session, exam_id: UUID, payload: ExamSubjectCreate
) -> ExamSubject:
    existing = db.query(ExamSubject).filter(
        ExamSubject.exam_id == exam_id,
        ExamSubject.subject_id == payload.subject_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject already added to this exam")
    es = ExamSubject(exam_id=exam_id, **payload.model_dump())
    db.add(es)
    db.commit()
    db.refresh(es)
    return es


def list_exam_subjects(db: Session, exam_id: UUID) -> list[ExamSubject]:
    return db.query(ExamSubject).filter(ExamSubject.exam_id == exam_id).all()


# ── Grade Rules ───────────────────────────────────────────────────────────────

def list_grade_rules(db: Session, school_id: UUID) -> list[GradeRule]:
    return db.query(GradeRule).filter(GradeRule.school_id == school_id).order_by(GradeRule.min_percent.desc()).all()


def create_grade_rule(db: Session, school_id: UUID, payload: GradeRuleCreate) -> GradeRule:
    rule = GradeRule(school_id=school_id, **payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def delete_grade_rule(db: Session, school_id: UUID, rule_id: UUID) -> None:
    rule = db.query(GradeRule).filter(GradeRule.id == rule_id, GradeRule.school_id == school_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Grade rule not found")
    db.delete(rule)
    db.commit()


# ── Marks ─────────────────────────────────────────────────────────────────────

def enter_marks(db: Session, school_id: UUID, payload: MarksBulkCreate, entered_by: UUID) -> list[Mark]:
    es = db.query(ExamSubject).filter(ExamSubject.id == payload.exam_subject_id).first()
    if not es:
        raise HTTPException(status_code=404, detail="Exam subject not found")

    results = []
    for entry in payload.entries:
        existing = db.query(Mark).filter(
            Mark.exam_subject_id == payload.exam_subject_id,
            Mark.student_id == entry.student_id,
        ).first()

        grade = None
        if entry.marks_obtained is not None and not entry.is_absent:
            pct = (entry.marks_obtained / float(es.max_marks)) * 100
            grade, _ = _compute_grade(db, school_id, pct)

        if existing:
            existing.marks_obtained = entry.marks_obtained
            existing.is_absent = entry.is_absent
            existing.remarks = entry.remarks
            existing.grade = grade
            existing.entered_by = entered_by
            results.append(existing)
        else:
            mark = Mark(
                school_id=school_id,
                exam_subject_id=payload.exam_subject_id,
                student_id=entry.student_id,
                marks_obtained=entry.marks_obtained,
                is_absent=entry.is_absent,
                remarks=entry.remarks,
                grade=grade,
                entered_by=entered_by,
            )
            db.add(mark)
            results.append(mark)

    db.commit()
    for r in results:
        db.refresh(r)
    return results


def get_exam_results(db: Session, school_id: UUID, exam_id: UUID) -> list[StudentResult]:
    exam = get_exam_or_404(db, school_id, exam_id)
    exam_subjects = list_exam_subjects(db, exam_id)

    # Get all students in this class for the exam's session
    students = db.query(Student).filter(
        Student.school_id == school_id,
        Student.class_id == exam.class_id,
        Student.status == "active",
        Student.deleted_at == None,
    ).all()

    results = []
    for student in students:
        subject_rows = []
        total_obtained = 0.0
        total_max = 0.0
        all_pass = True

        for es in exam_subjects:
            mark = db.query(Mark).filter(
                Mark.exam_subject_id == es.id,
                Mark.student_id == student.id,
            ).first()

            obtained = float(mark.marks_obtained) if mark and mark.marks_obtained is not None else 0.0
            max_m = float(es.max_marks)
            pct = (obtained / max_m * 100) if max_m > 0 else 0
            grade, is_pass = _compute_grade(db, school_id, pct) if mark and not mark.is_absent else ("AB", False)

            if mark and mark.is_absent:
                all_pass = False
            elif obtained < float(es.pass_marks):
                all_pass = False

            total_obtained += obtained
            total_max += max_m
            subject_rows.append({
                "subject_id": str(es.subject_id),
                "exam_date": str(es.exam_date),
                "marks_obtained": obtained if (mark and not mark.is_absent) else None,
                "max_marks": max_m,
                "pass_marks": float(es.pass_marks),
                "grade": grade,
                "is_absent": mark.is_absent if mark else False,
            })

        overall_pct = round(total_obtained / total_max * 100, 2) if total_max > 0 else 0
        overall_grade, _ = _compute_grade(db, school_id, overall_pct)

        results.append(StudentResult(
            student_id=student.id,
            student_name=f"{student.first_name} {student.last_name}",
            admission_number=student.admission_number,
            subjects=subject_rows,
            total_marks=round(total_obtained, 2),
            max_marks=round(total_max, 2),
            percentage=overall_pct,
            grade=overall_grade,
            is_pass=all_pass,
        ))

    # Assign ranks by percentage descending
    results.sort(key=lambda r: r.percentage, reverse=True)
    for i, r in enumerate(results):
        r.rank = i + 1

    return results
