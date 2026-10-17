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
  const academics = getSection(data, "academics");
  const gallery = getSection(data, "gallery");
  const admissions = getSection(data, "admissions");
  const contact = getSection(data, "contact");

  return (
    <WebsiteShell data={data}>
      {/* Hero */}
      {hero.show && (
        <section
          style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
          className="relative overflow-hidden min-h-[85vh] flex items-center justify-center text-white px-6"
        >
          {/* Decorative floating circles */}
          <div
            className="absolute opacity-20 rounded-full blur-3xl bg-white w-72 h-72"
            style={{ position: "absolute", top: "-2rem", left: "-2rem" }}
          />
          <div
            className="absolute opacity-20 rounded-full blur-3xl bg-white w-96 h-96"
            style={{ position: "absolute", bottom: "-3rem", right: "-3rem" }}
          />
          <div
            className="absolute opacity-20 rounded-full blur-3xl w-48 h-48"
            style={{ position: "absolute", top: "30%", right: "10%", backgroundColor: "rgba(255,255,255,0.3)" }}
          />

          {/* Content */}
          <div className="max-w-4xl mx-auto text-center relative z-10 pb-16">
            <div className="inline-block backdrop-blur-sm bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              Est. {established_year ?? "—"}
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 drop-shadow-lg">
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
                className="px-8 py-3 rounded-full font-bold text-white hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Apply Now
              </a>
              <a
                href="#about"
                className="px-8 py-3 rounded-full font-bold border-2 border-white text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* SVG wave at bottom */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
            <svg viewBox="0 0 1440 60" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
            </svg>
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
              <div
                key={label}
                className="rounded-xl bg-white/10 backdrop-blur-sm p-4 hover:-translate-y-1 transition-all duration-300"
              >
                <p className="text-3xl font-extrabold">{num}</p>
                <p className="text-sm opacity-80">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      {about.show && (
        <section id="about" className="py-20 px-6 bg-gradient-to-br from-white to-gray-50">
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
                  className="p-4 rounded-2xl border-2 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="font-bold text-gray-800 text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Academics */}
      {academics.show && (
        <section id="academics" className="py-20 px-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <h2 style={{ color: primary }} className="text-3xl font-bold mb-2 text-center">
              {academics.heading || "Academics"}
            </h2>
            {/* Section header accent line */}
            <div className="w-16 h-1 mx-auto mb-4 rounded-full" style={{ backgroundColor: primary }} />
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              {academics.description ||
                "Our comprehensive academic programs are designed to nurture intellectual curiosity and build a strong foundation for lifelong learning."}
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Primary School",
                  desc: "A strong foundation in literacy, numeracy, and creative thinking for young learners.",
                  icon: "📖",
                },
                {
                  title: "Middle School",
                  desc: "An engaging curriculum that builds critical thinking, scientific inquiry, and leadership skills.",
                  icon: "🔬",
                },
                {
                  title: "Senior School",
                  desc: "Advanced coursework preparing students for board examinations and higher education.",
                  icon: "🎓",
                },
              ].map(({ title, desc, icon }) => (
                <div
                  key={title}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-2 transition-all duration-300"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm"
                    style={{ backgroundColor: `${primary}15` }}
                  >
                    <span className="text-2xl">{icon}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg mb-2">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
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
                  className="aspect-square group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 bg-gray-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={img.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <p className="text-white text-sm font-semibold">{img.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Admissions CTA */}
      {admissions.show && (
        <section
          id="admissions"
          style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
          className="relative overflow-hidden py-20 px-6"
        >
          {/* Decorative circle */}
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10" />

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-3xl font-bold mb-4 text-white">
              {admissions.heading || "Admissions Open"}
            </h2>
            <p className="text-white/80 mb-8">
              {admissions.description ||
                `Join ${name} and be part of a community dedicated to academic excellence.
                Applications for the upcoming session are now open.`}
            </p>
            <a
              href="/login"
              style={{ backgroundColor: branding.accent_color }}
              className="inline-block px-10 py-4 rounded-full text-white font-bold text-lg hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-xl"
            >
              Apply for Admission
            </a>
          </div>
        </section>
      )}

      {/* Contact Us */}
      {contact.show && (
        <section id="contact" className="py-20 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 style={{ color: primary }} className="text-3xl font-bold mb-4 text-center">
              {contact.heading || "Contact Us"}
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              {contact.description ||
                `Have questions? We'd love to hear from you. Reach out to us and we'll get back to you as soon as possible.`}
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Address */}
              <div
                className="text-center p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                style={{ borderTop: `3px solid ${primary}` }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${primary}15` }}
                >
                  <span className="text-2xl">📍</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Our Address</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {address || `${city}, ${state}`}
                </p>
              </div>
              {/* Phone */}
              <div
                className="text-center p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                style={{ borderTop: `3px solid ${primary}` }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${primary}15` }}
                >
                  <span className="text-2xl">📞</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Phone</h3>
                <p className="text-gray-600 text-sm">{phone || "—"}</p>
                {branding.support_phone && (
                  <p className="text-gray-500 text-xs mt-1">Support: {branding.support_phone}</p>
                )}
              </div>
              {/* Email */}
              <div
                className="text-center p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                style={{ borderTop: `3px solid ${primary}` }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${primary}15` }}
                >
                  <span className="text-2xl">✉️</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Email</h3>
                <p className="text-gray-600 text-sm">{email || "—"}</p>
                {branding.support_email && (
                  <p className="text-gray-500 text-xs mt-1">Support: {branding.support_email}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </WebsiteShell>
  );
}
