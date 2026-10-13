from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Permissions
from app.core.tenant import CurrentUser, require_permission
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.student import (
    ParentCreate, ParentResponse, ParentStudentLink, ParentUpdate,
    StudentCreate, StudentDetailResponse, StudentResponse, StudentUpdate,
    ParentSummary,
)
from app.services import student_service

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("", response_model=PaginatedResponse[StudentResponse])
def list_students(
    session_id: Optional[UUID] = Query(None),
    class_id: Optional[UUID] = Query(None),
    section_id: Optional[UUID] = Query(None),
    gender: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.STUDENTS_VIEW)),
):
    result = student_service.list_students(
        db, current_user.school_id,
        session_id=session_id, class_id=class_id, section_id=section_id,
        gender=gender, status=status, search=search, page=page, page_size=page_size,
    )
    return PaginatedResponse(
        data=[StudentResponse.model_validate(s) for s in result["data"]],
        total=result["total"], page=result["page"],
        page_size=result["page_size"], total_pages=result["total_pages"],
    )


@router.post("", response_model=SuccessResponse[StudentResponse], status_code=201)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.STUDENTS_CREATE)),
):
    from app.services.subscription_service import check_student_limit
    check_student_limit(db, current_user.school_id)
    s = student_service.create_student(db, current_user.school_id, payload, current_user.email)
    return SuccessResponse(data=StudentResponse.model_validate(s), message="Student created")


@router.get("/{student_id}", response_model=SuccessResponse[StudentDetailResponse])
def get_student(
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.STUDENTS_VIEW)),
):
    s = student_service.get_student_or_404(db, current_user.school_id, student_id)
    # Build parents list
    parent_rows = student_service.get_student_parents(db, current_user.school_id, student_id)
    detail = StudentDetailResponse.model_validate(s)
    detail.parents = [
        ParentSummary(
            id=p.id,
            first_name=p.first_name,
            last_name=p.last_name,
            relationship_type=p.relationship_type,
            phone=p.phone,
            email=p.email,
            is_primary=is_primary,
        )
        for p, is_primary in parent_rows
    ]
    return SuccessResponse(data=detail)


@router.patch("/{student_id}", response_model=SuccessResponse[StudentResponse])
def update_student(
    student_id: UUID,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.STUDENTS_EDIT)),
):
    s = student_service.update_student(db, current_user.school_id, student_id, payload, current_user.email)
    return SuccessResponse(data=StudentResponse.model_validate(s))


@router.delete("/{student_id}", response_model=SuccessResponse[dict])
def delete_student(
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.STUDENTS_DELETE)),
):
    student_service.delete_student(db, current_user.school_id, student_id, current_user.email)
    return SuccessResponse(data={}, message="Student deactivated")


@router.get("/{student_id}/results", response_model=SuccessResponse[list])
def get_student_results(
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.RESULTS_VIEW)),
):
    """Returns all exam results for a specific student, grouped by exam."""
    from app.models.exam import Exam, ExamSubject, ExamType, Mark
    from app.models.academic import Subject

    student = student_service.get_student_or_404(db, current_user.school_id, student_id)

    # Get all exams for this student's class that are published/completed
    exams = (
        db.query(Exam)
        .filter(
            Exam.school_id == current_user.school_id,
            Exam.class_id == student.class_id,
            Exam.status.in_(["published", "completed"]),
        )
        .order_by(Exam.start_date.desc())
        .all()
    )

    results = []
    for exam in exams:
        exam_type = db.query(ExamType).filter(ExamType.id == exam.exam_type_id).first()
        exam_subjects = db.query(ExamSubject).filter(ExamSubject.exam_id == exam.id).all()

        subjects_data = []
        total_obtained = 0.0
        total_max = 0.0

        for es in exam_subjects:
            subject = db.query(Subject).filter(Subject.id == es.subject_id).first()
            mark = db.query(Mark).filter(
                Mark.exam_subject_id == es.id,
                Mark.student_id == student_id,
            ).first()

            obtained = float(mark.marks_obtained) if mark and mark.marks_obtained is not None and not mark.is_absent else None
            total_max += float(es.max_marks)
            if obtained is not None:
                total_obtained += obtained

            subjects_data.append({
                "subject_id": str(es.subject_id),
                "subject_name": subject.name if subject else "Unknown",
                "subject_code": subject.code if subject else "",
                "marks_obtained": obtained,
                "max_marks": float(es.max_marks),
                "pass_marks": float(es.pass_marks),
                "grade": mark.grade if mark else None,
                "is_absent": mark.is_absent if mark else False,
                "remarks": mark.remarks if mark else None,
                "percentage": round(obtained / float(es.max_marks) * 100, 1) if obtained is not None else None,
            })

        percentage = round(total_obtained / total_max * 100, 1) if total_max > 0 else 0.0

        results.append({
            "exam_id": str(exam.id),
            "exam_name": exam.name,
            "exam_type": exam_type.name if exam_type else "",
            "start_date": exam.start_date.isoformat(),
            "end_date": exam.end_date.isoformat(),
            "status": exam.status,
            "subjects": subjects_data,
            "total_obtained": total_obtained,
            "total_max": total_max,
            "percentage": percentage,
        })

    return SuccessResponse(data=results)


