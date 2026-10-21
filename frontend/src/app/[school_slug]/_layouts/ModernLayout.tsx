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
            {/* Left — accent pill + heading + CTAs */}
            <div>
              {/* CBSE pill */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-bold mb-6 tracking-[0.15em] uppercase border-l-4"
                style={{
                  backgroundColor: "rgba(0,0,0,0.45)",
                  borderLeftColor: accent,
                  color: "rgba(255,255,255,0.90)",
                  backdropFilter: "blur(8px)",
                }}
              >
                CBSE AFFILIATED&nbsp;•&nbsp;EST. {established_year ?? "—"}
              </div>

              <h1
                className="font-extrabold leading-[1.1] mb-5"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}
              >
                {hero.heading ? (
                  <span className="text-white">{hero.heading}</span>
                ) : (
                  <>
                    <span className="text-white block">A Brighter Future</span>
                    <span className="block" style={{ color: accent }}>Starts Here</span>
                  </>
                )}
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
                  Apply for Admission →
                </a>
                <a
                  href="#about"
                  className="px-8 py-3.5 rounded-sm font-bold border-2 border-white/70 text-white hover:bg-white/15 active:scale-95 transition-all duration-150 text-sm uppercase tracking-widest"
                >
                  Explore Our School
                </a>
              </div>
            </div>

            {/* Right — floating admissions card (desktop only) */}
            <div className="hidden md:flex justify-end">
              <div className="w-80 rounded-xl overflow-hidden shadow-2xl bg-white">
                {/* Card header */}
                <div className="px-6 py-5" style={{ backgroundColor: accent }}>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Admissions Open</p>
                  <p className="font-extrabold text-2xl text-white">2026-27</p>
                </div>
                {/* Card body */}
                <div className="px-6 py-5">
                  <p className="text-gray-500 text-sm mb-5 font-medium">
                    Nurturing Excellence Since {established_year ?? "—"}
                  </p>
                  <div className="space-y-4">
                    {/* Board row */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${primary}15` }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: primary }}>
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M3 9h18M9 21V9" />
                        </svg>
                      </div>
                      <span className="text-gray-700 text-sm font-semibold">{data.school_type.toUpperCase()}</span>
                    </div>
                    {/* Location row */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${primary}15` }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: primary }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <span className="text-gray-700 text-sm font-semibold">{city}, {state}</span>
                    </div>
                    {/* Phone / email row */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${primary}15` }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: primary }}>
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.47 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <span className="text-gray-700 text-sm font-semibold">{phone || email || "—"}</span>
                    </div>
                  </div>
                </div>
                {/* Card footer */}
                <div className="px-6 pb-6">
                  <a
                    href="#contact"
                    className="block w-full text-center py-3 rounded-lg text-sm font-bold text-white uppercase tracking-widest hover:opacity-90 transition-opacity shadow-md"
                    style={{ backgroundColor: accent }}
                  >
                    Request a Callback →
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

      {/* ── Features / Stats Bar ── */}
      {stats.show && (
        <section className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {[
              {
                label: "Academic Excellence",
                desc: "CBSE curriculum, smart classrooms & top board results",
                svg: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ),
              },
              {
                label: "Experienced Faculty",
                desc: "Qualified & dedicated educators with proven expertise",
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
                label: "Sports & Activities",
                desc: "Co-curricular programs that nurture every talent",
                svg: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                ),
              },
              {
                label: "Safe Campus",
                desc: "Secure, child-friendly environment with 24/7 care",
                svg: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
              },
            ].map(({ label, desc, svg }) => (
              <div
                key={label}
                className="flex items-start gap-4 px-7 py-8"
              >
                <span className="flex-shrink-0 mt-0.5" style={{ color: accent }}>
                  {svg}
                </span>
                <div>
                  <p className="font-extrabold text-gray-900 text-sm mb-1">{label}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── About ── */}
      {about.show && (
        <section id="about" className="py-24 px-6" style={{ backgroundColor: "#f8fafc" }}>
          <div className="max-w-7xl mx-auto">
            {/* Section heading */}
            <div className="text-center mb-14">
              <p
                className="text-xs font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: accent }}
              >
                About Us
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
                {about.heading ? (
                  <span style={{ color: "#0f172a" }}>{about.heading}</span>
                ) : (
                  <>
                    <span style={{ color: "#0f172a" }}>Discover </span>
                    <span style={{ color: accent }}>What Makes Us Different</span>
                  </>
                )}
              </h2>
              <div className="w-10 h-0.5 mx-auto mb-5" style={{ backgroundColor: accent }} />
              <p className="text-gray-500 max-w-2xl mx-auto text-base leading-relaxed">
                {about.description ||
                  `${name} is a premier CBSE-affiliated institution dedicated to academic excellence and the all-round development of every student.`}
              </p>
            </div>

            {/* 3-card grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  ),
                  title: "Academic Excellence",
                  desc: "Our CBSE-aligned curriculum combined with experienced faculty and modern infrastructure consistently delivers outstanding board results and prepares students for higher education.",
                  link: "Learn More →",
                  href: "#academics",
                },
                {
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                  ),
                  title: "Beyond the Classroom",
                  desc: "From sports and performing arts to community service and technology clubs — we nurture every dimension of a student's personality through rich co-curricular programs.",
                  link: "Explore Activities →",
                  href: "#gallery",
                },
                {
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  ),
                  title: "A Safe, Caring Campus",
                  desc: "We maintain a secure, inclusive, and nurturing environment where every child feels valued, respected, and empowered to explore their full potential every single day.",
                  link: "Take a Campus Tour →",
                  href: "#contact",
                },
              ].map(({ icon, title, desc, link, href }) => (
                <div
                  key={title}
                  className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Icon square */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 flex-shrink-0"
                    style={{ backgroundColor: `${accent}15` }}
                  >
                    <span style={{ color: accent }}>{icon}</span>
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-lg mb-3">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">{desc}</p>
                  <a
                    href={href}
                    className="text-sm font-bold hover:underline transition-colors"
                    style={{ color: accent }}
                  >
                    {link}
                  </a>
                </div>
              ))}
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
