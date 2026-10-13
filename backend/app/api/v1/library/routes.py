from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Modules, Permissions
from app.core.tenant import CurrentUser, require_module, require_permission
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.library import (
    BookCreate,
    BookIssueCreate,
    BookIssueResponse,
    BookResponse,
    BookReturnUpdate,
    BookUpdate,
)
from app.services import library_service

router = APIRouter(prefix="/library", tags=["Library"])


def _lib_view():
    def dep(
        current_user: CurrentUser = Depends(require_module(Modules.LIBRARY)),
        _perm: CurrentUser = Depends(require_permission(Permissions.LIBRARY_VIEW)),
    ) -> CurrentUser:
        return current_user
    return dep


# ── Dashboard stats ───────────────────────────────────────────────────────────

@router.get("/stats", response_model=SuccessResponse[dict])
def get_stats(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.LIBRARY_VIEW)),
):
    stats = library_service.get_dashboard_stats(db, current_user.school_id)
    return SuccessResponse(data=stats)


# ── Books ─────────────────────────────────────────────────────────────────────

@router.get("/books", response_model=PaginatedResponse[BookResponse])
def list_books(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    available_only: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.LIBRARY_VIEW)),
):
    result = library_service.list_books(
        db, current_user.school_id,
        search=search, category=category, available_only=available_only,
        page=page, page_size=page_size,
    )
    return PaginatedResponse(
        data=[BookResponse.model_validate(b) for b in result["data"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
    )


@router.post("/books", response_model=SuccessResponse[BookResponse], status_code=201)
def create_book(
    payload: BookCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.LIBRARY_MANAGE)),
):
    book = library_service.create_book(db, current_user.school_id, payload)
    return SuccessResponse(data=BookResponse.model_validate(book), message="Book added")


@router.patch("/books/{book_id}", response_model=SuccessResponse[BookResponse])
def update_book(
    book_id: UUID,
    payload: BookUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.LIBRARY_MANAGE)),
):
    book = library_service.update_book(db, current_user.school_id, book_id, payload)
    return SuccessResponse(data=BookResponse.model_validate(book))


# ── Issues ────────────────────────────────────────────────────────────────────

@router.get("/issues", response_model=PaginatedResponse[BookIssueResponse])
def list_issues(
    status: Optional[str] = Query(None, description="issued | returned | overdue"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.LIBRARY_VIEW)),
):
    result = library_service.list_issues(db, current_user.school_id, status=status, page=page, page_size=page_size)
    return PaginatedResponse(
        data=[BookIssueResponse.model_validate(i) for i in result["data"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
    )


@router.post("/issues", response_model=SuccessResponse[BookIssueResponse], status_code=201)
def issue_book(
    payload: BookIssueCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.LIBRARY_ISSUE)),
):
    issue = library_service.issue_book(db, current_user.school_id, payload)
    return SuccessResponse(data=BookIssueResponse.model_validate(issue), message="Book issued")


@router.patch("/issues/{issue_id}/return", response_model=SuccessResponse[BookIssueResponse])
def return_book(
    issue_id: UUID,
    payload: BookReturnUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.LIBRARY_RETURN)),
):
    issue = library_service.return_book(db, current_user.school_id, issue_id, payload)
    return SuccessResponse(data=BookIssueResponse.model_validate(issue), message="Book returned")
