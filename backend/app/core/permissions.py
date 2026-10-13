from __future__ import annotations

"""
All permission keys in the system.
Format: resource.action
These are seeded into the Permission table on startup.
"""


class Permissions:
    # ── Platform ─────────────────────────────────────────────────────────────
    PLATFORM_MANAGE = "platform.manage"

    # ── Schools ───────────────────────────────────────────────────────────────
    SCHOOLS_VIEW = "schools.view"
    SCHOOLS_CREATE = "schools.create"
    SCHOOLS_EDIT = "schools.edit"
    SCHOOLS_DELETE = "schools.delete"
    SCHOOLS_MANAGE_MODULES = "schools.manage_modules"

    # ── Settings ──────────────────────────────────────────────────────────────
    SETTINGS_MANAGE = "settings.manage"
    SETTINGS_BRANDING = "settings.branding"

    # ── Users / Roles ─────────────────────────────────────────────────────────
    USERS_VIEW = "users.view"
    USERS_CREATE = "users.create"
    USERS_EDIT = "users.edit"
    USERS_DELETE = "users.delete"
    ROLES_MANAGE = "roles.manage"

    # ── Students ──────────────────────────────────────────────────────────────
    STUDENTS_VIEW = "students.view"
    STUDENTS_CREATE = "students.create"
    STUDENTS_EDIT = "students.edit"
    STUDENTS_DELETE = "students.delete"
    STUDENTS_IMPORT = "students.import"
    STUDENTS_EXPORT = "students.export"

    # ── Teachers ──────────────────────────────────────────────────────────────
    TEACHERS_VIEW = "teachers.view"
    TEACHERS_CREATE = "teachers.create"
    TEACHERS_EDIT = "teachers.edit"
    TEACHERS_DELETE = "teachers.delete"

    # ── Parents ───────────────────────────────────────────────────────────────
    PARENTS_VIEW = "parents.view"
    PARENTS_CREATE = "parents.create"
    PARENTS_EDIT = "parents.edit"

    # ── Staff ─────────────────────────────────────────────────────────────────
    STAFF_VIEW = "staff.view"
    STAFF_CREATE = "staff.create"
    STAFF_EDIT = "staff.edit"
    STAFF_DELETE = "staff.delete"

    # ── Academics ─────────────────────────────────────────────────────────────
    ACADEMICS_VIEW = "academics.view"
    ACADEMICS_MANAGE = "academics.manage"

    # ── Attendance ────────────────────────────────────────────────────────────
    ATTENDANCE_VIEW = "attendance.view"
    ATTENDANCE_CREATE = "attendance.create"
    ATTENDANCE_EDIT = "attendance.edit"
    ATTENDANCE_REPORT = "attendance.report"

    # ── Timetable ─────────────────────────────────────────────────────────────
    TIMETABLE_VIEW = "timetable.view"
    TIMETABLE_MANAGE = "timetable.manage"

    # ── Homework ──────────────────────────────────────────────────────────────
    HOMEWORK_VIEW = "homework.view"
    HOMEWORK_CREATE = "homework.create"
    HOMEWORK_EDIT = "homework.edit"

    # ── Exams ─────────────────────────────────────────────────────────────────
    EXAMS_VIEW = "exams.view"
    EXAMS_MANAGE = "exams.manage"
    MARKS_CREATE = "marks.create"
    MARKS_EDIT = "marks.edit"
    RESULTS_VIEW = "results.view"

    # ── Fees ──────────────────────────────────────────────────────────────────
    FEES_VIEW = "fees.view"
    FEES_CREATE = "fees.create"
    FEES_EDIT = "fees.edit"
    FEES_COLLECT = "fees.collect"
    FEES_REPORT = "fees.report"

    # ── CRM / Admissions ──────────────────────────────────────────────────────
    CRM_VIEW = "crm.view"
    CRM_CREATE = "crm.create"
    CRM_EDIT = "crm.edit"
    CRM_MANAGE = "crm.manage"

    # ── Transport ─────────────────────────────────────────────────────────────
    TRANSPORT_VIEW = "transport.view"
    TRANSPORT_MANAGE = "transport.manage"

    # ── Library ───────────────────────────────────────────────────────────────
    LIBRARY_VIEW = "library.view"
    LIBRARY_ISSUE = "library.issue"
    LIBRARY_RETURN = "library.return"
    LIBRARY_MANAGE = "library.manage"

    # ── Certificates ──────────────────────────────────────────────────────────
    CERTIFICATES_VIEW = "certificates.view"
    CERTIFICATES_GENERATE = "certificates.generate"

    # ── Communication ─────────────────────────────────────────────────────────
    NOTICES_VIEW = "notices.view"
    NOTICES_CREATE = "notices.create"
    EVENTS_VIEW = "events.view"
    EVENTS_CREATE = "events.create"

    # ── Reports ───────────────────────────────────────────────────────────────
    REPORTS_VIEW = "reports.view"
    REPORTS_EXPORT = "reports.export"

    # ── Website ───────────────────────────────────────────────────────────────
    WEBSITE_VIEW = "website.view"
    WEBSITE_MANAGE = "website.manage"

    # ── Audit ─────────────────────────────────────────────────────────────────
    AUDIT_VIEW = "audit.view"

    @classmethod
    def all_permissions(cls) -> list[tuple[str, str]]:
        """Returns list of (key, human_name) for seeding."""
        result = []
        for attr in dir(cls):
            if attr.startswith("_") or attr == "all_permissions":
                continue
            val = getattr(cls, attr)
            if isinstance(val, str) and "." in val:
                name = val.replace(".", " ").replace("_", " ").title()
                result.append((val, name))
        return result


# ── Module keys (must match Module.key in DB) ─────────────────────────────────
class Modules:
    DASHBOARD = "dashboard"
    STUDENTS = "students"
    PARENTS = "parents"
    TEACHERS = "teachers"
    STAFF = "staff"
    ADMISSIONS = "admissions"
    ACADEMICS = "academics"
    ATTENDANCE = "attendance"
    TIMETABLE = "timetable"
    HOMEWORK = "homework"
    EXAMS = "exams"
    FEES = "fees"
    TRANSPORT = "transport"
    LIBRARY = "library"
    CERTIFICATES = "certificates"
    NOTICES = "notices"
    EVENTS = "events"
    COMMUNICATION = "communication"
    REPORTS = "reports"
    WEBSITE = "website"
    SETTINGS = "settings"
    WHITE_LABEL = "white_label"

    @classmethod
    def all_modules(cls) -> list[tuple[str, str, bool]]:
        """Returns list of (key, name, is_core) for seeding."""
        return [
            ("dashboard", "Dashboard", True),
            ("students", "Students", True),
            ("parents", "Parents", True),
            ("teachers", "Teachers", True),
            ("staff", "Staff", False),
            ("admissions", "Admissions CRM", False),
            ("academics", "Academic Management", True),
            ("attendance", "Attendance", False),
            ("timetable", "Timetable", False),
            ("homework", "Homework & Assignments", False),
            ("exams", "Examinations", False),
            ("fees", "Fees Management", False),
            ("transport", "Transport", False),
            ("library", "Library", False),
            ("certificates", "Certificates & ID Cards", False),
            ("notices", "Notice Board", False),
            ("events", "Events", False),
            ("communication", "Communication", False),
            ("reports", "Reports", False),
            ("website", "School Website", False),
            ("settings", "Settings", True),
            ("white_label", "White Label", False),
        ]
