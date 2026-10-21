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

export function ModernLayout({ data }: { data: SchoolWebsiteData }) {
  const { branding, name, phone, email, address, city, state, established_year } = data;
  const primary = branding.primary_color;
  const secondary = branding.secondary_color;
  const accent = branding.accent_color;

  const hero = getSection(data, "hero");
  const about = getSection(data, "about");
  const stats = getSection(data, "stats");
  const academics = getSection(data, "academics");
  const gallery = getSection(data, "gallery");
  const admissions = getSection(data, "admissions");
  const contact = getSection(data, "contact");

  return (
    <WebsiteShell data={data}>

      {/* ── Hero ── */}
      {hero.show && (() => {
        const banners = data.hero_banners && data.hero_banners.length > 0
          ? data.hero_banners
          : data.hero_banner_url
            ? [{ id: "single", image_url: data.hero_banner_url, title: null, subtitle: null }]
            : [];
        const hasBanner = banners.length > 0;

        const heroContent = (
          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-12 items-center min-h-[90vh] py-24">
            {/* Left — school name / tagline / CTAs */}
            <div>
              {/* Breadcrumb pill */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-bold mb-6 tracking-[0.15em] uppercase border-l-2"
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderLeftColor: accent,
                  color: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Est. {established_year ?? "—"}&nbsp;&nbsp;·&nbsp;&nbsp;{data.school_type.toUpperCase()}
              </div>

              <h1
                className="font-extrabold leading-[1.1] mb-5 text-white"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}
              >
                {hero.heading || branding.welcome_message || name}
              </h1>

              {/* Accent divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-0.5" style={{ backgroundColor: accent }} />
                <div className="w-3 h-0.5" style={{ backgroundColor: "rgba(255,255,255,0.4)" }} />
              </div>

              <p className="text-white/80 text-base md:text-lg leading-relaxed mb-10 max-w-lg">
                {hero.description ||
                  "A premier CBSE-affiliated institution committed to academic excellence, character building, and holistic development of every child."}
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="#admissions"
                  className="px-8 py-3.5 rounded-sm font-bold text-white shadow-xl hover:opacity-90 active:scale-95 transition-all duration-150 text-sm uppercase tracking-widest"
                  style={{ backgroundColor: accent }}
                >
                  Apply Now
                </a>
                <a
                  href="#about"
                  className="px-8 py-3.5 rounded-sm font-bold border-2 border-white/70 text-white hover:bg-white/15 active:scale-95 transition-all duration-150 text-sm uppercase tracking-widest"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Right — clean info card (desktop only) */}
            <div className="hidden md:flex justify-end">
              <div
                className="w-72 rounded-sm overflow-hidden shadow-2xl"
                style={{ backgroundColor: "rgba(255,255,255,0.97)" }}
              >
                {/* Card header */}
                <div className="px-6 py-4" style={{ backgroundColor: primary }}>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-0.5">School Profile</p>
                  <p className="text-white font-extrabold text-base truncate">{name}</p>
                </div>
                {/* Card body */}
                <div className="px-6 py-5 divide-y divide-gray-100">
                  {[
                    { label: "Board Affiliation", value: data.school_type.toUpperCase() },
                    { label: "Established", value: String(established_year ?? "—") },
                    { label: "Location", value: `${city}, ${state}` },
                    { label: "Contact", value: phone || email || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="py-3 flex items-center justify-between gap-4">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">{label}</span>
                      <span className="font-bold text-gray-800 text-sm text-right truncate" style={{ color: primary }}>{value}</span>
                    </div>
                  ))}
                </div>
                {/* Card footer */}
                <div className="px-6 pb-5">
                  <a
                    href="#admissions"
                    className="block w-full text-center py-2.5 rounded-sm text-sm font-bold text-white uppercase tracking-widest hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: accent }}
                  >
                    Enquire Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        );

        if (hasBanner) {
          return (
            <HeroSlider
              banners={banners}
              overlayStyle={{ background: "linear-gradient(105deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.30) 100%)" }}
              className="min-h-[90vh]"
            >
              {heroContent}
            </HeroSlider>
          );
        }

        return (
          <section
            className="relative overflow-hidden min-h-[90vh] flex items-center text-white"
            style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
          >
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,1) 0px, rgba(255,255,255,1) 1px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, rgba(255,255,255,1) 0px, rgba(255,255,255,1) 1px, transparent 1px, transparent 80px)",
              }}
            />
            {heroContent}
          </section>
        );
      })()}

      {/* ── Affiliation Bar ── */}
      {hero.show && (
        <div
          className="w-full py-3 px-6"
          style={{ backgroundColor: "#0f172a" }}
        >
          <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-x-6 gap-y-1 text-center">
            {[
              `CBSE Affiliated`,
              `Affiliation No. 2130XXX`,
              `Est. ${established_year ?? "—"}`,
              `${city}, ${state}`,
            ].map((item, i, arr) => (
              <span key={item} className="flex items-center gap-6">
                <span
                  className="text-xs font-bold uppercase tracking-[0.15em]"
                  style={{ color: "rgba(255,255,255,0.80)" }}
                >
                  {item}
                </span>
                {i < arr.length - 1 && (
                  <span
                    className="w-1 h-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: accent }}
                  />
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      {stats.show && (
        <section className="py-14 px-6 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                num: "1200+",
                label: "Students Enrolled",
                svg: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
              },
              {
                num: "80+",
                label: "Qualified Faculty",
                svg: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                ),
              },
              {
                num: `${established_year ? new Date().getFullYear() - established_year : 20}+`,
                label: "Years of Excellence",
                svg: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                ),
              },
              {
                num: "98%",
                label: "Board Pass Rate",
                svg: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                ),
              },
            ].map(({ num, label, svg }) => (
              <div
                key={label}
                className="bg-white rounded-sm border border-gray-100 pt-5 pb-6 px-6 flex flex-col items-center text-center shadow-sm"
                style={{ borderTop: `3px solid ${primary}` }}
              >
                <span className="mb-3" style={{ color: primary }}>
                  {svg}
                </span>
                <p className="text-3xl font-extrabold leading-none mb-1" style={{ color: primary }}>
                  {num}
                </p>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── About ── */}
      {about.show && (
        <section id="about" className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
            {/* Left */}
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: accent }}
              >
                About Us
              </p>
              <h2
                className="text-3xl md:text-4xl font-extrabold leading-tight mb-4"
                style={{ color: primary }}
              >
                {about.heading || `Welcome to ${name}`}
              </h2>
              <div className="flex items-center gap-2 mb-7">
                <div className="w-10 h-0.5" style={{ backgroundColor: primary }} />
                <div className="w-3 h-0.5" style={{ backgroundColor: accent }} />
              </div>
              <p className="text-gray-600 leading-relaxed mb-5 text-base">
                {about.description ||
                  `${name} is a premier CBSE-affiliated institution dedicated to academic excellence and the all-round development of every student. With state-of-the-art facilities and a team of experienced educators, we create an environment where young minds flourish.`}
              </p>
              <p className="text-gray-600 leading-relaxed text-base mb-9">
                Our curriculum blends traditional values with modern pedagogical practices, equipping
                students with the knowledge, skills, and character to thrive in a rapidly changing world.
              </p>

              {/* Why Choose Us */}
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: primary }}>
                Why Choose Us
              </p>
              <div className="space-y-4 mb-9">
                {[
                  {
                    title: "CBSE Curriculum",
                    desc: "Rigorous, nationally recognised syllabus aligned to NEP 2020 guidelines.",
                  },
                  {
                    title: "Experienced Faculty",
                    desc: "Qualified educators with decades of combined teaching experience.",
                  },
                  {
                    title: "Modern Infrastructure",
                    desc: "Smart classrooms, science labs, library, and multi-purpose sports facilities.",
                  },
                  {
                    title: "Holistic Development",
                    desc: "Arts, sports, and co-curricular activities that nurture every talent.",
                  },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <span
                      className="mt-1.5 flex-shrink-0 w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: accent }}
                    />
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{title}</p>
                      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href="#admissions"
                className="inline-block px-7 py-3 rounded-sm text-white font-bold text-sm uppercase tracking-widest shadow-md hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primary }}
              >
                Join Our School &rarr;
              </a>
            </div>

            {/* Right — Principal's Message */}
            <div className="flex flex-col gap-6">
              {/* Quote box */}
              <div
                className="rounded-sm p-8 relative border border-gray-100"
                style={{
                  backgroundColor: "#f8fafc",
                  borderLeft: `4px solid ${primary}`,
                }}
              >
                {/* Large decorative quote */}
                <div
                  className="absolute top-3 right-6 text-7xl font-serif leading-none select-none pointer-events-none"
                  style={{ color: `${primary}18` }}
                >
                  &rdquo;
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.18em] mb-5" style={{ color: accent }}>
                  Principal&apos;s Message
                </p>

                <p className="text-gray-700 leading-relaxed italic text-base relative z-10 mb-6">
                  {`Education is not merely the acquisition of knowledge — it is the development of character, resilience, and a lifelong love of learning. At ${name}, we are committed to nurturing every student as a complete individual, ready to make a meaningful contribution to society.`}
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: primary }} />
                  <div>
                    <p className="font-extrabold text-gray-800 text-sm">Principal</p>
                    <p className="text-gray-400 text-xs">{name}</p>
                  </div>
                </div>
              </div>

              {/* Quick info grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Board", value: data.school_type.toUpperCase() },
                  { label: "Established", value: String(established_year ?? "—") },
                  { label: "City", value: city },
                  { label: "State", value: state },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-gray-50 rounded-sm p-4 border border-gray-100"
                    style={{ borderTop: `2px solid ${accent}` }}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest mb-1 text-gray-400">{label}</p>
                    <p className="font-extrabold text-sm" style={{ color: primary }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Academics ── */}
      {academics.show && (
        <section id="academics" className="py-24 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p
                className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: accent }}
              >
                Academics
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: primary }}>
                {academics.heading || "Academic Programs"}
              </h2>
              <div className="w-10 h-0.5 mx-auto mb-4" style={{ backgroundColor: primary }} />
              <p className="text-gray-500 max-w-2xl mx-auto text-base leading-relaxed">
                {academics.description ||
                  "A structured CBSE-aligned curriculum spanning Pre-Primary to Senior Secondary — built to develop knowledge, critical thinking, and character at every stage."}
              </p>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-5">
              {[
                {
                  num: "01",
                  title: "Pre-Primary",
                  range: "Nursery – KG",
                  desc: "Play-based learning that sparks curiosity and builds foundational literacy and numeracy.",
                },
                {
                  num: "02",
                  title: "Primary",
                  range: "Class I – V",
                  desc: "Core subjects with activity-based methods to instil a love for learning.",
                },
                {
                  num: "03",
                  title: "Middle",
                  range: "Class VI – VIII",
                  desc: "Conceptual depth across Science, Mathematics, Social Studies, and Languages.",
                },
                {
                  num: "04",
                  title: "Secondary",
                  range: "Class IX – X",
                  desc: "Comprehensive CBSE board preparation with focus on analysis and exam skills.",
                },
                {
                  num: "05",
                  title: "Sr. Secondary",
                  range: "Class XI – XII",
                  desc: "Science, Commerce & Humanities streams preparing students for higher education.",
                },
              ].map(({ num, title, range, desc }) => (
                <div
                  key={num}
                  className="bg-white rounded-sm border border-gray-100 p-6 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                  style={{ borderTop: `3px solid ${primary}` }}
                >
                  <span
                    className="text-4xl font-extrabold leading-none mb-4 block"
                    style={{ color: `${primary}25` }}
                  >
                    {num}
                  </span>
                  <h3 className="font-extrabold text-gray-900 text-base mb-1 group-hover:text-current transition-colors" style={{ color: primary }}>
                    {title}
                  </h3>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: accent }}
                  >
                    {range}
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1">{desc}</p>
                  <div className="mt-5 w-6 h-0.5 rounded-full" style={{ backgroundColor: accent }} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery ── */}
      {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
        <section id="gallery" className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p
                className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: accent }}
              >
                Gallery
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: primary }}>
                {gallery.heading || "School Life"}
              </h2>
              <div className="w-10 h-0.5 mx-auto mt-4" style={{ backgroundColor: primary }} />
            </div>

            {/* CSS-only category filter */}
            <input type="radio" name="gfilter" id="gf-all" defaultChecked className="hidden" />
            <input type="radio" name="gfilter" id="gf-events" className="hidden" />
            <input type="radio" name="gfilter" id="gf-sports" className="hidden" />
            <input type="radio" name="gfilter" id="gf-academics" className="hidden" />

            <style>{`
              #gf-all:checked ~ .gfilter-labels label[for="gf-all"],
              #gf-events:checked ~ .gfilter-labels label[for="gf-events"],
              #gf-sports:checked ~ .gfilter-labels label[for="gf-sports"],
              #gf-academics:checked ~ .gfilter-labels label[for="gf-academics"] {
                color: #fff;
                border-color: transparent;
              }
              #gf-events:checked ~ .gfilter-labels ~ .gallery-grid [data-category]:not([data-category="Events"]) { display: none; }
              #gf-sports:checked ~ .gfilter-labels ~ .gallery-grid [data-category]:not([data-category="Sports"]) { display: none; }
              #gf-academics:checked ~ .gfilter-labels ~ .gallery-grid [data-category]:not([data-category="Academics"]) { display: none; }
            `}</style>

            <div className="gfilter-labels flex flex-wrap justify-center gap-3 mb-10">
              {[
                { forId: "gf-all", label: "All" },
                { forId: "gf-events", label: "Events" },
                { forId: "gf-sports", label: "Sports" },
                { forId: "gf-academics", label: "Academics" },
              ].map(({ forId, label }) => (
                <label
                  key={forId}
                  htmlFor={forId}
                  className="cursor-pointer px-6 py-2 rounded-sm text-sm font-bold border-2 transition-colors duration-200 uppercase tracking-wider"
                  style={{ borderColor: primary, color: primary }}
                >
                  {label}
                </label>
              ))}
            </div>

            <div className="gallery-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.gallery_items.map((img) => (
                <div
                  key={img.id}
                  data-category={img.category ?? undefined}
                  className="aspect-square group relative overflow-hidden rounded-sm shadow-sm bg-gray-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    {img.category && (
                      <span
                        className="text-xs font-bold uppercase tracking-wider mb-1"
                        style={{ color: accent }}
                      >
                        {img.category}
                      </span>
                    )}
                    <p className="text-white text-sm font-bold">{img.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Admissions ── */}
      {admissions.show && (
        <section
          id="admissions"
          className="relative overflow-hidden py-24 px-6"
          style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
        >
          {/* Decorative geometry */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 60px)",
            }}
          />
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-60 h-60 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative z-10 max-w-5xl mx-auto text-white">
            <div className="text-center mb-14">
              <p className="text-white/60 text-xs font-bold uppercase tracking-[0.18em] mb-3">
                Admissions
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
                {admissions.heading || "Admissions Open 2025-26"}
              </h2>
              <div className="w-10 h-0.5 mx-auto mb-6" style={{ backgroundColor: accent }} />
              <p className="text-white/75 text-base max-w-xl mx-auto leading-relaxed">
                {admissions.description ||
                  `Join ${name} and become part of a legacy of academic excellence. Seats are limited — apply early to secure your place.`}
              </p>
            </div>

            {/* 4-step process */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-14">
              {[
                {
                  step: "01",
                  title: "Online Application",
                  desc: "Fill out the admission form on our portal with complete student details.",
                },
                {
                  step: "02",
                  title: "Document Submission",
                  desc: "Submit birth certificate, previous mark sheets, and passport photos.",
                },
                {
                  step: "03",
                  title: "Interaction & Assessment",
                  desc: "A brief session with the child and parents by our academic team.",
                },
                {
                  step: "04",
                  title: "Confirmation",
                  desc: "Receive your admission letter and complete the fee payment online.",
                },
              ].map(({ step, title, desc }, i) => (
                <div key={step} className="flex flex-col items-center text-center relative">
                  {/* Step number */}
                  <div
                    className="w-14 h-14 rounded-sm flex items-center justify-center font-extrabold text-lg mb-4 border-2 border-white/30 relative z-10"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
                  >
                    <span style={{ color: accent }}>{step}</span>
                  </div>
                  {/* Connector line between steps */}
                  {i < 3 && (
                    <div
                      className="hidden md:block absolute top-7 left-1/2 w-full h-px"
                      style={{ backgroundColor: "rgba(255,255,255,0.15)", zIndex: 0 }}
                    />
                  )}
                  <h3 className="font-extrabold text-sm mb-2 uppercase tracking-wide">{title}</h3>
                  <p className="text-white/65 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <a
                href="/login"
                className="inline-block px-14 py-4 rounded-sm font-extrabold text-white text-sm shadow-2xl hover:opacity-90 active:scale-95 transition-all duration-150 uppercase tracking-widest"
                style={{ backgroundColor: accent }}
              >
                Apply Now &rarr;
              </a>
              <p className="text-white/50 text-xs mt-4 uppercase tracking-widest">
                Limited seats available · Academic Year 2025-26
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Contact ── */}
      {contact.show && (
        <section id="contact" className="py-24 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p
                className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: accent }}
              >
                Contact Us
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: primary }}>
                {contact.heading || "Get In Touch"}
              </h2>
              <div className="w-10 h-0.5 mx-auto mb-4" style={{ backgroundColor: primary }} />
              <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
                {contact.description ||
                  "We welcome your questions, feedback, and enquiries. Reach us any time during school hours."}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left — contact info card */}
              <div
                className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden"
                style={{ borderTop: `4px solid ${primary}` }}
              >
                <div className="px-8 py-6 border-b border-gray-100">
                  <h3 className="font-extrabold text-gray-900 text-xl">{name}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{data.school_type.toUpperCase()} Affiliated School</p>
                </div>

                <div className="px-8 py-6 space-y-6">
                  {/* Address */}
                  {(address || city) && (
                    <div className="flex items-start gap-4">
                      <div
                        className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${primary}12` }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: primary }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>
                          Address
                        </p>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {address && <>{address}<br /></>}
                          {city}{state ? `, ${state}` : ""}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {phone && (
                    <div className="flex items-start gap-4">
                      <div
                        className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${primary}12` }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: primary }}>
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.47 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>
                          Phone
                        </p>
                        <p className="text-gray-700 text-sm">{phone}</p>
                        {branding.support_phone && (
                          <p className="text-gray-400 text-xs mt-0.5">Support: {branding.support_phone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {email && (
                    <div className="flex items-start gap-4">
                      <div
                        className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${primary}12` }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: primary }}>
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>
                          Email
                        </p>
                        <p className="text-gray-700 text-sm">{email}</p>
                        {branding.support_email && (
                          <p className="text-gray-400 text-xs mt-0.5">Support: {branding.support_email}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right — Google Map */}
              <div className="rounded-sm overflow-hidden border border-gray-200 min-h-[320px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3572.8608563176817!2d82.52597947222179!3d26.427966480760162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3990928e2ecacf07%3A0x45812ae7e2c0ee77!2sDOYEN%20INTERNATIONAL%20SCHOOL!5e0!3m2!1sen!2sin!4v1792572714179!5m2!1sen!2sin"
                  width="100%"
                  height="320"
                  style={{ border: 0 }}
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

    </WebsiteShell>
  );
}
