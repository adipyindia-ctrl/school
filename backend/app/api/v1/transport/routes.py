from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Modules, Permissions
from app.core.tenant import CurrentUser, require_module, require_permission
from app.schemas.common import PaginatedResponse, SuccessResponse
from app.schemas.transport import (
    RouteCreate,
    RouteDetailResponse,
    RouteResponse,
    RouteStopCreate,
    RouteStopResponse,
    RouteStopUpdate,
    RouteUpdate,
    StudentTransportInfo,
    TransportAssignCreate,
    TransportAssignResponse,
    VehicleCreate,
    VehicleResponse,
    VehicleUpdate,
)
from app.services import transport_service

router = APIRouter(prefix="/transport", tags=["Transport"])

# Helper to get both transport module and correct permission
def _transport_view():
    def dep(
        current_user: CurrentUser = Depends(require_module(Modules.TRANSPORT)),
        _perm: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_VIEW)),
    ) -> CurrentUser:
        return current_user
    return dep


def _transport_manage():
    def dep(
        current_user: CurrentUser = Depends(require_module(Modules.TRANSPORT)),
        _perm: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_MANAGE)),
    ) -> CurrentUser:
        return current_user
    return dep


# ── Vehicles ──────────────────────────────────────────────────────────────────

@router.get("/vehicles", response_model=PaginatedResponse[VehicleResponse])
def list_vehicles(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_VIEW)),
):
    result = transport_service.list_vehicles(db, current_user.school_id, page=page, page_size=page_size)
    return PaginatedResponse(
        data=[VehicleResponse.model_validate(v) for v in result["data"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
    )


@router.post("/vehicles", response_model=SuccessResponse[VehicleResponse], status_code=201)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_MANAGE)),
):
    vehicle = transport_service.create_vehicle(
        db, current_user.school_id, payload,
        actor_id=current_user.user_id, actor_email=current_user.email,
    )
    return SuccessResponse(data=VehicleResponse.model_validate(vehicle), message="Vehicle created")


@router.get("/vehicles/{vehicle_id}", response_model=SuccessResponse[VehicleResponse])
def get_vehicle(
    vehicle_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_VIEW)),
):
    vehicle = transport_service.get_vehicle(db, current_user.school_id, vehicle_id)
    return SuccessResponse(data=VehicleResponse.model_validate(vehicle))


@router.patch("/vehicles/{vehicle_id}", response_model=SuccessResponse[VehicleResponse])
def update_vehicle(
    vehicle_id: UUID,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_MANAGE)),
):
    vehicle = transport_service.update_vehicle(
        db, current_user.school_id, vehicle_id, payload,
        actor_id=current_user.user_id, actor_email=current_user.email,
    )
    return SuccessResponse(data=VehicleResponse.model_validate(vehicle))


@router.delete("/vehicles/{vehicle_id}", response_model=SuccessResponse[dict])
def delete_vehicle(
    vehicle_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_MANAGE)),
):
    transport_service.delete_vehicle(
        db, current_user.school_id, vehicle_id,
        actor_id=current_user.user_id, actor_email=current_user.email,
    )
    return SuccessResponse(data={}, message="Vehicle deactivated")


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/routes", response_model=PaginatedResponse[RouteResponse])
def list_routes(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_VIEW)),
):
    result = transport_service.list_routes(db, current_user.school_id, page=page, page_size=page_size)
    return PaginatedResponse(
        data=[RouteResponse.model_validate(r) for r in result["data"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
    )


@router.post("/routes", response_model=SuccessResponse[RouteResponse], status_code=201)
def create_route(
    payload: RouteCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_MANAGE)),
):
    route = transport_service.create_route(
        db, current_user.school_id, payload,
        actor_id=current_user.user_id, actor_email=current_user.email,
    )
    return SuccessResponse(data=RouteResponse.model_validate(route), message="Route created")


@router.get("/routes/{route_id}", response_model=SuccessResponse[RouteDetailResponse])
def get_route(
    route_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_VIEW)),
):
    route = transport_service.get_route(db, current_user.school_id, route_id)
    stops = transport_service.list_stops(db, current_user.school_id, route_id)
    detail = RouteDetailResponse(
        **RouteResponse.model_validate(route).model_dump(),
        stops=[RouteStopResponse.model_validate(s) for s in stops],
    )
    return SuccessResponse(data=detail)


