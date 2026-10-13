from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Modules, Permissions
from app.core.tenant import CurrentUser, require_module, require_permission
from app.schemas.common import SuccessResponse
from app.services import certificate_service

router = APIRouter(prefix="/certificates", tags=["Certificates"])

VALID_TYPES = {"bonafide", "transfer", "character"}


@router.get("/student/{student_id}", response_model=SuccessResponse[dict])
def get_certificate_data(
    student_id: UUID,
    cert_type: str = Query(..., description="bonafide | transfer | character"),
    issue_date: Optional[date] = Query(None),
    reason: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.CERTIFICATES_GENERATE)),
):
    if cert_type not in VALID_TYPES:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"cert_type must be one of: {', '.join(VALID_TYPES)}")

    data = certificate_service.get_certificate_data(
        db,
        school_id=current_user.school_id,
        student_id=student_id,
        cert_type=cert_type,
        issue_date=issue_date,
        reason=reason,
    )
    return SuccessResponse(data=data)
