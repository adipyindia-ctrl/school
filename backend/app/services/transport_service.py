from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.transport import Route, RouteStop, TransportAssignment, Vehicle
from app.schemas.transport import (
    RouteCreate,
    RouteStopCreate,
    RouteStopUpdate,
    RouteUpdate,
    StudentTransportInfo,
    TransportAssignCreate,
    VehicleCreate,
    VehicleUpdate,
)
from app.services.audit_service import log_action


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_vehicle_or_404(db: Session, school_id: UUID, vehicle_id: UUID) -> Vehicle:
    v = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id, Vehicle.school_id == school_id, Vehicle.deleted_at.is_(None))
        .first()
    )
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return v


def _get_route_or_404(db: Session, school_id: UUID, route_id: UUID) -> Route:
    r = (
        db.query(Route)
        .filter(Route.id == route_id, Route.school_id == school_id, Route.deleted_at.is_(None))
        .first()
    )
    if not r:
        raise HTTPException(status_code=404, detail="Route not found")
    return r


def _get_stop_or_404(db: Session, school_id: UUID, stop_id: UUID) -> RouteStop:
    s = (
        db.query(RouteStop)
        .filter(RouteStop.id == stop_id, RouteStop.school_id == school_id)
        .first()
    )
    if not s:
        raise HTTPException(status_code=404, detail="Route stop not found")
    return s


def _get_assignment_or_404(db: Session, school_id: UUID, assignment_id: UUID) -> TransportAssignment:
    a = (
        db.query(TransportAssignment)
        .filter(
            TransportAssignment.id == assignment_id,
            TransportAssignment.school_id == school_id,
            TransportAssignment.deleted_at.is_(None),
        )
        .first()
    )
    if not a:
        raise HTTPException(status_code=404, detail="Transport assignment not found")
    return a


# ── Vehicle CRUD ──────────────────────────────────────────────────────────────

def list_vehicles(
    db: Session,
    school_id: UUID,
    page: int = 1,
    page_size: int = 50,
) -> dict:
    q = (
        db.query(Vehicle)
        .filter(Vehicle.school_id == school_id, Vehicle.deleted_at.is_(None))
        .order_by(Vehicle.vehicle_number)
    )
    total = q.count()
    data = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "data": data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


def get_vehicle(db: Session, school_id: UUID, vehicle_id: UUID) -> Vehicle:
    return _get_vehicle_or_404(db, school_id, vehicle_id)


