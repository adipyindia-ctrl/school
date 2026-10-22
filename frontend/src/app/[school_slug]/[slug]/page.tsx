import { notFound } from "next/navigation";

interface NavItem {
  id: string;
  label: string;
  url: string | null;
  parent_id: string | null;
  display_order: number;
}

interface Props {
  params: Promise<{ school_slug: string; slug: string }>;
}

async function fetchPage(schoolSlug: string, pageSlug: string) {
  try {
    const apiBase =
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;
    const res = await fetch(
      `${apiBase}/public/school/${schoolSlug}/pages/${pageSlug}`,
      { next: { revalidate: 0 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

async function fetchSchoolData(slug: string) {
  try {
    const apiBase =
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;
    const res = await fetch(`${apiBase}/public/school/${slug}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

const DEFAULT_NAV: NavItem[] = [
  { id: "home", label: "Home", url: "/", parent_id: null, display_order: 0 },
  { id: "about", label: "About", url: "#about", parent_id: null, display_order: 1 },
  { id: "admissions", label: "Admissions", url: "#admissions", parent_id: null, display_order: 2 },
  { id: "contact", label: "Contact", url: "#contact", parent_id: null, display_order: 3 },
];

export default async function CmsPageRenderer({ params }: Props) {
  const { school_slug, slug } = await params;
  const [page, school] = await Promise.all([
    fetchPage(school_slug, slug),
    fetchSchoolData(school_slug),
  ]);
  if (!page) notFound();

  const primaryColor: string = school?.branding?.primary_color ?? "#1a73e8";
  const fontFamily: string = school?.branding?.font_family ?? "Inter, sans-serif";

  // Use navigation_menu from school data, fall back to DEFAULT_NAV
  const rawNav: NavItem[] = school?.navigation_menu ?? [];
  const navItems: NavItem[] =
    rawNav.length > 0
      ? rawNav.filter((n: NavItem) => !n.parent_id).sort((a, b) => a.display_order - b.display_order)
      : DEFAULT_NAV;

  return (
    <div style={{ fontFamily }}>
      {/* Full navigation header using school's navigation_menu */}
      <header
        style={{ backgroundColor: primaryColor }}
        className="sticky top-0 z-50 shadow-md"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo + school name as home link */}
          <a
            href={`/${school_slug}`}
            className="flex items-center gap-3 text-white hover:opacity-90 transition-opacity"
          >
            {school?.branding?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={school.branding.logo_url}
                alt={school.name}
                className="h-9 w-9 object-contain rounded-lg bg-white p-0.5"
              />
            )}
            <span className="font-bold text-lg">{school?.name}</span>
          </a>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-6 text-white/90 text-sm font-medium">
            {navItems.map((item) => {
              // Resolve relative nav URLs to be school-scoped
              const href =
                item.url
                  ? item.url.startsWith("#") || item.url.startsWith("http")
                    ? item.url
                    : `/${school_slug}${item.url.startsWith("/") ? item.url : `/${item.url}`}`
                  : `/${school_slug}`;

              return (
                <a
                  key={item.id}
                  href={href}
                  className="hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Student Login */}
          {/* <a
            href="/login"
            style={{ backgroundColor: "white", color: primaryColor }}
            className="hidden md:block px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Student Login
          </a> */}
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {page.featured_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.featured_image}
            alt={page.title}
            className="w-full h-64 object-cover rounded-xl mb-8"
          />
        )}
        <h1
          className="text-3xl font-bold mb-6"
          style={{ color: primaryColor }}
        >
          {page.title}
        </h1>
        {page.content && (
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{ backgroundColor: primaryColor }}
        className="px-6 py-6 text-white mt-10"
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/80 text-sm">
            {school?.branding?.footer_text ?? `© ${new Date().getFullYear()} ${school?.name}. All rights reserved.`}
          </p>
          <a
            href={`/${school_slug}`}
            className="text-white/70 hover:text-white text-sm transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </footer>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { school_slug, slug } = await params;
  const [page, school] = await Promise.all([
    fetchPage(school_slug, slug),
    fetchSchoolData(school_slug),
  ]);
  return {
    title: page?.seo_title ?? page?.title ?? "Page",
    description:
      page?.seo_description ?? `${page?.title} - ${school?.name}`,
    icons: { icon: school?.branding?.favicon_url ?? "/favicon.ico" },
  };
}
