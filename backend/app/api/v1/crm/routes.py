from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Permissions
from app.core.tenant import CurrentUser, require_permission
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.crm import (
    FollowUpCreate, FollowUpResponse,
    FunnelStats,
    LeadCreate, LeadResponse, LeadUpdate,
)
from app.services import crm_service

router = APIRouter(prefix="/crm", tags=["Admission CRM"])


@router.get("/leads", response_model=PaginatedResponse[LeadResponse])
def list_leads(
    stage: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.CRM_VIEW)),
):
    result = crm_service.list_leads(
        db, current_user.school_id,
        stage=stage, search=search, page=page, page_size=page_size,
    )
    return PaginatedResponse(
        data=[LeadResponse.model_validate(l) for l in result["data"]],
        total=result["total"], page=result["page"],
        page_size=result["page_size"], total_pages=result["total_pages"],
    )


@router.get("/leads/kanban", response_model=SuccessResponse[dict])
def kanban_leads(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.CRM_VIEW)),
):
    grouped = crm_service.list_all_leads_by_stage(db, current_user.school_id)
    return SuccessResponse(data={
        stage: [LeadResponse.model_validate(l).model_dump() for l in leads]
        for stage, leads in grouped.items()
    })


@router.post("/leads", response_model=SuccessResponse[LeadResponse], status_code=201)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.CRM_CREATE)),
):
    lead = crm_service.create_lead(db, current_user.school_id, payload)
    return SuccessResponse(data=LeadResponse.model_validate(lead), message="Lead created")


@router.get("/leads/{lead_id}", response_model=SuccessResponse[LeadResponse])
def get_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.CRM_VIEW)),
):
    lead = crm_service.get_lead_or_404(db, current_user.school_id, lead_id)
    return SuccessResponse(data=LeadResponse.model_validate(lead))


@router.patch("/leads/{lead_id}", response_model=SuccessResponse[LeadResponse])
def update_lead(
    lead_id: UUID,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.CRM_EDIT)),
):
    lead = crm_service.update_lead(db, current_user.school_id, lead_id, payload)
    return SuccessResponse(data=LeadResponse.model_validate(lead))


@router.delete("/leads/{lead_id}", response_model=SuccessResponse[dict])
def delete_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.CRM_MANAGE)),
):
    crm_service.delete_lead(db, current_user.school_id, lead_id)
    return SuccessResponse(data={}, message="Lead archived")


@router.post("/leads/{lead_id}/convert", response_model=SuccessResponse[dict])
def convert_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.CRM_MANAGE)),
):
    data = crm_service.convert_lead_to_student(db, current_user.school_id, lead_id)
    return SuccessResponse(data=data, message="Lead marked as admitted. Use data to create student.")


@router.get("/leads/{lead_id}/follow-ups", response_model=SuccessResponse[list[FollowUpResponse]])
def list_follow_ups(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.CRM_VIEW)),
):
    fus = crm_service.list_follow_ups(db, current_user.school_id, lead_id)
    return SuccessResponse(data=[FollowUpResponse.model_validate(f) for f in fus])


@router.post("/leads/{lead_id}/follow-ups", response_model=SuccessResponse[FollowUpResponse], status_code=201)
def create_follow_up(
    lead_id: UUID,
    payload: FollowUpCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.CRM_EDIT)),
):
    fu = crm_service.create_follow_up(
        db, current_user.school_id, lead_id, payload, current_user.user_id
    )
    return SuccessResponse(data=FollowUpResponse.model_validate(fu), message="Follow-up logged")


@router.get("/funnel", response_model=SuccessResponse[list[FunnelStats]])
def funnel_stats(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.CRM_VIEW)),
):
    stats = crm_service.get_funnel_stats(db, current_user.school_id)
    return SuccessResponse(data=stats)
