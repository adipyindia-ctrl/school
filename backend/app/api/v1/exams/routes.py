from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Permissions
from app.core.tenant import CurrentUser, require_permission
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.exam import (
    ExamCreate, ExamResponse, ExamSubjectCreate, ExamSubjectResponse,
    ExamTypeCreate, ExamTypeResponse, ExamUpdate,
    GradeRuleCreate, GradeRuleResponse,
    MarkResponse, MarksBulkCreate,
    StudentResult,
)
from app.services import exam_service

router = APIRouter(prefix="/exams", tags=["Examinations"])


# ── Exam Types ────────────────────────────────────────────────────────────────

@router.get("/types", response_model=SuccessResponse[list[ExamTypeResponse]])
def list_types(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EXAMS_VIEW)),
):
    types = exam_service.list_exam_types(db, current_user.school_id)
    return SuccessResponse(data=[ExamTypeResponse.model_validate(t) for t in types])


@router.post("/types", response_model=SuccessResponse[ExamTypeResponse], status_code=201)
def create_type(
    payload: ExamTypeCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EXAMS_MANAGE)),
):
    t = exam_service.create_exam_type(db, current_user.school_id, payload)
    return SuccessResponse(data=ExamTypeResponse.model_validate(t), message="Exam type created")


# ── Grade Rules ───────────────────────────────────────────────────────────────

@router.get("/grade-rules", response_model=SuccessResponse[list[GradeRuleResponse]])
def list_grade_rules(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EXAMS_VIEW)),
):
    rules = exam_service.list_grade_rules(db, current_user.school_id)
    return SuccessResponse(data=[GradeRuleResponse.model_validate(r) for r in rules])


@router.post("/grade-rules", response_model=SuccessResponse[GradeRuleResponse], status_code=201)
def create_grade_rule(
    payload: GradeRuleCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EXAMS_MANAGE)),
):
    rule = exam_service.create_grade_rule(db, current_user.school_id, payload)
    return SuccessResponse(data=GradeRuleResponse.model_validate(rule), message="Grade rule created")


@router.delete("/grade-rules/{rule_id}", response_model=SuccessResponse[dict])
def delete_grade_rule(
    rule_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EXAMS_MANAGE)),
):
    exam_service.delete_grade_rule(db, current_user.school_id, rule_id)
    return SuccessResponse(data={}, message="Grade rule deleted")


# ── Exams ─────────────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse[ExamResponse])
def list_exams(
    session_id: Optional[UUID] = Query(None),
    class_id: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EXAMS_VIEW)),
):
    result = exam_service.list_exams(
        db, current_user.school_id,
        session_id=session_id, class_id=class_id,
        page=page, page_size=page_size,
    )
    return PaginatedResponse(
        data=[ExamResponse.model_validate(e) for e in result["data"]],
        total=result["total"], page=result["page"],
        page_size=result["page_size"], total_pages=result["total_pages"],
    )


@router.post("", response_model=SuccessResponse[ExamResponse], status_code=201)
def create_exam(
    payload: ExamCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EXAMS_MANAGE)),
):
    exam = exam_service.create_exam(db, current_user.school_id, payload)
    return SuccessResponse(data=ExamResponse.model_validate(exam), message="Exam created")


@router.get("/{exam_id}", response_model=SuccessResponse[ExamResponse])
def get_exam(
    exam_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EXAMS_VIEW)),
):
    exam = exam_service.get_exam_or_404(db, current_user.school_id, exam_id)
    return SuccessResponse(data=ExamResponse.model_validate(exam))


@router.patch("/{exam_id}", response_model=SuccessResponse[ExamResponse])
def update_exam(
    exam_id: UUID,
    payload: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EXAMS_MANAGE)),
):
    exam = exam_service.update_exam(db, current_user.school_id, exam_id, payload)
    return SuccessResponse(data=ExamResponse.model_validate(exam))


# ── Exam Subjects ─────────────────────────────────────────────────────────────

@router.get("/{exam_id}/subjects", response_model=SuccessResponse[list[ExamSubjectResponse]])
def list_subjects(
    exam_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EXAMS_VIEW)),
):
    subjects = exam_service.list_exam_subjects(db, exam_id)
    return SuccessResponse(data=[ExamSubjectResponse.model_validate(s) for s in subjects])


@router.post("/{exam_id}/subjects", response_model=SuccessResponse[ExamSubjectResponse], status_code=201)
def add_subject(
    exam_id: UUID,
    payload: ExamSubjectCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.EXAMS_MANAGE)),
):
    es = exam_service.add_exam_subject(db, exam_id, payload)
    return SuccessResponse(data=ExamSubjectResponse.model_validate(es), message="Subject added to exam")


# ── Marks ─────────────────────────────────────────────────────────────────────

@router.post("/marks", response_model=SuccessResponse[list[MarkResponse]])
def enter_marks(
    payload: MarksBulkCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.MARKS_CREATE)),
):
    marks = exam_service.enter_marks(db, current_user.school_id, payload, current_user.user_id)
    return SuccessResponse(
        data=[MarkResponse.model_validate(m) for m in marks],
        message=f"Marks saved for {len(marks)} students",
    )


# ── Results ───────────────────────────────────────────────────────────────────

@router.get("/{exam_id}/results", response_model=SuccessResponse[list[StudentResult]])
def get_results(
    exam_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.RESULTS_VIEW)),
):
    results = exam_service.get_exam_results(db, current_user.school_id, exam_id)
    return SuccessResponse(data=results)
