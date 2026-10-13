from __future__ import annotations

"""School-admin endpoints for role (module access) management and user registration."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.tenant import CurrentUser, get_current_user, get_school_admin
from app.schemas.common import SuccessResponse
from app.schemas.user import (
    ModuleOption,
    RoleModuleCreate,
    RoleModuleResponse,
    RoleModuleUpdate,
    SchoolUserCreate,
    SchoolUserResponse,
)
from app.services import role_admin_service

router = APIRouter(prefix="/settings", tags=["Roles & Access"])


# ── Assignable modules ─────────────────────────────────────────────────────────

@router.get("/assignable-modules", response_model=SuccessResponse[list[ModuleOption]])
def list_assignable_modules(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_school_admin),
):
    """Modules enabled for this school — the pool an admin can grant to roles."""
    data = role_admin_service.list_enabled_module_options(db, current_user.school_id)
    return SuccessResponse(data=[ModuleOption(**m) for m in data])


# ── Roles CRUD ──────────────────────────────────────────────────────────────

@router.get("/roles", response_model=SuccessResponse[list[RoleModuleResponse]])
def list_roles(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_school_admin),
):
    data = role_admin_service.list_roles(db, current_user.school_id)
    return SuccessResponse(data=[RoleModuleResponse(**r) for r in data])


@router.post("/roles", response_model=SuccessResponse[RoleModuleResponse])
def create_role(
    payload: RoleModuleCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_school_admin),
):
    data = role_admin_service.create_role(
        db,
        current_user.school_id,
        name=payload.name,
        description=payload.description,
        module_keys=payload.module_keys,
        actor_email=current_user.email,
    )
    return SuccessResponse(data=RoleModuleResponse(**data), message="Role created")


@router.patch("/roles/{role_id}", response_model=SuccessResponse[RoleModuleResponse])
def update_role(
    role_id: UUID,
    payload: RoleModuleUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_school_admin),
):
    data = role_admin_service.update_role(
        db,
        current_user.school_id,
        role_id,
        name=payload.name,
        description=payload.description,
        module_keys=payload.module_keys,
        actor_email=current_user.email,
    )
    return SuccessResponse(data=RoleModuleResponse(**data), message="Role updated")


@router.delete("/roles/{role_id}", response_model=SuccessResponse[dict])
def delete_role(
    role_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_school_admin),
):
    role_admin_service.delete_role(db, current_user.school_id, role_id, actor_email=current_user.email)
    return SuccessResponse(data={}, message="Role deleted")


# ── User registration & listing ────────────────────────────────────────────

@router.get("/users", response_model=SuccessResponse[list[SchoolUserResponse]])
def list_users(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_school_admin),
):
    data = role_admin_service.list_school_users(db, current_user.school_id)
    return SuccessResponse(data=[SchoolUserResponse(**u) for u in data])


@router.post("/users", response_model=SuccessResponse[SchoolUserResponse])
def create_user(
    payload: SchoolUserCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_school_admin),
):
    data = role_admin_service.create_school_user(
        db,
        current_user.school_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        password=payload.password,
        user_type=payload.user_type,
        role_id=payload.role_id,
        actor_email=current_user.email,
        actor_id=current_user.user_id,
    )
    return SuccessResponse(data=SchoolUserResponse(**data), message="User created")


# ── Current user's effective modules ────────────────────────────────────────

@router.get("/my-modules", response_model=SuccessResponse[dict])
def my_modules(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Modules the logged-in user can access (role grants ∩ school-enabled)."""
    from app.models.user import User
    user = db.query(User).filter(User.id == current_user.user_id).first()
    if not user:
        return SuccessResponse(data={"modules": []})
    return SuccessResponse(data={"modules": role_admin_service.get_effective_module_keys(db, user)})
