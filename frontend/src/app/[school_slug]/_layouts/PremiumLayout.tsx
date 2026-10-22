import type { SchoolWebsiteData } from "@/types/website";
import { WebsiteShell } from "./WebsiteShell";
import { HeroSlider } from "./HeroSlider";

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
  const accent = branding.accent_color || "#C9A84C";

  const hero = getSection(data, "hero");
  const stats = getSection(data, "stats");
  const about = getSection(data, "about");
  const academics = getSection(data, "academics");
  const gallery = getSection(data, "gallery");
  const admissions = getSection(data, "admissions");
  const contact = getSection(data, "contact");

  return (
    <WebsiteShell data={data}>
      <div className="bg-black text-white" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

        {/* ── HERO ── */}
        {hero.show && (() => {
          const banners: Array<{ id: string; image_url: string; title: string | null; subtitle: string | null }> =
            data.hero_banners && data.hero_banners.length > 0
              ? data.hero_banners
              : data.hero_banner_url
                ? [{ id: "single", image_url: data.hero_banner_url, title: null, subtitle: null }]
                : [];
          const hasBanner = banners.length > 0;

          const heroContent = (
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 md:py-24 min-h-[60vh] md:min-h-[95vh] text-center">
              {/* Top thin gold line */}
              <div className="mb-8 flex items-center gap-4">
                <div className="h-px w-16" style={{ backgroundColor: accent }} />
                <div
                  className="w-2 h-2 rotate-45"
                  style={{ backgroundColor: accent }}
                />
                <div className="h-px w-16" style={{ backgroundColor: accent }} />
              </div>

              {/* Est. line */}
              <p
                className="text-xs font-light mb-5 tracking-[0.45em] uppercase"
                style={{ color: accent }}
              >
                Est.&nbsp;{established_year ?? "—"}&nbsp;&nbsp;·&nbsp;&nbsp;{city}, {state}
              </p>

              {/* School name */}
              <h1
                className="text-5xl md:text-7xl lg:text-8xl font-bold leading-none mb-6 tracking-tight text-white"
                style={{ fontFamily: "'Georgia', serif", textShadow: "0 2px 40px rgba(0,0,0,0.9)" }}
              >
                {hero.heading || branding.welcome_message || name}
              </h1>

              {/* Thin gold divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px w-24" style={{ backgroundColor: `${accent}60` }} />
                <div
                  className="w-1.5 h-1.5 rotate-45 border"
                  style={{ borderColor: `${accent}80` }}
                />
                <div className="h-px w-24" style={{ backgroundColor: `${accent}60` }} />
              </div>

              {/* Subtitle */}
              <p
                className="text-white/55 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-light tracking-wide"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                {hero.description ||
                  "Where tradition meets excellence — forging leaders of tomorrow with the wisdom of generations."}
              </p>

              {/* CTAs */}
              <div className="flex gap-4 justify-center flex-wrap">
                <a
                  href="#admissions"
                  className="px-10 py-3.5 text-sm font-semibold tracking-[0.15em] uppercase transition-all duration-300 hover:opacity-85"
                  style={{ backgroundColor: accent, color: "#000" }}
                >
                  Apply Now
                </a>
                <a
                  href="#about"
                  className="px-10 py-3.5 text-sm font-semibold tracking-[0.15em] uppercase border border-white/40 hover:border-white/80 transition-all duration-300 text-white/80 hover:text-white"
                >
                  Discover More
                </a>
              </div>

              {/* Scroll indicator */}
              <div className="mt-14 flex flex-col items-center gap-2 opacity-40">
                <span className="text-xs tracking-[0.4em] uppercase text-white">Scroll</span>
                <div className="w-px h-8" style={{ backgroundColor: accent }} />
              </div>
            </div>
          );

          if (hasBanner) {
            return (
              <HeroSlider
                banners={banners}
                overlayStyle={{ background: "rgba(0,0,0,0.70)" }}
                className="min-h-[60vh] md:min-h-[95vh] flex flex-col"
              >
                {heroContent}
              </HeroSlider>
            );
          }

          return (
            <section className="relative min-h-[60vh] md:min-h-[95vh] flex flex-col bg-black">
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(ellipse at 50% 60%, rgba(201,168,76,0.08) 0%, transparent 65%), black",
                }}
              />
              {heroContent}
            </section>
          );
        })()}

        {/* ── THIN GOLD DIVIDER ── */}
        <div className="relative overflow-hidden" style={{ backgroundColor: "#0a0a0a" }}>
          <div className="h-px w-full" style={{ backgroundColor: `${accent}40` }} />
        </div>

        {/* ── STATS ── */}
        {stats.show && (
          <section className="py-10 md:py-16 px-4 sm:px-6" style={{ backgroundColor: "#0a0a0a" }}>
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-zinc-800/60">
                {[
                  { num: "1200+", label: "Students Enrolled" },
                  { num: "80+", label: "Expert Faculty" },
                  { num: `${established_year ? new Date().getFullYear() - established_year : 25}+`, label: "Years of Legacy" },
                  { num: "100%", label: "Board Results" },
                ].map(({ num, label }) => (
                  <div key={label} className="text-center py-10 px-6 group">
                    <p
                      className="text-5xl md:text-6xl font-bold mb-3 tracking-tight"
                      style={{ color: accent, fontFamily: "'Georgia', serif" }}
                    >
                      {num}
                    </p>
                    <div className="h-px w-8 mx-auto mb-3" style={{ backgroundColor: `${accent}50` }} />
                    <p className="text-white/40 text-xs uppercase tracking-[0.25em] font-light">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── ABOUT ── */}
        {about.show && (
          <section id="about" className="bg-zinc-950">
            {/* Top editorial quote block */}
            <div
              className="py-12 md:py-20 px-4 sm:px-6 border-t border-b"
              style={{ borderColor: `${accent}20` }}
            >
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
                {/* Left — school story with gold accent border */}
                <div
                  className="pl-8 border-l-2"
                  style={{ borderColor: accent }}
                >
                  <p
                    className="text-xs uppercase tracking-[0.35em] font-light mb-5"
                    style={{ color: accent }}
                  >
                    Our Story
                  </p>
                  <h2
                    className="text-4xl md:text-5xl font-bold mb-8 leading-tight text-white"
                    style={{ fontFamily: "'Georgia', serif" }}
                  >
                    {about.heading || "A Legacy of\nExcellence"}
                  </h2>
                  <p className="text-white/55 leading-loose text-sm mb-8 font-light">
                    {about.description ||
                      `${name} has stood as a beacon of academic distinction since ${established_year ?? "its founding"}. Our commitment to holistic development, ethical leadership, and intellectual rigour has produced generations of distinguished alumni who shape the world.`}
                  </p>

                  {/* Gold rule + quote */}
                  <div className="relative mt-8 pt-8" style={{ borderTop: `1px solid ${accent}25` }}>
                    <span
                      className="absolute -top-5 left-0 text-7xl font-bold leading-none opacity-20 select-none"
                      style={{ color: accent, fontFamily: "'Georgia', serif" }}
                    >
                      &ldquo;
                    </span>
                    <blockquote
                      className="text-white/60 text-sm leading-loose italic font-light pl-4"
                      style={{ fontFamily: "'Georgia', serif" }}
                    >
                      The goal of education is not merely knowledge, but action and character.
                    </blockquote>
                    <p className="text-xs mt-3 pl-4" style={{ color: `${accent}90` }}>
                      — Principal&apos;s Vision
                    </p>
                  </div>
                </div>

                {/* Right — 4 info cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Board", value: "CBSE, New Delhi", icon: "🎓" },
                    { label: "City", value: `${city}, ${state}`, icon: "📍" },
                    { label: "Phone", value: phone || "—", icon: "📞" },
                    { label: "Email", value: email || "—", icon: "✉️" },
                  ].map(({ label, value, icon }) => (
                    <div
                      key={label}
                      className="bg-zinc-900 p-6 border border-zinc-800 hover:border-zinc-600 transition-all duration-300"
                    >
                      <div className="text-lg mb-2">{icon}</div>
                      <p
                        className="text-xs uppercase tracking-[0.25em] mb-2 font-light"
                        style={{ color: accent }}
                      >
                        {label}
                      </p>
                      <p className="text-white/75 text-sm font-light leading-relaxed break-all">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Facilities row */}
            <div className="py-10 md:py-16 px-4 sm:px-6">
              <div className="max-w-6xl mx-auto">
                <p
                  className="text-xs uppercase tracking-[0.35em] mb-8 text-center font-light"
                  style={{ color: accent }}
                >
                  Our Facilities
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-0 divide-x divide-y md:divide-y-0 divide-zinc-800/60">
                  {[
                    { name: "Library" },
                    { name: "Science Labs" },
                    { name: "Sports Complex" },
                    { name: "Auditorium" },
                    { name: "Hostel" },
                    { name: "Computer Centre" },
                  ].map(({ name: fname }) => (
                    <div
                      key={fname}
                      className="py-8 px-4 text-center group hover:bg-zinc-900 transition-colors duration-200"
                    >
                      <div className="h-px w-6 mx-auto mb-4" style={{ backgroundColor: `${accent}60` }} />
                      <p className="text-white/60 text-xs uppercase tracking-[0.2em] group-hover:text-white/90 transition-colors duration-200">
                        {fname}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── ACADEMICS ── */}
        {academics.show && (
          <section id="academics" className="py-14 md:py-28 px-4 sm:px-6 bg-zinc-900">
            <div className="max-w-6xl mx-auto">
              {/* Section header */}
              <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <p
                    className="text-xs uppercase tracking-[0.35em] mb-4 font-light"
                    style={{ color: accent }}
                  >
                    Academic Programmes
                  </p>
                  <h2
                    className="text-4xl md:text-5xl font-bold leading-tight text-white"
                    style={{ fontFamily: "'Georgia', serif" }}
                  >
                    {academics.heading || "Curriculum of\nDistinction"}
                  </h2>
                </div>
                <p className="text-white/40 text-sm font-light max-w-sm leading-relaxed">
                  {academics.description ||
                    "A world-class curriculum designed to cultivate critical thinkers and future leaders."}
                </p>
              </div>

              {/* Grade cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  {
                    num: "01",
                    title: "Pre-Primary",
                    range: "Nursery – KG",
                    desc: "Play-based early childhood education nurturing curiosity and foundational skills.",
                  },
                  {
                    num: "02",
                    title: "Primary",
                    range: "Classes I – V",
                    desc: "Strong foundational learning across core subjects with experiential methods.",
                  },
                  {
                    num: "03",
                    title: "Middle School",
                    range: "Classes VI – VIII",
                    desc: "Inquiry-driven curriculum deepening conceptual understanding across disciplines.",
                  },
                  {
                    num: "04",
                    title: "Secondary",
                    range: "Classes IX – X",
                    desc: "Rigorous CBSE board preparation with structured academic mentorship.",
                  },
                  {
                    num: "05",
                    title: "Sr. Secondary",
                    range: "Classes XI – XII",
                    desc: "Specialised streams preparing students for competitive examinations and higher studies.",
                  },
                ].map(({ num, title, range, desc }) => (
                  <div
                    key={num}
                    className="bg-zinc-950 p-7 flex flex-col border-l-2 border border-zinc-800 hover:border-zinc-600 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/80 transition-all duration-300"
                    style={{ borderLeftColor: accent }}
                  >
                    {/* Number badge */}
                    <span
                      className="text-4xl font-bold mb-5 leading-none opacity-20"
                      style={{ color: accent, fontFamily: "'Georgia', serif" }}
                    >
                      {num}
                    </span>
                    <p className="text-white font-semibold text-sm mb-1 tracking-wide">{title}</p>
                    <p
                      className="text-xs uppercase tracking-[0.2em] mb-4 font-light"
                      style={{ color: accent }}
                    >
                      {range}
                    </p>
                    <div className="h-px mb-4" style={{ backgroundColor: `${accent}20` }} />
                    <p className="text-white/45 text-xs leading-relaxed flex-1 font-light">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── GALLERY ── */}
        {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
          <section id="gallery" className="py-14 md:py-28 px-4 sm:px-6 bg-zinc-950">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="text-center mb-14">
                <p
                  className="text-xs uppercase tracking-[0.35em] mb-4 font-light"
                  style={{ color: accent }}
                >
                  Gallery
                </p>
                <h2
                  className="text-4xl md:text-5xl font-bold text-white"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {gallery.heading || "Our World in Focus"}
                </h2>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <div className="h-px w-12" style={{ backgroundColor: `${accent}50` }} />
                  <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: `${accent}80` }} />
                  <div className="h-px w-12" style={{ backgroundColor: `${accent}50` }} />
                </div>
              </div>

              {/* Images grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data.gallery_items.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-[4/3] overflow-hidden bg-zinc-900 group relative"
                    style={{ border: `1px solid ${accent}15` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt={img.title}
                      className="w-full h-full object-cover object-center opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      loading="lazy"
                      decoding="async"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                      {img.category && (
                        <p
                          className="text-xs uppercase tracking-[0.25em] mb-1.5 font-light"
                          style={{ color: accent }}
                        >
                          {img.category}
                        </p>
                      )}
                      <p className="text-white text-sm font-semibold">{img.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── ADMISSIONS ── */}
        {admissions.show && (
          <section id="admissions" className="py-14 md:py-28 px-4 sm:px-6 bg-zinc-900">
            <div className="max-w-6xl mx-auto">
              {/* Gold top accent line */}
              <div className="h-px w-full mb-20" style={{ backgroundColor: `${accent}35` }} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
                {/* Left */}
                <div>
                  <p
                    className="text-xs uppercase tracking-[0.35em] mb-5 font-light"
                    style={{ color: accent }}
                  >
                    Admissions
                  </p>
                  <h2
                    className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-white"
                    style={{ fontFamily: "'Georgia', serif" }}
                  >
                    {admissions.heading || "Begin Your\nJourney Here"}
                  </h2>
                  <div className="h-px w-16 mb-6" style={{ backgroundColor: `${accent}50` }} />
                  <p className="text-white/50 leading-loose text-sm font-light mb-10">
                    {admissions.description ||
                      `${name} welcomes applications for the upcoming academic year. Join a community committed to excellence, integrity, and lifelong learning.`}
                  </p>
                  <a
                    href="/login"
                    className="inline-block px-12 py-4 text-sm font-semibold tracking-[0.2em] uppercase transition-all duration-300 hover:opacity-85 shadow-xl"
                    style={{ backgroundColor: accent, color: "#000" }}
                  >
                    Apply Now
                  </a>
                </div>

                {/* Right — 4-step process */}
                <div className="space-y-0">
                  {[
                    {
                      num: "01",
                      title: "Application",
                      desc: "Fill out the online application form with all required academic and personal details.",
                    },
                    {
                      num: "02",
                      title: "Document Verification",
                      desc: "Submit academic records, birth certificate, and valid identity proof for review.",
                    },
                    {
                      num: "03",
                      title: "Assessment & Interview",
                      desc: "Attend a personal interaction session with our academic panel.",
                    },
                    {
                      num: "04",
                      title: "Confirmation",
                      desc: "Receive your offer letter and complete the fee payment process.",
                    },
                  ].map(({ num, title, desc }, i, arr) => (
                    <div
                      key={num}
                      className="flex items-start gap-6 py-7"
                      style={{
                        borderBottom: i < arr.length - 1 ? `1px solid ${accent}15` : "none",
                      }}
                    >
                      {/* Gold numbered circle */}
                      <div
                        className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-black"
                        style={{ backgroundColor: accent }}
                      >
                        {num}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm mb-1.5 tracking-wide">{title}</p>
                        <p className="text-white/40 text-xs leading-relaxed font-light">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── CONTACT ── */}
        {contact.show && (
          <section id="contact" className="py-14 md:py-28 px-4 sm:px-6 bg-zinc-950">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="text-center mb-16">
                <p
                  className="text-xs uppercase tracking-[0.35em] mb-4 font-light"
                  style={{ color: accent }}
                >
                  Get In Touch
                </p>
                <h2
                  className="text-4xl md:text-5xl font-bold text-white mb-4"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {contact.heading || "Contact Us"}
                </h2>
                <p className="text-white/40 max-w-md mx-auto text-sm font-light leading-relaxed">
                  {contact.description ||
                    "We welcome your enquiries. Reach out to us for admissions guidance or any other information."}
                </p>
              </div>

              {/* Cards + Map */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Left — 3 contact cards stacked */}
                <div className="md:col-span-2 flex flex-col gap-4">
                  {/* Address */}
                  <div
                    className="bg-zinc-900 p-7 border border-zinc-800 hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <p
                      className="text-xs uppercase tracking-[0.25em] mb-1 font-light"
                      style={{ color: accent }}
                    >
                      Address
                    </p>
                    <div className="h-px w-8 mb-3" style={{ backgroundColor: `${accent}35` }} />
                    <p className="text-white/70 text-sm leading-relaxed font-light">
                      {address || `${city}, ${state}`}
                    </p>
                  </div>

                  {/* Phone */}
                  <div
                    className="bg-zinc-900 p-7 border border-zinc-800 hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <p
                      className="text-xs uppercase tracking-[0.25em] mb-1 font-light"
                      style={{ color: accent }}
                    >
                      Phone
                    </p>
                    <div className="h-px w-8 mb-3" style={{ backgroundColor: `${accent}35` }} />
                    <p className="text-white/70 text-sm font-light">{phone || "—"}</p>
                    {branding.support_phone && (
                      <p className="text-white/35 text-xs mt-2 font-light">
                        Support: {branding.support_phone}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div
                    className="bg-zinc-900 p-7 border border-zinc-800 hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <p
                      className="text-xs uppercase tracking-[0.25em] mb-1 font-light"
                      style={{ color: accent }}
                    >
                      Email
                    </p>
                    <div className="h-px w-8 mb-3" style={{ backgroundColor: `${accent}35` }} />
                    <p className="text-white/70 text-sm font-light break-all">{email || "—"}</p>
                    {branding.support_email && (
                      <p className="text-white/35 text-xs mt-2 font-light">
                        Support: {branding.support_email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right — Google Map */}
                <div
                  className="md:col-span-3 overflow-hidden min-h-[380px]"
                  style={{ border: `1px solid ${accent}25` }}
                >
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3572.8608563176817!2d82.52597947222179!3d26.427966480760162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3990928e2ecacf07%3A0x45812ae7e2c0ee77!2sDOYEN%20INTERNATIONAL%20SCHOOL!5e0!3m2!1sen!2sin!4v1792572714179!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0, display: "block", minHeight: "380px" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    title="Doyen International School Location"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </WebsiteShell>
  );
}
