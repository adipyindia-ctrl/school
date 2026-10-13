from __future__ import annotations

import csv
import io
import math
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Permissions
from app.core.tenant import CurrentUser, require_permission
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogListResponse, AuditLogRead
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/audit", tags=["Audit"])


def _build_query(
    db: Session,
    school_id,
    *,
    actor_email: Optional[str],
    action: Optional[str],
    resource_type: Optional[str],
    date_from: Optional[str],
    date_to: Optional[str],
    search: Optional[str],
):
    """Build a filtered SQLAlchemy query for audit logs scoped to a school."""
    q = db.query(AuditLog).filter(AuditLog.school_id == school_id)

    if actor_email:
        q = q.filter(AuditLog.actor_email.ilike(f"%{actor_email}%"))
    if action:
        q = q.filter(AuditLog.action == action)
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)
    if date_from:
        q = q.filter(AuditLog.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        q = q.filter(AuditLog.created_at <= datetime.fromisoformat(date_to + "T23:59:59"))
    if search:
        term = f"%{search}%"
        q = q.filter(
            AuditLog.actor_email.ilike(term) | AuditLog.resource_type.ilike(term)
        )

    return q


@router.get("/logs", response_model=AuditLogListResponse)
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    actor_email: Optional[str] = Query(None, description="Partial match on actor email"),
    action: Optional[str] = Query(None, description="Exact match on action"),
    resource_type: Optional[str] = Query(None, description="Exact match on resource type"),
    date_from: Optional[str] = Query(None, description="ISO date, e.g. 2024-01-01"),
    date_to: Optional[str] = Query(None, description="ISO date, e.g. 2024-12-31"),
    search: Optional[str] = Query(None, description="Searches actor_email and resource_type"),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.AUDIT_VIEW)),
):
    """Paginated, filterable audit log scoped to the current school."""
    q = _build_query(
        db, current_user.school_id,
        actor_email=actor_email,
        action=action,
        resource_type=resource_type,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )

    total = q.count()
    logs = (
        q.order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedResponse(
        data=[AuditLogRead.model_validate(log) for log in logs],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if page_size else 1,
    )


@router.get("/logs/export")
def export_audit_logs_csv(
    actor_email: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.AUDIT_VIEW)),
):
    """Export audit logs as CSV (max 5 000 rows), applying the same filters."""
    q = _build_query(
        db, current_user.school_id,
        actor_email=actor_email,
        action=action,
        resource_type=resource_type,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )

    logs = q.order_by(AuditLog.created_at.desc()).limit(5000).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "actor_email", "action", "resource_type",
        "resource_id", "ip_address", "created_at",
    ])
    for log in logs:
        writer.writerow([
            str(log.id),
            log.actor_email,
            log.action,
            log.resource_type or "",
            log.resource_id or "",
            log.ip_address or "",
            log.created_at.isoformat(),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_logs.csv"},
    )
