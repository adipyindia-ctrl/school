from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenant import CurrentUser, get_super_admin
from app.schemas.common import SuccessResponse
from app.services.school_service import get_platform_stats

router = APIRouter(prefix="/platform", tags=["Platform – Dashboard"])


@router.get("/dashboard", response_model=SuccessResponse[dict])
def platform_dashboard(
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_super_admin),
):
    stats = get_platform_stats(db)
    return SuccessResponse(data=stats)
