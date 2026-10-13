from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.website import WebsiteSection, WebsiteSetting

# Default section catalog — seeded on first call
DEFAULT_SECTIONS = [
    {"section_key": "hero",         "heading": "Welcome",          "display_order": 1},
    {"section_key": "about",        "heading": "About Us",         "display_order": 2},
    {"section_key": "stats",        "heading": "Our Achievements", "display_order": 3},
    {"section_key": "academics",    "heading": "Academics",        "display_order": 4},
    {"section_key": "gallery",      "heading": "Gallery",          "display_order": 5},
    {"section_key": "testimonials", "heading": "Testimonials",     "display_order": 6},
    {"section_key": "events",       "heading": "Events",           "display_order": 7},
    {"section_key": "contact",      "heading": "Contact Us",       "display_order": 8},
    {"section_key": "cta",          "heading": "Join Us",          "display_order": 9},
]


def _seed_sections(db: Session, school_id: UUID) -> None:
    """Create default sections for a school if none exist."""
    existing = db.query(WebsiteSection).filter(
        WebsiteSection.school_id == school_id
    ).count()
    if existing == 0:
        for s in DEFAULT_SECTIONS:
            db.add(WebsiteSection(school_id=school_id, **s))
        db.flush()


def get_or_create_settings(db: Session, school_id: UUID) -> WebsiteSetting:
    ws = db.query(WebsiteSetting).filter(WebsiteSetting.school_id == school_id).first()
    if not ws:
        ws = WebsiteSetting(school_id=school_id)
        db.add(ws)
        db.flush()
    return ws


def get_settings(db: Session, school_id: UUID) -> WebsiteSetting:
    return get_or_create_settings(db, school_id)


def update_settings(
    db: Session,
    school_id: UUID,
    layout_template: Optional[int] = None,
    is_published: Optional[bool] = None,
    seo_title: Optional[str] = None,
    seo_description: Optional[str] = None,
) -> WebsiteSetting:
    ws = get_or_create_settings(db, school_id)
    if layout_template is not None:
        if layout_template not in (1, 2, 3, 4, 5):
            raise HTTPException(status_code=400, detail="layout_template must be 1–5")
        ws.layout_template = layout_template
    if is_published is not None:
        ws.is_published = is_published
    if seo_title is not None:
        ws.seo_title = seo_title
    if seo_description is not None:
        ws.seo_description = seo_description
    db.commit()
    db.refresh(ws)
    return ws


def list_sections(db: Session, school_id: UUID) -> list[WebsiteSection]:
    _seed_sections(db, school_id)
    db.commit()
    return (
        db.query(WebsiteSection)
        .filter(WebsiteSection.school_id == school_id)
        .order_by(WebsiteSection.display_order)
        .all()
    )


def update_section(
    db: Session,
    school_id: UUID,
    section_key: str,
    is_enabled: Optional[bool] = None,
    heading: Optional[str] = None,
    description: Optional[str] = None,
    display_order: Optional[int] = None,
    content: Optional[dict] = None,
) -> WebsiteSection:
    section = db.query(WebsiteSection).filter(
        WebsiteSection.school_id == school_id,
        WebsiteSection.section_key == section_key,
    ).first()
    if not section:
        raise HTTPException(status_code=404, detail=f"Section '{section_key}' not found")
    if is_enabled is not None:
        section.is_enabled = is_enabled
    if heading is not None:
        section.heading = heading
    if description is not None:
        section.description = description
    if display_order is not None:
        section.display_order = display_order
    if content is not None:
        section.content = content
    db.commit()
    db.refresh(section)
    return section


def bulk_reorder(db: Session, school_id: UUID, order: list[dict]) -> list[WebsiteSection]:
    """
    order: [{"section_key": "hero", "display_order": 1}, ...]
    """
    for item in order:
        db.query(WebsiteSection).filter(
            WebsiteSection.school_id == school_id,
            WebsiteSection.section_key == item["section_key"],
        ).update({"display_order": item["display_order"]})
    db.commit()
    return list_sections(db, school_id)
