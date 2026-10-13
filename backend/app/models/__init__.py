# Import all models here so Alembic can detect them
from app.models.school import School, SchoolBranding, SchoolSettings
from app.models.subscription import (
    SubscriptionPlan,
    Module,
    PlanModule,
    SchoolSubscription,
    SchoolModule,
)
from app.models.user import User, RefreshToken, Role, Permission, RolePermission, UserRole
from app.models.audit import AuditLog
from app.models.academic import AcademicSession, Class, Section, Subject, ClassSubject
from app.models.student import Student, Parent, StudentParent
from app.models.teacher import Teacher, Staff
from app.models.attendance import Attendance
from app.models.timetable import TimetablePeriod
from app.models.communication import Homework, Notice, Event
from app.models.fees import FeeCategory, FeeStructure, StudentFee, FeePayment
from app.models.exam import ExamType, Exam, ExamSubject, GradeRule, Mark
from app.models.crm import AdmissionLead, FollowUp
from app.models.transport import Vehicle, Route, RouteStop, TransportAssignment
from app.models.library import Book, BookIssue
from app.models.website import NavigationMenu

__all__ = [
    "School", "SchoolBranding", "SchoolSettings",
    "SubscriptionPlan", "Module", "PlanModule", "SchoolSubscription", "SchoolModule",
    "User", "RefreshToken", "Role", "Permission", "RolePermission", "UserRole",
    "AuditLog",
    "AcademicSession", "Class", "Section", "Subject", "ClassSubject",
    "Student", "Parent", "StudentParent",
    "Teacher", "Staff",
    "Attendance", "TimetablePeriod",
    "Homework", "Notice", "Event",
    "FeeCategory", "FeeStructure", "StudentFee", "FeePayment",
    "ExamType", "Exam", "ExamSubject", "GradeRule", "Mark",
    "AdmissionLead", "FollowUp",
    "Vehicle", "Route", "RouteStop", "TransportAssignment",
    "Book", "BookIssue",
    "NavigationMenu",
]
