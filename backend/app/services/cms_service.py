from __future__ import annotations

import re
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.website import WebsitePage

# Slug validation: lowercase alphanumeric + hyphens only
_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _validate_slug(slug: str) -> None:
    """Raise HTTP 400 if the slug format is invalid."""
    if not slug or not _SLUG_RE.match(slug):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid slug. Slugs must be lowercase alphanumeric characters "
                "separated by hyphens (e.g. 'about-us', 'contact')."
            ),
        )


def list_pages(
    db: Session,
    school_id: UUID,
    status: Optional[str] = None,
) -> list[WebsitePage]:
    """Return pages for a school, optionally filtered by status, newest first."""
    q = db.query(WebsitePage).filter(WebsitePage.school_id == school_id)
    if status:
        q = q.filter(WebsitePage.status == status)
    return q.order_by(WebsitePage.created_at.desc()).all()


def get_page(db: Session, school_id: UUID, page_id: UUID) -> WebsitePage:
    """Return a page by ID. Raise 404 if not found."""
    page = (
        db.query(WebsitePage)
        .filter(WebsitePage.school_id == school_id, WebsitePage.id == page_id)
        .first()
    )
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


def get_page_by_slug(db: Session, school_id: UUID, slug: str) -> WebsitePage | None:
    """Return a page by slug, or None if not found."""
    return (
        db.query(WebsitePage)
        .filter(WebsitePage.school_id == school_id, WebsitePage.slug == slug)
        .first()
    )


def create_page(
    db: Session,
    school_id: UUID,
    title: str,
    slug: str,
    content: Optional[str] = None,
    featured_image: Optional[str] = None,
    seo_title: Optional[str] = None,
    seo_description: Optional[str] = None,
    status: str = "draft",
    created_by: Optional[UUID] = None,
) -> WebsitePage:
    """Create a new CMS page. Raises 400 on duplicate or invalid slug."""
    _validate_slug(slug)

    # Check uniqueness
    existing = get_page_by_slug(db, school_id, slug)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"A page with slug '{slug}' already exists for this school.",
        )

    page = WebsitePage(
        school_id=school_id,
        title=title,
        slug=slug,
        content=content,
        featured_image=featured_image,
        seo_title=seo_title,
        seo_description=seo_description,
        status=status,
        created_by=created_by,
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


def update_page(
    db: Session,
    school_id: UUID,
    page_id: UUID,
    **kwargs,
) -> WebsitePage:
    """Partially update a page. Validates slug uniqueness if slug is changed."""
    page = get_page(db, school_id, page_id)

    new_slug = kwargs.get("slug")
    if new_slug is not None:
        _validate_slug(new_slug)
        # Check uniqueness excluding current page
        conflict = (
            db.query(WebsitePage)
            .filter(
                WebsitePage.school_id == school_id,
                WebsitePage.slug == new_slug,
                WebsitePage.id != page_id,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=400,
                detail=f"A page with slug '{new_slug}' already exists for this school.",
            )

    allowed_fields = {
        "title", "slug", "content", "featured_image",
        "seo_title", "seo_description", "status",
    }
    for field, value in kwargs.items():
        if field in allowed_fields and value is not None:
            setattr(page, field, value)

    db.commit()
    db.refresh(page)
    return page


def delete_page(db: Session, school_id: UUID, page_id: UUID) -> None:
    """Hard-delete a page. Raises 404 if not found."""
    page = get_page(db, school_id, page_id)
    db.delete(page)
    db.commit()
