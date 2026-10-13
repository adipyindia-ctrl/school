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

export function ModernLayout({ data }: { data: SchoolWebsiteData }) {
  const { branding, name, phone, email, address, city, state, established_year } = data;
  const primary = branding.primary_color;
  const secondary = branding.secondary_color;

  const hero = getSection(data, "hero");
  const about = getSection(data, "about");
  const stats = getSection(data, "stats");
  const gallery = getSection(data, "gallery");
  const admissions = getSection(data, "admissions");

  return (
    <WebsiteShell data={data}>
      {/* Hero */}
      {hero.show && (
        <section
          style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
          className="text-white py-28 px-6"
        >
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              Est. {established_year ?? "—"}
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              {hero.heading || branding.welcome_message || `Welcome to ${name}`}
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {hero.description ||
                "Nurturing young minds with excellence in education, character building, and holistic development."}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="#admissions"
                style={{ backgroundColor: branding.accent_color }}
                className="px-8 py-3 rounded-full font-bold text-white hover:opacity-90 transition-opacity"
              >
                Apply Now
              </a>
              <a
                href="#about"
                className="px-8 py-3 rounded-full font-bold border-2 border-white text-white hover:bg-white/10 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Stats Bar */}
      {stats.show && (
        <section style={{ backgroundColor: branding.accent_color }} className="py-8 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[
              ["1000+", "Students"],
              ["50+", "Teachers"],
              ["20+", "Courses"],
              ["100%", "Results"],
            ].map(([num, label]) => (
              <div key={label}>
                <p className="text-3xl font-extrabold">{num}</p>
                <p className="text-sm opacity-80">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      {about.show && (
        <section id="about" className="py-20 px-6 bg-white">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 style={{ color: primary }} className="text-3xl font-bold mb-4">
                {about.heading || "About Our School"}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {about.description ||
                  `${name} is a leading educational institution committed to academic excellence and the overall
                  development of students. With state-of-the-art facilities and experienced faculty, we provide
                  an environment where students thrive.`}
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our curriculum blends traditional values with modern pedagogical approaches to prepare students
                for the challenges of the 21st century.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Board", value: data.school_type.toUpperCase() },
                { label: "Established", value: String(established_year ?? "—") },
                { label: "Location", value: `${city}, ${state}` },
                { label: "Contact", value: phone },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{ borderColor: primary }}
                  className="p-4 rounded-xl border-2 text-center"
                >
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="font-bold text-gray-800 text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
        <section id="gallery" className="py-20 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 style={{ color: primary }} className="text-3xl font-bold mb-8 text-center">
              {gallery.heading || "Gallery"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.gallery_items.map((img) => (
                <div
                  key={img.id}
                  className="aspect-square overflow-hidden rounded-xl bg-gray-200 shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={img.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Admissions CTA */}
      {admissions.show && (
        <section id="admissions" style={{ backgroundColor: `${primary}10` }} className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 style={{ color: primary }} className="text-3xl font-bold mb-4">
              {admissions.heading || "Admissions Open"}
            </h2>
            <p className="text-gray-600 mb-8">
              {admissions.description ||
                `Join ${name} and be part of a community dedicated to academic excellence.
                Applications for the upcoming session are now open.`}
            </p>
            <a
              href="/login"
              style={{ backgroundColor: primary }}
              className="inline-block px-10 py-4 rounded-full text-white font-bold text-lg hover:opacity-90 transition-opacity"
            >
              Apply for Admission
            </a>
          </div>
        </section>
      )}
    </WebsiteShell>
  );
}
