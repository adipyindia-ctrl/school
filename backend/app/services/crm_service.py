from __future__ import annotations

import math
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.crm import AdmissionLead, FollowUp
from app.schemas.crm import (
    STAGES, FollowUpCreate, FunnelStats, LeadCreate, LeadUpdate,
)


# ── Labels ────────────────────────────────────────────────────────────────────

_STAGE_LABELS = {
    "new_enquiry": "New Enquiry",
    "contacted": "Contacted",
    "follow_up": "Follow-Up",
    "school_visit": "School Visit",
    "application_submitted": "Application Submitted",
    "admission_confirmed": "Admission Confirmed",
    "rejected": "Rejected",
}


# ── Leads ─────────────────────────────────────────────────────────────────────

def list_leads(
    db: Session,
    school_id: UUID,
    stage: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
) -> dict:
    q = db.query(AdmissionLead).filter(
        AdmissionLead.school_id == school_id,
        AdmissionLead.deleted_at == None,
    )
    if stage:
        q = q.filter(AdmissionLead.stage == stage)
    if search:
        q = q.filter(
            AdmissionLead.student_name.ilike(f"%{search}%")
            | AdmissionLead.phone.ilike(f"%{search}%")
        )
    total = q.count()
    data = (
        q.order_by(AdmissionLead.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "data": data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


def list_all_leads_by_stage(db: Session, school_id: UUID) -> dict[str, list[AdmissionLead]]:
    """Return leads grouped by stage — used by Kanban view."""
    leads = (
        db.query(AdmissionLead)
        .filter(AdmissionLead.school_id == school_id, AdmissionLead.deleted_at == None)
        .order_by(AdmissionLead.created_at.desc())
        .all()
    )
    grouped: dict[str, list[AdmissionLead]] = {s: [] for s in STAGES}
    for lead in leads:
        if lead.stage in grouped:
            grouped[lead.stage].append(lead)
    return grouped


def get_lead_or_404(db: Session, school_id: UUID, lead_id: UUID) -> AdmissionLead:
    lead = db.query(AdmissionLead).filter(
        AdmissionLead.id == lead_id,
        AdmissionLead.school_id == school_id,
        AdmissionLead.deleted_at == None,
    ).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


def create_lead(db: Session, school_id: UUID, payload: LeadCreate) -> AdmissionLead:
    lead = AdmissionLead(school_id=school_id, **payload.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def update_lead(
    db: Session, school_id: UUID, lead_id: UUID, payload: LeadUpdate
) -> AdmissionLead:
    lead = get_lead_or_404(db, school_id, lead_id)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(lead, k, v)
    db.commit()
    db.refresh(lead)
    return lead


def delete_lead(db: Session, school_id: UUID, lead_id: UUID) -> None:
    from datetime import datetime, timezone
    lead = get_lead_or_404(db, school_id, lead_id)
    lead.deleted_at = datetime.now(timezone.utc)
    lead.is_active = False
    db.commit()


def convert_lead_to_student(
    db: Session, school_id: UUID, lead_id: UUID
) -> dict:
    """Move lead to 'admission_confirmed' and return pre-filled student data."""
    lead = get_lead_or_404(db, school_id, lead_id)
    lead.stage = "admission_confirmed"
    db.commit()
    # Return data the frontend can use to pre-fill the student creation form
    return {
        "first_name": lead.student_name.split()[0] if lead.student_name else "",
        "last_name": " ".join(lead.student_name.split()[1:]) if lead.student_name else "",
        "interested_class": lead.interested_class,
        "parent_name": lead.parent_name,
        "phone": lead.phone,
        "email": lead.email,
    }


# ── Follow-ups ────────────────────────────────────────────────────────────────

def list_follow_ups(db: Session, school_id: UUID, lead_id: UUID) -> list[FollowUp]:
    return (
        db.query(FollowUp)
        .filter(FollowUp.lead_id == lead_id, FollowUp.school_id == school_id)
        .order_by(FollowUp.follow_up_date.desc())
        .all()
    )


def create_follow_up(
    db: Session,
    school_id: UUID,
    lead_id: UUID,
    payload: FollowUpCreate,
    done_by: UUID,
) -> FollowUp:
    # Validate lead belongs to school
    get_lead_or_404(db, school_id, lead_id)
    fu = FollowUp(
        lead_id=lead_id,
        school_id=school_id,
        done_by=done_by,
        **payload.model_dump(),
    )
    db.add(fu)
    # Update lead's next follow-up date
    if payload.next_follow_up:
        lead = db.query(AdmissionLead).filter(AdmissionLead.id == lead_id).first()
        if lead:
            lead.follow_up_date = payload.next_follow_up
            lead.stage = "follow_up"
    db.commit()
    db.refresh(fu)
    return fu


# ── Funnel stats ──────────────────────────────────────────────────────────────

def get_funnel_stats(db: Session, school_id: UUID) -> list[FunnelStats]:
    counts = (
        db.query(AdmissionLead.stage, func.count(AdmissionLead.id).label("cnt"))
        .filter(AdmissionLead.school_id == school_id, AdmissionLead.deleted_at == None)
        .group_by(AdmissionLead.stage)
        .all()
    )
    count_map = {row.stage: row.cnt for row in counts}
    return [
        FunnelStats(stage=s, count=count_map.get(s, 0), label=_STAGE_LABELS.get(s, s))
        for s in STAGES
    ]
