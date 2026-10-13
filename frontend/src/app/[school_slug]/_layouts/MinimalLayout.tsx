import type { SchoolWebsiteData } from "@/types/website";
import { WebsiteShell } from "./WebsiteShell";

function getSection(data: SchoolWebsiteData, key: string) {
  if (!data.website_sections || data.website_sections.length === 0) {
    return { show: true, heading: null, description: null, content: null };
  }
  const s = data.website_sections.find((sec) => sec.section_key === key);
  if (!s) return { show: false, heading: null, description: null, content: null };
  return { show: s.is_enabled, heading: s.heading, description: s.description, content: s.content };
}

export function MinimalLayout({ data }: { data: SchoolWebsiteData }) {
  const { branding, name, phone, email, address, city, state, established_year } = data;
  const primary = branding.primary_color;

  const hero = getSection(data, "hero");
  const about = getSection(data, "about");
  const gallery = getSection(data, "gallery");
  const admissions = getSection(data, "admissions");

  return (
    <WebsiteShell data={data}>
      <div className="bg-white text-gray-900">
        {/* Hero — clean typography */}
        {hero.show && (
          <section className="max-w-3xl mx-auto px-8 py-32 text-center">
            <p className="text-sm text-gray-400 mb-4 tracking-wide uppercase">
              {data.school_type.toUpperCase()} · {city} · Est. {established_year ?? "—"}
            </p>
            <h1 className="text-5xl font-light leading-tight mb-6" style={{ color: primary }}>
              {hero.heading || branding.welcome_message || name}
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-10">
              {hero.description ||
                "A place where curiosity is encouraged, potential is realised, and every student matters."}
            </p>
            <a
              href="#admissions"
              style={{ borderColor: primary, color: primary } as React.CSSProperties}
              className="text-base font-semibold border-b-2 pb-0.5 hover:opacity-70 transition-opacity"
            >
              Explore Admissions →
            </a>
          </section>
        )}

        {/* Divider */}
        <div className="max-w-3xl mx-auto px-8">
          <hr className="border-gray-100" />
        </div>

        {/* About */}
        {about.show && (
          <section id="about" className="max-w-3xl mx-auto px-8 py-20">
            <h2 className="text-2xl font-semibold mb-6" style={{ color: primary }}>
              {about.heading || "About"}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {about.description ||
                `${name} offers an outstanding educational environment with dedicated teachers, modern
                facilities, and a curriculum designed to inspire lifelong learning. Located in ${city}, ${state},
                we serve hundreds of students across all grades.`}
            </p>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                ["Board", data.school_type.toUpperCase()],
                ["City", city],
                ["Phone", phone || "—"],
                ["Email", email ? email.split("@")[0] + "@..." : "—"],
              ].map(([l, v]) => (
                <div key={l} className="p-3 bg-gray-50 rounded">
                  <p className="text-xs text-gray-400 mb-1">{l}</p>
                  <p className="text-sm font-medium truncate">{v}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
          <section id="gallery" className="max-w-3xl mx-auto px-8 py-16">
            <h2 className="text-2xl font-semibold mb-8" style={{ color: primary }}>
              {gallery.heading || "Gallery"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.gallery_items.map((img) => (
                <div
                  key={img.id}
                  className="aspect-square overflow-hidden rounded-lg bg-gray-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={img.title}
                    className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        {admissions.show && (
          <section id="admissions" className="max-w-3xl mx-auto px-8 py-16 text-center">
            <h2 className="text-2xl font-semibold mb-4">
              {admissions.heading || "Ready to Join?"}
            </h2>
            <p className="text-gray-500 mb-6">
              {admissions.description || "Applications for the next session are now open."}
            </p>
            <a
              href="/login"
              style={{ backgroundColor: primary }}
              className="inline-block px-8 py-3 text-white font-semibold rounded hover:opacity-90 transition-opacity"
            >
              Apply Now
            </a>
          </section>
        )}
      </div>
    </WebsiteShell>
  );
}
