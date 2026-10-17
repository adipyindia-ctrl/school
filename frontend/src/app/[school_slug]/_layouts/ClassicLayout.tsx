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
  const academics = getSection(data, "academics");
  const gallery = getSection(data, "gallery");
  const admissions = getSection(data, "admissions");
  const contact = getSection(data, "contact");

  return (
    <WebsiteShell data={data}>
      {/* Hero Banner */}
      {hero.show && (
        <div
          style={{
            background: `linear-gradient(180deg, ${primary}20 0%, ${primary}08 50%, white 100%)`,
            fontFamily: "Georgia, serif",
          }}
          className="min-h-[80vh] flex items-center justify-center px-6 text-center border-b"
        >
          <div className="max-w-3xl mx-auto">
            {/* Decorative crest ring */}
            <div
              className="w-32 h-32 rounded-full border-4 mx-auto mb-6 flex items-center justify-center text-5xl"
              style={{ borderColor: primary }}
            >
              🏛️
            </div>

            {/* Est. divider */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px" style={{ backgroundColor: primary }} />
              <span style={{ color: primary }} className="text-xs tracking-widest uppercase">
                Est. {established_year ?? "—"}
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: primary }} />
            </div>

            <h2 style={{ color: primary }} className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
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
                className="px-8 py-3 text-white font-semibold hover:opacity-90 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                Admissions
              </a>
              <a
                href="#about"
                className="px-8 py-3 border-2 font-semibold hover:bg-gray-50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                style={{ borderColor: primary, color: primary }}
              >
                About Us
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Three pillars */}
      {about.show && (
        <section
          id="about"
          className="py-16 px-6 bg-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <div className="max-w-5xl mx-auto">
            <h2 style={{ color: primary }} className="text-2xl font-bold mb-4 text-center">
              {about.heading || "Our Pillars of Excellence"}
            </h2>
            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-px" style={{ backgroundColor: primary }} />
              <span style={{ color: primary }}>✦</span>
              <div className="w-12 h-px" style={{ backgroundColor: primary }} />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Academic Excellence",
                  body:
                    about.description ||
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
                <div
                  key={title}
                  className="bg-white border border-gray-200 border-t-4 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                  style={{ borderTopColor: primary }}
                >
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
                <div
                  key={label}
                  className="bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200"
                >
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

      {/* Academics */}
      {academics.show && (
        <section
          id="academics"
          className="py-16 px-6 bg-gray-50"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <div className="max-w-5xl mx-auto">
            <h2
              style={{ color: primary }}
              className="text-2xl font-bold mb-4 text-center tracking-wide"
            >
              {academics.heading || "Our Academic Programs"}
            </h2>
            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-px" style={{ backgroundColor: primary }} />
              <span style={{ color: primary }}>✦</span>
              <div className="w-12 h-px" style={{ backgroundColor: primary }} />
            </div>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              {academics.description ||
                "A rigorous and well-rounded curriculum designed to develop scholars and leaders of tomorrow."}
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Primary School",
                  body: "Building strong foundations through an engaging and nurturing learning environment.",
                },
                {
                  title: "Middle School",
                  body: "Expanding horizons with advanced concepts, scientific exploration, and creative thinking.",
                },
                {
                  title: "Senior School",
                  body: "Preparing students for board examinations and competitive entrance tests with excellence.",
                },
              ].map(({ title, body }) => (
                <div
                  key={title}
                  className="p-6 border border-gray-200 border-t-4 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  style={{ borderTopColor: primary }}
                >
                  <h3 style={{ color: primary }} className="font-bold text-lg mb-2">
                    {title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
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
              className="text-2xl font-bold mb-4 text-center tracking-wide"
            // eslint-disable-next-line react/no-unknown-property
            >
              {gallery.heading || "Gallery"}
            </h2>
            <div className="w-16 h-1 mx-auto mb-8" style={{ backgroundColor: primary }} />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.gallery_items.map((img) => (
                <div
                  key={img.id}
                  className="border-2 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                  style={{ borderColor: primary }}
                >
                  <div className="aspect-video relative group overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt={img.title}
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                      <p
                        className="text-white text-xs font-semibold"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {img.title}
                      </p>
                    </div>
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
        <section
          id="admissions"
          className="py-16 px-6 text-center"
          style={{
            background: `linear-gradient(180deg, white 0%, ${primary}10 100%)`,
            fontFamily: "Georgia, serif",
          }}
        >
          <div
            className="border-2 p-10 max-w-2xl mx-auto"
            style={{ borderColor: primary }}
          >
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
              className="inline-block px-8 py-3 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
            >
              Apply Now
            </a>
          </div>
        </section>
      )}

      {/* Contact Us */}
      {contact.show && (
        <section
          id="contact"
          className="py-16 px-6 bg-gray-50"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <div className="max-w-5xl mx-auto">
            <h2
              style={{ color: primary }}
              className="text-2xl font-bold mb-4 text-center tracking-wide"
            >
              {contact.heading || "Contact Us"}
            </h2>
            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-px" style={{ backgroundColor: primary }} />
              <span style={{ color: primary }}>✦</span>
              <div className="w-12 h-px" style={{ backgroundColor: primary }} />
            </div>
            <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
              {contact.description || "We're here to help. Feel free to reach out to us with any queries."}
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div
                className="bg-white border border-gray-200 p-6 text-center shadow-sm hover:shadow-md transition-all duration-200"
                style={{ borderTop: `4px solid ${primary}` }}
              >
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Address</p>
                <p className="text-sm font-bold" style={{ color: primary }}>
                  {address || `${city}, ${state}`}
                </p>
              </div>
              <div
                className="bg-white border border-gray-200 p-6 text-center shadow-sm hover:shadow-md transition-all duration-200"
                style={{ borderTop: `4px solid ${primary}` }}
              >
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Phone</p>
                <p className="text-sm font-bold" style={{ color: primary }}>
                  {phone || "—"}
                </p>
                {branding.support_phone && (
                  <p className="text-xs text-gray-400 mt-1">Support: {branding.support_phone}</p>
                )}
              </div>
              <div
                className="bg-white border border-gray-200 p-6 text-center shadow-sm hover:shadow-md transition-all duration-200"
                style={{ borderTop: `4px solid ${primary}` }}
              >
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Email</p>
                <p className="text-sm font-bold" style={{ color: primary }}>
                  {email || "—"}
                </p>
                {branding.support_email && (
                  <p className="text-xs text-gray-400 mt-1">Support: {branding.support_email}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </WebsiteShell>
  );
}
