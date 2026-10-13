from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import Modules, Permissions
from app.core.tenant import CurrentUser, require_module, require_permission
from app.schemas.common import SuccessResponse
from app.services import website_service
from app.services import navigation_service
from app.services import gallery_service
from app.services import cms_service

router = APIRouter(prefix="/website", tags=["Website"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class WebsiteSettingsUpdate(BaseModel):
    layout_template: Optional[int] = None
    is_published: Optional[bool] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None


class SectionUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    heading: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    content: Optional[dict[str, Any]] = None


class ReorderItem(BaseModel):
    section_key: str
    display_order: int


class BulkReorderPayload(BaseModel):
    order: list[ReorderItem]


def _section_to_dict(s: Any) -> dict:
    return {
        "id": str(s.id),
        "school_id": str(s.school_id),
        "section_key": s.section_key,
        "is_enabled": s.is_enabled,
        "heading": s.heading,
        "description": s.description,
        "content": s.content,
        "display_order": s.display_order,
    }


def _settings_to_dict(ws: Any) -> dict:
    return {
        "id": str(ws.id),
        "school_id": str(ws.school_id),
        "layout_template": ws.layout_template,
        "is_published": ws.is_published,
        "seo_title": ws.seo_title,
        "seo_description": ws.seo_description,
    }


# ── Settings ──────────────────────────────────────────────────────────────────

@router.get("/settings", response_model=SuccessResponse[dict])
def get_settings(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_VIEW)),
):
    ws = website_service.get_settings(db, current_user.school_id)
    return SuccessResponse(data=_settings_to_dict(ws))


@router.patch("/settings", response_model=SuccessResponse[dict])
def update_settings(
    payload: WebsiteSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    ws = website_service.update_settings(
        db, current_user.school_id,
        layout_template=payload.layout_template,
        is_published=payload.is_published,
        seo_title=payload.seo_title,
        seo_description=payload.seo_description,
    )
    return SuccessResponse(data=_settings_to_dict(ws), message="Website settings updated")


# ── Sections ──────────────────────────────────────────────────────────────────

@router.get("/sections", response_model=SuccessResponse[list])
def list_sections(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_VIEW)),
):
    sections = website_service.list_sections(db, current_user.school_id)
    return SuccessResponse(data=[_section_to_dict(s) for s in sections])


@router.patch("/sections/{section_key}", response_model=SuccessResponse[dict])
def update_section(
    section_key: str,
    payload: SectionUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    section = website_service.update_section(
        db, current_user.school_id, section_key,
        is_enabled=payload.is_enabled,
        heading=payload.heading,
        description=payload.description,
        display_order=payload.display_order,
        content=payload.content,
    )
    return SuccessResponse(data=_section_to_dict(section))


@router.post("/sections/reorder", response_model=SuccessResponse[list])
def reorder_sections(
    payload: BulkReorderPayload,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    sections = website_service.bulk_reorder(
        db, current_user.school_id,
        [{"section_key": i.section_key, "display_order": i.display_order} for i in payload.order],
    )
    return SuccessResponse(data=[_section_to_dict(s) for s in sections], message="Sections reordered")


# ── Navigation Menu Pydantic Schemas ─────────────────────────────────────────

class MenuItemCreate(BaseModel):
    label: str
    url: Optional[str] = None
    parent_id: Optional[UUID] = None
    display_order: int = 0
    page_id: Optional[UUID] = None


class MenuItemUpdate(BaseModel):
    label: Optional[str] = None
    url: Optional[str] = None
    parent_id: Optional[UUID] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    page_id: Optional[UUID] = None


class MenuReorderItem(BaseModel):
    id: UUID
    display_order: int


class MenuBulkReorder(BaseModel):
    order: list[MenuReorderItem]


def _menu_to_dict(m: Any) -> dict:
    return {
        "id": str(m.id),
        "school_id": str(m.school_id),
        "label": m.label,
        "url": m.url,
        "page_id": str(m.page_id) if m.page_id else None,
        "parent_id": str(m.parent_id) if m.parent_id else None,
        "display_order": m.display_order,
        "is_active": m.is_active,
    }


# ── Navigation Menu Routes ────────────────────────────────────────────────────

@router.get("/navigation", response_model=SuccessResponse[list])
def list_navigation(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_VIEW)),
):
    items = navigation_service.list_menu_items(db, current_user.school_id)
    return SuccessResponse(data=[_menu_to_dict(m) for m in items])


