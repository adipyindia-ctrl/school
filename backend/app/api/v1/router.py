from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.auth.routes import router as auth_router
from app.api.v1.platform.schools import router as platform_schools_router
from app.api.v1.platform.dashboard import router as platform_dashboard_router
from app.api.v1.platform.plans import router as platform_plans_router
from app.api.v1.platform.audit import router as platform_audit_router
from app.api.v1.settings.routes import router as settings_router
from app.api.v1.settings.roles import router as settings_roles_router
from app.api.v1.public.routes import router as public_router
from app.api.v1.academics.routes import router as academics_router
from app.api.v1.students.routes import router as students_router
from app.api.v1.students.routes import parents_router
from app.api.v1.teachers.routes import router as teachers_router
from app.api.v1.teachers.routes import staff_router
from app.api.v1.attendance.routes import router as attendance_router
from app.api.v1.timetable.routes import router as timetable_router
from app.api.v1.communication.routes import homework_router, notices_router, events_router
from app.api.v1.fees.routes import router as fees_router
from app.api.v1.exams.routes import router as exams_router
from app.api.v1.crm.routes import router as crm_router
from app.api.v1.transport.routes import router as transport_router
from app.api.v1.library.routes import router as library_router
from app.api.v1.certificates.routes import router as certificates_router
from app.api.v1.reports.routes import router as reports_router
from app.api.v1.website.routes import router as website_router
from app.api.v1.audit.routes import router as audit_router
from app.api.v1.dashboard.routes import router as school_dashboard_router

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth_router)
v1_router.include_router(school_dashboard_router)
v1_router.include_router(platform_dashboard_router)
v1_router.include_router(platform_schools_router)
v1_router.include_router(platform_plans_router)
v1_router.include_router(platform_audit_router)
v1_router.include_router(settings_router)
v1_router.include_router(settings_roles_router)
v1_router.include_router(public_router)
v1_router.include_router(academics_router)
v1_router.include_router(students_router)
v1_router.include_router(parents_router)
v1_router.include_router(teachers_router)
v1_router.include_router(staff_router)
v1_router.include_router(attendance_router)
v1_router.include_router(timetable_router)
v1_router.include_router(homework_router)
v1_router.include_router(notices_router)
v1_router.include_router(events_router)
v1_router.include_router(fees_router)
v1_router.include_router(exams_router)
v1_router.include_router(crm_router)
v1_router.include_router(transport_router)
v1_router.include_router(library_router)
v1_router.include_router(certificates_router)
v1_router.include_router(reports_router)
v1_router.include_router(website_router)
v1_router.include_router(audit_router)
