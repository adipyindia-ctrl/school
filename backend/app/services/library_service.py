from __future__ import annotations
import math
from datetime import date
from typing import Optional
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from app.models.library import Book, BookIssue
from app.schemas.library import BookCreate, BookIssueCreate, BookReturnUpdate, BookUpdate


def list_books(db: Session, school_id: UUID, search: Optional[str] = None,
               category: Optional[str] = None, available_only: bool = False,
               page: int = 1, page_size: int = 25) -> dict:
    q = db.query(Book).filter(Book.school_id == school_id)
    if search:
        q = q.filter(or_(Book.title.ilike(f"%{search}%"), Book.author.ilike(f"%{search}%"), Book.isbn.ilike(f"%{search}%")))
    if category:
        q = q.filter(Book.category == category)
    if available_only:
        q = q.filter(Book.available_copies > 0)
    total = q.count()
    data = q.order_by(Book.title).offset((page - 1) * page_size).limit(page_size).all()
    return {"data": data, "total": total, "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


def create_book(db: Session, school_id: UUID, payload: BookCreate) -> Book:
    book = Book(school_id=school_id, available_copies=payload.total_copies, **payload.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


def update_book(db: Session, school_id: UUID, book_id: UUID, payload: BookUpdate) -> Book:
    book = db.query(Book).filter(Book.id == book_id, Book.school_id == school_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(book, k, v)
    db.commit()
    db.refresh(book)
    return book


def issue_book(db: Session, school_id: UUID, payload: BookIssueCreate) -> BookIssue:
    book = db.query(Book).filter(Book.id == payload.book_id, Book.school_id == school_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.available_copies <= 0:
        raise HTTPException(status_code=400, detail="No copies available")
    issue = BookIssue(school_id=school_id, **payload.model_dump())
    db.add(issue)
    book.available_copies -= 1
    db.commit()
    db.refresh(issue)
    return issue


def return_book(db: Session, school_id: UUID, issue_id: UUID, payload: BookReturnUpdate) -> BookIssue:
    issue = db.query(BookIssue).filter(BookIssue.id == issue_id, BookIssue.school_id == school_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found")
    if issue.status == "returned":
        raise HTTPException(status_code=400, detail="Book already returned")
    overdue_days = max(0, (payload.return_date - issue.due_date).days)
    fine = round(overdue_days * payload.fine_per_day, 2)
    issue.return_date = payload.return_date
    issue.fine_amount = fine
    issue.status = "returned"
    book = db.query(Book).filter(Book.id == issue.book_id).first()
    if book:
        book.available_copies += 1
    db.commit()
    db.refresh(issue)
    return issue


def list_issues(db: Session, school_id: UUID, status: Optional[str] = None,
                page: int = 1, page_size: int = 25) -> dict:
    q = db.query(BookIssue).filter(BookIssue.school_id == school_id)
    if status:
        q = q.filter(BookIssue.status == status)
    total = q.count()
    data = q.order_by(BookIssue.issue_date.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"data": data, "total": total, "page": page, "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size else 1}


def get_dashboard_stats(db: Session, school_id: UUID) -> dict:
    total_books = db.query(func.sum(Book.total_copies)).filter(Book.school_id == school_id).scalar() or 0
    issued = db.query(func.count(BookIssue.id)).filter(BookIssue.school_id == school_id, BookIssue.status == "issued").scalar() or 0
    overdue = db.query(func.count(BookIssue.id)).filter(
        BookIssue.school_id == school_id, BookIssue.status == "issued", BookIssue.due_date < date.today()
    ).scalar() or 0
    total_fine = db.query(func.sum(BookIssue.fine_amount)).filter(BookIssue.school_id == school_id, BookIssue.status != "returned").scalar() or 0
    return {"total_books": total_books, "issued": issued, "overdue": overdue, "outstanding_fines": float(total_fine)}
