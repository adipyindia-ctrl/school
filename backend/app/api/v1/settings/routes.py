from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Permissions
from app.core.tenant import CurrentUser, get_current_user, require_permission
from app.schemas.common import SuccessResponse
from app.schemas.school import BrandingResponse, BrandingUpdate, SettingsResponse, SettingsUpdate
from app.services import school_service

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/branding", response_model=SuccessResponse[BrandingResponse])
def get_branding(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    school = school_service.get_school_or_404(db, current_user.school_id)
    if not school.branding:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Branding not configured")
    return SuccessResponse(data=BrandingResponse.model_validate(school.branding))


@router.patch("/branding", response_model=SuccessResponse[BrandingResponse])
def update_branding(
    payload: BrandingUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.SETTINGS_BRANDING)),
):
    branding = school_service.update_branding(db, current_user.school_id, payload, actor_email=current_user.email)
    return SuccessResponse(data=BrandingResponse.model_validate(branding), message="Branding updated")


@router.get("/general", response_model=SuccessResponse[SettingsResponse])
def get_settings(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    school = school_service.get_school_or_404(db, current_user.school_id)
    if not school.settings:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Settings not configured")
    return SuccessResponse(data=SettingsResponse.model_validate(school.settings))


@router.patch("/general", response_model=SuccessResponse[SettingsResponse])
def update_settings(
    payload: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.SETTINGS_MANAGE)),
):
    settings = school_service.update_settings(db, current_user.school_id, payload, actor_email=current_user.email)
    return SuccessResponse(data=SettingsResponse.model_validate(settings), message="Settings updated")


@router.get("/modules", response_model=SuccessResponse[dict])
def get_enabled_modules(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Returns the list of enabled module keys for the authenticated user's school.
    Used by the frontend to populate the tenant store without an extra public resolve call."""
    from app.models.subscription import SchoolModule, Module as ModuleModel
    rows = (
        db.query(ModuleModel.key)
        .join(SchoolModule, SchoolModule.module_id == ModuleModel.id)
        .filter(
            SchoolModule.school_id == current_user.school_id,
            SchoolModule.is_enabled == True,
        )
        .all()
    )
    return SuccessResponse(data={"enabled_modules": [r.key for r in rows]})


@router.get("/subscription-status", response_model=SuccessResponse[dict])
def get_subscription_status(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Returns current subscription info and student/teacher usage vs plan limits."""
    from app.services.subscription_service import get_usage_summary
    return SuccessResponse(data=get_usage_summary(db, current_user.school_id))


@router.get("/audit-logs", response_model=SuccessResponse[dict])
def list_audit_logs(
    action: str | None = None,
    resource_type: str | None = None,
    actor_email: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.AUDIT_VIEW)),
):
    """Paginated, filterable audit log for the current school."""
    import math
    from datetime import datetime
    from app.models.audit import AuditLog

    q = db.query(AuditLog).filter(AuditLog.school_id == current_user.school_id)
    if action:
        q = q.filter(AuditLog.action == action)
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)
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
                "actor_email": log.actor_email,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "description": log.description,
                "ip_address": log.ip_address,
                "old_values": log.old_values,
                "new_values": log.new_values,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    })


@router.get("/audit-logs/export")
def export_audit_logs_csv(
    action: str | None = None,
    resource_type: str | None = None,
    actor_email: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.AUDIT_VIEW)),
):
    """Export audit logs to CSV (max 5000 rows)."""
    import csv
    import io
    from datetime import datetime
    from fastapi.responses import StreamingResponse
    from app.models.audit import AuditLog

    q = db.query(AuditLog).filter(AuditLog.school_id == current_user.school_id)
    if action:
        q = q.filter(AuditLog.action == action)
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)
    if actor_email:
        q = q.filter(AuditLog.actor_email.ilike(f"%{actor_email}%"))
    if date_from:
        q = q.filter(AuditLog.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        q = q.filter(AuditLog.created_at <= datetime.fromisoformat(date_to + "T23:59:59"))

    logs = q.order_by(AuditLog.created_at.desc()).limit(5000).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "Actor", "Action", "Resource Type", "Resource ID", "Description", "IP Address"])
    for log in logs:
        writer.writerow([
            log.created_at.isoformat(),
            log.actor_email,
            log.action,
            log.resource_type or "",
            log.resource_id or "",
            log.description or "",
            log.ip_address or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_logs.csv"},
    )