@router.patch("/routes/{route_id}", response_model=SuccessResponse[RouteResponse])
def update_route(
    route_id: UUID,
    payload: RouteUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_MANAGE)),
):
    route = transport_service.update_route(
        db, current_user.school_id, route_id, payload,
        actor_id=current_user.user_id, actor_email=current_user.email,
    )
    return SuccessResponse(data=RouteResponse.model_validate(route))


@router.delete("/routes/{route_id}", response_model=SuccessResponse[dict])
def delete_route(
    route_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_MANAGE)),
):
    transport_service.delete_route(
        db, current_user.school_id, route_id,
        actor_id=current_user.user_id, actor_email=current_user.email,
    )
    return SuccessResponse(data={}, message="Route deleted")


# ── Route Stops ───────────────────────────────────────────────────────────────

@router.get("/routes/{route_id}/stops", response_model=SuccessResponse[list[RouteStopResponse]])
def list_stops(
    route_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_VIEW)),
):
    stops = transport_service.list_stops(db, current_user.school_id, route_id)
    return SuccessResponse(data=[RouteStopResponse.model_validate(s) for s in stops])


@router.post("/routes/{route_id}/stops", response_model=SuccessResponse[RouteStopResponse], status_code=201)
def create_stop(
    route_id: UUID,
    payload: RouteStopCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_MANAGE)),
):
    stop = transport_service.create_stop(
        db, current_user.school_id, route_id, payload,
        actor_id=current_user.user_id, actor_email=current_user.email,
    )
    return SuccessResponse(data=RouteStopResponse.model_validate(stop), message="Stop added")


@router.patch("/stops/{stop_id}", response_model=SuccessResponse[RouteStopResponse])
def update_stop(
    stop_id: UUID,
    payload: RouteStopUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_MANAGE)),
):
    stop = transport_service.update_stop(
        db, current_user.school_id, stop_id, payload,
        actor_id=current_user.user_id, actor_email=current_user.email,
    )
    return SuccessResponse(data=RouteStopResponse.model_validate(stop))


@router.delete("/stops/{stop_id}", response_model=SuccessResponse[dict])
def delete_stop(
    stop_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_MANAGE)),
):
    transport_service.delete_stop(
        db, current_user.school_id, stop_id,
        actor_id=current_user.user_id, actor_email=current_user.email,
    )
    return SuccessResponse(data={}, message="Stop deleted")


# ── Assignments ───────────────────────────────────────────────────────────────

@router.get("/assignments", response_model=PaginatedResponse[TransportAssignResponse])
def list_assignments(
    student_id: Optional[UUID] = Query(None),
    route_id: Optional[UUID] = Query(None),
    vehicle_id: Optional[UUID] = Query(None),
    session_id: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_VIEW)),
):
    result = transport_service.list_assignments(
        db, current_user.school_id,
        student_id=student_id,
        route_id=route_id,
        vehicle_id=vehicle_id,
        session_id=session_id,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(
        data=[TransportAssignResponse.model_validate(a) for a in result["data"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"],
    )


@router.post("/assignments", response_model=SuccessResponse[TransportAssignResponse], status_code=201)
def assign_transport(
    payload: TransportAssignCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_MANAGE)),
):
    ta = transport_service.assign_transport(
        db, current_user.school_id, payload,
        actor_id=current_user.user_id, actor_email=current_user.email,
    )
    return SuccessResponse(data=TransportAssignResponse.model_validate(ta), message="Student assigned to transport")


@router.delete("/assignments/{assignment_id}", response_model=SuccessResponse[dict])
def unassign_transport(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_MANAGE)),
):
    transport_service.unassign_transport(
        db, current_user.school_id, assignment_id,
        actor_id=current_user.user_id, actor_email=current_user.email,
    )
    return SuccessResponse(data={}, message="Transport assignment removed")


# ── Parent portal endpoint ────────────────────────────────────────────────────

@router.get(
    "/student/{student_id}/info",
    response_model=SuccessResponse[StudentTransportInfo | None],
)
def student_transport_info(
    student_id: UUID,
    session_id: UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.TRANSPORT_VIEW)),
):
    """Return transport details for a student — consumed by parent portal."""
    info = transport_service.get_student_transport_info(
        db, current_user.school_id, student_id, session_id
    )
    return SuccessResponse(data=info, message="Transport info retrieved")
