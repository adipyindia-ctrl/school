from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.website import NavigationMenu

# Default items seeded on first list call if no items exist
DEFAULT_MENU = [
    {"label": "Home",       "url": "/",           "display_order": 1},
    {"label": "About Us",   "url": "#about",      "display_order": 2},
    {"label": "Academics",  "url": "#academics",  "display_order": 3},
    {"label": "Contact",    "url": "#contact",    "display_order": 4},
]


def _seed_defaults(db: Session, school_id: UUID) -> None:
    """Create default navigation items for a school if none exist."""
    existing = db.query(NavigationMenu).filter(
        NavigationMenu.school_id == school_id
    ).count()
    if existing == 0:
        for item in DEFAULT_MENU:
            db.add(NavigationMenu(school_id=school_id, **item))
        db.flush()


def list_menu_items(db: Session, school_id: UUID) -> list[NavigationMenu]:
    """Returns all menu items for the school ordered by display_order.
    Seeds default items if none exist.
    """
    _seed_defaults(db, school_id)
    db.commit()
    return (
        db.query(NavigationMenu)
        .filter(NavigationMenu.school_id == school_id)
        .order_by(NavigationMenu.display_order)
        .all()
    )


def create_menu_item(
    db: Session,
    school_id: UUID,
    label: str,
    url: Optional[str] = None,
    parent_id: Optional[UUID] = None,
    display_order: int = 0,
    page_id: Optional[UUID] = None,
) -> NavigationMenu:
    """Creates a new NavigationMenu record and returns it."""
    item = NavigationMenu(
        school_id=school_id,
        label=label,
        url=url,
        parent_id=parent_id,
        display_order=display_order,
        page_id=page_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_menu_item(
    db: Session,
    school_id: UUID,
    item_id: UUID,
    **kwargs,
) -> NavigationMenu:
    """Updates label/url/parent_id/display_order/is_active/page_id.
    Raises 404 if not found or belongs to a different school.
    """
    item = db.query(NavigationMenu).filter(
        NavigationMenu.id == item_id,
        NavigationMenu.school_id == school_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Navigation menu item not found")

    allowed_fields = {"label", "url", "parent_id", "display_order", "is_active", "page_id"}
    for field, value in kwargs.items():
        if field in allowed_fields and value is not None:
            setattr(item, field, value)
    # is_active can be explicitly set to False, handle separately
    if "is_active" in kwargs and kwargs["is_active"] is not None:
        item.is_active = kwargs["is_active"]

    db.commit()
    db.refresh(item)
    return item


def delete_menu_item(db: Session, school_id: UUID, item_id: UUID) -> None:
    """Hard deletes a menu item. Nullifies parent_id of children first."""
    item = db.query(NavigationMenu).filter(
        NavigationMenu.id == item_id,
        NavigationMenu.school_id == school_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Navigation menu item not found")

    # Nullify children's parent_id before deletion
    db.query(NavigationMenu).filter(
        NavigationMenu.parent_id == item_id,
        NavigationMenu.school_id == school_id,
    ).update({"parent_id": None})

    db.delete(item)
    db.commit()


def bulk_reorder(db: Session, school_id: UUID, order: list[dict]) -> list[NavigationMenu]:
    """Takes [{"id": "uuid", "display_order": int}, ...] and updates all at once."""
    for item in order:
        db.query(NavigationMenu).filter(
            NavigationMenu.id == item["id"],
            NavigationMenu.school_id == school_id,
        ).update({"display_order": item["display_order"]})
    db.commit()
    return (
        db.query(NavigationMenu)
        .filter(NavigationMenu.school_id == school_id)
        .order_by(NavigationMenu.display_order)
        .all()
    )
