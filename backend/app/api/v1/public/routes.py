from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.subscription import SchoolModule, Module
from app.models.school import School, SchoolBranding
from app.models.website import NavigationMenu, WebsiteSetting, Gallery as GalleryModel, WebsiteSection, HeroBanner
from app.schemas.common import SuccessResponse
from app.schemas.school import BrandingResponse
from app.services.school_service import get_school_by_slug, get_school_by_custom_domain
from app.core.config import settings
from app.services import cms_service

router = APIRouter(prefix="/public", tags=["Public"])


@router.get("/schools", response_model=SuccessResponse[list])
def list_public_schools(db: Session = Depends(get_db)):
    """
    Returns a list of all active/trial schools for public discovery.
    Used by the root page to find the default school to display.
    """
    schools = (
        db.query(School)
        .filter(School.deleted_at == None, School.status.in_(["active", "trial"]))
        .order_by(School.created_at)
        .limit(10)
        .all()
    )
    return SuccessResponse(data=[
        {"slug": s.slug, "name": s.name, "status": s.status}
        for s in schools
    ])


@router.get("/resolve", response_model=SuccessResponse[dict])
def resolve_slug(
    slug: Optional[str] = Query(None, description="School subdomain slug"),
    domain: Optional[str] = Query(None, description="Full custom domain (e.g. school.customdomain.com)"),
    db: Session = Depends(get_db),
):
    """Used by Next.js middleware to resolve a school slug or custom domain to school_id + branding."""
    school = None

    if domain:
        # Try exact custom_domain match first
        school = get_school_by_custom_domain(db, domain)

        # Fall back: if domain looks like a subdomain of BASE_DOMAIN, extract slug from it
        if not school:
            base = settings.BASE_DOMAIN.lower()
            domain_lower = domain.lower()
            # e.g. "school-a.yourdomain.com" against BASE_DOMAIN="yourdomain.com"
            if domain_lower.endswith(f".{base}"):
                extracted_slug = domain_lower[: -(len(base) + 1)].split(".")[0]
                school = get_school_by_slug(db, extracted_slug)

    if not school and slug:
        school = get_school_by_slug(db, slug)

    if not school or school.status in ("archived",):
        raise HTTPException(status_code=404, detail="School not found")

    branding_data = {}
    if school.branding:
        branding_data = {
            "primary_color": school.branding.primary_color,
            "secondary_color": school.branding.secondary_color,
            "sidebar_color": school.branding.sidebar_color,
            "accent_color": school.branding.accent_color,
            "font_family": school.branding.font_family,
            "logo_url": school.branding.logo_url,
            "favicon_url": school.branding.favicon_url,
            "welcome_message": school.branding.welcome_message,
        }

    enabled_modules = (
        db.query(Module.key)
        .join(SchoolModule, SchoolModule.module_id == Module.id)
        .filter(SchoolModule.school_id == school.id, SchoolModule.is_enabled == True)
        .all()
    )

    return SuccessResponse(data={
        "school_id": str(school.id),
        "name": school.name,
        "slug": school.slug,
        "status": school.status,
        "custom_domain": school.custom_domain,
        "branding": branding_data,
        "enabled_modules": [m.key for m in enabled_modules],
    })


