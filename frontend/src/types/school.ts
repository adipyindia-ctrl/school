export interface School {
  id: string;
  name: string;
  code: string;
  slug: string;
  school_type: string;
  established_year: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  status: SchoolStatus;
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
  branding?: Branding | null;
  settings?: SchoolSettings | null;
}

export type SchoolStatus = "active" | "suspended" | "trial" | "expired" | "archived";

export interface Branding {
  id: string;
  school_id: string;
  primary_color: string;
  secondary_color: string;
  sidebar_color: string;
  accent_color: string;
  font_family: string;
  logo_url: string | null;
  favicon_url: string | null;
  login_bg_url: string | null;
  dashboard_logo_url: string | null;
  welcome_message: string | null;
  footer_text: string | null;
  support_phone: string | null;
  support_email: string | null;
  updated_at: string;
}

export interface SchoolSettings {
  id: string;
  school_id: string;
  academic_year_start_month: number;
  attendance_threshold: number;
  fee_due_day: number;
  timezone: string;
  currency: string;
  date_format: string;
  updated_at: string;
}

export interface TenantContext {
  school_id: string | null;
  name: string;
  slug: string;
  status: string;
  custom_domain: string | null;
  branding: Partial<Branding>;
  enabled_modules: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: string;
  max_students: number;
  max_teachers: number;
  storage_mb: number;
  sms_limit: number;
  trial_days: number;
  is_active: boolean;
}
