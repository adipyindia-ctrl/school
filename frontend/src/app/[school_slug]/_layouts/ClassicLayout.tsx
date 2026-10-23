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
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12 19.79 19.79 0 0 1 1 3.18 2 2 0 0 1 2.98 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16l.92.92z"/>
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function IconAward() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="6"/>
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

function IconFlask() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3h6l1 9H8L9 3z"/>
      <path d="M6.5 12c0 0-2.5 2.5-2.5 5a7 7 0 0 0 14 0c0-2.5-2.5-5-2.5-5"/>
    </svg>
  );
}

function IconPalette() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ text, accent }: { text: string; accent: string }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-3">
      <div className="w-8 h-px" style={{ backgroundColor: accent }} />
      <span className="text-xs tracking-[0.3em] uppercase font-bold" style={{ color: accent }}>{text}</span>
      <div className="w-8 h-px" style={{ backgroundColor: accent }} />
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────
export function ClassicLayout({ data }: { data: SchoolWebsiteData }) {
  const { branding, name, phone, email, address, city, state, established_year } = data;
  const primary = branding.primary_color;
  const accent = branding.accent_color || "#C8971A";

  const hero = getSection(data, "hero");
  const about = getSection(data, "about");
  const academics = getSection(data, "academics");
  const gallery = getSection(data, "gallery");
  const admissions = getSection(data, "admissions");
  const contact = getSection(data, "contact");

  // ── Banner setup ────────────────────────────────────────────────────────────
  const banners =
    (data.hero_banners?.length ?? 0) > 0
      ? data.hero_banners!
      : data.hero_banner_url
      ? [{ id: "single", image_url: data.hero_banner_url, title: null as null, subtitle: null as null }]
      : [];
  const hasBanner = banners.length > 0;

  return (
    <WebsiteShell data={data}>

      {/* ── SECTION 1: Hero ─────────────────────────────────────────────────── */}
      {hero.show && (() => {
        const heroContent = (
          <div
            className="max-w-6xl mx-auto px-4 sm:px-6 hidden md:flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 h-[220px] md:min-h-[90vh] py-4 md:py-20"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {/* Left: text + CTAs */}
            <div className="flex-1 w-full text-center md:text-left">
              <p
                className="text-xs tracking-widest uppercase font-semibold mb-4"
                style={{ color: accent }}
              >
                LEARN · GROW · ACHIEVE
              </p>
              <h1
                className="text-4xl md:text-5xl font-bold leading-tight mb-5"
                style={{ fontFamily: "Georgia, serif" }}
              >
                <span style={{ color: "#ffffff" }}>Building Character</span>
                <br />
                <span className="italic" style={{ color: accent }}>for a Brighter Future</span>
              </h1>
              <p
                className="text-base leading-relaxed mb-8 max-w-lg"
                style={{ color: "rgba(255,255,255,0.80)" }}
              >
                {hero.description ||
                  `A tradition of excellence in education since ${established_year ?? "our founding"}. Committed to shaping future leaders with knowledge, integrity, and character.`}
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <a
                  href="#admissions"
                  className="px-8 py-3 font-semibold text-sm rounded hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: accent, color: "#ffffff" }}
                >
                  Apply for Admission
                </a>
                <a
                  href="#about"
                  className="px-8 py-3 border-2 border-white font-semibold text-sm rounded text-white hover:bg-white/10 transition-colors"
                >
                  Explore Our School
                </a>
              </div>
            </div>

            {/* Admission Enquiry card removed from hero */}
          </div>
        );

        if (hasBanner) {
          return (
            <HeroSlider
              banners={banners}
              overlayStyle={{ background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.05) 100%)" }}
              className="h-[220px] md:min-h-[90vh]"
            >
              {heroContent}
            </HeroSlider>
          );
        }

        return (
          <div
            className="relative h-[220px] md:min-h-[90vh] flex items-center"
            style={{
              background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 60%, ${primary}99 100%)`,
              fontFamily: "Georgia, serif",
            }}
          >
            {heroContent}
          </div>
        );
      })()}

      {/* ── SECTION 2: Stats Bar ─────────────────────────────────────────────── */}
      <section className="hidden md:block bg-white shadow-md border-b" style={{ fontFamily: "Georgia, serif" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { icon: <IconAward />, num: `${established_year ? new Date().getFullYear() - established_year : 20}+`, label: "Years of Excellence" },
            { icon: <IconUsers />, num: "1000+", label: "Students Enrolled" },
            { icon: <IconBook />, num: "50+", label: "Expert Faculty" },
            { icon: <IconStar />, num: "100%", label: "Success Rate" },
          ].map(({ icon, num, label }, i) => (
            <div
              key={label}
              className="py-8 px-6 text-center flex flex-col items-center"
              style={{ borderLeft: i > 0 ? "1px solid #e5e7eb" : undefined }}
            >
              <div className="w-10 h-10 flex items-center justify-center mb-3" style={{ color: primary }}>{icon}</div>
              <p className="text-3xl font-bold mb-1" style={{ color: primary }}>{num}</p>
              <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4: Academics ─────────────────────────────────────────────── */}
      {academics.show && (
        <section
          id="academics"
          className="py-12 md:py-20 px-4 sm:px-6 bg-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <div className="max-w-6xl mx-auto">
            <SectionLabel text="OUR ACADEMICS" accent={accent} />
            <h2
              className="text-3xl font-bold text-center mb-3"
              style={{ color: primary, fontFamily: "Georgia, serif" }}
            >
              {academics.heading || "Academic Programs"}
            </h2>
            <div className="flex justify-between items-center mb-10">
              <p className="text-sm text-gray-500 max-w-xl">
                {academics.description || `Comprehensive education from Pre-Primary through Senior Secondary, designed for every stage of your child's growth.`}
              </p>
              <a
                href="#contact"
                className="text-sm font-semibold flex-shrink-0 ml-4"
                style={{ color: accent }}
              >
                View All Programs →
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {([
                { num: "01", title: "Pre-Primary", tagline: "Play · Learn · Grow", range: "Nursery–KG" },
                { num: "02", title: "Primary", tagline: "Think · Create · Achieve", range: "Class I–V" },
                { num: "03", title: "Middle School", tagline: "Explore · Debate · Read", range: "Class VI–VIII" },
                { num: "04", title: "Secondary", tagline: "Analyse · Perform · Excel", range: "Class IX–X" },
                { num: "05", title: "Senior Secondary", tagline: "Focus · Prepare · Succeed", range: "Class XI–XII" },
              ] as const).map(({ num, title, tagline, range }, idx) => {
                const thumbUrl =
                  data.gallery_items && data.gallery_items.length > 0
                    ? data.gallery_items[idx % data.gallery_items.length].image_url
                    : null;
                return (
                  <div
                    key={title}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative"
                    style={{ borderTop: `4px solid ${accent}` }}
                  >
                    {/* Number badge */}
                    <div
                      className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: accent }}
                    >
                      {num}
                    </div>

                    {/* Thumbnail */}
                    {thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbUrl}
                        alt={title}
                        className="w-full h-28 object-cover rounded mb-3"
                      />
                    ) : (
                      <div
                        className="w-full h-28 rounded mb-3"
                        style={{ background: `linear-gradient(135deg, ${primary}22 0%, ${accent}22 100%)` }}
                      />
                    )}

                    <p className="font-bold text-sm mb-0.5" style={{ color: primary }}>{title}</p>
                    <p className="text-xs text-gray-400 mb-1">{range}</p>
                    <p className="italic text-xs mb-3" style={{ color: accent }}>{tagline}</p>
                    <a
                      href="#contact"
                      className="text-xs font-semibold"
                      style={{ color: accent }}
                    >
                      Explore Classes →
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 6: Gallery ──────────────────────────────────────────────── */}
      {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
        <section
          id="gallery"
          className="py-12 md:py-20 px-4 sm:px-6 bg-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <div className="max-w-6xl mx-auto">
            <SectionLabel text="OUR GALLERY" accent={accent} />
            <h2
              className="text-3xl font-bold text-center mb-6"
              style={{ color: primary, fontFamily: "Georgia, serif" }}
            >
              {gallery.heading || "Moments That Matter"}
            </h2>

            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-500 max-w-lg">
                {gallery.description || `A glimpse into the vibrant life at ${name}.`}
              </p>
              <a
                href="#gallery"
                className="text-sm font-semibold border-2 px-4 py-2 rounded flex-shrink-0 ml-4 hover:opacity-80 transition-opacity"
                style={{ borderColor: accent, color: accent }}
              >
                View All Photos →
              </a>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-3 mb-8">
              {["All", "Events", "Sports", "Academics"].map((cat) => (
                <label
                  key={cat}
                  className="cursor-pointer px-5 py-2 text-xs font-semibold uppercase tracking-widest rounded transition-all duration-200"
                  style={{
                    backgroundColor: cat === "All" ? accent : "transparent",
                    color: cat === "All" ? "#ffffff" : accent,
                    border: `1px solid ${accent}`,
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {cat}
                </label>
              ))}
            </div>

            {/* Masonry grid */}
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
              {data.gallery_items.map((img) => (
                <div
                  key={img.id}
                  className="break-inside-avoid mb-3 overflow-hidden rounded-lg group relative"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={img.title}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-3">
                    <p className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {img.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 3: About ─────────────────────────────────────────────────── */}
      {about.show && (
        <section
          id="about"
          className="py-12 md:py-20 px-4 sm:px-6"
          style={{ backgroundColor: "#FAFAF7", fontFamily: "Georgia, serif" }}
        >
          <div className="max-w-6xl mx-auto">
            <SectionLabel text="ABOUT US" accent={accent} />
            <h2
              className="text-3xl font-bold text-center mb-12"
              style={{ color: primary, fontFamily: "Georgia, serif" }}
            >
              {about.heading || `Welcome to ${name}`}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
              {/* Left: image — order-2 on mobile */}
              <div className="order-2 md:order-1">
                {data.gallery_items && data.gallery_items.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.gallery_items[0].image_url}
                    alt={data.gallery_items[0].title}
                    className="w-full h-80 object-cover rounded-lg shadow-xl"
                  />
                ) : (
                  <div
                    className="w-full h-80 rounded-lg shadow-xl"
                    style={{ backgroundColor: `${primary}33` }}
                  />
                )}
                <div
                  className="mt-3 px-4 py-2 rounded text-sm font-semibold text-white inline-block"
                  style={{ backgroundColor: primary }}
                >
                  {name} · {city}, {state}
                </div>
              </div>

              {/* Right: text + features */}
              <div>
                <h3
                  className="text-2xl font-bold mb-4"
                  style={{ color: primary, fontFamily: "Georgia, serif" }}
                >
                  {name}
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4 text-base">
                  {about.description
                    ? about.description.split(". ").slice(0, Math.ceil(about.description.split(". ").length / 2)).join(". ") + "."
                    : `${name} has been a beacon of quality education, nurturing young minds with a blend of academic rigour and strong moral values. Our institution has consistently produced leaders across every field.`}
                </p>
                <p className="text-gray-600 leading-relaxed mb-8 text-sm">
                  {about.description
                    ? about.description.split(". ").slice(Math.ceil(about.description.split(". ").length / 2)).join(". ")
                    : `Rooted in the best traditions of education, we believe every student deserves a safe, stimulating environment where curiosity is rewarded and character is built alongside academics.`}
                </p>

                {/* Feature grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {[
                    { icon: <IconAward />, title: "Academic Excellence", sub: "Consistent top results and curriculum depth" },
                    { icon: <IconShield />, title: "Safe & Nurturing Campus", sub: "Secure environment for holistic growth" },
                    { icon: <IconHeart />, title: "Holistic Development", sub: "Sports, arts, and character building" },
                    { icon: <IconGlobe />, title: "Global Perspective", sub: "World-class teaching and exposure" },
                  ].map(({ icon, title, sub }) => (
                    <div key={title} className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${accent}18`, color: accent }}
                      >
                        {icon}
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-0.5" style={{ color: primary }}>{title}</p>
                        <p className="text-xs text-gray-500">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href="#academics"
                  className="inline-block border-2 font-semibold text-sm px-6 py-2.5 rounded hover:text-white transition-colors"
                  style={{ borderColor: primary, color: primary }}
                >
                  Learn More →
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 5: Campus Life ───────────────────────────────────────────── */}
      <section
        className="py-12 md:py-20 px-4 sm:px-6"
        style={{
          background: `linear-gradient(135deg, ${primary}08 0%, ${primary}12 100%)`,
          fontFamily: "Georgia, serif",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <SectionLabel text="CAMPUS LIFE" accent={accent} />
          <h2
            className="text-3xl font-bold text-center mb-4"
            style={{ color: primary, fontFamily: "Georgia, serif" }}
          >
            Life Beyond the Classroom
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-10">
            {/* Left */}
            <div>
              <p className="text-gray-700 leading-relaxed mb-6 text-base">
                At {name}, we believe education extends far beyond textbooks. Our vibrant campus life ensures every student discovers their passion, builds lifelong friendships, and develops the skills needed for a fulfilling future.
              </p>
              <a
                href="#about"
                className="inline-block px-6 py-3 font-semibold text-sm text-white rounded hover:opacity-90 transition-opacity"
                style={{ backgroundColor: accent }}
              >
                Explore Campus Life →
              </a>
            </div>

            {/* Right: 2x2 activity tiles */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <IconUsers />, title: "Sports", desc: "Inter-school competitions and athletics" },
                { icon: <IconFlask />, title: "Science Labs", desc: "State-of-the-art laboratory facilities" },
                { icon: <IconBook />, title: "Library", desc: "10,000+ books and digital resources" },
                { icon: <IconPalette />, title: "Arts & Culture", desc: "Music, dance, drama and fine arts" },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 flex gap-4 items-start"
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ backgroundColor: `${accent}18`, color: accent }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1" style={{ color: primary }}>{title}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: Testimonials ─────────────────────────────────────────── */}
      <section
        className="py-12 md:py-20 px-4 sm:px-6"
        style={{ backgroundColor: "#F9F6F0", fontFamily: "Georgia, serif" }}
      >
        <div className="max-w-6xl mx-auto">
          <SectionLabel text="TESTIMONIALS" accent={accent} />
          <h2
            className="text-3xl font-bold text-center mb-12"
            style={{ color: primary, fontFamily: "Georgia, serif" }}
          >
            What Parents Say
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "The academic environment here is exceptional. My daughter has grown tremendously in both studies and character.",
                name: "Priya Sharma",
                role: "Parent of Grade 8 student",
              },
              {
                quote: "The teachers are dedicated and the school genuinely cares about every child's individual progress.",
                name: "Rajesh Verma",
                role: "Parent of Grade 5 student",
              },
              {
                quote: "Excellent infrastructure and holistic approach to education. Couldn't have made a better choice.",
                name: "Sunita Patel",
                role: "Parent of Grade 11 student",
              },
            ].map(({ quote, name: tName, role }) => (
              <div
                key={tName}
                className="bg-white rounded-xl p-7 shadow-sm border border-gray-100"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-3 text-yellow-400">
                  <IconStar /><IconStar /><IconStar /><IconStar /><IconStar />
                </div>
                {/* Open quote */}
                <div
                  className="text-6xl leading-none mb-2 select-none"
                  style={{ color: `${accent}33`, fontFamily: "Georgia, serif" }}
                  aria-hidden="true"
                >
                  &ldquo;
                </div>
                <p
                  className="italic text-sm text-gray-700 leading-relaxed mb-5"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {quote}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: `${primary}22`, color: primary }}
                  >
                    {tName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: primary }}>{tName}</p>
                    <p className="text-xs text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: CTA Band ─────────────────────────────────────────────── */}
      <section
        className="py-10 md:py-16 px-4 sm:px-6 text-center"
        style={{ backgroundColor: primary, fontFamily: "Georgia, serif" }}
      >
        <p className="text-xs tracking-widest uppercase font-semibold mb-3" style={{ color: accent }}>
          TAKE THE NEXT STEP
        </p>
        <h2
          className="text-3xl font-bold mb-6 text-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Give Your Child a Brighter Future
        </h2>
        <a
          href="#admissions"
          className="inline-block px-8 py-3 font-semibold text-sm text-white rounded hover:opacity-90 transition-opacity"
          style={{ backgroundColor: accent }}
        >
          Apply Now →
        </a>
      </section>

      {/* ── SECTION 9: Admissions ───────────────────────────────────────────── */}
      {admissions.show && (
        <section
          id="admissions"
          className="py-12 md:py-20 px-4 sm:px-6"
          style={{
            background: `linear-gradient(135deg, ${primary}08 0%, ${primary}12 100%)`,
            fontFamily: "Georgia, serif",
          }}
        >
          <div className="max-w-6xl mx-auto">
            <SectionLabel text="ADMISSIONS" accent={accent} />
            <h2
              className="text-3xl font-bold text-center mb-12"
              style={{ color: primary, fontFamily: "Georgia, serif" }}
            >
              {admissions.heading || "Admission Enquiry"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              {/* Left: info */}
              <div>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {admissions.description ||
                    `Applications are invited for admission to ${name} for the upcoming academic session. Admissions are open for all classes subject to seat availability.`}
                </p>
                <ol className="space-y-3 mb-8">
                  {[
                    "Obtain the School Prospectus from the Administrative Office",
                    "Fill the Application Form completely and accurately",
                    "Submit attested copies of required documents",
                    "Appear for Entrance Test / Interaction as notified",
                    "Confirm admission by depositing the fees within stipulated time",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <span
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white text-xs font-bold rounded-full"
                        style={{ backgroundColor: accent }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Right: enquiry form */}
              <div className="bg-white rounded-xl shadow-xl p-8">
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: primary, fontFamily: "Georgia, serif" }}
                >
                  Send an Enquiry
                </h3>
                <div className="w-10 h-0.5 mb-6" style={{ backgroundColor: accent }} />
                <input
                  type="text"
                  placeholder="Your Name"
                  className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none mb-3"
                  style={{ fontFamily: "Georgia, serif" }}
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none mb-3"
                  style={{ fontFamily: "Georgia, serif" }}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none mb-3"
                  style={{ fontFamily: "Georgia, serif" }}
                />
                <select
                  className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none mb-3"
                  style={{ fontFamily: "Georgia, serif" }}
                >
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
                  className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none mb-4"
                  style={{ fontFamily: "Georgia, serif" }}
                />
                <button
                  className="w-full py-3 font-semibold text-sm text-white rounded hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: accent }}
                >
                  Submit Message →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 10: Contact ─────────────────────────────────────────────── */}
      {contact.show && (
        <section
          id="contact"
          className="py-12 md:py-20 px-4 sm:px-6 bg-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <div className="max-w-6xl mx-auto">
            <SectionLabel text="GET IN TOUCH" accent={accent} />
            <h2
              className="text-3xl font-bold text-center mb-12"
              style={{ color: primary, fontFamily: "Georgia, serif" }}
            >
              {contact.heading || "Contact Us"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Column 1: Info */}
              <div>
                <p className="font-bold text-lg mb-5" style={{ color: primary }}>Visit Us</p>
                <div className="space-y-4">
                  {[
                    { icon: <IconMapPin />, text: address || `${city}, ${state}` },
                    { icon: <IconPhone />, text: phone || "—" },
                    { icon: <IconMail />, text: email || "—" },
                    { icon: <IconClock />, text: "Mon–Sat: 8:00 AM – 4:00 PM" },
                  ].map(({ icon, text }, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${primary}15`, color: primary }}
                      >
                        {icon}
                      </div>
                      <p className="text-sm text-gray-600 pt-2">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Map */}
              <div>
                <p className="font-bold text-lg mb-5" style={{ color: primary }}>Find Us</p>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3572.8608563176817!2d82.52597947222179!3d26.427966480760162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3990928e2ecacf07%3A0x45812ae7e2c0ee77!2sDOYEN%20INTERNATIONAL%20SCHOOL!5e0!3m2!1sen!2sin!4v1792572714179!5m2!1sen!2sin"
                  width="100%"
                  height="220"
                  style={{ border: 0, display: "block", borderRadius: "8px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="School Location"
                />
              </div>

              {/* Column 3: Contact form */}
              <div>
                <p className="font-bold text-lg mb-5" style={{ color: primary }}>Send Us a Message</p>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none mb-3"
                  style={{ fontFamily: "Georgia, serif" }}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none mb-3"
                  style={{ fontFamily: "Georgia, serif" }}
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none mb-3"
                  style={{ fontFamily: "Georgia, serif" }}
                />
                <select
                  className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none mb-3"
                  style={{ fontFamily: "Georgia, serif" }}
                >
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
                  className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none mb-3"
                  style={{ fontFamily: "Georgia, serif" }}
                />
                <button
                  className="w-full py-3 font-semibold text-sm text-white rounded hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: accent }}
                >
                  Submit Message →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

    </WebsiteShell>
  );
}
