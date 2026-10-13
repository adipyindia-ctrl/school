from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Vehicle ───────────────────────────────────────────────────────────────────

VEHICLE_TYPES = ("BUS", "VAN", "AUTO", "OTHER")


class VehicleCreate(BaseModel):
    vehicle_number: str = Field(..., min_length=1, max_length=30)
    vehicle_type: Optional[str] = Field(None, description="BUS | VAN | AUTO | OTHER")
    driver_name: Optional[str] = Field(None, max_length=150)
    driver_contact: Optional[str] = Field(None, max_length=30)
    seating_capacity: int = Field(40, ge=1, le=200)


class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = Field(None, min_length=1, max_length=30)
    vehicle_type: Optional[str] = None
    driver_name: Optional[str] = None
    driver_contact: Optional[str] = None
    seating_capacity: Optional[int] = Field(None, ge=1, le=200)
    is_active: Optional[bool] = None


class VehicleResponse(BaseModel):
    id: UUID
    school_id: UUID
    vehicle_number: str
    vehicle_type: Optional[str] = None
    driver_name: Optional[str] = None
    driver_contact: Optional[str] = None
    seating_capacity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── RouteStop ─────────────────────────────────────────────────────────────────

class RouteStopCreate(BaseModel):
    stop_name: str = Field(..., min_length=1, max_length=200)
    stop_order: int = Field(0, ge=0)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    morning_pickup_time: Optional[str] = Field(None, description="HH:MM format")
    evening_dropoff_time: Optional[str] = Field(None, description="HH:MM format")


class RouteStopUpdate(BaseModel):
    stop_name: Optional[str] = Field(None, min_length=1, max_length=200)
    stop_order: Optional[int] = Field(None, ge=0)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    morning_pickup_time: Optional[str] = None
    evening_dropoff_time: Optional[str] = None


class RouteStopResponse(BaseModel):
    id: UUID
    route_id: UUID
    school_id: UUID
    stop_name: str
    stop_order: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    morning_pickup_time: Optional[str] = None
    evening_dropoff_time: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Route ─────────────────────────────────────────────────────────────────────

class RouteCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    stops: list[RouteStopCreate] = []


class RouteUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RouteResponse(BaseModel):
    id: UUID
    school_id: UUID
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RouteDetailResponse(RouteResponse):
    stops: list[RouteStopResponse] = []


# ── TransportAssignment ───────────────────────────────────────────────────────

class TransportAssignCreate(BaseModel):
    student_id: UUID
    vehicle_id: UUID
    route_id: UUID
    stop_id: Optional[UUID] = None
    academic_session_id: UUID


class TransportAssignResponse(BaseModel):
    id: UUID
    school_id: UUID
    student_id: UUID
    vehicle_id: UUID
    route_id: UUID
    stop_id: Optional[UUID] = None
    academic_session_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Parent portal info ────────────────────────────────────────────────────────

class StudentTransportInfo(BaseModel):
    """Returned to parent portal for a student's transport details."""
    assignment_id: UUID
    vehicle_number: str
    vehicle_type: Optional[str] = None
    driver_name: Optional[str] = None
    driver_contact: Optional[str] = None
    route_name: str
    stop_name: Optional[str] = None
    morning_pickup_time: Optional[str] = None
    evening_dropoff_time: Optional[str] = None