def create_vehicle(
    db: Session,
    school_id: UUID,
    payload: VehicleCreate,
    actor_id: Optional[UUID] = None,
    actor_email: str = "system",
) -> Vehicle:
    # Check duplicate vehicle number within school
    existing = (
        db.query(Vehicle)
        .filter(
            Vehicle.school_id == school_id,
            Vehicle.vehicle_number == payload.vehicle_number,
            Vehicle.deleted_at.is_(None),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Vehicle number already exists for this school")

    v = Vehicle(school_id=school_id, **payload.model_dump())
    db.add(v)
    db.flush()
    log_action(
        db,
        action="transport.vehicle.create",
        actor_id=actor_id,
        actor_email=actor_email,
        school_id=school_id,
        resource_type="Vehicle",
        resource_id=v.id,
        new_values=payload.model_dump(),
    )
    db.commit()
    db.refresh(v)
    return v


def update_vehicle(
    db: Session,
    school_id: UUID,
    vehicle_id: UUID,
    payload: VehicleUpdate,
    actor_id: Optional[UUID] = None,
    actor_email: str = "system",
) -> Vehicle:
    v = _get_vehicle_or_404(db, school_id, vehicle_id)
    old_values = {k: getattr(v, k) for k in payload.model_fields}
    for k, val in payload.model_dump(exclude_none=True).items():
        setattr(v, k, val)
    log_action(
        db,
        action="transport.vehicle.update",
        actor_id=actor_id,
        actor_email=actor_email,
        school_id=school_id,
        resource_type="Vehicle",
        resource_id=vehicle_id,
        old_values=old_values,
        new_values=payload.model_dump(exclude_none=True),
    )
    db.commit()
    db.refresh(v)
    return v


def delete_vehicle(
    db: Session,
    school_id: UUID,
    vehicle_id: UUID,
    actor_id: Optional[UUID] = None,
    actor_email: str = "system",
) -> None:
    v = _get_vehicle_or_404(db, school_id, vehicle_id)
    v.deleted_at = datetime.now(timezone.utc)
    v.is_active = False
    log_action(
        db,
        action="transport.vehicle.delete",
        actor_id=actor_id,
        actor_email=actor_email,
        school_id=school_id,
        resource_type="Vehicle",
        resource_id=vehicle_id,
    )
    db.commit()


# ── Route CRUD ────────────────────────────────────────────────────────────────

def list_routes(
    db: Session,
    school_id: UUID,
    page: int = 1,
    page_size: int = 50,
) -> dict:
    q = (
        db.query(Route)
        .filter(Route.school_id == school_id, Route.deleted_at.is_(None))
        .order_by(Route.name)
    )
    total = q.count()
    data = q.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "data": data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


def get_route(db: Session, school_id: UUID, route_id: UUID) -> Route:
    return _get_route_or_404(db, school_id, route_id)


def create_route(
    db: Session,
    school_id: UUID,
    payload: RouteCreate,
    actor_id: Optional[UUID] = None,
    actor_email: str = "system",
) -> Route:
    route = Route(school_id=school_id, name=payload.name, description=payload.description)
    db.add(route)
    db.flush()
    # Create stops in order
    for stop in payload.stops:
        db.add(RouteStop(route_id=route.id, school_id=school_id, **stop.model_dump()))
    log_action(
        db,
        action="transport.route.create",
        actor_id=actor_id,
        actor_email=actor_email,
        school_id=school_id,
        resource_type="Route",
        resource_id=route.id,
        new_values={"name": payload.name, "stops_count": len(payload.stops)},
    )
    db.commit()
    db.refresh(route)
    return route


def update_route(
    db: Session,
    school_id: UUID,
    route_id: UUID,
    payload: RouteUpdate,
    actor_id: Optional[UUID] = None,
    actor_email: str = "system",
) -> Route:
    route = _get_route_or_404(db, school_id, route_id)
    old_values = {k: getattr(route, k) for k in payload.model_fields}
    for k, val in payload.model_dump(exclude_none=True).items():
        setattr(route, k, val)
    log_action(
        db,
        action="transport.route.update",
        actor_id=actor_id,
        actor_email=actor_email,
        school_id=school_id,
        resource_type="Route",
        resource_id=route_id,
        old_values=old_values,
        new_values=payload.model_dump(exclude_none=True),
    )
    db.commit()
    db.refresh(route)
    return route


def delete_route(
    db: Session,
    school_id: UUID,
    route_id: UUID,
    actor_id: Optional[UUID] = None,
    actor_email: str = "system",
) -> None:
    route = _get_route_or_404(db, school_id, route_id)
    route.deleted_at = datetime.now(timezone.utc)
    route.is_active = False
    log_action(
        db,
        action="transport.route.delete",
        actor_id=actor_id,
        actor_email=actor_email,
        school_id=school_id,
        resource_type="Route",
        resource_id=route_id,
    )
    db.commit()


# ── RouteStop CRUD ────────────────────────────────────────────────────────────

def list_stops(db: Session, school_id: UUID, route_id: UUID) -> list[RouteStop]:
    # Validate route belongs to school
    _get_route_or_404(db, school_id, route_id)
    return (
        db.query(RouteStop)
        .filter(RouteStop.route_id == route_id, RouteStop.school_id == school_id)
        .order_by(RouteStop.stop_order)
        .all()
    )


def create_stop(
    db: Session,
    school_id: UUID,
    route_id: UUID,
    payload: RouteStopCreate,
    actor_id: Optional[UUID] = None,
    actor_email: str = "system",
) -> RouteStop:
    _get_route_or_404(db, school_id, route_id)
    stop = RouteStop(route_id=route_id, school_id=school_id, **payload.model_dump())
    db.add(stop)
    db.flush()
    log_action(
        db,
        action="transport.stop.create",
        actor_id=actor_id,
        actor_email=actor_email,
        school_id=school_id,
        resource_type="RouteStop",
        resource_id=stop.id,
        new_values=payload.model_dump(),
    )
    db.commit()
    db.refresh(stop)
    return stop


def update_stop(
    db: Session,
    school_id: UUID,
    stop_id: UUID,
    payload: RouteStopUpdate,
    actor_id: Optional[UUID] = None,
    actor_email: str = "system",
) -> RouteStop:
    stop = _get_stop_or_404(db, school_id, stop_id)
    old_values = {k: getattr(stop, k) for k in payload.model_fields}
    for k, val in payload.model_dump(exclude_none=True).items():
        setattr(stop, k, val)
    log_action(
        db,
        action="transport.stop.update",
        actor_id=actor_id,
        actor_email=actor_email,
        school_id=school_id,
        resource_type="RouteStop",
        resource_id=stop_id,
        old_values=old_values,
        new_values=payload.model_dump(exclude_none=True),
    )
    db.commit()
    db.refresh(stop)
    return stop


def delete_stop(
    db: Session,
    school_id: UUID,
    stop_id: UUID,
    actor_id: Optional[UUID] = None,
    actor_email: str = "system",
) -> None:
    stop = _get_stop_or_404(db, school_id, stop_id)
    log_action(
        db,
        action="transport.stop.delete",
        actor_id=actor_id,
        actor_email=actor_email,
        school_id=school_id,
        resource_type="RouteStop",
        resource_id=stop_id,
    )
    db.delete(stop)
    db.commit()


# ── TransportAssignment CRUD ──────────────────────────────────────────────────

def list_assignments(
    db: Session,
    school_id: UUID,
    student_id: Optional[UUID] = None,
    route_id: Optional[UUID] = None,
    vehicle_id: Optional[UUID] = None,
    session_id: Optional[UUID] = None,
    page: int = 1,
    page_size: int = 50,
) -> dict:
    q = db.query(TransportAssignment).filter(
        TransportAssignment.school_id == school_id,
        TransportAssignment.deleted_at.is_(None),
    )
    if student_id:
        q = q.filter(TransportAssignment.student_id == student_id)
    if route_id:
        q = q.filter(TransportAssignment.route_id == route_id)
    if vehicle_id:
        q = q.filter(TransportAssignment.vehicle_id == vehicle_id)
    if session_id:
        q = q.filter(TransportAssignment.academic_session_id == session_id)
    total = q.count()
    data = q.order_by(TransportAssignment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "data": data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


def assign_transport(
    db: Session,
    school_id: UUID,
    payload: TransportAssignCreate,
    actor_id: Optional[UUID] = None,
    actor_email: str = "system",
) -> TransportAssignment:
    # Validate vehicle belongs to school
    vehicle = _get_vehicle_or_404(db, school_id, payload.vehicle_id)
    # Validate route belongs to school
    _get_route_or_404(db, school_id, payload.route_id)

    # Check if student already assigned for this session
    existing = (
        db.query(TransportAssignment)
        .filter(
            TransportAssignment.school_id == school_id,
            TransportAssignment.student_id == payload.student_id,
            TransportAssignment.academic_session_id == payload.academic_session_id,
            TransportAssignment.deleted_at.is_(None),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Student already has a transport assignment for this session")

    # Capacity check: count active assignments for this vehicle in this session
    current_count = (
        db.query(TransportAssignment)
        .filter(
            TransportAssignment.vehicle_id == payload.vehicle_id,
            TransportAssignment.academic_session_id == payload.academic_session_id,
            TransportAssignment.deleted_at.is_(None),
        )
        .count()
    )
    if current_count >= vehicle.seating_capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Vehicle is at full capacity ({vehicle.seating_capacity} seats). Cannot assign more students.",
        )

    ta = TransportAssignment(school_id=school_id, **payload.model_dump())
    db.add(ta)
    db.flush()
    log_action(
        db,
        action="transport.assignment.create",
        actor_id=actor_id,
        actor_email=actor_email,
        school_id=school_id,
        resource_type="TransportAssignment",
        resource_id=ta.id,
        new_values=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(ta)
    return ta


def unassign_transport(
    db: Session,
    school_id: UUID,
    assignment_id: UUID,
    actor_id: Optional[UUID] = None,
    actor_email: str = "system",
) -> None:
    ta = _get_assignment_or_404(db, school_id, assignment_id)
    ta.deleted_at = datetime.now(timezone.utc)
    ta.is_active = False
    log_action(
        db,
        action="transport.assignment.delete",
        actor_id=actor_id,
        actor_email=actor_email,
        school_id=school_id,
        resource_type="TransportAssignment",
        resource_id=assignment_id,
    )
    db.commit()


# ── Parent portal ─────────────────────────────────────────────────────────────

def get_student_transport_info(
    db: Session,
    school_id: UUID,
    student_id: UUID,
    session_id: UUID,
) -> Optional[StudentTransportInfo]:
    """Return transport info for a student — used by parent portal."""
    ta = (
        db.query(TransportAssignment)
        .filter(
            TransportAssignment.school_id == school_id,
            TransportAssignment.student_id == student_id,
            TransportAssignment.academic_session_id == session_id,
            TransportAssignment.deleted_at.is_(None),
        )
        .first()
    )
    if not ta:
        return None

    vehicle = db.query(Vehicle).filter(Vehicle.id == ta.vehicle_id).first()
    route = db.query(Route).filter(Route.id == ta.route_id).first()
    stop = db.query(RouteStop).filter(RouteStop.id == ta.stop_id).first() if ta.stop_id else None

    if not vehicle or not route:
        return None

    return StudentTransportInfo(
        assignment_id=ta.id,
        vehicle_number=vehicle.vehicle_number,
        vehicle_type=vehicle.vehicle_type,
        driver_name=vehicle.driver_name,
        driver_contact=vehicle.driver_contact,
        route_name=route.name,
        stop_name=stop.stop_name if stop else None,
        morning_pickup_time=stop.morning_pickup_time if stop else None,
        evening_dropoff_time=stop.evening_dropoff_time if stop else None,
    )