# ── Parents ───────────────────────────────────────────────────────────────────

parents_router = APIRouter(prefix="/parents", tags=["Parents"])


@parents_router.get("", response_model=PaginatedResponse[ParentResponse])
def list_parents(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.PARENTS_VIEW)),
):
    result = student_service.list_parents(
        db, current_user.school_id, search=search, page=page, page_size=page_size
    )
    return PaginatedResponse(
        data=[student_service.build_parent_response(db, p) for p in result["data"]],
        total=result["total"], page=result["page"],
        page_size=result["page_size"], total_pages=result["total_pages"],
    )


@parents_router.post("", response_model=SuccessResponse[ParentResponse], status_code=201)
def create_parent(
    payload: ParentCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.PARENTS_CREATE)),
):
    p = student_service.create_parent(db, current_user.school_id, payload, current_user.email)
    return SuccessResponse(
        data=student_service.build_parent_response(db, p),
        message="Parent created",
    )


@parents_router.get("/{parent_id}", response_model=SuccessResponse[ParentResponse])
def get_parent(
    parent_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.PARENTS_VIEW)),
):
    p = student_service.get_parent_or_404(db, current_user.school_id, parent_id)
    return SuccessResponse(data=student_service.build_parent_response(db, p))


@parents_router.patch("/{parent_id}", response_model=SuccessResponse[ParentResponse])
def update_parent(
    parent_id: UUID,
    payload: ParentUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.PARENTS_EDIT)),
):
    p = student_service.update_parent(db, current_user.school_id, parent_id, payload, current_user.email)
    return SuccessResponse(data=student_service.build_parent_response(db, p))


@parents_router.delete("/{parent_id}", response_model=SuccessResponse[dict])
def delete_parent(
    parent_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.PARENTS_EDIT)),
):
    student_service.delete_parent(db, current_user.school_id, parent_id, current_user.email)
    return SuccessResponse(data={}, message="Parent deleted")


@parents_router.post("/{parent_id}/students/{student_id}", response_model=SuccessResponse[dict])
def link_student(
    parent_id: UUID,
    student_id: UUID,
    payload: ParentStudentLink = ParentStudentLink(),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.PARENTS_EDIT)),
):
    student_service.link_student_to_parent(
        db, current_user.school_id, parent_id, student_id,
        payload.is_primary, current_user.email,
    )
    return SuccessResponse(data={}, message="Student linked to parent")


@parents_router.delete("/{parent_id}/students/{student_id}", response_model=SuccessResponse[dict])
def unlink_student(
    parent_id: UUID,
    student_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.PARENTS_EDIT)),
):
    student_service.unlink_student_from_parent(
        db, current_user.school_id, parent_id, student_id, current_user.email,
    )
    return SuccessResponse(data={}, message="Student unlinked from parent")
