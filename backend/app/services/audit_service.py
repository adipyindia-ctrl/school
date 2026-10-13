from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def log_action(
    db: Session,
    *,
    action: str,
    actor_id: Optional[UUID] = None,
    actor_email: str = "system",
    school_id: Optional[UUID] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    old_values: Optional[dict[str, Any]] = None,
    new_values: Optional[dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    description: Optional[str] = None,
) -> AuditLog:
    entry = AuditLog(
        school_id=school_id,
        actor_id=actor_id,
        actor_email=actor_email,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
        description=description,
    )
    db.add(entry)
    # Note: caller is responsible for db.commit()
    return entry
