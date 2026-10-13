from __future__ import annotations

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    school_slug: Optional[str] = None  # Optional: used to scope login to a school


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserSummary"


class UserSummary(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    user_type: str
    school_id: Optional[UUID] = None
    permissions: list[str] = []
    modules: list[str] = []  # module keys the user can access (role grants ∩ school-enabled)

    model_config = {"from_attributes": True}


class RefreshRequest(BaseModel):
    # Token comes from HttpOnly cookie; this body is empty
    pass


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# ── Impersonation ─────────────────────────────────────────────────────────────

class ImpersonatedUserInfo(BaseModel):
    id: str
    email: str
    name: str
    role: str


class ImpersonatedSchoolInfo(BaseModel):
    id: str
    name: str
    slug: str


class ImpersonationResponse(BaseModel):
    """Response payload from POST /platform/schools/{id}/impersonate."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds — always 3600 (1 hour)
    impersonated_user: ImpersonatedUserInfo
    school: ImpersonatedSchoolInfo
