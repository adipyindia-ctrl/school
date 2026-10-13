from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.tenant import CurrentUser, get_super_admin
from app.models.subscription import Module, PlanModule, SchoolSubscription, SubscriptionPlan
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/platform/plans", tags=["Platform – Plans"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ModuleInfo(BaseModel):
    id: UUID
    key: str
    name: str
    description: Optional[str] = None
    is_core: bool

    model_config = {"from_attributes": True}


class PlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = 0
    billing_cycle: str = "monthly"
    max_students: int = 500
    max_teachers: int = 50
    storage_mb: int = 1024
    sms_limit: int = 0
    trial_days: int = 30
    display_order: int = 0


class PlanResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    price: float
    billing_cycle: str
    max_students: int
    max_teachers: int
    storage_mb: int
    sms_limit: int
    trial_days: int
    is_active: bool
    display_order: int
    modules: list[ModuleInfo] = []

    model_config = {"from_attributes": True}


class AddModulePayload(BaseModel):
    module_key: str


# ── Helper ────────────────────────────────────────────────────────────────────

def _plan_to_response(plan: SubscriptionPlan) -> PlanResponse:
    modules = [
        ModuleInfo.model_validate(pm.module)
        for pm in plan.plan_modules
        if pm.module is not None
    ]
    data = PlanResponse.model_validate(plan)
    data.modules = modules
    return data


def _get_plan_with_modules(db: Session, plan_id: UUID) -> SubscriptionPlan:
    plan = (
        db.query(SubscriptionPlan)
        .options(joinedload(SubscriptionPlan.plan_modules).joinedload(PlanModule.module))
        .filter(SubscriptionPlan.id == plan_id)
        .first()
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=SuccessResponse[list[PlanResponse]])
def list_plans(db: Session = Depends(get_db), _: CurrentUser = Depends(get_super_admin)):
    plans = (
        db.query(SubscriptionPlan)
        .options(joinedload(SubscriptionPlan.plan_modules).joinedload(PlanModule.module))
        .filter(SubscriptionPlan.is_active == True)
        .order_by(SubscriptionPlan.display_order)
        .all()
    )
    return SuccessResponse(data=[_plan_to_response(p) for p in plans])


@router.post("", response_model=SuccessResponse[PlanResponse], status_code=201)
def create_plan(
    payload: PlanCreate,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_super_admin),
):
    plan = SubscriptionPlan(**payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    # Reload with modules relationship
    plan = _get_plan_with_modules(db, plan.id)
    return SuccessResponse(data=_plan_to_response(plan), message="Plan created")


@router.patch("/{plan_id}", response_model=SuccessResponse[PlanResponse])
def update_plan(
    plan_id: UUID,
    payload: PlanCreate,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_super_admin),
):
    plan = _get_plan_with_modules(db, plan_id)
    for k, v in payload.model_dump().items():
        setattr(plan, k, v)
    db.commit()
    db.refresh(plan)
    plan = _get_plan_with_modules(db, plan_id)
    return SuccessResponse(data=_plan_to_response(plan))


@router.delete("/{plan_id}", response_model=SuccessResponse[dict])
def delete_plan(
    plan_id: UUID,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_super_admin),
):
    """Soft-delete a plan by setting is_active=False.
    Returns 400 if any active school subscriptions use this plan
    AND the school itself has not been deleted."""
    from app.models.school import School

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Only block if the subscribing school is still active (not soft-deleted)
    active_subs = (
        db.query(SchoolSubscription)
        .join(School, School.id == SchoolSubscription.school_id)
        .filter(
            SchoolSubscription.plan_id == plan_id,
            SchoolSubscription.status.in_(["active", "trial"]),
            School.deleted_at == None,   # ignore subscriptions of deleted schools
        )
        .count()
    )
    if active_subs > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete plan: {active_subs} active school(s) are using it.",
        )

    plan.is_active = False
    db.commit()
    return SuccessResponse(data={}, message="Plan deleted")


@router.get("/{plan_id}/modules", response_model=SuccessResponse[list[ModuleInfo]])
def list_plan_modules(
    plan_id: UUID,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_super_admin),
):
    """List all modules assigned to a plan."""
    plan = _get_plan_with_modules(db, plan_id)
    modules = [
        ModuleInfo.model_validate(pm.module)
        for pm in plan.plan_modules
        if pm.module is not None
    ]
    return SuccessResponse(data=modules)


@router.post("/{plan_id}/modules", response_model=SuccessResponse[ModuleInfo], status_code=201)
def add_plan_module(
    plan_id: UUID,
    payload: AddModulePayload,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_super_admin),
):
    """Add a module to a plan. Returns 404 if module_key not found, 409 if already assigned."""
    # Verify plan exists
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Verify module exists
    module = db.query(Module).filter(Module.key == payload.module_key).first()
    if not module:
        raise HTTPException(status_code=404, detail=f"Module '{payload.module_key}' not found")

    # Check if already assigned
    existing = (
        db.query(PlanModule)
        .filter(PlanModule.plan_id == plan_id, PlanModule.module_id == module.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Module '{payload.module_key}' is already assigned to this plan",
        )

    db.add(PlanModule(plan_id=plan_id, module_id=module.id))
    db.commit()
    return SuccessResponse(data=ModuleInfo.model_validate(module), message="Module added to plan")


@router.delete("/{plan_id}/modules/{module_key}", response_model=SuccessResponse[dict])
def remove_plan_module(
    plan_id: UUID,
    module_key: str,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_super_admin),
):
    """Remove a module from a plan. Returns 404 if not assigned."""
    # Verify plan exists
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    module = db.query(Module).filter(Module.key == module_key).first()
    if not module:
        raise HTTPException(status_code=404, detail=f"Module '{module_key}' not found")

    pm = (
        db.query(PlanModule)
        .filter(PlanModule.plan_id == plan_id, PlanModule.module_id == module.id)
        .first()
    )
    if not pm:
        raise HTTPException(
            status_code=404,
            detail=f"Module '{module_key}' is not assigned to this plan",
        )

    db.delete(pm)
    db.commit()
    return SuccessResponse(data={}, message="Module removed from plan")


@router.get("/{plan_id}/schools", response_model=SuccessResponse[list])
def get_plan_schools(
    plan_id: UUID,
    db: Session = Depends(get_db),
    _: CurrentUser = Depends(get_super_admin),
):
    """Return all active (non-deleted) schools subscribed to this plan."""
    from app.models.school import School

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    rows = (
        db.query(School, SchoolSubscription.status, SchoolSubscription.end_date)
        .join(SchoolSubscription, SchoolSubscription.school_id == School.id)
        .filter(
            SchoolSubscription.plan_id == plan_id,
            School.deleted_at == None,
        )
        .order_by(School.name)
        .all()
    )

    return SuccessResponse(data=[
        {
            "id": str(school.id),
            "name": school.name,
            "slug": school.slug,
            "code": school.code,
            "city": school.city,
            "state": school.state,
            "status": school.status,
            "subscription_status": sub_status,
            "subscription_end": end_date.isoformat() if end_date else None,
        }
        for school, sub_status, end_date in rows
    ])
