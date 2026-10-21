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

export function MinimalLayout({ data }: { data: SchoolWebsiteData }) {
  const { branding, name, phone, email, address, city, state, established_year } = data;
  const primary = branding.primary_color;

  const hero = getSection(data, "hero");
  const about = getSection(data, "about");
  const academics = getSection(data, "academics");
  const gallery = getSection(data, "gallery");
  const admissions = getSection(data, "admissions");
  const contact = getSection(data, "contact");

  // Collect unique gallery categories for filter tabs
  const galleryCategories: string[] = [];
  if (data.gallery_items) {
    data.gallery_items.forEach((item) => {
      if (item.category && !galleryCategories.includes(item.category)) {
        galleryCategories.push(item.category);
      }
    });
  }
  const hasGalleryCategories = galleryCategories.length > 1;

  return (
    <WebsiteShell data={data}>
      <div className="bg-white text-gray-900">

        {/* ── Hero ── */}
        {hero.show && (() => {
          const banners = data.hero_banners && data.hero_banners.length > 0
            ? data.hero_banners
            : data.hero_banner_url
              ? [{ id: "single", image_url: data.hero_banner_url, title: null, subtitle: null }]
              : [];
          const hasBanner = banners.length > 0;

          const heroContent = (
            <div className={`max-w-6xl mx-auto px-8 w-full relative z-10 flex items-center ${hasBanner ? "min-h-[88vh]" : "min-h-[88vh]"}`}>
              <div className="max-w-2xl py-20">
                {/* Tag line */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-px" style={{ backgroundColor: hasBanner ? "rgba(255,255,255,0.55)" : primary }} />
                  <p
                    className="text-xs tracking-[0.22em] uppercase font-medium"
                    style={{ color: hasBanner ? "rgba(255,255,255,0.65)" : "#9ca3af" }}
                  >
                    {data.school_type.toUpperCase()} · Est. {established_year ?? "—"}
                  </p>
                </div>

                {/* School name / heading */}
                <h1
                  className="text-6xl md:text-7xl font-light leading-[1.05] mb-4"
                  style={{ color: hasBanner ? "#ffffff" : primary }}
                >
                  {hero.heading || branding.welcome_message || name}
                </h1>

                {/* Affiliation line */}
                <p
                  className="text-sm tracking-wide mb-5"
                  style={{ color: hasBanner ? "rgba(255,255,255,0.60)" : "#9ca3af" }}
                >
                  {data.school_type.toUpperCase()} Affiliated &nbsp;|&nbsp; {city}, {state}
                </p>

                {/* Subtle horizontal rule */}
                <div className="w-20 h-px mb-8" style={{ backgroundColor: hasBanner ? "rgba(255,255,255,0.30)" : "#e5e7eb" }} />

                {/* Description */}
                <p
                  className="text-xl leading-relaxed mb-10 max-w-lg"
                  style={{ color: hasBanner ? "rgba(255,255,255,0.80)" : "#6b7280" }}
                >
                  {hero.description || "A place where curiosity is encouraged, potential is realised, and every student matters."}
                </p>

                {/* CTAs */}
                <div className="flex items-center gap-6 flex-wrap">
                  <a
                    href="#admissions"
                    style={{ backgroundColor: hasBanner ? "white" : primary, color: hasBanner ? primary : "white" } as React.CSSProperties}
                    className="px-9 py-3 font-medium text-sm tracking-wide hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                  >
                    Apply Now →
                  </a>
                  <a
                    href="#about"
                    className="text-sm font-medium pb-0.5 border-b-2 hover:opacity-60 transition-opacity duration-200 group"
                    style={{ borderColor: hasBanner ? "rgba(255,255,255,0.55)" : primary, color: hasBanner ? "rgba(255,255,255,0.90)" : primary } as React.CSSProperties}
                  >
                    Learn More <span className="group-hover:translate-x-1 inline-block transition-transform duration-200">→</span>
                  </a>
                </div>
              </div>

              {/* Watermark initial — right side, only when no banner */}
              {!hasBanner && (
                <div className="absolute right-0 top-0 bottom-0 flex items-center pr-8 pointer-events-none select-none" aria-hidden="true">
                  <span className="text-[18rem] font-black opacity-[0.03] leading-none" style={{ color: primary }}>
                    {name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          );

          if (hasBanner) {
            return (
              <HeroSlider
                banners={banners}
                overlayStyle={{ background: "rgba(0,0,0,0.50)" }}
                className="min-h-[88vh]"
              >
                {heroContent}
              </HeroSlider>
            );
          }

          return (
            <section className="relative min-h-[88vh] flex items-center overflow-hidden border-b border-gray-100">
              {heroContent}
            </section>
          );
        })()}

        {/* ── Stats Row ── */}
        <section className="border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-8 py-8 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {[
              { num: "1200+", label: "Students" },
              { num: "80+", label: "Faculty" },
              { num: `${established_year ? new Date().getFullYear() - established_year : 25}+`, label: "Years" },
              { num: "98%", label: "Pass Rate" },
            ].map(({ num, label }) => (
              <div key={label} className="text-center px-6 py-2">
                <p className="text-3xl font-light mb-1" style={{ color: primary }}>{num}</p>
                <p className="text-xs text-gray-400 uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── About ── */}
        {about.show && (
          <section id="about" className="py-24 border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-8">
              <div className="grid md:grid-cols-2 gap-20 items-start">

                {/* Left column */}
                <div>
                  <p className="text-xs text-gray-400 tracking-[0.2em] uppercase mb-4">About Us</p>
                  <h2
                    className="text-4xl font-light mb-6 leading-snug pl-4 border-l-4"
                    style={{ color: primary, borderColor: primary }}
                  >
                    {about.heading || "About Our School"}
                  </h2>
                  <p className="text-gray-500 text-base leading-relaxed mb-10">
                    {about.description ||
                      `${name} offers an outstanding educational environment with dedicated teachers, modern facilities, and a curriculum designed to inspire lifelong learning. Located in ${city}, ${state}, we serve hundreds of students across all grades.`}
                  </p>

                  {/* Mission statement — large italic typographic blockquote */}
                  <blockquote className="mb-10">
                    <p
                      className="text-2xl font-light italic leading-snug"
                      style={{ color: primary }}
                    >
                      &ldquo;Inspiring curiosity. Building character. Preparing tomorrow&rsquo;s citizens.&rdquo;
                    </p>
                    <div className="mt-4 w-10 h-px" style={{ backgroundColor: primary }} />
                  </blockquote>

                  {/* Why Choose Us — dash-accented list */}
                  <div>
                    <p className="text-xs text-gray-400 tracking-[0.2em] uppercase mb-5">Why Choose Us</p>
                    <ul className="space-y-4">
                      {[
                        { label: "Inquiry-Based Learning", desc: "Students learn through exploration, questioning, and hands-on discovery." },
                        { label: "Inclusive Environment", desc: "A diverse, welcoming community where every learner thrives." },
                        { label: "Technology Integration", desc: "Digital tools and smart classrooms woven into daily curriculum." },
                        { label: "Proven Track Record", desc: "Consistent board results and co-curricular achievements year after year." },
                      ].map(({ label, desc }) => (
                        <li key={label} className="flex gap-4">
                          <span className="mt-1.5 w-4 h-px flex-shrink-0" style={{ backgroundColor: primary, display: "inline-block" as React.CSSProperties["display"] }} />
                          <div>
                            <span className="text-sm font-semibold text-gray-800">{label}</span>
                            <span className="text-sm text-gray-400"> — {desc}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right column — 4 info cards */}
                <div className="grid grid-cols-2 gap-3 pt-10">
                  {([
                    ["Board", data.school_type.toUpperCase()],
                    ["City", city],
                    ["Phone", phone || "—"],
                    ["Email", email ? email.split("@")[0] + "@..." : "—"],
                  ] as [string, string][]).map(([l, v]) => (
                    <div
                      key={l}
                      className="p-5 bg-gray-50 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">{l}</p>
                      <p className="text-sm font-medium truncate" style={{ color: primary }}>{v}</p>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </section>
        )}

        {/* ── Academics ── */}
        {academics.show && (
          <section id="academics" className="py-24 bg-gray-50 border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-8">
              <p className="text-xs text-gray-400 tracking-[0.2em] uppercase mb-4">Academics</p>
              <div className="flex items-end justify-between gap-8 mb-14 flex-wrap">
                <h2
                  className="text-4xl font-light pl-4 border-l-4"
                  style={{ color: primary, borderColor: primary }}
                >
                  {academics.heading || "Academic Programs"}
                </h2>
                <p className="text-gray-500 text-sm max-w-md leading-relaxed">
                  {academics.description || "A comprehensive curriculum designed to nurture intellectual curiosity and build a strong foundation."}
                </p>
              </div>
              <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-5">
                {[
                  { num: "01", title: "Pre-Primary", range: "Nursery – KG", desc: "Play-based learning that nurtures creativity and early development." },
                  { num: "02", title: "Primary", range: "Class I – V", desc: "Building foundational skills in literacy, numeracy, and science." },
                  { num: "03", title: "Middle", range: "Class VI – VIII", desc: "Expanding knowledge with analytical thinking and project-based work." },
                  { num: "04", title: "Secondary", range: "Class IX – X", desc: "Board-focused curriculum with depth, rigour, and individual support." },
                  { num: "05", title: "Sr. Secondary", range: "Class XI – XII", desc: "Streams in Science, Commerce, and Humanities for higher education readiness." },
                ].map(({ num, title, range, desc }) => (
                  <div
                    key={title}
                    className="bg-white p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <p
                      className="text-5xl font-light mb-4 opacity-10 group-hover:opacity-30 transition-opacity"
                      style={{ color: primary }}
                    >
                      {num}
                    </p>
                    <div className="w-6 h-px mb-4" style={{ backgroundColor: primary }} />
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{title}</h3>
                    <p className="text-xs text-gray-400 mb-3 tracking-wide">{range}</p>
                    <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Gallery ── */}
        {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
          <section id="gallery" className="py-24 border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-8">
              <p className="text-xs text-gray-400 tracking-[0.2em] uppercase mb-4">Gallery</p>
              <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
                <h2
                  className="text-4xl font-light pl-4 border-l-4"
                  style={{ color: primary, borderColor: primary }}
                >
                  {gallery.heading || "Our School"}
                </h2>

                {/* Category filter tabs — CSS-only radio technique */}
                {hasGalleryCategories && (
                  <div className="flex items-center gap-6 flex-wrap">
                    <style>{`
                      .gal-filter { display: none; }
                      .gal-tab { font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; color: #9ca3af; padding-bottom: 4px; border-bottom: 2px solid transparent; transition: color 0.2s, border-color 0.2s; }
                      .gal-filter:checked + .gal-tab { color: ${primary}; border-color: ${primary}; }
                    `}</style>
                    {galleryCategories.map((cat, i) => (
                      <span key={cat} className="flex items-center">
                        <input
                          type="radio"
                          name="gallery-cat"
                          id={`gal-cat-${i}`}
                          className="gal-filter"
                          defaultChecked={i === 0}
                          value={cat}
                        />
                        <label htmlFor={`gal-cat-${i}`} className="gal-tab">{cat}</label>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.gallery_items.map((img) => (
                  <div
                    key={img.id}
                    className="relative group overflow-hidden bg-gray-100 aspect-square"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                      <p className="text-white text-xs font-medium">{img.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Admissions ── */}
        {admissions.show && (
          <section id="admissions" className="py-24 border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-8">
              <p className="text-xs text-gray-400 tracking-[0.2em] uppercase mb-4">Admissions</p>
              <h2
                className="text-4xl font-light mb-14 pl-4 border-l-4"
                style={{ color: primary, borderColor: primary }}
              >
                {admissions.heading || "Admission Process 2025–26"}
              </h2>

              {/* 4-step horizontal process */}
              <div className="relative mb-14">
                {/* Connecting line */}
                <div
                  className="hidden md:block absolute top-7 left-0 right-0 h-px"
                  style={{ backgroundColor: `${primary}20` }}
                />
                <div className="grid md:grid-cols-4 gap-8 relative">
                  {[
                    { step: "01", title: "Apply Online", desc: "Complete the application form on our admissions portal." },
                    { step: "02", title: "Submit Documents", desc: "Upload birth certificate, previous report cards, and ID proof." },
                    { step: "03", title: "Assessment", desc: "Attend a brief interaction and grade-level assessment session." },
                    { step: "04", title: "Confirmation", desc: "Receive your admission letter and complete fee payment." },
                  ].map(({ step, title, desc }, i) => (
                    <div key={step} className="flex flex-col items-start gap-4">
                      {/* Numbered circle */}
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-base font-semibold flex-shrink-0 relative z-10"
                        style={{ backgroundColor: primary }}
                      >
                        {step}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                      </div>
                      {/* Arrow between steps on mobile */}
                      {i < 3 && (
                        <span className="md:hidden text-gray-200 text-lg self-center">↓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-6 flex-wrap">
                <a
                  href="/login"
                  style={{ backgroundColor: primary }}
                  className="inline-block px-10 py-4 text-white font-medium text-sm tracking-wide hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  Apply Now →
                </a>
                <p className="text-xs text-gray-400">Rolling admissions &nbsp;·&nbsp; No application fee</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Contact ── */}
        {contact.show && (
          <section id="contact" className="py-24 bg-gray-50">
            <div className="max-w-6xl mx-auto px-8">
              <p className="text-xs text-gray-400 tracking-[0.2em] uppercase mb-4">Contact</p>
              <h2
                className="text-4xl font-light mb-4 pl-4 border-l-4"
                style={{ color: primary, borderColor: primary }}
              >
                {contact.heading || "Get In Touch"}
              </h2>

              {/* Inline summary */}
              <p className="text-gray-400 text-sm mb-10">
                {address || city} &nbsp;·&nbsp; {phone || "—"} &nbsp;·&nbsp; {email || "—"}
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Left 2 columns: contact cards */}
                <div className="bg-white p-6 border border-gray-100 hover:shadow-md transition-all duration-200">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Address</p>
                  <div className="w-5 h-px mb-4" style={{ backgroundColor: primary }} />
                  <p className="text-sm font-medium text-gray-700 leading-relaxed">{address || `${city}, ${state}`}</p>
                </div>

                <div className="bg-white p-6 border border-gray-100 hover:shadow-md transition-all duration-200">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Phone</p>
                  <div className="w-5 h-px mb-4" style={{ backgroundColor: primary }} />
                  <p className="text-sm font-medium mb-2" style={{ color: primary }}>{phone || "—"}</p>
                  {branding.support_phone && (
                    <p className="text-xs text-gray-400">Support: {branding.support_phone}</p>
                  )}
                </div>

                {/* Right column: map placeholder */}
                <div
                  className="relative flex flex-col"
                  style={{ gridColumn: "3 / 4", gridRow: "1 / 3" } as React.CSSProperties}
                >
                  {/* Email card stacked above map */}
                  <div className="bg-white p-6 border border-gray-100 hover:shadow-md transition-all duration-200 mb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Email</p>
                    <div className="w-5 h-px mb-4" style={{ backgroundColor: primary }} />
                    <p className="text-sm font-medium mb-2" style={{ color: primary }}>{email || "—"}</p>
                    {branding.support_email && (
                      <p className="text-xs text-gray-400">Support: {branding.support_email}</p>
                    )}
                  </div>

                  {/* Google Map */}
                  <div className="flex-1 min-h-[200px] overflow-hidden rounded-sm border border-gray-200">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3572.8608563176817!2d82.52597947222179!3d26.427966480760162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3990928e2ecacf07%3A0x45812ae7e2c0ee77!2sDOYEN%20INTERNATIONAL%20SCHOOL!5e0!3m2!1sen!2sin!4v1792572714179!5m2!1sen!2sin"
                      width="100%"
                      height="200"
                      style={{ border: 0, display: "block" }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      title="Doyen International School Location"
                    />
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

      </div>
    </WebsiteShell>
  );
}
