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

export function ClassicLayout({ data }: { data: SchoolWebsiteData }) {
  const { branding, name, phone, email, address, city, state, established_year } = data;
  const primary = branding.primary_color;

  const hero = getSection(data, "hero");
  const about = getSection(data, "about");
  const gallery = getSection(data, "gallery");
  const admissions = getSection(data, "admissions");

  return (
    <WebsiteShell data={data}>
      {/* Hero Banner */}
      {hero.show && (
        <div
          style={{ backgroundColor: `${primary}15`, fontFamily: "Georgia, serif" }}
          className="py-24 px-6 text-center border-b"
        >
          <h2 style={{ color: primary }} className="text-4xl font-bold mb-4">
            {hero.heading || branding.welcome_message || `Welcome to ${name}`}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            {hero.description ||
              `A tradition of excellence in education since ${established_year ?? "our founding"}.
              Dedicated to shaping the future with knowledge, integrity, and character.`}
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <a
              href="#admissions"
              style={{ backgroundColor: primary }}
              className="px-8 py-3 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Admissions
            </a>
            <a
              href="#about-us"
              className="px-8 py-3 border-2 font-semibold hover:bg-gray-50 transition-colors"
              style={{ borderColor: primary, color: primary }}
            >
              About Us
            </a>
          </div>
        </div>
      )}

      {/* Three pillars */}
      {about.show && (
        <section
          id="about-us"
          className="py-16 px-6 bg-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <div className="max-w-5xl mx-auto">
            <h2 style={{ color: primary }} className="text-2xl font-bold mb-8 text-center">
              {about.heading || "Our Pillars of Excellence"}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Academic Excellence",
                  body: about.description ||
                    "Rigorous curriculum designed to challenge and inspire students at every level.",
                },
                {
                  title: "Character Building",
                  body: "We instil values of integrity, compassion, and leadership in every student.",
                },
                {
                  title: "Holistic Development",
                  body: "Sports, arts, and extracurricular activities for well-rounded growth.",
                },
              ].map(({ title, body }) => (
                <div key={title} className="border-t-4 pt-4" style={{ borderColor: primary }}>
                  <h3 style={{ color: primary }} className="font-bold text-lg mb-2">
                    {title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: "Board", value: data.school_type.toUpperCase() },
                { label: "Established", value: String(established_year ?? "—") },
                { label: "Location", value: `${city}, ${state}` },
                { label: "Contact", value: phone || email },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-gray-50 border">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-sm font-bold truncate" style={{ color: primary }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
        <section id="gallery" className="py-16 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2
              style={{ color: primary }}
              className="text-2xl font-bold mb-2 text-center tracking-wide"
              // eslint-disable-next-line react/no-unknown-property
            >
              {gallery.heading || "Gallery"}
            </h2>
            <div className="w-16 h-1 mx-auto mb-8" style={{ backgroundColor: primary }} />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.gallery_items.map((img) => (
                <div
                  key={img.id}
                  className="bg-white border border-gray-200 overflow-hidden shadow-sm"
                >
                  <div className="aspect-video overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt={img.title}
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    />
                  </div>
                  <p className="text-xs text-gray-600 px-2 py-1.5 truncate font-medium">
                    {img.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Admissions */}
      {admissions.show && (
        <section id="admissions" className="py-16 px-6 bg-white text-center">
          <div className="max-w-2xl mx-auto">
            <h2 style={{ color: primary }} className="text-2xl font-bold mb-4">
              {admissions.heading || "Admissions Open"}
            </h2>
            <p className="text-gray-600 mb-6">
              {admissions.description ||
                `Join ${name}. Applications for the upcoming academic session are now open.`}
            </p>
            <a
              href="/login"
              style={{ backgroundColor: primary }}
              className="inline-block px-8 py-3 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Apply Now
            </a>
          </div>
        </section>
      )}
    </WebsiteShell>
  );
}
