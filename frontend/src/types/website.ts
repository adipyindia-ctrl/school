export interface SchoolWebsiteData {
  school_id: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  established_year: number | null;
  school_type: string;
  website: string;
  layout_template: number; // 1–5
  enabled_modules: string[]; // list of enabled module keys, e.g. ["white_label", "website", ...]
  hero_banner_url?: string | null;
  hero_banners?: Array<{
    id: string;
    image_url: string;
    title: string | null;
    subtitle: string | null;
    display_order: number;
  }>;
  branding: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    logo_url: string | null;
    favicon_url: string | null;
    welcome_message: string | null;
    footer_text: string | null;
    support_phone: string | null;
    support_email: string | null;
  };
  navigation_menu?: Array<{
    id: string;
    label: string;
    url: string | null;
    parent_id: string | null;
    display_order: number;
  }>;
  gallery_items?: Array<{
    id: string;
    title: string;
    image_url: string;
    category: string | null;
  }>;
  website_sections?: Array<{
    section_key: string;
    is_enabled: boolean;
    heading: string | null;
    description: string | null;
    content: Record<string, unknown> | null;
    display_order: number;
  }>;
}

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

export interface CmsPageSummary {
  id: string;
  title: string;
  slug: string;
  seo_title: string | null;
}

export interface GalleryItem {
  id: string;
  school_id: string;
  title: string;
  image_url: string;
  category: string | null;
  display_order: number;
  created_at: string;
}
