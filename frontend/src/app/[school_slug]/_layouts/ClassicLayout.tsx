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

// ── Inline SVG icons (no extra packages) ─────────────────────────────────────
function IconAddress() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12 19.79 19.79 0 0 1 1 3.18 2 2 0 0 1 2.98 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16l.92.92z"/>
    </svg>
  );
}

function IconEmail() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

// ── Decorative section header ─────────────────────────────────────────────────
function SectionHeader({ heading, subtext, primary }: { heading: string; subtext?: string | null; primary: string }) {
  return (
    <div className="text-center mb-14">
      <p className="text-xs tracking-[0.3em] uppercase mb-3 font-semibold" style={{ color: `${primary}aa` }}>
        {subtext ?? "\u00a0"}
      </p>
      <h2 className="text-3xl font-bold mb-5" style={{ color: primary, fontFamily: "Georgia, serif" }}>
        {heading}
      </h2>
      <div className="flex items-center justify-center gap-3">
        <div className="w-16 h-px" style={{ backgroundColor: `${primary}50` }} />
        <div className="w-2 h-2 rotate-45 border" style={{ borderColor: primary }} />
        <div className="w-16 h-px" style={{ backgroundColor: `${primary}50` }} />
      </div>
    </div>
  );
}

export function ClassicLayout({ data }: { data: SchoolWebsiteData }) {
  const { branding, name, phone, email, address, city, state, established_year } = data;
  const primary = branding.primary_color;

  // School initials for crest
  const initials = `${name.charAt(0)}${name.split(" ")[1]?.charAt(0) ?? ""}`;

  const hero = getSection(data, "hero");
  const about = getSection(data, "about");
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
          <div
            className="relative z-10 max-w-3xl mx-auto px-6 py-24 min-h-[85vh] flex flex-col items-center justify-center text-center"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {/* Background watermark letter (no-banner only) */}
            {!hasBanner && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
                <span className="text-[18rem] font-black opacity-[0.03] leading-none" style={{ color: primary }}>
                  {name.charAt(0)}
                </span>
              </div>
            )}

            {/* Crest — SVG shield with school initials */}
            <div
              className="mx-auto mb-7 flex items-center justify-center shadow-md"
              style={{
                width: "7rem",
                height: "7rem",
                border: `3px solid ${hasBanner ? "rgba(255,255,255,0.75)" : primary}`,
                backgroundColor: hasBanner ? "rgba(255,255,255,0.12)" : `${primary}0d`,
                clipPath: "polygon(50% 0%, 100% 15%, 100% 70%, 50% 100%, 0% 70%, 0% 15%)",
              }}
            >
              <span
                className="text-2xl font-bold tracking-wider select-none"
                style={{ color: hasBanner ? "white" : primary }}
              >
                {initials}
              </span>
            </div>

            {/* Est. ribbon */}
            <div className="flex items-center gap-4 mb-6 w-full max-w-md">
              <div className="flex-1 h-px" style={{ backgroundColor: hasBanner ? "rgba(255,255,255,0.45)" : `${primary}50` }} />
              <span className="text-xs tracking-[0.22em] uppercase font-semibold" style={{ color: hasBanner ? "rgba(255,255,255,0.9)" : primary }}>
                Est. {established_year ?? "—"} &nbsp;·&nbsp; {data.school_type.toUpperCase()}
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: hasBanner ? "rgba(255,255,255,0.45)" : `${primary}50` }} />
            </div>

            {/* Headline */}
            <h1
              className="text-4xl md:text-5xl font-bold mb-5 leading-tight"
              style={{ color: hasBanner ? "#ffffff" : primary, textShadow: hasBanner ? "0 2px 12px rgba(0,0,0,0.35)" : "none" }}
            >
              {hero.heading || branding.welcome_message || `Welcome to ${name}`}
            </h1>

            <p
              className="max-w-xl mx-auto text-base md:text-lg leading-relaxed mb-9"
              style={{ color: hasBanner ? "rgba(255,255,255,0.88)" : "#4b5563" }}
            >
              {hero.description ||
                `A tradition of excellence in education since ${established_year ?? "our founding"}. Committed to shaping future leaders with knowledge, integrity, and character.`}
            </p>

            {/* CTA buttons — no emoji ornaments */}
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="#admissions"
                className="px-10 py-3 font-semibold text-sm tracking-widest uppercase shadow-md hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                style={{ backgroundColor: hasBanner ? "white" : primary, color: hasBanner ? primary : "white" }}
              >
                Admissions
              </a>
              <a
                href="#about"
                className="px-10 py-3 border-2 font-semibold text-sm tracking-widest uppercase hover:-translate-y-0.5 transition-all duration-200"
                style={{
                  borderColor: hasBanner ? "rgba(255,255,255,0.8)" : primary,
                  color: hasBanner ? "white" : primary,
                  backgroundColor: hasBanner ? "rgba(255,255,255,0.1)" : "transparent",
                }}
              >
                About Us
              </a>
            </div>
          </div>
        );

        if (hasBanner) {
          return (
            <HeroSlider
              banners={banners}
              overlayStyle={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 100%)" }}
              className="min-h-[85vh]"
            >
              {heroContent}
            </HeroSlider>
          );
        }

        return (
          <div
            className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b"
            style={{
              background: `linear-gradient(180deg, ${primary}15 0%, ${primary}07 60%, white 100%)`,
              fontFamily: "Georgia, serif",
            }}
          >
            {heroContent}
          </div>
        );
      })()}

      {/* ── Affiliation bar ── */}
      <div
        className="py-2.5 px-6 text-center"
        style={{ backgroundColor: primary, fontFamily: "Georgia, serif" }}
      >
        <p className="text-xs tracking-widest uppercase text-white/90 font-medium">
          Affiliated to CBSE Board, New Delhi&nbsp;&nbsp;|&nbsp;&nbsp;Estd.&nbsp;
          {established_year ?? "—"}&nbsp;&nbsp;|&nbsp;&nbsp;
          {city}, {state}
        </p>
      </div>

      {/* ── Stats Bar ── */}
      <section className="bg-white border-b border-gray-200" style={{ fontFamily: "Georgia, serif" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { num: "1000+", label: "Students on Roll" },
            { num: "50+", label: "Teaching Staff" },
            { num: `${established_year ? new Date().getFullYear() - established_year : "25"}+`, label: "Years of Excellence" },
            { num: "100%", label: "Board Pass %" },
          ].map(({ num, label }, i) => (
            <div
              key={label}
              className="py-8 px-6 text-center"
              style={{
                borderLeft: i > 0 ? "1px solid #e5e7eb" : undefined,
                borderBottom: `3px solid ${primary}`,
              }}
            >
              <p className="text-4xl font-bold mb-1" style={{ color: primary, fontFamily: "Georgia, serif" }}>{num}</p>
              <div className="w-6 h-px mx-auto my-2" style={{ backgroundColor: `${primary}60` }} />
              <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── About ── */}
      {about.show && (
        <section
          id="about"
          className="py-20 px-6 bg-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <div className="max-w-6xl mx-auto">
            <SectionHeader heading={about.heading || "About Our Institution"} subtext="Heritage · Excellence · Character" primary={primary} />

            <div className="grid md:grid-cols-2 gap-14">

              {/* Left: History text + Vision & Mission */}
              <div>
                <p className="text-gray-700 leading-relaxed mb-5 text-base">
                  {about.description ||
                    `${name} has been a beacon of quality education for decades, nurturing young minds with a blend of academic rigour and strong moral values. Our institution has consistently produced leaders across every field — from science and commerce to arts and public service.`}
                </p>
                <p className="text-gray-600 leading-relaxed mb-8 text-sm">
                  Rooted in the best traditions of Indian education, we believe that every student deserves a safe, stimulating environment where curiosity is rewarded and character is built alongside academics.
                </p>

                {/* Vision & Mission */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className="p-5 border"
                    style={{ borderColor: `${primary}40`, borderTop: `3px solid ${primary}` }}
                  >
                    <h4 className="text-xs tracking-widest uppercase font-bold mb-2" style={{ color: primary }}>Our Vision</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      To be a centre of excellence that prepares students to contribute meaningfully to society and the nation.
                    </p>
                  </div>
                  <div
                    className="p-5 border"
                    style={{ borderColor: `${primary}40`, borderTop: `3px solid ${primary}` }}
                  >
                    <h4 className="text-xs tracking-widest uppercase font-bold mb-2" style={{ color: primary }}>Our Mission</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      To impart education that is holistic, value-based, and empowers every student to achieve their highest potential.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Principal's Message */}
              <div>
                <div
                  className="relative p-8 border-l-4"
                  style={{
                    backgroundColor: `${primary}07`,
                    borderLeftColor: primary,
                    borderTop: `1px solid ${primary}20`,
                    borderRight: `1px solid ${primary}20`,
                    borderBottom: `1px solid ${primary}20`,
                  }}
                >
                  {/* Decorative large open-quote */}
                  <span
                    className="absolute -top-5 left-6 text-8xl font-serif leading-none select-none pointer-events-none"
                    style={{ color: `${primary}30`, fontFamily: "Georgia, serif" }}
                    aria-hidden="true"
                  >
                    &ldquo;
                  </span>

                  <p className="text-xs tracking-[0.25em] uppercase font-bold mb-6" style={{ color: primary }}>
                    Principal&apos;s Message
                  </p>

                  <p className="italic text-gray-700 leading-loose text-sm mb-6" style={{ fontFamily: "Georgia, serif" }}>
                    Education is not the filling of a pail, but the lighting of a fire. At {name}, we strive to kindle that flame of curiosity and discipline in every student, equipping them for a life of purpose and service.
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-px" style={{ backgroundColor: primary }} />
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>
                      Principal, {name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info row */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-px border border-gray-200">
              {[
                { label: "Affiliated Board", value: data.school_type.toUpperCase() },
                { label: "Established", value: String(established_year ?? "—") },
                { label: "Location", value: `${city}, ${state}` },
                { label: "Contact", value: phone || email || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white py-5 px-6 text-center hover:bg-gray-50 transition-colors duration-150">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">{label}</p>
                  <p className="text-sm font-bold truncate" style={{ color: primary, fontFamily: "Georgia, serif" }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Academics ── */}
      {academics.show && (
        <section
          id="academics"
          className="py-20 px-6"
          style={{ background: `linear-gradient(180deg, #f8f7f4 0%, #f1efe9 100%)`, fontFamily: "Georgia, serif" }}
        >
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              heading={academics.heading || "Academic Programmes"}
              subtext="Nursery to Class XII"
              primary={primary}
            />
            {academics.description && (
              <p className="text-center text-gray-600 max-w-2xl mx-auto -mt-6 mb-12 text-sm leading-relaxed">
                {academics.description}
              </p>
            )}

            {/* 5-level programme cards */}
            <div className="grid md:grid-cols-5 gap-5">
              {[
                {
                  roman: "I",
                  title: "Pre-Primary",
                  grades: "Nursery – KG",
                  body: "Play-based early learning that fosters curiosity, language, and social skills through a structured yet nurturing environment.",
                },
                {
                  roman: "II",
                  title: "Primary",
                  grades: "Class I – V",
                  body: "Strong foundational skills in literacy, numeracy, sciences, and arts following the NCERT framework with activity-based methods.",
                },
                {
                  roman: "III",
                  title: "Middle School",
                  grades: "Class VI – VIII",
                  body: "Concept-driven learning across all subjects with emphasis on critical thinking, project work, and co-curricular activities.",
                },
                {
                  roman: "IV",
                  title: "Secondary",
                  grades: "Class IX – X",
                  body: "CBSE board preparation with comprehensive coaching, regular assessments, and personalised guidance for every student.",
                },
                {
                  roman: "V",
                  title: "Sr. Secondary",
                  grades: "Class XI – XII",
                  body: "Streams in Science, Commerce, and Humanities with career counselling, competitive exam support, and college guidance.",
                },
              ].map(({ roman, title, grades, body }) => (
                <div
                  key={title}
                  className="bg-white border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                  style={{ borderTop: `4px solid ${primary}` }}
                >
                  {/* Roman numeral */}
                  <div
                    className="text-3xl font-bold mb-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300 select-none"
                    style={{ color: primary, fontFamily: "Georgia, serif" }}
                  >
                    {roman}
                  </div>
                  <h3 className="font-bold text-base mb-0.5" style={{ color: primary }}>
                    {title}
                  </h3>
                  <p className="text-xs font-medium mb-3 tracking-wide" style={{ color: `${primary}80` }}>
                    {grades}
                  </p>
                  <div className="w-6 h-px mb-3" style={{ backgroundColor: `${primary}40` }} />
                  <p className="text-gray-600 text-xs leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery ── */}
      {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
        <section id="gallery" className="py-20 px-6 bg-white" style={{ fontFamily: "Georgia, serif" }}>
          <div className="max-w-6xl mx-auto">
            <SectionHeader heading={gallery.heading || "Photo Gallery"} subtext="Life at School" primary={primary} />

            {/* CSS-only category filter tabs */}
            <div className="flex flex-wrap gap-3 justify-center mb-10">
              {["All", "Events", "Sports", "Academics"].map((cat) => (
                <label
                  key={cat}
                  className="cursor-pointer px-5 py-2 text-xs font-semibold uppercase tracking-widest border transition-all duration-200 hover:border-opacity-80"
                  style={{
                    borderColor: `${primary}50`,
                    color: cat === "All" ? "white" : primary,
                    backgroundColor: cat === "All" ? primary : "transparent",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {cat}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.gallery_items.map((img) => (
                <div
                  key={img.id}
                  className="overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 bg-white group"
                >
                  <div className="aspect-video relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt={img.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)" }}>
                      <p className="text-white text-xs font-semibold" style={{ fontFamily: "Georgia, serif" }}>
                        {img.title}
                      </p>
                    </div>
                  </div>
                  <div className="h-0.5 w-full" style={{ backgroundColor: `${primary}25` }} />
                  <p className="text-xs text-gray-500 px-3 py-2 truncate font-medium tracking-wide">
                    {img.title}
                  </p>
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
          className="py-20 px-6"
          style={{ background: `linear-gradient(180deg, ${primary}0c 0%, ${primary}1a 100%)`, fontFamily: "Georgia, serif" }}
        >
          <div className="max-w-2xl mx-auto">
            {/* Official notice box — double border */}
            <div className="border-2 p-2 shadow-md" style={{ borderColor: primary }}>
              <div className="border p-10" style={{ borderColor: `${primary}35` }}>

                {/* Header line */}
                <div className="text-center mb-8">
                  <p
                    className="text-xs tracking-[0.4em] uppercase font-bold mb-2"
                    style={{ color: `${primary}80` }}
                  >
                    Official Notice
                  </p>
                  <h2
                    className="text-2xl font-bold tracking-widest uppercase mb-1"
                    style={{ color: primary, fontFamily: "Georgia, serif", fontVariant: "small-caps" }}
                  >
                    {admissions.heading || "Admission Notice"}
                  </h2>
                  <p className="text-sm font-semibold tracking-wide" style={{ color: primary }}>
                    Academic Session 2025–26
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <div className="w-12 h-px" style={{ backgroundColor: `${primary}50` }} />
                    <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: primary }} />
                    <div className="w-12 h-px" style={{ backgroundColor: `${primary}50` }} />
                  </div>
                </div>

                {/* Body text */}
                <p className="text-gray-700 text-sm leading-relaxed mb-8 text-center">
                  {admissions.description ||
                    `Applications are invited for admission to ${name} for the academic session 2025–26. Admissions are open for all classes subject to seat availability.`}
                </p>

                {/* Numbered steps */}
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
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: primary }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{step}</p>
                    </li>
                  ))}
                </ol>

                {/* CTA */}
                <div className="text-center">
                  <a
                    href="/login"
                    className="inline-block px-12 py-3 text-white text-sm font-semibold uppercase tracking-widest shadow hover:shadow-lg hover:-translate-y-0.5 hover:opacity-90 transition-all duration-200"
                    style={{ backgroundColor: primary }}
                  >
                    Apply Now
                  </a>
                </div>

              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Contact ── */}
      {contact.show && (
        <section
          id="contact"
          className="py-20 px-6 bg-gray-50"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <div className="max-w-6xl mx-auto">
            <SectionHeader heading={contact.heading || "Contact Us"} subtext="We are here to help" primary={primary} />

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {/* Address */}
              <div
                className="bg-white border border-gray-200 p-7 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                style={{ borderTop: `4px solid ${primary}` }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center mx-auto mb-4"
                  style={{ color: primary, backgroundColor: `${primary}0f` }}
                >
                  <IconAddress />
                </div>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Address</p>
                <p className="text-sm font-semibold leading-relaxed" style={{ color: primary }}>
                  {address || `${city}, ${state}`}
                </p>
              </div>

              {/* Phone */}
              <div
                className="bg-white border border-gray-200 p-7 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                style={{ borderTop: `4px solid ${primary}` }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center mx-auto mb-4"
                  style={{ color: primary, backgroundColor: `${primary}0f` }}
                >
                  <IconPhone />
                </div>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Phone</p>
                <p className="text-sm font-semibold leading-relaxed" style={{ color: primary }}>
                  {phone || "—"}
                </p>
                {branding.support_phone && (
                  <p className="text-xs text-gray-400 mt-1">Support: {branding.support_phone}</p>
                )}
              </div>

              {/* Email */}
              <div
                className="bg-white border border-gray-200 p-7 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                style={{ borderTop: `4px solid ${primary}` }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center mx-auto mb-4"
                  style={{ color: primary, backgroundColor: `${primary}0f` }}
                >
                  <IconEmail />
                </div>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Email</p>
                <p className="text-sm font-semibold leading-relaxed" style={{ color: primary }}>
                  {email || "—"}
                </p>
                {branding.support_email && (
                  <p className="text-xs text-gray-400 mt-1">Support: {branding.support_email}</p>
                )}
              </div>
            </div>

            {/* Google Map */}
            <div className="w-full overflow-hidden mt-8" style={{ border: `1px solid ${primary}25` }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3572.8608563176817!2d82.52597947222179!3d26.427966480760162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3990928e2ecacf07%3A0x45812ae7e2c0ee77!2sDOYEN%20INTERNATIONAL%20SCHOOL!5e0!3m2!1sen!2sin!4v1792572714179!5m2!1sen!2sin"
                width="100%"
                height="300"
                style={{ border: 0, display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Doyen International School Location"
              />
            </div>
          </div>
        </section>
      )}

    </WebsiteShell>
  );
}
