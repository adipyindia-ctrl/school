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

        {/* ── Hero ── */}
        {hero.show && (() => {
          const banners = data.hero_banners && data.hero_banners.length > 0
            ? data.hero_banners
            : data.hero_banner_url
              ? [{ id: "single", image_url: data.hero_banner_url, title: null, subtitle: null }]
              : [];
          const hasBanner = banners.length > 0;

          const heroContent = (
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-20 min-h-[95vh] text-center max-w-5xl mx-auto">
              {/* Top rule */}
              <div className="w-16 h-px mx-auto mb-6" style={{ backgroundColor: accent }} />

              {/* Establishment ribbon */}
              <p
                style={{ color: accent, letterSpacing: "0.35em" }}
                className="text-xs font-semibold uppercase mb-3 font-serif"
              >
                Est.&nbsp;{established_year ?? "—"}&nbsp;·&nbsp;{data.school_type.toUpperCase()}&nbsp;·&nbsp;{city},&nbsp;{state}
              </p>

              {/* School name */}
              <h1 className="text-6xl md:text-8xl font-black leading-none mb-5 tracking-tight text-white drop-shadow-2xl">
                {hero.heading || branding.welcome_message || name}
              </h1>

              {/* Affiliation line */}
              <p className="text-white/40 text-xs uppercase tracking-[0.25em] mb-6 font-light">
                Affiliated to CBSE Board, New Delhi
              </p>

              <div className="w-16 h-px mx-auto mb-6" style={{ backgroundColor: `${accent}50` }} />

              <p className="text-white/55 text-lg max-w-xl mx-auto mb-10 leading-relaxed font-light">
                {hero.description || "Where ambition meets excellence — a premium educational experience crafted for tomorrow's leaders."}
              </p>

              <div className="flex gap-4 justify-center flex-wrap">
                <a
                  href="#admissions"
                  style={{ backgroundColor: accent, color: "#000" }}
                  className="px-10 py-3.5 font-bold tracking-wide text-sm hover:opacity-90 transition-opacity duration-200 shadow-xl"
                >
                  Apply Now
                </a>
                <a
                  href="#about"
                  className="px-10 py-3.5 font-bold text-sm border border-white/25 hover:border-white/60 transition-colors duration-200 tracking-wide"
                >
                  Discover More
                </a>
              </div>

              {/* Static scroll indicator — no animate-bounce */}
              <div className="mt-10 flex flex-col items-center gap-1">
                <span className="text-white/30 text-xs tracking-[0.3em] uppercase">Scroll</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white/25"
                >
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </div>
            </div>
          );

          if (hasBanner) {
            return (
              <HeroSlider
                banners={banners}
                overlayStyle={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.70) 100%)" }}
                className="min-h-[95vh]"
              >
                {heroContent}
              </HeroSlider>
            );
          }

          return (
            <section className="relative min-h-[95vh] flex flex-col overflow-hidden">
              <div
                className="absolute inset-0 z-[1]"
                style={{
                  background: `radial-gradient(ellipse at 30% 40%, ${primary}55 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, ${accent}25 0%, transparent 50%), black`,
                }}
              />
              <div
                className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl z-[1]"
                style={{ backgroundColor: primary }}
              />
              <div
                className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl z-[1]"
                style={{ backgroundColor: accent }}
              />
              <div
                className="absolute inset-0 opacity-5 z-[1]"
                style={{
                  backgroundImage: `linear-gradient(${primary}40 1px, transparent 1px), linear-gradient(90deg, ${primary}40 1px, transparent 1px)`,
                  backgroundSize: "60px 60px",
                }}
              />
              {heroContent}
            </section>
          );
        })()}

        {/* ── Stats ── */}
        {stats.show && (
          <section style={{ backgroundColor: primary }} className="py-14 px-8">
            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/20">
              {[
                { num: "1200+", label: "Students" },
                { num: "80+", label: "Expert Faculty" },
                { num: `${established_year ? new Date().getFullYear() - established_year : 25}+`, label: "Years of Legacy" },
                { num: "100%", label: "Board Results" },
              ].map(({ num, label }) => (
                <div
                  key={label}
                  className="text-center py-8 px-8 hover:bg-white/10 transition-colors duration-200"
                >
                  <p style={{ color: accent }} className="text-5xl font-black mb-2 tracking-tight">
                    {num}
                  </p>
                  <div className="w-8 h-px mx-auto mb-3" style={{ backgroundColor: `${accent}50` }} />
                  <p className="text-white/60 text-xs uppercase tracking-[0.2em] font-light">{label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── About ── */}
        {about.show && (
          <section id="about" className="bg-zinc-950">
            {/* Legacy & Excellence — full-width editorial block */}
            <div className="py-20 px-8 border-b border-zinc-800">
              <div className="max-w-6xl mx-auto">
                {/* Large typographic quote */}
                <p
                  className="text-5xl md:text-7xl font-thin leading-tight text-white/70 mb-16 max-w-4xl"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  &ldquo;Shaping Leaders Since{" "}
                  <span style={{ color: accent }} className="font-semibold">
                    {established_year ?? "Our Founding"}
                  </span>
                  &rdquo;
                </p>

                {/* Three pillars */}
                <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                  {[
                    {
                      label: "Founded",
                      value: established_year ? String(established_year) : "—",
                      desc: "Decades of unbroken academic tradition",
                    },
                    {
                      label: "Accreditation",
                      value: "CBSE",
                      desc: "Affiliated to CBSE, New Delhi",
                    },
                    {
                      label: "Alumni",
                      value: "1000+",
                      desc: "Distinguished graduates worldwide",
                    },
                  ].map(({ label, value, desc }) => (
                    <div key={label} className="py-10 px-10 group">
                      <p
                        style={{ color: accent, letterSpacing: "0.25em" }}
                        className="text-xs uppercase font-semibold mb-3"
                      >
                        {label}
                      </p>
                      <p className="text-4xl font-black text-white mb-2 tracking-tight">{value}</p>
                      <p className="text-white/40 text-sm font-light leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* About columns */}
            <div className="py-24 px-8">
              <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-start">
                {/* Left — about text with decorative quote mark */}
                <div className="pl-8 border-l-2" style={{ borderColor: accent }}>
                  <p
                    style={{ color: accent, letterSpacing: "0.3em" }}
                    className="text-xs uppercase font-semibold mb-4"
                  >
                    About Us
                  </p>
                  <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                    {about.heading || "A Legacy of Excellence"}
                  </h2>
                  <div className="relative">
                    <span
                      className="absolute -top-4 -left-2 text-8xl font-black opacity-10 leading-none select-none pointer-events-none"
                      style={{ color: accent }}
                    >
                      &ldquo;
                    </span>
                    <p className="text-white/55 leading-relaxed relative z-10 pl-4 text-base">
                      {about.description ||
                        `${name} has been at the forefront of education since ${established_year ?? "its founding"}, consistently producing graduates who excel in every field. Our philosophy centres on academic rigour, ethical leadership, and global citizenship.`}
                    </p>
                  </div>
                </div>

                {/* Right — Facilities editorial list */}
                <div>
                  <p
                    style={{ color: accent, letterSpacing: "0.3em" }}
                    className="text-xs uppercase font-semibold mb-6"
                  >
                    Our Facilities
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: "Library", desc: "Curated collection spanning all disciplines" },
                      { name: "Science Labs", desc: "Fully equipped for hands-on experimentation" },
                      { name: "Sports Complex", desc: "Multi-sport grounds and indoor courts" },
                      { name: "Auditorium", desc: "Performing arts and cultural events" },
                      { name: "Hostel", desc: "Secure residential boarding facility" },
                      { name: "Computer Center", desc: "Modern computing infrastructure" },
                    ].map(({ name: fname, desc }) => (
                      <div
                        key={fname}
                        className="bg-zinc-900 border border-zinc-800 p-5 hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <p
                          style={{ color: accent }}
                          className="text-xs uppercase tracking-wider font-semibold mb-1"
                        >
                          {fname}
                        </p>
                        <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Academics ── */}
        {academics.show && (
          <section id="academics" className="py-28 px-8 bg-zinc-900">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <p
                  style={{ color: accent, letterSpacing: "0.3em" }}
                  className="text-xs uppercase font-semibold mb-4"
                >
                  Academics
                </p>
                <h2 className="text-5xl font-black mb-6 leading-tight">
                  {academics.heading || "Academic Programmes"}
                </h2>
                <p className="text-white/50 max-w-2xl mx-auto font-light">
                  {academics.description ||
                    "A world-class curriculum crafted to develop critical thinkers and future leaders."}
                </p>
              </div>

              <div className="grid md:grid-cols-5 gap-3">
                {[
                  { title: "Pre-Primary", range: "Nursery – KG", desc: "Play-based early childhood education nurturing curiosity and motor skills." },
                  { title: "Primary", range: "Classes I – V", desc: "Strong foundational learning across core subjects with experiential methods." },
                  { title: "Middle", range: "Classes VI – VIII", desc: "Inquiry-driven curriculum deepening conceptual understanding." },
                  { title: "Secondary", range: "Classes IX – X", desc: "Rigorous CBSE board preparation with structured mentorship." },
                  { title: "Senior Secondary", range: "Classes XI – XII", desc: "Specialised streams for competitive examinations and higher studies." },
                ].map(({ title, range, desc }, index) => (
                  <div
                    key={title}
                    className="bg-zinc-950 p-7 border-l-2 border border-zinc-800 hover:border-l-2 hover:border-zinc-600 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60 transition-all duration-300 group flex flex-col"
                    style={{ borderLeftColor: accent }}
                  >
                    <span
                      className="text-5xl font-black mb-4 block leading-none opacity-15"
                      style={{ color: accent }}
                    >
                      0{index + 1}
                    </span>
                    <p className="font-black text-white text-base mb-1 tracking-tight">{title}</p>
                    <p
                      style={{ color: accent }}
                      className="text-xs uppercase tracking-wider font-semibold mb-3"
                    >
                      {range}
                    </p>
                    <p className="text-white/50 text-xs leading-relaxed flex-1">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Gallery ── */}
        {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
          <section id="gallery" className="py-28 px-8 bg-zinc-950">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <p
                  style={{ color: accent, letterSpacing: "0.3em" }}
                  className="text-xs uppercase font-semibold mb-4"
                >
                  Gallery
                </p>
                <h2 className="text-5xl font-black leading-tight">
                  {gallery.heading || "Our World in Focus"}
                </h2>
              </div>

              {/* CSS-only category tabs using radio inputs */}
              <div className="mb-8">
                {/* Collect unique categories */}
                {(() => {
                  const allCategories = ["All", ...Array.from(
                    new Set(
                      (data.gallery_items ?? [])
                        .map((i) => i.category)
                        .filter((c): c is string => Boolean(c))
                    )
                  )];

                  return (
                    <div className="flex flex-wrap gap-2 justify-center mb-8">
                      {allCategories.map((cat, idx) => (
                        <label
                          key={cat}
                          className="cursor-pointer"
                          htmlFor={`gallery-tab-${idx}`}
                        >
                          <input
                            type="radio"
                            id={`gallery-tab-${idx}`}
                            name="gallery-category"
                            defaultChecked={idx === 0}
                            className="sr-only peer"
                            value={cat}
                          />
                          <span
                            className="inline-block px-5 py-2 text-xs uppercase tracking-wider font-semibold border border-zinc-700 peer-checked:border-transparent transition-all duration-200 cursor-pointer"
                            style={idx === 0 ? { backgroundColor: accent, color: "#000" } : {}}
                          >
                            {cat}
                          </span>
                        </label>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data.gallery_items.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-[4/3] overflow-hidden bg-zinc-900 group relative border border-zinc-800 hover:border-zinc-500 transition-all duration-300"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt={img.title}
                      className="w-full h-full object-cover object-center opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                      {img.category && (
                        <p
                          style={{ color: accent }}
                          className="text-xs uppercase tracking-widest mb-1 font-semibold"
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

        {/* ── Admissions ── */}
        {admissions.show && (
          <section id="admissions" className="py-28 px-8 bg-zinc-900">
            <div className="w-full h-px mb-20" style={{ backgroundColor: `${accent}30` }} />
            <div className="max-w-3xl mx-auto">
              <div className="border border-zinc-700 p-10">
                <div className="border border-zinc-800 p-8">
                  <div className="w-16 h-px mb-8" style={{ backgroundColor: accent }} />
                  <p
                    style={{ color: accent, letterSpacing: "0.3em" }}
                    className="text-xs uppercase font-semibold mb-3"
                  >
                    Join Us
                  </p>
                  <h2 className="text-4xl md:text-5xl font-black mb-3 leading-tight" style={{ color: accent }}>
                    Admissions 2025–26
                  </h2>
                  <p className="text-white/50 mb-10 leading-relaxed font-light text-sm">
                    {admissions.description ||
                      `${name} welcomes applications for the upcoming academic year. Secure your place in one of India's premier institutions.`}
                  </p>

                  {/* Admission process steps */}
                  <div className="space-y-6 mb-10">
                    {[
                      { step: "01", title: "Application", desc: "Fill out the online application form with all required details." },
                      { step: "02", title: "Document Verification", desc: "Submit and verify academic records, birth certificate, and identity proof." },
                      { step: "03", title: "Interview", desc: "Attend a personal interaction session with our academic panel." },
                      { step: "04", title: "Admission", desc: "Receive your offer letter and complete the fee payment process." },
                    ].map(({ step, title, desc }) => (
                      <div key={step} className="flex items-start gap-5">
                        {/* Gold number circle */}
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-black"
                          style={{ backgroundColor: accent }}
                        >
                          {step}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm mb-0.5">{title}</p>
                          <p className="text-white/45 text-xs leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <a
                    href="/login"
                    style={{ backgroundColor: accent, color: "#000" }}
                    className="inline-block px-12 py-4 font-black text-sm tracking-wide hover:opacity-90 transition-opacity duration-200 shadow-xl"
                  >
                    Apply Now
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Contact ── */}
        {contact.show && (
          <section id="contact" className="py-28 px-8 bg-zinc-950">
            <div className="w-full h-px mb-20" style={{ backgroundColor: `${accent}15` }} />
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <p
                  style={{ color: accent, letterSpacing: "0.3em" }}
                  className="text-xs uppercase font-semibold mb-4"
                >
                  Get In Touch
                </p>
                <h2 className="text-5xl font-black mb-4">
                  {contact.heading || "Contact Us"}
                </h2>
                <p className="text-white/50 max-w-xl mx-auto font-light">
                  {contact.description || "We would love to hear from you. Reach out for any enquiries or admissions guidance."}
                </p>
              </div>

              {/* Split layout: 2/3 cards + 1/3 map */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Left 2/3 — 3 contact cards */}
                <div className="md:col-span-2 grid md:grid-cols-3 gap-3">
                  {/* Address card */}
                  <div className="bg-zinc-900 p-8 border border-zinc-800 hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200">
                    <div className="mb-4">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: accent }}
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <p
                      style={{ color: accent }}
                      className="text-xs uppercase tracking-[0.2em] font-semibold mb-2"
                    >
                      Address
                    </p>
                    <div className="w-6 h-px mb-3" style={{ backgroundColor: `${accent}40` }} />
                    <p className="text-white/70 text-sm leading-relaxed font-light">
                      {address || `${city}, ${state}`}
                    </p>
                  </div>

                  {/* Phone card */}
                  <div className="bg-zinc-900 p-8 border border-zinc-800 hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200">
                    <div className="mb-4">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: accent }}
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.4 2 2 0 0 1 3.57 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.62-1.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <p
                      style={{ color: accent }}
                      className="text-xs uppercase tracking-[0.2em] font-semibold mb-2"
                    >
                      Phone
                    </p>
                    <div className="w-6 h-px mb-3" style={{ backgroundColor: `${accent}40` }} />
                    <p className="text-white/70 text-sm font-light">{phone || "—"}</p>
                    {branding.support_phone && (
                      <p className="text-white/35 text-xs mt-2">Support: {branding.support_phone}</p>
                    )}
                  </div>

                  {/* Email card */}
                  <div className="bg-zinc-900 p-8 border border-zinc-800 hover:border-zinc-600 hover:-translate-y-0.5 transition-all duration-200">
                    <div className="mb-4">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: accent }}
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <p
                      style={{ color: accent }}
                      className="text-xs uppercase tracking-[0.2em] font-semibold mb-2"
                    >
                      Email
                    </p>
                    <div className="w-6 h-px mb-3" style={{ backgroundColor: `${accent}40` }} />
                    <p className="text-white/70 text-sm font-light break-all">{email || "—"}</p>
                    {branding.support_email && (
                      <p className="text-white/35 text-xs mt-2">Support: {branding.support_email}</p>
                    )}
                  </div>
                </div>

                {/* Right 1/3 — Map placeholder */}
                <div
                  className="bg-zinc-800 border-2 border-dashed flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:bg-zinc-700 transition-colors duration-200"
                  style={{ borderColor: `${accent}50` }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: accent }}
                    className="mb-3"
                  >
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                  </svg>
                  <span
                    style={{ color: accent }}
                    className="text-xs uppercase tracking-[0.25em] font-semibold"
                  >
                    View Location
                  </span>
                  <span className="text-white/30 text-xs mt-1">{city}, {state}</span>
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </WebsiteShell>
  );
}
