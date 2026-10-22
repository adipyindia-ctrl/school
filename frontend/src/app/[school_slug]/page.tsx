import { notFound } from "next/navigation";
import type { SchoolWebsiteData } from "@/types/website";
import { ModernLayout } from "./_layouts/ModernLayout";
import { ClassicLayout } from "./_layouts/ClassicLayout";
import { PremiumLayout } from "./_layouts/PremiumLayout";
import { MinimalLayout } from "./_layouts/MinimalLayout";
import { KidsLayout } from "./_layouts/KidsLayout";

interface Props {
  params: Promise<{ school_slug: string }>;
}

async function fetchSchoolData(slug: string): Promise<SchoolWebsiteData | null> {
  try {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api/v1";
    const res = await fetch(`${apiBase}/public/school/${slug}`, {
      cache: 'no-store', // bypass Vercel CDN cache — always fresh
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as SchoolWebsiteData;
  } catch {
    return null;
  }
}

export default async function SchoolWebsitePage({ params }: Props) {
  const { school_slug } = await params;
  const data = await fetchSchoolData(school_slug);
  if (!data) notFound();

  const template = data.layout_template ?? 1;

  switch (template) {
    case 2: return <ClassicLayout data={data} />;
    case 3: return <PremiumLayout data={data} />;
    case 4: return <MinimalLayout data={data} />;
    case 5: return <KidsLayout data={data} />;
    default: return <ModernLayout data={data} />;
  }
}

export async function generateMetadata({ params }: Props) {
  const { school_slug } = await params;
  const data = await fetchSchoolData(school_slug);
  return {
    title: data?.name ?? "School Website",
    description: data?.branding.welcome_message ?? `Welcome to ${data?.name}`,
    icons: { icon: data?.branding.favicon_url ?? "/favicon.ico" },
  };
}
