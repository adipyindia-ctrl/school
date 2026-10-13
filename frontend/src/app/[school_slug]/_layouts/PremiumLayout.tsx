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
  const gallery = getSection(data, "gallery");
  const admissions = getSection(data, "admissions");

  return (
    <WebsiteShell data={data}>
      <div className="bg-black text-white">
        {/* Full-screen hero */}
        {hero.show && (
          <section className="relative min-h-[90vh] flex flex-col">
            <div
              className="flex-1 flex items-center justify-center px-8 pt-8 pb-16"
              style={{
                background: `radial-gradient(ellipse at 50% 50%, ${primary}40 0%, black 70%)`,
              }}
            >
              <div className="text-center max-w-4xl">
                <p
                  style={{ color: accent }}
                  className="text-sm font-semibold tracking-[0.3em] uppercase mb-4"
                >
                  Est. {established_year ?? "—"} · {city}, {state}
                </p>
                <h1 className="text-6xl md:text-8xl font-black leading-none mb-6 tracking-tight">
                  {hero.heading || branding.welcome_message || name}
                </h1>
                <p className="text-white/60 text-lg max-w-xl mx-auto mb-10">
                  {hero.description ||
                    "Where ambition meets excellence. A premium educational experience crafted for tomorrow's leaders."}
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <a
                    href="#admissions"
                    style={{ backgroundColor: accent }}
                    className="px-10 py-4 font-bold text-black hover:opacity-90 transition-opacity"
                  >
                    Apply Now
                  </a>
                  <a
                    href="#about"
                    className="px-10 py-4 font-bold border border-white/30 hover:border-white transition-colors"
                  >
                    Discover More
                  </a>
                </div>
              </div>
            </div>
            <div className="text-center pb-8 text-white/40 text-xs tracking-widest animate-bounce">
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
                <div key={l}>
                  <p style={{ color: accent }} className="text-4xl font-black mb-1">
                    {n}
                  </p>
                  <p className="text-white/70 text-sm uppercase tracking-wider">{l}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {about.show && (
          <section id="about" className="py-24 px-8 bg-zinc-950">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
              <div>
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
                  <div key={label} className="bg-zinc-900 p-5 border border-zinc-800">
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
                    className="aspect-square overflow-hidden bg-zinc-900 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt={img.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Admissions CTA */}
        {admissions.show && (
          <section id="admissions" className="py-24 px-8 bg-zinc-900 text-center">
            <div className="max-w-2xl mx-auto">
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
                className="inline-block px-10 py-4 font-black text-lg hover:opacity-90 transition-opacity"
              >
                Apply Now
              </a>
            </div>
          </section>
        )}
      </div>
    </WebsiteShell>
  );
}
