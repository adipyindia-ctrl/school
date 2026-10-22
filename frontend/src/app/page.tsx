import { notFound } from "next/navigation";
import type { SchoolWebsiteData } from "@/types/website";
import { ModernLayout } from "./[school_slug]/_layouts/ModernLayout";
import { ClassicLayout } from "./[school_slug]/_layouts/ClassicLayout";
import { PremiumLayout } from "./[school_slug]/_layouts/PremiumLayout";
import { MinimalLayout } from "./[school_slug]/_layouts/MinimalLayout";
import { KidsLayout } from "./[school_slug]/_layouts/KidsLayout";

/**
 * Root page — renders the default school's public website directly at http://localhost:3000
 * without any URL redirect. The slug is read from DEFAULT_SCHOOL_SLUG env var.
 */
async function fetchSchoolData(slug: string): Promise<SchoolWebsiteData | null> {
  try {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api/v1";
    const res = await fetch(`${apiBase}/public/school/${slug}`, {
      next: { revalidate: 0 }, // always fresh — admin changes show instantly
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as SchoolWebsiteData;
  } catch {
    return null;
  }
}

async function getDefaultSlug(): Promise<string | null> {
  // 1. Env override — set DEFAULT_SCHOOL_SLUG in .env.local
  if (process.env.DEFAULT_SCHOOL_SLUG) {
    return process.env.DEFAULT_SCHOOL_SLUG;
  }
  // 2. Auto-discover first active school from backend
  try {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api/v1";
    const res = await fetch(`${apiBase}/public/schools`, { next: { revalidate: 0 } });
    if (res.ok) {
      const json = await res.json();
      const schools: { slug: string; status: string }[] = json.data ?? [];
      return schools.find((s) => s.status === "active" || s.status === "trial")?.slug ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}

export default async function RootPage() {
  const slug = await getDefaultSlug();
  if (!slug) notFound();

  const data = await fetchSchoolData(slug);
  if (!data) notFound();

  switch (data.layout_template ?? 1) {
    case 2: return <ClassicLayout data={data} />;
    case 3: return <PremiumLayout data={data} />;
    case 4: return <MinimalLayout data={data} />;
    case 5: return <KidsLayout data={data} />;
    default: return <ModernLayout data={data} />;
  }
}

export async function generateMetadata() {
  const slug = await getDefaultSlug();
  if (!slug) return { title: "School Website" };
  const data = await fetchSchoolData(slug);
  return {
    title: data?.name ?? "School Website",
    description: data?.branding.welcome_message ?? `Welcome to ${data?.name}`,
    icons: { icon: data?.branding.favicon_url ?? "/favicon.ico" },
  };
}
