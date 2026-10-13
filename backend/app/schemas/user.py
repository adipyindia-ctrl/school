from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    user_type: str = "staff"
    school_id: Optional[UUID] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    user_type: str
    school_id: Optional[UUID] = None
    photo_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permission_keys: list[str] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_keys: Optional[list[str]] = None


class RoleResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    is_system: bool
    permissions: list[str] = []

    model_config = {"from_attributes": True}


# ── Module-based roles (school-admin managed) ─────────────────────────────────

class RoleModuleCreate(BaseModel):
    """Create a per-school role and grant it a set of modules by key."""
    name: str
    description: Optional[str] = None
    module_keys: list[str] = []


class RoleModuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    module_keys: Optional[list[str]] = None


class RoleModuleResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    is_system: bool
    module_keys: list[str] = []
    user_count: int = 0


class ModuleOption(BaseModel):
    """A module the admin can assign to a role (only those enabled for the school)."""
    key: str
    name: str


# ── School-admin user registration ────────────────────────────────────────────

class SchoolUserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    user_type: str  # student | parent | teacher | staff
    role_id: UUID


class SchoolUserResponse(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    user_type: str
    is_active: bool
    role_id: Optional[UUID] = None
    role_name: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PermissionResponse(BaseModel):
    id: UUID
    key: str
    name: str
    module_key: Optional[str] = None

    model_config = {"from_attributes": True}


class AssignRoleRequest(BaseModel):
    role_id: UUID
