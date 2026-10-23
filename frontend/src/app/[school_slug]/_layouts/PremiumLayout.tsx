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

// ── Inline SVG icons ──────────────────────────────────────────────────────────
function IconMapPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12 19.79 19.79 0 0 1 1 3.18 2 2 0 0 1 2.98 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16l.92.92z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconAward() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function IconFlask() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3h6l1 9H8L9 3z" />
      <path d="M6.5 12c0 0-2.5 2.5-2.5 5a7 7 0 0 0 14 0c0-2.5-2.5-5-2.5-5" />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
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
      <div className="bg-zinc-950 text-white" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

        {/* ── 1. HERO ── */}
        {hero.show && (() => {
          const banners: Array<{ id: string; image_url: string; title: string | null; subtitle: string | null }> =
            data.hero_banners && data.hero_banners.length > 0
              ? data.hero_banners
              : data.hero_banner_url
                ? [{ id: "single", image_url: data.hero_banner_url, title: null, subtitle: null }]
                : [];
          const hasBanner = banners.length > 0;

          const heroContent = (
            <div
              className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 h-[220px] md:min-h-[95vh] hidden md:flex flex-col items-start justify-center text-left py-4 md:py-24"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              {/* Eyebrow */}
              <p className="text-xs tracking-[0.3em] uppercase mb-5 font-semibold" style={{ color: accent }}>
                LEARN &middot; GROW &middot; ACHIEVE
              </p>

              {/* Heading */}
              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-white"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                <span className="block">{hero.heading || branding.welcome_message || name}</span>
                <span className="block italic" style={{ color: accent }}>for a Brighter Future</span>
              </h1>

              {/* Description */}
              <p className="text-zinc-300 text-base md:text-lg max-w-xl mb-10 leading-relaxed">
                {hero.description ||
                  `A tradition of excellence in education since ${established_year ?? "our founding"}. Committed to shaping future leaders with knowledge, integrity, and character.`}
              </p>

              {/* Buttons — NO admission enquiry form */}
              <div className="flex flex-wrap gap-4">
                <a
                  href="#admissions"
                  className="px-8 py-3.5 text-sm font-semibold tracking-wide transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accent, color: "#000" }}
                >
                  Apply for Admission →
                </a>
                <a
                  href="#about"
                  className="px-8 py-3.5 text-sm font-semibold tracking-wide border border-white/40 hover:border-white text-white/90 transition-colors"
                >
                  Watch Campus Tour
                </a>
              </div>
            </div>
          );

          if (hasBanner) {
            return (
              <HeroSlider
                banners={banners}
                overlayStyle={{ background: "linear-gradient(to right, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0.05) 100%)" }}
                className="h-[220px] md:min-h-[95vh] flex flex-col"
              >
                {heroContent}
              </HeroSlider>
            );
          }

          return (
            <section className="relative h-[220px] md:min-h-[95vh] flex flex-col bg-zinc-950">
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at 50% 60%, ${accent}12 0%, transparent 65%), #09090b`,
                }}
              />
              {heroContent}
            </section>
          );
        })()}

        {/* ── 2. STATS BAR ── */}
        {stats.show && (
          <section className="hidden md:block bg-zinc-900">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                {[
                  { icon: <IconAward />, num: `${established_year ?? "—"}+`, label: "Years of Excellence" },
                  { icon: <IconUsers />, num: "1000+", label: "Students Enrolled" },
                  { icon: <IconBook />, num: "50+", label: "Expert Faculty" },
                  { icon: <IconStar />, num: "100%", label: "Success Rate" },
                ].map(({ icon, num, label }) => (
                  <div key={label} className="text-center py-10 px-6">
                    <div className="flex items-center justify-center mb-3" style={{ color: accent }}>{icon}</div>
                    <p
                      className="text-4xl md:text-5xl font-bold mb-3"
                      style={{ color: accent, fontFamily: "'Georgia', serif" }}
                    >
                      {num}
                    </p>
                    <p className="text-zinc-400 text-xs uppercase tracking-[0.25em]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 3. ACADEMICS ── */}
        {academics.show && (
          <section id="academics" className="bg-zinc-900 py-12 md:py-24 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <p className="text-xs tracking-[0.3em] uppercase mb-4 font-semibold" style={{ color: accent }}>OUR ACADEMICS</p>

              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
                <h2
                  className="text-3xl sm:text-4xl md:text-5xl font-bold text-white"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {academics.heading || "Academic Programs"}
                </h2>
                <div className="md:text-right">
                  <p className="text-zinc-400 text-sm max-w-sm mb-2">
                    {academics.description ||
                      "Comprehensive education from Pre-Primary through Senior Secondary, designed for every stage of your child's growth."}
                  </p>
                  <a href="#contact" className="text-sm font-semibold" style={{ color: accent }}>View All Programs →</a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { num: "01", title: "Pre-Primary", range: "Nursery–KG", tagline: "Play · Learn · Grow" },
                  { num: "02", title: "Primary", range: "Class I–V", tagline: "Think · Create · Achieve" },
                  { num: "03", title: "Middle School", range: "Class VI–VIII", tagline: "Explore · Debate · Read" },
                  { num: "04", title: "Secondary", range: "Class IX–X", tagline: "Analyse · Perform · Excel" },
                  { num: "05", title: "Sr. Secondary", range: "Class XI–XII", tagline: "Focus · Prepare · Succeed" },
                ].map(({ num, title, range, tagline }, idx) => {
                  const thumbUrl =
                    data.gallery_items && data.gallery_items.length > 0
                      ? data.gallery_items[idx % data.gallery_items.length].image_url
                      : null;
                  return (
                    <div
                      key={num}
                      className="relative bg-zinc-950 p-5 border border-zinc-800 hover:border-zinc-600 hover:-translate-y-1 transition"
                      style={{ borderTop: `3px solid ${accent}` }}
                    >
                      <span
                        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black"
                        style={{ backgroundColor: accent }}
                      >
                        {num}
                      </span>

                      {thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbUrl} alt={title} className="w-full h-24 object-cover mb-3" loading="lazy" />
                      ) : (
                        <div
                          className="w-full h-24 mb-3"
                          style={{ background: `linear-gradient(135deg, #18181b 0%, ${accent}22 100%)` }}
                        />
                      )}

                      <p className="text-white text-sm font-semibold">{title}</p>
                      <p className="text-zinc-500 text-xs mb-1">{range}</p>
                      <p className="italic text-xs mb-3" style={{ color: accent }}>{tagline}</p>
                      <a href="#contact" className="text-xs font-semibold" style={{ color: accent }}>Explore Classes →</a>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── 4. GALLERY ── */}
        {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
          <section id="gallery" className="bg-zinc-900 py-12 md:py-24 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <p className="text-xs tracking-[0.3em] uppercase mb-4 font-semibold" style={{ color: accent }}>OUR GALLERY</p>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                <h2
                  className="text-3xl sm:text-4xl md:text-5xl font-bold text-white"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {gallery.heading || "Moments That Matter"}
                </h2>
                <a
                  href="#gallery"
                  className="text-sm font-semibold border px-4 py-2 inline-block flex-shrink-0"
                  style={{ borderColor: accent, color: accent }}
                >
                  View All Photos →
                </a>
              </div>

              <p className="text-zinc-400 text-sm max-w-lg mb-8">
                {gallery.description || `A glimpse into the vibrant life at ${name}.`}
              </p>

              {/* Filter tabs — CSS-only presentational */}
              <div className="flex flex-wrap gap-3 mb-8">
                {["All", "Events", "Sports", "Academics"].map((cat) => (
                  <span
                    key={cat}
                    className="px-5 py-2 text-xs uppercase tracking-widest cursor-default select-none"
                    style={{
                      backgroundColor: cat === "All" ? accent : "transparent",
                      color: cat === "All" ? "#000" : accent,
                      border: `1px solid ${accent}`,
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Image grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {data.gallery_items.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-[4/3] overflow-hidden bg-zinc-950 relative group"
                    style={{ border: `1px solid ${accent}18` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt={img.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                      {img.category && (
                        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: accent }}>{img.category}</p>
                      )}
                      <p className="text-white text-sm font-semibold">{img.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── 5. ABOUT ── */}
        {about.show && (
          <section id="about" className="bg-zinc-950 py-12 md:py-24 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <p className="text-xs tracking-[0.3em] uppercase mb-4 font-semibold" style={{ color: accent }}>ABOUT US</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
                {/* Left: gallery image */}
                <div>
                  {data.gallery_items && data.gallery_items.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.gallery_items[0].image_url}
                      alt={data.gallery_items[0].title}
                      className="w-full h-72 md:h-[420px] object-cover"
                      style={{ border: `1px solid ${accent}30` }}
                    />
                  ) : (
                    <div
                      className="w-full h-72 md:h-[420px]"
                      style={{ background: `linear-gradient(135deg, #18181b 0%, ${accent}15 100%)` }}
                    />
                  )}
                </div>

                {/* Right: text + feature tiles */}
                <div>
                  <h2
                    className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
                    style={{ fontFamily: "'Georgia', serif" }}
                  >
                    {about.heading || name}
                  </h2>
                  <p className="text-zinc-400 leading-relaxed mb-8">
                    {about.description ||
                      `${name} has been a beacon of quality education, nurturing young minds with a blend of academic rigour and strong moral values since ${established_year ?? "its founding"}. Our institution has consistently produced leaders across every field.`}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                      { icon: <IconAward />, title: "Academic Excellence", sub: "Consistent top results and curriculum depth" },
                      { icon: <IconShield />, title: "Safe Campus", sub: "Secure environment for holistic growth" },
                      { icon: <IconHeart />, title: "Holistic Development", sub: "Sports, arts, and character building" },
                    ].map(({ icon, title, sub }) => (
                      <div key={title} className="bg-zinc-900 p-5 border border-zinc-800">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                          style={{ backgroundColor: `${accent}18`, color: accent }}
                        >
                          {icon}
                        </div>
                        <p className="text-white text-sm font-semibold mb-1">{title}</p>
                        <p className="text-zinc-500 text-xs">{sub}</p>
                      </div>
                    ))}
                  </div>

                  <a
                    href="#academics"
                    className="inline-block px-6 py-2.5 text-sm font-semibold border transition-colors hover:bg-white/5"
                    style={{ borderColor: accent, color: accent }}
                  >
                    Learn More →
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 6. CAMPUS LIFE ── */}
        <section className="bg-zinc-950 py-12 md:py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs tracking-[0.3em] uppercase mb-4 font-semibold" style={{ color: accent }}>CAMPUS LIFE</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {/* Left */}
              <div>
                <h2
                  className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  Life Beyond the Classroom
                </h2>
                <p className="text-zinc-400 leading-relaxed mb-8">
                  At {name}, we believe education extends far beyond textbooks. Our vibrant campus life ensures
                  every student discovers their passion, builds lifelong friendships, and develops the skills
                  needed for a fulfilling future.
                </p>
                <a
                  href="#about"
                  className="inline-block px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accent, color: "#000" }}
                >
                  Explore Campus Life →
                </a>
              </div>

              {/* Right: 2×2 dark tiles */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <IconUsers />, title: "Sports", desc: "Inter-school competitions and athletics" },
                  { icon: <IconFlask />, title: "Science Labs", desc: "State-of-the-art laboratory facilities" },
                  { icon: <IconBook />, title: "Library", desc: "10,000+ books and digital resources" },
                  { icon: <IconPalette />, title: "Arts & Culture", desc: "Music, dance, drama and fine arts" },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="bg-zinc-900 p-5 border border-zinc-800 flex gap-4 items-start">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${accent}18`, color: accent }}
                    >
                      {icon}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold mb-1">{title}</p>
                      <p className="text-zinc-500 text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. TESTIMONIALS ── */}
        <section className="bg-zinc-950 py-12 md:py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs tracking-[0.3em] uppercase mb-4 font-semibold" style={{ color: accent }}>TESTIMONIALS</p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-12"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              What Parents Say
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "The academic environment here is truly exceptional. My daughter has grown in both her studies and her character — I couldn't be happier with our choice.",
                  name: "Anjali Sharma",
                  role: "Parent · Grade 5",
                },
                {
                  quote: "The teachers are deeply dedicated and the school genuinely cares about each child's progress. My son looks forward to school every single day.",
                  name: "Rohit Mehta",
                  role: "Parent · Grade 8",
                },
                {
                  quote: "Excellent infrastructure, holistic approach, and a warm community. This school has shaped my daughter into a confident young leader.",
                  name: "Priya Nair",
                  role: "Parent · Grade 10",
                },
              ].map(({ quote, name: tName, role }) => (
                <div key={tName} className="bg-zinc-900 p-7 border border-zinc-800 flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4" style={{ color: accent }}>
                    <IconStar /><IconStar /><IconStar /><IconStar /><IconStar />
                  </div>
                  {/* Large gold quote mark */}
                  <div
                    className="text-7xl leading-none mb-2 select-none font-serif"
                    style={{ color: `${accent}50` }}
                    aria-hidden="true"
                  >
                    &ldquo;
                  </div>
                  <p className="italic text-zinc-300 text-sm leading-relaxed mb-6 flex-1">{quote}</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm"
                      style={{ backgroundColor: `${accent}22`, color: accent }}
                    >
                      {tName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{tName}</p>
                      <p className="text-zinc-500 text-xs">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. CTA BAND (ADMISSIONS) ── */}
        {admissions.show && (
          <section
            id="admissions"
            className="py-14 md:py-20 px-4 sm:px-6 text-center"
            style={{ backgroundColor: accent }}
          >
            <p className="text-xs tracking-[0.3em] uppercase font-semibold mb-3" style={{ color: "#00000088" }}>
              Take the Next Step
            </p>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-black"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              {admissions.heading || "Give Your Child a Brighter Future"}
            </h2>
            <a
              href="/login"
              className="inline-block px-8 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#0a0a0a", color: "#fff" }}
            >
              Apply Now →
            </a>
          </section>
        )}

        {/* ── 9. CONTACT ── */}
        {contact.show && (
          <section id="contact" className="bg-zinc-950 py-12 md:py-24 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <p className="text-xs tracking-[0.3em] uppercase mb-4 font-semibold" style={{ color: accent }}>GET IN TOUCH</p>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                {contact.heading || "Contact Us"}
              </h2>
              <p className="text-zinc-400 max-w-md mb-12 text-sm leading-relaxed">
                {contact.description ||
                  "We welcome your enquiries. Reach out to us for admissions guidance or any other information."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Col 1: contact info with SVG icons */}
                <div className="space-y-5">
                  {[
                    { icon: <IconMapPin />, text: address || `${city ?? ""}, ${state ?? ""}` },
                    { icon: <IconPhone />, text: phone || "—" },
                    { icon: <IconMail />, text: email || "—" },
                    { icon: <IconClock />, text: "Mon–Sat: 8:00 AM – 4:00 PM" },
                  ].map(({ icon, text }, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${accent}18`, color: accent }}
                      >
                        {icon}
                      </div>
                      <p className="text-zinc-300 text-sm pt-2">{text}</p>
                    </div>
                  ))}
                </div>

                {/* Col 2: Google Maps iframe */}
                <div
                  className="overflow-hidden"
                  style={{ border: `1px solid ${accent}25`, minHeight: "300px" }}
                >
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3572.8608563176817!2d82.52597947222179!3d26.427966480760162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3990928e2ecacf07%3A0x45812ae7e2c0ee77!2sDOYEN%20INTERNATIONAL%20SCHOOL!5e0!3m2!1sen!2sin!4v1792572714179!5m2!1sen!2sin"
                    width="100%"
                    height="300"
                    style={{ border: 0, display: "block" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    title="School Location"
                  />
                </div>

                {/* Col 3: Send Us a Message form */}
                <div>
                  <h3 className="text-white font-bold text-lg mb-5" style={{ fontFamily: "'Georgia', serif" }}>
                    Send Us a Message
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                    <select className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-400 focus:outline-none focus:border-zinc-600">
                      <option value="">Select Program</option>
                      <option value="pre-primary">Pre-Primary</option>
                      <option value="primary">Primary</option>
                      <option value="middle">Middle School</option>
                      <option value="secondary">Secondary</option>
                      <option value="senior">Senior Secondary</option>
                    </select>
                    <textarea
                      rows={3}
                      placeholder="Your Message"
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                    />
                    <button
                      type="button"
                      className="w-full py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                      style={{ backgroundColor: accent, color: "#000" }}
                    >
                      Submit Message →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Mobile/Tablet only Stats — just before footer ── */}
        {stats.show && (
          <section className="md:hidden bg-zinc-900 py-8 px-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { num: `${established_year ?? "—"}+`, label: "Years of Excellence" },
                { num: "1000+", label: "Students Enrolled" },
                { num: "50+", label: "Expert Faculty" },
                { num: "100%", label: "Success Rate" },
              ].map(({ num, label }) => (
                <div key={label} className="text-center py-5 px-3 border border-zinc-800 rounded-lg">
                  <p className="text-2xl font-bold mb-1" style={{ color: accent, fontFamily: "'Georgia', serif" }}>{num}</p>
                  <p className="text-zinc-400 text-xs uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </WebsiteShell>
  );
}