@router.post("/navigation", response_model=SuccessResponse[dict])
def create_navigation_item(
    payload: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    item = navigation_service.create_menu_item(
        db,
        school_id=current_user.school_id,
        label=payload.label,
        url=payload.url,
        parent_id=payload.parent_id,
        display_order=payload.display_order,
        page_id=payload.page_id,
    )
    return SuccessResponse(data=_menu_to_dict(item), message="Menu item created")


@router.post("/navigation/reorder", response_model=SuccessResponse[list])
def reorder_navigation(
    payload: MenuBulkReorder,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    items = navigation_service.bulk_reorder(
        db,
        school_id=current_user.school_id,
        order=[{"id": str(i.id), "display_order": i.display_order} for i in payload.order],
    )
    return SuccessResponse(data=[_menu_to_dict(m) for m in items], message="Menu reordered")


@router.patch("/navigation/{item_id}", response_model=SuccessResponse[dict])
def update_navigation_item(
    item_id: UUID,
    payload: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    item = navigation_service.update_menu_item(
        db,
        school_id=current_user.school_id,
        item_id=item_id,
        **payload.model_dump(exclude_unset=True),
    )
    return SuccessResponse(data=_menu_to_dict(item), message="Menu item updated")


@router.delete("/navigation/{item_id}", response_model=SuccessResponse[dict])
def delete_navigation_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    navigation_service.delete_menu_item(db, school_id=current_user.school_id, item_id=item_id)
    return SuccessResponse(data={}, message="Menu item deleted")


# ── CMS Pages Pydantic Schemas ────────────────────────────────────────────────

class PageCreate(BaseModel):
    title: str
    slug: str
    content: Optional[str] = None
    featured_image: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    status: str = "draft"


class PageUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    featured_image: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    status: Optional[str] = None


def _page_to_dict(p: Any) -> dict:
    return {
        "id": str(p.id),
        "school_id": str(p.school_id),
        "title": p.title,
        "slug": p.slug,
        "content": p.content,
        "featured_image": p.featured_image,
        "seo_title": p.seo_title,
        "seo_description": p.seo_description,
        "status": p.status,
        "created_by": str(p.created_by) if p.created_by else None,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


# ── CMS Pages Routes ──────────────────────────────────────────────────────────

@router.get("/pages", response_model=SuccessResponse[list])
def list_pages(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_VIEW)),
):
    pages = cms_service.list_pages(db, current_user.school_id, status=status)
    return SuccessResponse(data=[_page_to_dict(p) for p in pages])


@router.post("/pages", response_model=SuccessResponse[dict])
def create_page(
    payload: PageCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    page = cms_service.create_page(
        db,
        school_id=current_user.school_id,
        title=payload.title,
        slug=payload.slug,
        content=payload.content,
        featured_image=payload.featured_image,
        seo_title=payload.seo_title,
        seo_description=payload.seo_description,
        status=payload.status,
        created_by=current_user.id,
    )
    return SuccessResponse(data=_page_to_dict(page), message="Page created")


@router.get("/pages/{page_id}", response_model=SuccessResponse[dict])
def get_page(
    page_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_VIEW)),
):
    page = cms_service.get_page(db, current_user.school_id, page_id)
    return SuccessResponse(data=_page_to_dict(page))


@router.patch("/pages/{page_id}", response_model=SuccessResponse[dict])
def update_page(
    page_id: UUID,
    payload: PageUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    page = cms_service.update_page(
        db,
        school_id=current_user.school_id,
        page_id=page_id,
        **payload.model_dump(exclude_unset=True),
    )
    return SuccessResponse(data=_page_to_dict(page), message="Page updated")


@router.delete("/pages/{page_id}", response_model=SuccessResponse[dict])
def delete_page(
    page_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    cms_service.delete_page(db, school_id=current_user.school_id, page_id=page_id)
    return SuccessResponse(data={}, message="Page deleted")


# ── Gallery Pydantic Schemas ───────────────────────────────────────────────────

class GalleryCreate(BaseModel):
    title: str
    image_url: str
    category: Optional[str] = None
    display_order: int = 0


class GalleryUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    display_order: Optional[int] = None


class GalleryReorderItem(BaseModel):
    id: UUID
    display_order: int


class GalleryBulkReorder(BaseModel):
    order: list[GalleryReorderItem]


def _gallery_to_dict(g: Any) -> dict:
    return {
        "id": str(g.id),
        "school_id": str(g.school_id),
        "title": g.title,
        "image_url": g.image_url,
        "category": g.category,
        "display_order": g.display_order,
        "created_at": g.created_at.isoformat() if g.created_at else None,
    }


# ── Gallery Routes ────────────────────────────────────────────────────────────

@router.get("/gallery", response_model=SuccessResponse[list])
def list_gallery(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_VIEW)),
):
    result = gallery_service.list_gallery(
        db,
        school_id=current_user.school_id,
        category=category,
        page=1,
        page_size=200,
    )
    return SuccessResponse(data=[_gallery_to_dict(g) for g in result["data"]])


@router.post("/gallery", response_model=SuccessResponse[dict], status_code=201)
def create_gallery_item(
    payload: GalleryCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    item = gallery_service.create_gallery_item(
        db,
        school_id=current_user.school_id,
        title=payload.title,
        image_url=payload.image_url,
        category=payload.category,
        display_order=payload.display_order,
    )
    return SuccessResponse(data=_gallery_to_dict(item), message="Gallery item created")


@router.post("/gallery/reorder", response_model=SuccessResponse[list])
def reorder_gallery(
    payload: GalleryBulkReorder,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    items = gallery_service.bulk_reorder(
        db,
        school_id=current_user.school_id,
        order=[{"id": str(i.id), "display_order": i.display_order} for i in payload.order],
    )
    return SuccessResponse(data=[_gallery_to_dict(g) for g in items], message="Gallery reordered")


@router.patch("/gallery/{item_id}", response_model=SuccessResponse[dict])
def update_gallery_item(
    item_id: UUID,
    payload: GalleryUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    item = gallery_service.update_gallery_item(
        db,
        school_id=current_user.school_id,
        item_id=item_id,
        **payload.model_dump(exclude_unset=True),
    )
    return SuccessResponse(data=_gallery_to_dict(item), message="Gallery item updated")


@router.delete("/gallery/{item_id}", response_model=SuccessResponse[dict])
def delete_gallery_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permissions.WEBSITE_MANAGE)),
):
    gallery_service.delete_gallery_item(db, school_id=current_user.school_id, item_id=item_id)
    return SuccessResponse(data={}, message="Gallery item deleted")
