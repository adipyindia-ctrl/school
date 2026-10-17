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

export function PremiumLayout({ data }: { data: SchoolWebsiteData }) {
  const { branding, name, phone, email, address, city, state, established_year } = data;
  const primary = branding.primary_color;
  const accent = branding.accent_color;

  const hero = getSection(data, "hero");
  const stats = getSection(data, "stats");
  const about = getSection(data, "about");
  const academics = getSection(data, "academics");
  const gallery = getSection(data, "gallery");
  const admissions = getSection(data, "admissions");
  const contact = getSection(data, "contact");

  return (
    <WebsiteShell data={data}>
      <div className="bg-black text-white">
        {/* Full-screen hero */}
        {hero.show && (
          <section className="relative min-h-[90vh] flex flex-col">
            {/* Decorative blobs */}
            <div
              className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
              style={{ backgroundColor: primary }}
            />
            <div
              className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl"
              style={{ backgroundColor: accent }}
            />
            <div
              className="flex-1 flex items-center justify-center px-8 pt-8 pb-16 relative"
              style={{
                background: `radial-gradient(ellipse at 30% 50%, ${primary}50 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, ${accent}30 0%, transparent 50%), black`,
              }}
            >
              <div className="text-center max-w-4xl">
                <p
                  style={{ color: accent }}
                  className="text-sm font-semibold tracking-[0.3em] uppercase mb-4"
                >
                  Est. {established_year ?? "—"} · {city}, {state}
                </p>
                <h1 className="text-6xl md:text-9xl font-black leading-none mb-6 tracking-tighter">
                  {hero.heading || branding.welcome_message || name}
                </h1>
                <p className="text-white/60 text-lg max-w-xl mx-auto mb-10">
                  {hero.description ||
                    "Where ambition meets excellence. A premium educational experience crafted for tomorrow's leaders."}
                </p>
                {/* Gold divider above CTA */}
                <div className="w-24 h-px mx-auto mb-8" style={{ backgroundColor: accent }} />
                <div className="flex gap-4 justify-center flex-wrap">
                  <a
                    href="#admissions"
                    style={{ backgroundColor: accent }}
                    className="px-10 py-4 font-bold text-black hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl"
                  >
                    Apply Now
                  </a>
                  <a
                    href="#about"
                    className="px-10 py-4 font-bold border border-white/30 hover:border-white transition-all duration-300 hover:scale-105"
                  >
                    Discover More
                  </a>
                </div>
              </div>
            </div>
            <div className="text-center pb-8 text-white/40 text-xs text-sm tracking-widest animate-bounce">
              ↓ SCROLL
            </div>
          </section>
        )}

        {/* Stats */}
        {stats.show && (
          <section style={{ backgroundColor: primary }} className="py-16 px-8">
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                ["1000+", "Students"],
                ["50+", "Expert Faculty"],
                ["25+", "Years Legacy"],
                ["100%", "Board Results"],
              ].map(([n, l]) => (
                <div
                  key={l}
                  className="border border-white/10 p-6 rounded-none hover:-translate-y-1 transition-all duration-300"
                >
                  <p style={{ color: accent }} className="text-5xl font-black mb-1">
                    {n}
                  </p>
                  {/* Gold underline on stat number */}
                  <div className="w-8 h-0.5 mx-auto mt-2 mb-2" style={{ backgroundColor: accent }} />
                  <p className="text-white/70 text-sm uppercase tracking-wider">{l}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {about.show && (
          <section id="about" className="py-24 px-8 bg-zinc-950">
            {/* Gold top divider */}
            <div className="w-full h-px" style={{ backgroundColor: `${accent}30` }} />
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center pt-16">
              {/* Gold vertical accent line beside heading text */}
              <div className="pl-6 border-l-2" style={{ borderColor: accent }}>
                <p style={{ color: accent }} className="text-xs tracking-widest uppercase mb-3">
                  About Us
                </p>
                <h2 className="text-4xl font-black mb-6 leading-tight">
                  {about.heading || "A Legacy of Excellence"}
                </h2>
                <p className="text-white/60 leading-relaxed">
                  {about.description ||
                    `${name} has been at the forefront of education since ${established_year ?? "its founding"},
                    consistently producing graduates who excel in every field. Our philosophy centres on
                    academic rigour, ethical leadership, and global citizenship.`}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Board", value: data.school_type.toUpperCase() },
                  { label: "City", value: city },
                  { label: "Phone", value: phone },
                  { label: "Email", value: email ? email.split("@")[0] + "@..." : "—" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-zinc-900 p-5 border border-zinc-800 hover:border-white/30 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <p style={{ color: accent }} className="text-xs uppercase tracking-wider mb-1">
                      {label}
                    </p>
                    <p className="font-semibold text-sm truncate">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Academics */}
        {academics.show && (
          <section id="academics" className="py-24 px-8 bg-zinc-900">
            <div className="max-w-5xl mx-auto">
              <p style={{ color: accent }} className="text-xs tracking-widest uppercase mb-3 text-center">
                Academics
              </p>
              <h2 className="text-4xl font-black mb-4 text-center leading-tight">
                {academics.heading || "Academic Excellence"}
              </h2>
              <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
                {academics.description ||
                  "A world-class curriculum crafted to develop critical thinkers and future leaders."}
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  {
                    title: "Primary School",
                    desc: "Foundational learning that sparks curiosity and builds essential skills.",
                  },
                  {
                    title: "Middle School",
                    desc: "Deepening knowledge through inquiry-based and experiential learning.",
                  },
                  {
                    title: "Senior School",
                    desc: "Rigorous preparation for board examinations and competitive assessments.",
                  },
                ].map(({ title, desc }, index) => (
                  <div
                    key={title}
                    className="bg-zinc-950 p-8 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50"
                  >
                    {/* Editorial number */}
                    <span
                      className="text-5xl font-black opacity-10 mb-2 block"
                      style={{ color: accent }}
                    >
                      0{index + 1}
                    </span>
                    {/* Gold left accent line inside card */}
                    <div className="border-l-2 pl-4" style={{ borderColor: accent }}>
                      <p style={{ color: accent }} className="text-xs uppercase tracking-wider mb-3">
                        {title}
                      </p>
                      <p className="text-white/70 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery */}
        {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
          <section id="gallery" className="py-24 px-8 bg-zinc-950">
            <div className="max-w-5xl mx-auto">
              <p style={{ color: accent }} className="text-xs tracking-widest uppercase mb-3 text-center">
                Gallery
              </p>
              <h2 className="text-4xl font-black mb-10 text-center leading-tight">
                {gallery.heading || "Our World in Focus"}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {data.gallery_items.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-square overflow-hidden bg-zinc-900 group relative border border-zinc-800 hover:border-zinc-600 transition-all duration-300"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt={img.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center">
                      <p style={{ color: accent }} className="text-xs uppercase tracking-widest mb-1">
                        {img.category || "Gallery"}
                      </p>
                      <p className="text-white text-sm font-semibold text-center px-2">{img.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Admissions CTA */}
        {admissions.show && (
          <section id="admissions" className="py-24 px-8 bg-zinc-900 text-center">
            {/* Gold top border divider */}
            <div className="w-full h-px mb-0" style={{ backgroundColor: `${accent}40` }} />
            <div className="max-w-2xl mx-auto pt-16">
              {/* Editorial box */}
              <div className="border border-zinc-800 p-12 max-w-2xl mx-auto">
                {/* Decorative gold line */}
                <div className="w-16 h-px mx-auto mb-6" style={{ backgroundColor: accent }} />
                <p style={{ color: accent }} className="text-xs tracking-widest uppercase mb-3">
                  Join Us
                </p>
                <h2 className="text-4xl font-black mb-6">
                  {admissions.heading || "Begin Your Journey"}
                </h2>
                <p className="text-white/60 mb-10">
                  {admissions.description ||
                    `${name} welcomes applications for the upcoming academic year. Secure your place now.`}
                </p>
                <a
                  href="/login"
                  style={{ backgroundColor: accent, color: "black" }}
                  className="inline-block px-10 py-4 font-black text-lg hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Apply Now
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Contact Us */}
        {contact.show && (
          <section id="contact" className="py-24 px-8 bg-zinc-950">
            <div className="max-w-5xl mx-auto">
              {/* Gold top divider */}
              <div className="w-full h-px mb-16" style={{ backgroundColor: `${accent}20` }} />
              <p style={{ color: accent }} className="text-xs tracking-widest uppercase mb-3 text-center">
                Get In Touch
              </p>
              <h2 className="text-4xl font-black mb-4 text-center">
                {contact.heading || "Contact Us"}
              </h2>
              <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
                {contact.description || "We'd love to hear from you. Reach out to us for any enquiries."}
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="bg-zinc-900 p-8 border border-zinc-800 text-center hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-300 hover:-translate-y-0.5">
                  <p style={{ color: accent }} className="text-xs uppercase tracking-wider mb-3">
                    Address
                  </p>
                  <p className="font-semibold text-sm">{address || `${city}, ${state}`}</p>
                </div>
                <div className="bg-zinc-900 p-8 border border-zinc-800 text-center hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-300 hover:-translate-y-0.5">
                  <p style={{ color: accent }} className="text-xs uppercase tracking-wider mb-3">
                    Phone
                  </p>
                  <p className="font-semibold text-sm">{phone || "—"}</p>
                  {branding.support_phone && (
                    <p className="text-white/40 text-xs mt-2">Support: {branding.support_phone}</p>
                  )}
                </div>
                <div className="bg-zinc-900 p-8 border border-zinc-800 text-center hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-300 hover:-translate-y-0.5">
                  <p style={{ color: accent }} className="text-xs uppercase tracking-wider mb-3">
                    Email
                  </p>
                  <p className="font-semibold text-sm">{email || "—"}</p>
                  {branding.support_email && (
                    <p className="text-white/40 text-xs mt-2">Support: {branding.support_email}</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </WebsiteShell>
  );
}
