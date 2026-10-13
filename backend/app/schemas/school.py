from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator, model_validator


# ── School ────────────────────────────────────────────────────────────────────

class SchoolBase(BaseModel):
    name: str
    code: str
    school_type: str = "cbse"
    established_year: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    pincode: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def _empty_str_to_none(cls, values: dict) -> dict:
        """Coerce empty strings to None for all optional string/email fields."""
        if not isinstance(values, dict):
            return values  # ORM object — skip, Pydantic handles field extraction
        str_optional_fields = {
            "phone", "email", "website", "address", "city",
            "state", "pincode",
        }
        for field in str_optional_fields:
            if field in values and values[field] == "":
                values[field] = None
        # established_year: 0 or falsy int → None
        if values.get("established_year") == 0:
            values["established_year"] = None
        return values


class SchoolCreate(SchoolBase):
    slug: str

    @field_validator("slug")
    @classmethod
    def slug_format(cls, v: str) -> str:
        import re
        if not re.match(r"^[a-z0-9-]+$", v):
            raise ValueError("Slug must contain only lowercase letters, numbers, and hyphens")
        return v


class SchoolUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    school_type: Optional[str] = None
    established_year: Optional[int] = None
    custom_domain: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def _empty_str_to_none(cls, values: dict) -> dict:
        if not isinstance(values, dict):
            return values
        str_optional_fields = {
            "phone", "email", "website", "address", "city",
            "state", "pincode", "custom_domain",
        }
        for field in str_optional_fields:
            if field in values and values[field] == "":
                values[field] = None
        if values.get("established_year") == 0:
            values["established_year"] = None
        return values


class SchoolResponse(SchoolBase):
    id: UUID
    slug: str
    status: str
    custom_domain: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SchoolDetailResponse(SchoolResponse):
    branding: Optional["BrandingResponse"] = None
    settings: Optional["SettingsResponse"] = None


# ── Branding ──────────────────────────────────────────────────────────────────

class BrandingUpdate(BaseModel):
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    sidebar_color: Optional[str] = None
    accent_color: Optional[str] = None
    font_family: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    login_bg_url: Optional[str] = None
    dashboard_logo_url: Optional[str] = None
    welcome_message: Optional[str] = None
    footer_text: Optional[str] = None
    support_phone: Optional[str] = None
    support_email: Optional[EmailStr] = None

    @model_validator(mode="before")
    @classmethod
    def _empty_str_to_none(cls, values: dict) -> dict:
        if not isinstance(values, dict):
            return values
        for field in list(values.keys()):
            if isinstance(values.get(field), str) and values[field] == "":
                values[field] = None
        return values


class BrandingResponse(BrandingUpdate):
    id: UUID
    school_id: UUID
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Settings ──────────────────────────────────────────────────────────────────

class SettingsUpdate(BaseModel):
    academic_year_start_month: Optional[int] = None
    attendance_threshold: Optional[float] = None
    fee_due_day: Optional[int] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    date_format: Optional[str] = None


class SettingsResponse(SettingsUpdate):
    id: UUID
    school_id: UUID
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Onboarding wizard payload ─────────────────────────────────────────────────

class AdminAccountCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str

    @model_validator(mode="before")
    @classmethod
    def _empty_str_to_none(cls, values: dict) -> dict:
        if not isinstance(values, dict):
            return values
        if values.get("phone") == "":
            values["phone"] = None
        return values

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class OnboardingCreate(BaseModel):
    # Step 1
    school: SchoolCreate
    # Step 2
    branding: Optional[BrandingUpdate] = None
    # Step 3 – handled separately after school creation
    # Step 4
    admin: AdminAccountCreate
    # Step 5
    enabled_modules: list[str] = []
    # Step 6
    plan_id: Optional[UUID] = None
