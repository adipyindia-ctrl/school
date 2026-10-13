from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import PaginatedResponse


class AuditLogRead(BaseModel):
    id: UUID
    school_id: Optional[UUID] = None
    actor_id: Optional[UUID] = None
    actor_email: str
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    old_values: Optional[dict[str, Any]] = None
    new_values: Optional[dict[str, Any]] = None
    ip_address: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# Convenience alias — PaginatedResponse[AuditLogRead]
AuditLogListResponse = PaginatedResponse[AuditLogRead]
