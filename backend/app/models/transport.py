from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDMixin


class Vehicle(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "vehicles"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vehicle_number: Mapped[str] = mapped_column(String(30), nullable=False)
    # BUS, VAN, AUTO, OTHER
    vehicle_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    driver_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    driver_contact: Mapped[str | None] = mapped_column(String(30), nullable=True)
    seating_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=40)

    __table_args__ = (
        UniqueConstraint("school_id", "vehicle_number", name="uq_vehicle_school_number"),
    )


class Route(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "transport_routes"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class RouteStop(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "route_stops"

    route_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("transport_routes.id", ondelete="CASCADE"), nullable=False, index=True
    )
    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    stop_name: Mapped[str] = mapped_column(String(200), nullable=False)
    stop_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # GPS coordinates (optional)
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    # HH:MM format strings
    morning_pickup_time: Mapped[str | None] = mapped_column(String(10), nullable=True)
    evening_dropoff_time: Mapped[str | None] = mapped_column(String(10), nullable=True)


class TransportAssignment(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "transport_assignments"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False
    )
    route_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("transport_routes.id", ondelete="RESTRICT"), nullable=False
    )
    stop_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("route_stops.id", ondelete="SET NULL"), nullable=True
    )
    academic_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("academic_sessions.id", ondelete="RESTRICT"), nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "school_id", "student_id", "academic_session_id",
            name="uq_transport_assignment_student_session",
        ),
    )
