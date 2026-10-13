from __future__ import annotations

import math
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.website import Gallery


def list_gallery(
    db: Session,
    school_id: UUID,
    category: Optional[str] = None,
    page: int = 1,
    page_size: int = 25,
) -> dict:
    """Return a paginated list of gallery items for a school, optionally filtered by category."""
    q = db.query(Gallery).filter(Gallery.school_id == school_id)
    if category:
        q = q.filter(Gallery.category == category)
    total = q.count()
    data = (
        q.order_by(Gallery.display_order, Gallery.created_at)
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


def create_gallery_item(
    db: Session,
    school_id: UUID,
    title: str,
    image_url: str,
    category: Optional[str] = None,
    display_order: int = 0,
) -> Gallery:
    """Create a new gallery item for the school."""
    item = Gallery(
        school_id=school_id,
        title=title,
        image_url=image_url,
        category=category,
        display_order=display_order,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_gallery_item(
    db: Session,
    school_id: UUID,
    item_id: UUID,
    title: Optional[str] = None,
    image_url: Optional[str] = None,
    category: Optional[str] = None,
    display_order: Optional[int] = None,
) -> Gallery:
    """Update an existing gallery item. Raises 404 if not found."""
    item = db.query(Gallery).filter(
        Gallery.id == item_id,
        Gallery.school_id == school_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    if title is not None:
        item.title = title
    if image_url is not None:
        item.image_url = image_url
    if category is not None:
        item.category = category
    if display_order is not None:
        item.display_order = display_order
    db.commit()
    db.refresh(item)
    return item


def delete_gallery_item(db: Session, school_id: UUID, item_id: UUID) -> None:
    """Hard delete a gallery item. Raises 404 if not found."""
    item = db.query(Gallery).filter(
        Gallery.id == item_id,
        Gallery.school_id == school_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    db.delete(item)
    db.commit()


def bulk_reorder(
    db: Session,
    school_id: UUID,
    order: list[dict],
) -> list[Gallery]:
    """
    Bulk-update display_order for multiple gallery items.
    order: [{"id": "uuid", "display_order": int}, ...]
    """
    for entry in order:
        db.query(Gallery).filter(
            Gallery.id == entry["id"],
            Gallery.school_id == school_id,
        ).update({"display_order": entry["display_order"]})
    db.commit()
    return (
        db.query(Gallery)
        .filter(Gallery.school_id == school_id)
        .order_by(Gallery.display_order, Gallery.created_at)
        .all()
    )
