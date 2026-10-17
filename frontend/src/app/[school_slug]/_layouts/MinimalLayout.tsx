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
  const contact = getSection(data, "contact");

  return (
    <WebsiteShell data={data}>
      <div className="bg-white text-gray-900">
        {/* Hero — clean typography */}
        {hero.show && (
          <section className="min-h-[75vh] flex items-center">
            <div className="max-w-3xl mx-auto px-8 text-center">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-8 h-px" style={{ backgroundColor: primary }} />
                <p className="text-sm text-gray-400 tracking-wide uppercase">
                  {data.school_type.toUpperCase()} · {city} · Est. {established_year ?? "—"}
                </p>
                <div className="w-8 h-px" style={{ backgroundColor: primary }} />
              </div>
              <h1 className="text-6xl md:text-7xl font-light leading-tight mb-8" style={{ color: primary }}>
                {hero.heading || branding.welcome_message || name}
              </h1>
              <div className="w-12 h-0.5 mx-auto mb-8" style={{ backgroundColor: primary }} />
              <p className="text-gray-500 text-lg leading-relaxed mb-10">
                {hero.description ||
                  "A place where curiosity is encouraged, potential is realised, and every student matters."}
              </p>
              <span className="group">
                <a
                  href="#admissions"
                  style={{ borderColor: primary, color: primary } as React.CSSProperties}
                  className="text-base font-semibold border-b-2 pb-0.5 hover:opacity-70 transition-opacity"
                >
                  Explore Admissions{" "}
                  <span className="group-hover:translate-x-1 inline-block transition-transform duration-200">
                    →
                  </span>
                </a>
              </span>
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="max-w-3xl mx-auto px-8">
          <hr className="border-gray-100" />
        </div>

        {/* About */}
        {about.show && (
          <section id="about" className="max-w-3xl mx-auto px-8 py-24">
            <h2
              className="text-2xl font-semibold mb-6 pl-4 border-l-4"
              style={{ color: primary, borderColor: primary }}
            >
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
                <div
                  key={l}
                  className="p-3 bg-gray-50 rounded hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border border-gray-100"
                >
                  <p className="text-xs text-gray-400 mb-1">{l}</p>
                  <p className="text-sm font-medium truncate">{v}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
          <section id="gallery" className="max-w-3xl mx-auto px-8 py-20">
            <h2
              className="text-2xl font-semibold mb-8 pl-4 border-l-4"
              style={{ color: primary, borderColor: primary }}
            >
              {gallery.heading || "Gallery"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.gallery_items.map((img) => (
                <div
                  key={img.id}
                  className="relative group overflow-hidden rounded-lg bg-gray-100 aspect-square"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                    <p className="text-white text-xs">{img.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        {admissions.show && (
          <section
            id="admissions"
            className="py-24"
            style={{ backgroundColor: `${primary}06` }}
          >
            <div className="max-w-lg mx-auto px-8 text-center">
              <h2
                className="text-2xl font-semibold mb-4 pl-4 border-l-4 text-left"
                style={{ color: primary, borderColor: primary }}
              >
                {admissions.heading || "Ready to Join?"}
              </h2>
              <p className="text-gray-500 mb-6">
                {admissions.description || "Applications for the next session are now open."}
              </p>
              <a
                href="/login"
                style={{ backgroundColor: primary }}
                className="inline-block px-8 py-3 text-white font-semibold rounded hover:opacity-90 transition-opacity hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                Apply Now
              </a>
            </div>
          </section>
        )}

        {/* Contact Us */}
        {contact.show && (
          <section id="contact" className="max-w-3xl mx-auto px-8 py-24">
            <hr className="border-gray-100 mb-16" />
            <h2
              className="text-2xl font-semibold mb-4 pl-4 border-l-4"
              style={{ color: primary, borderColor: primary }}
            >
              {contact.heading || "Contact"}
            </h2>
            <p className="text-gray-500 mb-8">
              {contact.description || "Get in touch with us. We're happy to help."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all duration-200">
                <p className="text-xs text-gray-400 mb-1">Address</p>
                <p className="text-sm font-medium">{address || `${city}, ${state}`}</p>
              </div>
              <div className="bg-gray-50 rounded border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all duration-200">
                <p className="text-xs text-gray-400 mb-1">Phone</p>
                <p className="text-sm font-medium">{phone || "—"}</p>
                {branding.support_phone && (
                  <p className="text-xs text-gray-400 mt-1">Support: {branding.support_phone}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded border border-gray-100 p-5 hover:shadow-sm hover:border-gray-200 transition-all duration-200">
                <p className="text-xs text-gray-400 mb-1">Email</p>
                <p className="text-sm font-medium">{email || "—"}</p>
                {branding.support_email && (
                  <p className="text-xs text-gray-400 mt-1">Support: {branding.support_email}</p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </WebsiteShell>
  );
}
