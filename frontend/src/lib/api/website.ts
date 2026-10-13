import api from "@/lib/api";
import type { ApiResponse } from "@/types/common";

export interface WebsiteSettings {
  id: string;
  school_id: string;
  layout_template: number;
  is_published: boolean;
  seo_title: string | null;
  seo_description: string | null;
}

export interface WebsiteSection {
  id: string;
  school_id: string;
  section_key: string;
  is_enabled: boolean;
  heading: string | null;
  description: string | null;
  content: Record<string, unknown> | null;
  display_order: number;
}

const BASE = "/website";

export async function getWebsiteSettings() {
  const res = await api.get<ApiResponse<WebsiteSettings>>(`${BASE}/settings`);
  return res.data.data;
}

export async function updateWebsiteSettings(payload: Partial<{
  layout_template: number;
  is_published: boolean;
  seo_title: string;
  seo_description: string;
}>) {
  const res = await api.patch<ApiResponse<WebsiteSettings>>(`${BASE}/settings`, payload);
  return res.data.data;
}

export async function listSections() {
  const res = await api.get<ApiResponse<WebsiteSection[]>>(`${BASE}/sections`);
  return res.data.data;
}

export async function updateSection(sectionKey: string, payload: Partial<{
  is_enabled: boolean;
  heading: string;
  description: string;
  display_order: number;
}>) {
  const res = await api.patch<ApiResponse<WebsiteSection>>(`${BASE}/sections/${sectionKey}`, payload);
  return res.data.data;
}

export async function reorderSections(order: { section_key: string; display_order: number }[]) {
  const res = await api.post<ApiResponse<WebsiteSection[]>>(`${BASE}/sections/reorder`, { order });
  return res.data.data;
}

// ── Navigation Menu ───────────────────────────────────────────────────────────

export interface NavigationMenuItem {
  id: string;
  school_id: string;
  label: string;
  url: string | null;
  page_id: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
}

export async function listMenuItems(): Promise<NavigationMenuItem[]> {
  const res = await api.get<ApiResponse<NavigationMenuItem[]>>(`${BASE}/navigation`);
  return res.data.data;
}

export async function createMenuItem(payload: {
  label: string;
  url?: string;
  parent_id?: string;
  display_order?: number;
  page_id?: string;
}): Promise<NavigationMenuItem> {
  const res = await api.post<ApiResponse<NavigationMenuItem>>(`${BASE}/navigation`, payload);
  return res.data.data;
}

export async function updateMenuItem(
  id: string,
  payload: Partial<{
    label: string;
    url: string | null;
    parent_id: string | null;
    display_order: number;
    is_active: boolean;
    page_id: string | null;
  }>,
): Promise<NavigationMenuItem> {
  const res = await api.patch<ApiResponse<NavigationMenuItem>>(`${BASE}/navigation/${id}`, payload);
  return res.data.data;
}

export async function deleteMenuItem(id: string): Promise<void> {
  await api.delete(`${BASE}/navigation/${id}`);
}

export async function reorderMenuItems(
  order: { id: string; display_order: number }[],
): Promise<NavigationMenuItem[]> {
  const res = await api.post<ApiResponse<NavigationMenuItem[]>>(`${BASE}/navigation/reorder`, { order });
  return res.data.data;
}

// ── CMS Pages ─────────────────────────────────────────────────────────────────

export interface CmsPage {
  id: string;
  school_id: string;
  title: string;
  slug: string;
  content: string | null;
  featured_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export async function listCmsPages(status?: string): Promise<CmsPage[]> {
  const params = status ? `?status=${status}` : '';
  const res = await api.get<ApiResponse<CmsPage[]>>(`${BASE}/pages${params}`);
  return res.data.data;
}

export async function getCmsPage(pageId: string): Promise<CmsPage> {
  const res = await api.get<ApiResponse<CmsPage>>(`${BASE}/pages/${pageId}`);
  return res.data.data;
}

export async function createCmsPage(payload: {
  title: string;
  slug: string;
  content?: string;
  featured_image?: string;
  seo_title?: string;
  seo_description?: string;
  status?: string;
}): Promise<CmsPage> {
  const res = await api.post<ApiResponse<CmsPage>>(`${BASE}/pages`, payload);
  return res.data.data;
}

export async function updateCmsPage(
  pageId: string,
  payload: Partial<{
    title: string;
    slug: string;
    content: string;
    featured_image: string;
    seo_title: string;
    seo_description: string;
    status: string;
  }>,
): Promise<CmsPage> {
  const res = await api.patch<ApiResponse<CmsPage>>(`${BASE}/pages/${pageId}`, payload);
  return res.data.data;
}

export async function deleteCmsPage(pageId: string): Promise<void> {
  await api.delete(`${BASE}/pages/${pageId}`);
}

// ── Gallery ───────────────────────────────────────────────────────────────────

export interface GalleryItem {
  id: string;
  school_id: string;
  title: string;
  image_url: string;
  category: string | null;
  display_order: number;
  created_at: string;
}

export async function getGalleryItems(category?: string): Promise<GalleryItem[]> {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  const res = await api.get<ApiResponse<GalleryItem[]>>(`${BASE}/gallery${params}`);
  return res.data.data;
}

export async function createGalleryItem(data: {
  title: string;
  image_url: string;
  category?: string | null;
  display_order?: number;
}): Promise<GalleryItem> {
  const res = await api.post<ApiResponse<GalleryItem>>(`${BASE}/gallery`, data);
  return res.data.data;
}

export async function updateGalleryItem(
  id: string,
  data: Partial<{
    title: string;
    image_url: string;
    category: string | null;
    display_order: number;
  }>,
): Promise<GalleryItem> {
  const res = await api.patch<ApiResponse<GalleryItem>>(`${BASE}/gallery/${id}`, data);
  return res.data.data;
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await api.delete(`${BASE}/gallery/${id}`);
}

export async function reorderGalleryItems(
  order: { id: string; display_order: number }[],
): Promise<GalleryItem[]> {
  const res = await api.post<ApiResponse<GalleryItem[]>>(`${BASE}/gallery/reorder`, { order });
  return res.data.data;
}