@router.get("/school/{slug}", response_model=SuccessResponse[dict])
def get_school_website(slug: str, db: Session = Depends(get_db)):
    """
    Returns full public website data for a school slug.
    Used by the public-facing school website renderer.
    """
    school = get_school_by_slug(db, slug)
    if not school or school.status in ("archived", "suspended"):
        raise HTTPException(status_code=404, detail="School not found or inactive")

    branding = db.query(SchoolBranding).filter(SchoolBranding.school_id == school.id).first()

    # Determine layout template (1-5, default 1) — read from WebsiteSetting
    ws = db.query(WebsiteSetting).filter(WebsiteSetting.school_id == school.id).first()
    layout_template = ws.layout_template if ws else 1

    # Fetch active navigation menu items
    nav_items = (
        db.query(NavigationMenu)
        .filter(
            NavigationMenu.school_id == school.id,
            NavigationMenu.is_active == True,
        )
        .order_by(NavigationMenu.display_order)
        .all()
    )
    nav_menu = [
        {
            "id": str(n.id),
            "label": n.label,
            "url": n.url,
            "parent_id": str(n.parent_id) if n.parent_id else None,
            "display_order": n.display_order,
        }
        for n in nav_items
    ]

    # Fetch gallery items (up to 20 for homepage)
    gallery_items = (
        db.query(GalleryModel)
        .filter(GalleryModel.school_id == school.id)
        .order_by(GalleryModel.display_order, GalleryModel.created_at)
        .limit(20)
        .all()
    )

    # Fetch enabled website sections ordered by display_order
    sections = (
        db.query(WebsiteSection)
        .filter(
            WebsiteSection.school_id == school.id,
            WebsiteSection.is_enabled == True,
        )
        .order_by(WebsiteSection.display_order)
        .all()
    )

    # Fetch enabled modules for this school (needed for white_label suppression, etc.)
    school_modules = (
        db.query(Module.key)
        .join(SchoolModule, SchoolModule.module_id == Module.id)
        .filter(SchoolModule.school_id == school.id, SchoolModule.is_enabled == True)
        .all()
    )
    enabled_module_keys = [m.key for m in school_modules]

    # Fetch active hero banners
    hero_banners = (
        db.query(HeroBanner)
        .filter(HeroBanner.school_id == school.id, HeroBanner.is_active == True)
        .order_by(HeroBanner.display_order, HeroBanner.created_at)
        .all()
    )

    return SuccessResponse(data={
        "school_id": str(school.id),
        "name": school.name,
        "slug": school.slug,
        "phone": school.phone or "",
        "email": school.email or "",
        "address": school.address or "",
        "city": school.city or "",
        "state": school.state or "",
        "established_year": school.established_year,
        "school_type": school.school_type,
        "website": school.website or "",
        "layout_template": layout_template,
        "enabled_modules": enabled_module_keys,
        "branding": {
            "primary_color": branding.primary_color if branding else "#1a73e8",
            "secondary_color": branding.secondary_color if branding else "#34a853",
            "accent_color": branding.accent_color if branding else "#f59e0b",
            "font_family": branding.font_family if branding else "Inter",
            "logo_url": branding.logo_url if branding else None,
            "favicon_url": branding.favicon_url if branding else None,
            "welcome_message": branding.welcome_message if branding else None,
            "footer_text": branding.footer_text if branding else None,
            "support_phone": branding.support_phone if branding else None,
            "support_email": branding.support_email if branding else None,
        },
        "navigation_menu": nav_menu,
        "hero_banner_url": ws.hero_banner_url if ws else None,
        "hero_banners": [
            {
                "id": str(b.id),
                "image_url": b.image_url,
                "title": b.title,
                "subtitle": b.subtitle,
                "display_order": b.display_order,
            }
            for b in hero_banners
        ],
        "gallery_items": [
            {"id": str(g.id), "title": g.title, "image_url": g.image_url, "category": g.category}
            for g in gallery_items
        ],
        "website_sections": [
            {
                "section_key": s.section_key,
                "is_enabled": s.is_enabled,
                "heading": s.heading,
                "description": s.description,
                "content": s.content,
                "display_order": s.display_order,
            }
            for s in sections
        ],
    })


@router.get("/school/{slug}/pages", response_model=SuccessResponse[list])
def list_public_pages(slug: str, db: Session = Depends(get_db)):
    """Returns a list of published CMS pages for a school (summary fields for nav/listing)."""
    school = get_school_by_slug(db, slug)
    if not school or school.status in ("archived", "suspended"):
        raise HTTPException(status_code=404, detail="School not found or inactive")

    pages = cms_service.list_pages(db, school.id, status="published")
    return SuccessResponse(data=[
        {
            "id": str(p.id),
            "title": p.title,
            "slug": p.slug,
            "seo_title": p.seo_title,
        }
        for p in pages
    ])


@router.get("/school/{slug}/pages/{page_slug}", response_model=SuccessResponse[dict])
def get_public_page(slug: str, page_slug: str, db: Session = Depends(get_db)):
    """Returns a single published CMS page by slug."""
    school = get_school_by_slug(db, slug)
    if not school or school.status in ("archived", "suspended"):
        raise HTTPException(status_code=404, detail="School not found or inactive")

    page = cms_service.get_page_by_slug(db, school.id, page_slug)
    if not page or page.status != "published":
        raise HTTPException(status_code=404, detail="Page not found")

    return SuccessResponse(data={
        "id": str(page.id),
        "title": page.title,
        "slug": page.slug,
        "content": page.content,
        "featured_image": page.featured_image,
        "seo_title": page.seo_title,
        "seo_description": page.seo_description,
        "status": page.status,
        "created_at": page.created_at.isoformat() if page.created_at else None,
    })


@router.get("/school/{slug}/gallery", response_model=SuccessResponse[list])
def get_public_gallery(
    slug: str,
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Returns gallery items for a school. Unauthenticated."""
    school = get_school_by_slug(db, slug)
    if not school or school.status in ("archived", "suspended"):
        raise HTTPException(status_code=404, detail="School not found or inactive")

    q = db.query(GalleryModel).filter(GalleryModel.school_id == school.id)
    if category:
        q = q.filter(GalleryModel.category == category)
    items = q.order_by(GalleryModel.display_order, GalleryModel.created_at).all()

    return SuccessResponse(data=[
        {
            "id": str(g.id),
            "title": g.title,
            "image_url": g.image_url,
            "category": g.category,
            "display_order": g.display_order,
        }
        for g in items
    ])
