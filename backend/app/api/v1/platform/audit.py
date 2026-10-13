"""Platform-level audit log — Super Admin only."""
from __future__ import annotations

import math
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenant import CurrentUser, get_super_admin
from app.models.audit import AuditLog
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/platform/audit", tags=["Platform – Audit"])


@router.get("", response_model=SuccessResponse[dict])
def list_platform_audit(
    school_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    actor_email: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_super_admin),
):
    from datetime import datetime

    q = db.query(AuditLog)
    if school_id:
        q = q.filter(AuditLog.school_id == UUID(school_id))
    if action:
        q = q.filter(AuditLog.action == action)
    if actor_email:
        q = q.filter(AuditLog.actor_email.ilike(f"%{actor_email}%"))
    if date_from:
        q = q.filter(AuditLog.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        q = q.filter(AuditLog.created_at <= datetime.fromisoformat(date_to + "T23:59:59"))

    total = q.count()
    logs = q.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return SuccessResponse(data={
        "items": [
            {
                "id": str(log.id),
                "school_id": str(log.school_id) if log.school_id else None,
                "actor_email": log.actor_email,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "description": log.description,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    })
