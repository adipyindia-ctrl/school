from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class BookCreate(BaseModel):
    title: str
    author: Optional[str] = None
    isbn: Optional[str] = None
    publisher: Optional[str] = None
    category: Optional[str] = None
    total_copies: int = 1


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    publisher: Optional[str] = None
    category: Optional[str] = None
    total_copies: Optional[int] = None


class BookResponse(BaseModel):
    id: UUID
    school_id: UUID
    title: str
    author: Optional[str] = None
    isbn: Optional[str] = None
    publisher: Optional[str] = None
    category: Optional[str] = None
    total_copies: int
    available_copies: int
    created_at: datetime
    model_config = {"from_attributes": True}


class BookIssueCreate(BaseModel):
    book_id: UUID
    user_id: UUID
    issue_date: date
    due_date: date


class BookReturnUpdate(BaseModel):
    return_date: date
    fine_per_day: float = 5.0


class BookIssueResponse(BaseModel):
    id: UUID
    school_id: UUID
    book_id: UUID
    user_id: UUID
    issue_date: date
    due_date: date
    return_date: Optional[date] = None
    fine_amount: float
    status: str
    created_at: datetime
    model_config = {"from_attributes": True}
