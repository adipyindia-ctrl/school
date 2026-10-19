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
          <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full grid md:grid-cols-2 gap-12 items-center min-h-[90vh]">
            {/* Left — school name / tagline / CTAs */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 tracking-widest uppercase border border-white/40"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(8px)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Est. {established_year ?? "—"} &nbsp;·&nbsp; {data.school_type.toUpperCase()}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-5 text-white drop-shadow-lg">
                {hero.heading || branding.welcome_message || `Welcome to ${name}`}
              </h1>

              <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                {hero.description ||
                  "Nurturing young minds with excellence in education, character building, and holistic development."}
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="#admissions"
                  style={{ backgroundColor: accent }}
                  className="px-8 py-3 rounded font-bold text-white shadow-lg hover:opacity-90 transition-opacity duration-200 text-sm uppercase tracking-wide"
                >
                  Apply Now
                </a>
                <a
                  href="#about"
                  className="px-8 py-3 rounded font-bold border-2 border-white text-white hover:bg-white/15 transition-colors duration-200 text-sm uppercase tracking-wide"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Right — info tiles (no emoji) */}
            <div className="hidden md:grid grid-cols-2 gap-4">
              {[
                { label: "Board Affiliation", value: data.school_type.toUpperCase() },
                { label: "Established", value: String(established_year ?? "—") },
                { label: "Location", value: `${city}, ${state}` },
                { label: "Contact", value: phone || email || "—" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-lg p-5 border border-white/30"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(10px)",
                    borderLeft: `4px solid ${accent}`,
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-widest mb-1"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    {label}
                  </p>
                  <p className="font-bold text-white text-sm truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>
        );

        if (hasBanner) {
          return (
            <HeroSlider
              banners={banners}
              overlayStyle={{ background: `linear-gradient(135deg, ${primary}cc 0%, ${secondary}99 100%)` }}
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
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-10 z-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg,rgba(255,255,255,0.05) 0px,rgba(255,255,255,0.05) 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,rgba(255,255,255,0.05) 0px,rgba(255,255,255,0.05) 1px,transparent 1px,transparent 60px)",
              }}
            />
            {heroContent}
          </section>
        );
      })()}

      {/* ── Affiliation Ribbon ── */}
      {hero.show && (
        <div
          className="w-full py-2.5 px-6 text-center text-xs font-medium tracking-wide text-white"
          style={{ backgroundColor: `${primary}dd` }}
        >
          CBSE Affiliated&nbsp;&nbsp;|&nbsp;&nbsp;Affiliation No. 2130XXX&nbsp;&nbsp;|&nbsp;&nbsp;Est.&nbsp;
          {established_year ?? "—"}&nbsp;&nbsp;|&nbsp;&nbsp;{city}, {state}
        </div>
      )}

      {/* ── Stats Bar ── */}
      {stats.show && (
        <section style={{ backgroundColor: accent }} className="py-12 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[
              {
                svg: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
                num: "1000+",
                label: "Students Enrolled",
              },
              {
                svg: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                ),
                num: `${established_year ? new Date().getFullYear() - established_year : 25}+`,
                label: "Years of Excellence",
              },
              {
                svg: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                ),
                num: "20+",
                label: "Courses Offered",
              },
              {
                svg: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                ),
                num: "98%",
                label: "Board Results",
              },
            ].map(({ svg, num, label }) => (
              <div
                key={label}
                className="bg-white/15 rounded-lg p-6 flex flex-col items-center gap-3"
              >
                <div className="opacity-90">{svg}</div>
                <p className="text-3xl font-extrabold leading-none">{num}</p>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── About ── */}
      {about.show && (
        <section id="about" className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            {/* Two columns */}
            <div className="grid md:grid-cols-2 gap-16 items-start mb-16">
              {/* Left — school story */}
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: accent }}
                >
                  About Us
                </p>
                <h2 className="text-4xl font-extrabold mb-4 leading-tight" style={{ color: primary }}>
                  {about.heading || "About Our School"}
                </h2>
                <div className="w-10 h-1 rounded-full mb-6" style={{ backgroundColor: accent }} />

                <p className="text-gray-600 leading-relaxed mb-5 text-base">
                  {about.description ||
                    `${name} is a premier CBSE-affiliated institution dedicated to academic excellence and the all-round development of every student. With state-of-the-art facilities and a team of experienced educators, we create an environment where young minds flourish.`}
                </p>
                <p className="text-gray-600 leading-relaxed text-base mb-8">
                  Our curriculum seamlessly blends traditional values with modern pedagogical practices,
                  equipping students with the knowledge, skills, and character to thrive in a rapidly
                  changing world.
                </p>

                {/* Why Choose Us — no emoji, colored square bullet */}
                <div className="space-y-4">
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
                      desc: "Smart classrooms, science labs, library, and sports facilities.",
                    },
                    {
                      title: "Holistic Development",
                      desc: "Arts, sports, and co-curricular activities to nurture every talent.",
                    },
                  ].map(({ title, desc }) => (
                    <div key={title} className="flex items-start gap-3">
                      <span
                        className="mt-1 flex-shrink-0 w-3 h-3 rounded-sm"
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
                  style={{ backgroundColor: primary }}
                  className="inline-block mt-8 px-7 py-3 rounded text-white font-semibold hover:opacity-90 transition-opacity duration-200 shadow-md text-sm uppercase tracking-wide"
                >
                  Join Us &rarr;
                </a>
              </div>

              {/* Right — Principal's Message */}
              <div>
                <div
                  className="rounded-xl p-8 border-l-4 relative"
                  style={{
                    backgroundColor: `${primary}08`,
                    borderLeftColor: primary,
                  }}
                >
                  {/* Decorative large quotation mark */}
                  <div
                    className="absolute top-4 left-6 text-8xl font-serif leading-none select-none pointer-events-none"
                    style={{ color: `${primary}20` }}
                  >
                    &ldquo;
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: accent }}>
                    Principal&apos;s Message
                  </p>

                  <p className="text-gray-700 leading-relaxed italic text-base relative z-10 mb-6">
                    {`Education is not merely the acquisition of knowledge — it is the development of character, resilience, and a lifelong love of learning. At ${name}, we are committed to nurturing every student as a complete individual, ready to make a meaningful contribution to society.`}
                  </p>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-0.5 rounded-full"
                      style={{ backgroundColor: primary }}
                    />
                    <p className="font-bold text-gray-800 text-sm">
                      Principal, {name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat chips — no emoji */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Board", value: data.school_type.toUpperCase() },
                { label: "Established", value: String(established_year ?? "—") },
                { label: "Location", value: `${city}, ${state}` },
                { label: "Contact", value: phone || "—" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="p-4 rounded-lg border bg-gray-50 text-center"
                  style={{ borderColor: `${primary}25` }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-widest mb-1"
                    style={{ color: accent }}
                  >
                    {label}
                  </p>
                  <p className="font-bold text-gray-800 text-sm truncate">{value}</p>
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
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: accent }}
              >
                Academics
              </p>
              <h2 className="text-4xl font-extrabold mb-4" style={{ color: primary }}>
                {academics.heading || "Academic Programs"}
              </h2>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: accent }} />
              <p className="text-gray-600 max-w-2xl mx-auto text-base">
                {academics.description ||
                  "A structured, CBSE-aligned curriculum spanning Pre-Primary to Senior Secondary — designed to build knowledge, skills, and values at every stage."}
              </p>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                {
                  num: "01",
                  title: "Pre-Primary",
                  range: "Nursery – KG",
                  desc: "Play-based learning that sparks curiosity and builds foundational literacy and numeracy skills.",
                },
                {
                  num: "02",
                  title: "Primary",
                  range: "Class I – V",
                  desc: "Core subjects with activity-based methods to instil a love for learning in young students.",
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
                  desc: "Comprehensive CBSE board preparation with focus on analytical and exam skills.",
                },
                {
                  num: "05",
                  title: "Senior Secondary",
                  range: "Class XI – XII",
                  desc: "Science, Commerce, and Humanities streams preparing students for higher education.",
                },
              ].map(({ num, title, range, desc }) => (
                <div
                  key={num}
                  className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Numbered badge */}
                  <span
                    className="text-3xl font-extrabold leading-none mb-4 block"
                    style={{ color: `${primary}30` }}
                  >
                    {num}
                  </span>
                  <h3 className="font-extrabold text-gray-900 text-lg mb-1">{title}</h3>
                  <p
                    className="text-xs font-semibold uppercase tracking-widest mb-3"
                    style={{ color: accent }}
                  >
                    {range}
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1">{desc}</p>
                  <div
                    className="mt-4 w-8 h-0.5 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
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
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: accent }}
              >
                Gallery
              </p>
              <h2 className="text-4xl font-extrabold" style={{ color: primary }}>
                {gallery.heading || "School Life"}
              </h2>
              <div className="w-10 h-1 rounded-full mx-auto mt-4" style={{ backgroundColor: accent }} />
            </div>

            {/* CSS-only category filter — radio inputs + sibling selectors */}
            <input type="radio" name="gfilter" id="gf-all" defaultChecked className="hidden" />
            <input type="radio" name="gfilter" id="gf-events" className="hidden" />
            <input type="radio" name="gfilter" id="gf-sports" className="hidden" />
            <input type="radio" name="gfilter" id="gf-academics" className="hidden" />

            <style>{`
              #gf-events:checked ~ .gfilter-labels label[for="gf-events"],
              #gf-sports:checked ~ .gfilter-labels label[for="gf-sports"],
              #gf-academics:checked ~ .gfilter-labels label[for="gf-academics"],
              #gf-all:checked ~ .gfilter-labels label[for="gf-all"] {
                background-color: var(--accent, #2563eb);
                color: #fff;
                border-color: var(--accent, #2563eb);
              }
              #gf-events:checked ~ .gfilter-labels ~ .gallery-grid [data-category]:not([data-category="Events"]) { display: none; }
              #gf-sports:checked ~ .gfilter-labels ~ .gallery-grid [data-category]:not([data-category="Sports"]) { display: none; }
              #gf-academics:checked ~ .gfilter-labels ~ .gallery-grid [data-category]:not([data-category="Academics"]) { display: none; }
            `}</style>

            {/* Filter tab labels */}
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
                  className="cursor-pointer px-6 py-2 rounded-full text-sm font-semibold border-2 transition-colors duration-200"
                  style={{
                    borderColor: primary,
                    color: primary,
                  }}
                >
                  {label}
                </label>
              ))}
            </div>

            {/* Gallery grid */}
            <div className="gallery-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.gallery_items.map((img) => (
                <div
                  key={img.id}
                  data-category={img.category ?? undefined}
                  className="aspect-square group relative overflow-hidden rounded-lg shadow-md bg-gray-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    {img.category && (
                      <span
                        className="text-xs font-semibold uppercase tracking-wider mb-1"
                        style={{ color: accent }}
                      >
                        {img.category}
                      </span>
                    )}
                    <p className="text-white text-sm font-semibold">{img.title}</p>
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
          {/* Decorative circles */}
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative z-10 max-w-5xl mx-auto text-white">
            {/* Header */}
            <div className="text-center mb-14">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">
                Admissions
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
                {admissions.heading || "Admissions Open 2025-26"}
              </h2>
              <p className="text-white/80 text-base max-w-xl mx-auto">
                {admissions.description ||
                  `Join ${name} and become part of a legacy of academic excellence. Seats are limited — apply early.`}
              </p>
            </div>

            {/* 4-step process */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {[
                {
                  step: "1",
                  title: "Online Application",
                  desc: "Fill out the admission form on our portal with student details.",
                },
                {
                  step: "2",
                  title: "Document Submission",
                  desc: "Submit birth certificate, previous mark sheets, and photos.",
                },
                {
                  step: "3",
                  title: "Interaction & Assessment",
                  desc: "Brief interaction with the child and parents by our academic team.",
                },
                {
                  step: "4",
                  title: "Admission Confirmation",
                  desc: "Receive your admission letter and complete fee payment online.",
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex flex-col items-center text-center">
                  {/* Step circle */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-lg mb-4 border-2 border-white/40"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  >
                    {step}
                  </div>
                  <h3 className="font-bold text-base mb-1">{title}</h3>
                  <p className="text-white/70 text-xs leading-relaxed">{desc}</p>
                  {/* Arrow connector — hidden on last */}
                  {step !== "4" && (
                    <div className="hidden md:block absolute" />
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <a
                href="/login"
                style={{ backgroundColor: accent }}
                className="inline-block px-12 py-4 rounded font-bold text-white text-base shadow-2xl hover:opacity-90 transition-opacity duration-200 uppercase tracking-wide"
              >
                Apply Now &rarr;
              </a>
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
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: accent }}
              >
                Contact Us
              </p>
              <h2 className="text-4xl font-extrabold mb-4" style={{ color: primary }}>
                {contact.heading || "Get In Touch"}
              </h2>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: accent }} />
              <p className="text-gray-600 max-w-xl mx-auto text-base">
                {contact.description ||
                  "We welcome your questions, feedback, and enquiries. Reach us any time during school hours."}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left — contact card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8" style={{ borderTop: `4px solid ${primary}` }}>
                <h3 className="font-extrabold text-gray-900 text-xl mb-6">{name}</h3>

                <div className="space-y-5">
                  {/* Address */}
                  {(address || city) && (
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex-shrink-0 text-gray-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: accent }}>Address</p>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {address && <>{address}<br /></>}
                          {city}{state ? `, ${state}` : ""}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {phone && (
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex-shrink-0 text-gray-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.47 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-.96a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: accent }}>Phone</p>
                        <p className="text-gray-700 text-sm">{phone}</p>
                        {branding.support_phone && (
                          <p className="text-gray-400 text-xs mt-0.5">Support: {branding.support_phone}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {email && (
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex-shrink-0 text-gray-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: accent }}>Email</p>
                        <p className="text-gray-700 text-sm">{email}</p>
                        {branding.support_email && (
                          <p className="text-gray-400 text-xs mt-0.5">Support: {branding.support_email}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right — map placeholder */}
              <div
                className="rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-100 flex flex-col items-center justify-center min-h-[300px]"
              >
                <span className="text-4xl mb-3">📍</span>
                <p className="font-semibold text-gray-500 text-base">Find Us On Map</p>
                <p className="text-gray-400 text-sm mt-1">{address || `${city}, ${state}`}</p>
              </div>
            </div>
          </div>
        </section>
      )}

    </WebsiteShell>
  );
}
