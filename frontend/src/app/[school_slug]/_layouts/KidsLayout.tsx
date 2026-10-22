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

export function KidsLayout({ data }: { data: SchoolWebsiteData }) {
  const { branding, name, phone, email, address, city, established_year } = data;

  const bg1 = branding.primary_color;
  const bg2 = branding.accent_color;
  const bg3 = branding.secondary_color;

  const hero = getSection(data, "hero");
  const activities = getSection(data, "activities");
  const academics = getSection(data, "academics");
  const about = getSection(data, "about");
  const gallery = getSection(data, "gallery");
  const admissions = getSection(data, "admissions");
  const contact = getSection(data, "contact");

  const activityCardColors = ["bg-pink-50", "bg-blue-50", "bg-green-50", "bg-yellow-50", "bg-purple-50", "bg-orange-50", "bg-red-50", "bg-teal-50"];
  const borderColors = [bg1, bg2, bg3, "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
  const galleryBorderColors = [bg1, bg2, bg3, "#10b981"];
  const contactCardColors = [
    { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700" },
    { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
    { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
    { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  ];

  return (
    <WebsiteShell data={data}>
      <div style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive" }} className="bg-yellow-50">

        {/* ── Hero ── */}
        {hero.show && (() => {
          const banners = data.hero_banners && data.hero_banners.length > 0
            ? data.hero_banners
            : data.hero_banner_url
              ? [{ id: "single", image_url: data.hero_banner_url, title: null, subtitle: null }]
              : [];
          const hasBanner = banners.length > 0;

          const heroContent = (
            <div className="max-w-3xl mx-auto relative z-10 py-12 px-4 sm:px-6 text-center w-full min-h-[60vh] md:min-h-[88vh] flex flex-col items-center justify-center">

              {/* School Name — large colorful heading */}
              <h1
                className="text-5xl md:text-6xl font-black mb-3 leading-tight drop-shadow-sm"
                style={{ color: hasBanner ? "#ffffff" : bg1 }}
              >
                {name}
              </h1>

              {/* Board affiliation badge */}
              <div className="mb-4">
                <span
                  className="inline-block px-5 py-1.5 rounded-full text-sm font-black uppercase tracking-widest shadow"
                  style={{
                    background: hasBanner ? "rgba(255,255,255,0.25)" : bg2,
                    color: "#ffffff",
                    border: hasBanner ? "2px solid rgba(255,255,255,0.5)" : "none",
                  }}
                >
                  {data.school_type ? data.school_type.toUpperCase() + " Affiliated" : "CBSE Affiliated"}
                </span>
              </div>

              {/* Welcome message */}
              <p className="text-lg leading-relaxed mb-6 max-w-xl mx-auto" style={{ color: hasBanner ? "rgba(255,255,255,0.90)" : "#4b5563" }}>
                {hero.description || `A fun, safe, and nurturing place where children discover the joy of learning, make lifelong friends, and grow into confident young individuals! 🌈`}
              </p>

              {/* School info strip — pill/badge row */}
              <div className="flex flex-wrap justify-center gap-3 mb-7">
                {[
                  `🏫 Nursery to Class 8`,
                  `🕐 School Timings: 8:00 AM – 2:30 PM`,
                  `📅 Est. ${established_year ?? "—"}`,
                ].map((info) => (
                  <span
                    key={info}
                    className="px-4 py-1.5 rounded-full text-sm font-bold shadow-sm"
                    style={{
                      background: hasBanner ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.85)",
                      color: hasBanner ? "#ffffff" : bg1,
                      border: hasBanner ? "1.5px solid rgba(255,255,255,0.4)" : `1.5px solid ${bg1}40`,
                    }}
                  >
                    {info}
                  </span>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex gap-4 justify-center flex-wrap">
                <a
                  href="#admissions"
                  style={{ backgroundColor: bg2 }}
                  className="px-9 py-3 text-white font-black rounded-full text-lg shadow-xl hover:opacity-90 hover:scale-110 hover:shadow-2xl transition-all duration-300"
                >
                  🎒 Enrol Now!
                </a>
                <a
                  href="#about"
                  style={{
                    backgroundColor: hasBanner ? "rgba(255,255,255,0.2)" : bg1,
                    border: hasBanner ? "2px solid rgba(255,255,255,0.5)" : "none",
                  }}
                  className="px-9 py-3 text-white font-black rounded-full text-lg shadow-xl hover:opacity-90 hover:scale-110 hover:shadow-2xl transition-all duration-300"
                >
                  📖 Learn More
                </a>
              </div>

              {/* Wavy bottom — only without banner */}
              {!hasBanner && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-yellow-50" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
              )}
            </div>
          );

          if (hasBanner) {
            return (
              <HeroSlider
                banners={banners}
                overlayStyle={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.40) 100%)" }}
                className="min-h-[88vh]"
              >
                {heroContent}
              </HeroSlider>
            );
          }

          return (
            <section className="min-h-[88vh] flex items-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${bg1}18 0%, ${bg2}15 50%, ${bg3}18 100%)` }}>
              <div className="absolute top-10 left-10 w-40 h-40 rounded-full opacity-15 blur-2xl" style={{ backgroundColor: bg1 }} />
              <div className="absolute top-24 right-16 w-28 h-28 rounded-full opacity-25 blur-xl" style={{ backgroundColor: bg2 }} />
              <div className="absolute bottom-28 left-28 w-32 h-32 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: bg3 }} />
              <div className="absolute top-16 right-1/3 text-4xl opacity-20 select-none">⭐</div>
              <div className="absolute bottom-32 right-12 text-5xl opacity-15 select-none">🌟</div>
              <div className="absolute top-1/3 left-8 text-3xl opacity-20 select-none">✨</div>
              {heroContent}
            </section>
          );
        })()}

        {/* ── Stats ── */}
        <section className="py-8 md:py-10 px-4 sm:px-6 bg-white">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { emoji: "👩‍🎓", num: "1200+", label: "Happy Students" },
              { emoji: "👩‍🏫", num: "60+", label: "Caring Teachers" },
              { emoji: "🎨", num: "25+", label: "Fun Activities" },
              { emoji: "📅", num: String(established_year ?? "—"), label: "Year Established" },
            ].map(({ emoji, num, label }, index) => (
              <div
                key={label}
                className={`rounded-2xl p-5 text-center shadow-sm border-2 border-yellow-100 hover:scale-105 transition-all duration-300 ${activityCardColors[index % activityCardColors.length]}`}
                style={{ borderTop: `4px solid ${borderColors[index % borderColors.length]}` }}
              >
                <div className="text-3xl mb-2">{emoji}</div>
                <p className="text-2xl font-black" style={{ color: borderColors[index % borderColors.length] }}>{num}</p>
                <p className="text-gray-600 text-xs font-bold mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Activities ── */}
        {activities.show && (
          <section id="activities" className="py-10 md:py-14 px-4 sm:px-6 bg-yellow-50">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-center text-3xl font-black mb-2" style={{ color: bg1 }}>
                {activities.heading || "Fun Activities for Every Child 🎉"}
              </h2>
              <p className="text-center text-gray-500 text-sm mb-10">
                {activities.description || "We believe learning happens everywhere — in the classroom, on the field, and in the art room!"}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                  { emoji: "🎨", title: "Drawing & Craft", desc: "Express creativity through art, painting, clay, and more" },
                  { emoji: "🎵", title: "Dance & Music", desc: "Rhythm, song, and movement for joyful expression" },
                  { emoji: "🧘", title: "Yoga & Sports", desc: "Daily exercise, games, PT, and mindfulness sessions" },
                  { emoji: "💻", title: "Computer Lab", desc: "Age-appropriate digital literacy and typing skills" },
                  { emoji: "🔬", title: "Science Exploration", desc: "Hands-on experiments that spark curiosity" },
                  { emoji: "📖", title: "Story Time", desc: "Reading aloud, library visits, and storytelling circles" },
                  { emoji: "🚌", title: "Field Trips", desc: "Educational excursions to museums, parks, and more" },
                  { emoji: "🌟", title: "Annual Day", desc: "Grand celebration of talent, culture, and achievement" },
                ].map(({ emoji, title, desc }, index) => (
                  <div
                    key={title}
                    className={`rounded-2xl p-5 text-center shadow-sm border-2 border-yellow-100 hover:scale-105 transition-all duration-300 hover:shadow-lg ${activityCardColors[index % activityCardColors.length]}`}
                    style={{ borderTop: `4px solid ${borderColors[index % borderColors.length]}` }}
                  >
                    <div className="text-4xl mb-3">{emoji}</div>
                    <p className="font-bold text-gray-800 text-sm">{title}</p>
                    <p className="text-gray-500 text-xs mt-1 leading-snug">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Academics ── */}
        {academics.show && (
          <section id="academics" className="py-10 md:py-14 px-4 sm:px-6 bg-white">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-center text-3xl font-black mb-2" style={{ color: bg1 }}>
                {academics.heading || "Our Classes 🎓"}
              </h2>
              <p className="text-center text-gray-500 text-sm mb-10">
                {academics.description || "From Nursery to Class 8 — a structured, joyful learning journey for every stage of childhood."}
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  {
                    emoji: "🌱",
                    title: "Pre-Primary",
                    range: "Nursery · LKG · UKG",
                    desc: "Play-based learning that builds language, number sense, motor skills, and social confidence in a safe, loving classroom.",
                    idx: 0,
                  },
                  {
                    emoji: "📚",
                    title: "Primary",
                    range: "Class I to Class V",
                    desc: "Strong foundations in Maths, Science, English, Hindi, and EVS with activity-based teaching and regular assessments.",
                    idx: 1,
                  },
                  {
                    emoji: "🔭",
                    title: "Middle School",
                    range: "Class VI to Class VIII",
                    desc: "Deeper subject learning, project work, lab practicals, and co-curricular activities to prepare students for senior classes.",
                    idx: 2,
                  },
                ].map(({ emoji, title, range, desc, idx }) => (
                  <div
                    key={title}
                    className={`rounded-2xl p-7 text-center shadow-sm border-2 border-yellow-100 hover:scale-105 transition-all duration-300 hover:shadow-xl ${activityCardColors[idx % activityCardColors.length]}`}
                    style={{ borderTop: `4px solid ${borderColors[idx % borderColors.length]}` }}
                  >
                    <div className="text-5xl mb-3">{emoji}</div>
                    <h3 className="font-black text-gray-800 text-lg mb-1">{title}</h3>
                    <p className="text-xs font-bold mb-3 px-3 py-1 rounded-full inline-block" style={{ background: `${borderColors[idx % borderColors.length]}20`, color: borderColors[idx % borderColors.length] }}>{range}</p>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              {/* Safety banner */}
              <div
                className="rounded-2xl px-6 py-5 flex flex-wrap justify-center gap-x-8 gap-y-2 text-white text-sm font-bold text-center shadow-md"
                style={{ background: `linear-gradient(90deg, ${bg1}, ${bg2})` }}
              >
                <span>✅ Safe School Transport</span>
                <span>✅ CCTV Surveillance</span>
                <span>✅ Trained &amp; Verified Staff</span>
                <span>✅ Child-Friendly Campus</span>
              </div>
            </div>
          </section>
        )}

        {/* ── About ── */}
        {about.show && (
          <section
            id="about"
            className="py-16 px-6 min-h-[300px]"
            style={{ background: `linear-gradient(135deg, ${bg1}15, ${bg2}15, ${bg3}15)` }}
          >
            <div className="max-w-4xl mx-auto">
              <h2 className="text-center text-3xl font-black mb-4" style={{ color: bg1 }}>
                {about.heading || "About Us 💛"}
              </h2>
              <p className="text-gray-600 leading-relaxed text-base text-center mb-10">
                {about.description ||
                  `Founded in ${established_year ?? "—"}, ${name} in ${city} has been a trusted home for quality early education. Our caring teachers nurture every child's curiosity, confidence, and character — building a strong foundation for life.`}
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">

                {/* School Timings card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-yellow-100" style={{ borderTop: `4px solid ${bg1}` }}>
                  <h3 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2">
                    🕐 School Timings
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-500">Morning Assembly</span>
                      <span className="font-bold text-gray-800">8:00 AM</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-500">Classes</span>
                      <span className="font-bold text-gray-800">8:15 AM – 2:30 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-500">After School Activities</span>
                      <span className="font-bold text-gray-800">2:30 – 4:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-500">Working Days</span>
                      <span className="font-bold text-gray-800">Monday – Saturday</span>
                    </li>
                  </ul>
                </div>

                {/* Why Parents Choose Us card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-yellow-100" style={{ borderTop: `4px solid ${bg2}` }}>
                  <h3 className="font-black text-gray-800 text-lg mb-4 flex items-center gap-2">
                    ⭐ Why Parents Choose Us
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {[
                      { emoji: "🔒", point: "Safe & Secure Environment", detail: "CCTV, verified staff, safe transport" },
                      { emoji: "👩‍🏫", point: "Experienced Teachers", detail: "Dedicated educators with years of experience" },
                      { emoji: "🧩", point: "Play-Based Learning", detail: "Hands-on activities for deeper understanding" },
                      { emoji: "🤍", point: "Individual Attention", detail: "Small class sizes, every child noticed" },
                    ].map(({ emoji, point, detail }) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="text-lg leading-none mt-0.5">{emoji}</span>
                        <div>
                          <p className="font-bold text-gray-800 leading-tight">{point}</p>
                          <p className="text-gray-400 text-xs">{detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Contact info pills */}
              <div className="flex flex-wrap justify-center gap-4">
                {[`📍 ${city}`, `📞 ${phone || "—"}`, `✉️ ${email || "—"}`].map((item) => (
                  <span
                    key={item}
                    className="bg-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200 border-2 border-yellow-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Gallery ── */}
        {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
          <section id="gallery" className="py-10 md:py-14 px-4 sm:px-6 bg-white">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-center text-3xl font-black mb-2" style={{ color: bg1 }}>
                {gallery.heading || "Our Happy Moments 📸 🎉"}
              </h2>
              <p className="text-center text-gray-500 text-sm mb-6">
                {gallery.description || "A glimpse of the joy, learning, and fun inside our school!"}
              </p>

              {/* CSS-only category filter */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {["All", "Events", "Sports", "Activities"].map((cat) => (
                  <label
                    key={cat}
                    className="cursor-pointer px-5 py-2 rounded-full text-sm font-bold border-2 transition-all duration-200 select-none"
                    style={{
                      borderColor: bg1,
                      color: bg1,
                      background: "white",
                    }}
                  >
                    <input type="radio" name="gallery-filter" value={cat} className="sr-only" defaultChecked={cat === "All"} />
                    {cat}
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.gallery_items.map((img, index) => (
                  <div
                    key={img.id}
                    className="aspect-square relative group overflow-hidden rounded-2xl border-4 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300"
                    style={{ borderColor: galleryBorderColors[index % galleryBorderColors.length] }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt={img.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-1 p-3">
                      {img.category && (
                        <span className="text-xs font-black uppercase tracking-wider" style={{ color: galleryBorderColors[index % galleryBorderColors.length] }}>
                          {img.category}
                        </span>
                      )}
                      <p className="text-white text-sm font-black text-center">{img.title}</p>
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
            className="py-14 md:py-20 px-4 sm:px-6 text-center min-h-[50vh] flex items-center justify-center relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${bg1}, ${bg2}, ${bg3})` }}
          >
            {/* Floating decorations */}
            <div className="absolute top-4 left-6 text-5xl opacity-40 select-none">⭐</div>
            <div className="absolute top-10 right-10 text-4xl opacity-40 select-none">🌟</div>
            <div className="absolute bottom-6 left-16 text-3xl opacity-40 select-none">✨</div>
            <div className="absolute bottom-10 right-6 text-4xl opacity-30 select-none">🎊</div>
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }} />

            <div className="max-w-2xl mx-auto text-white relative z-10 w-full">
              <h2 className="text-4xl font-black mb-2 leading-tight">
                {admissions.heading || "Enrol Your Child! 🎒"}
              </h2>
              <p className="text-white/80 mb-2 text-base font-bold tracking-wide">
                Admissions Open for 2025–26 · Nursery to Class 8
              </p>
              <p className="text-white/75 mb-10 text-sm">
                {admissions.description || "Give your child the best start — limited seats available. Enrol early to avoid disappointment!"}
              </p>

              {/* 4-step admission process */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { step: "1", emoji: "📞", title: "Contact Us", detail: "Call or visit our school office" },
                  { step: "2", emoji: "📝", title: "Fill Form", detail: "Complete the admission enquiry form" },
                  { step: "3", emoji: "🏫", title: "Visit School", detail: "Tour our campus with your child" },
                  { step: "4", emoji: "🎉", title: "Welcome!", detail: "Confirm admission & join our family" },
                ].map(({ step, emoji, title, detail }) => (
                  <div key={step} className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/30">
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white font-black text-sm mx-auto mb-2">{step}</div>
                    <div className="text-3xl mb-2">{emoji}</div>
                    <p className="font-black text-white text-sm">{title}</p>
                    <p className="text-white/70 text-xs mt-1 leading-snug">{detail}</p>
                  </div>
                ))}
              </div>

              <a
                href="/login"
                className="inline-block px-12 py-4 bg-white font-black text-xl rounded-full shadow-2xl hover:scale-110 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-300"
                style={{ color: bg1 }}
              >
                ✏️ Apply Now
              </a>
            </div>
          </section>
        )}

        {/* ── Contact ── */}
        {contact.show && (
          <section id="contact" className="py-12 md:py-16 px-4 sm:px-6 bg-yellow-50">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <div className="text-5xl mb-3">📬</div>
                <h2 className="text-3xl font-black mb-3" style={{ color: bg1 }}>
                  {contact.heading || "Talk to Us! 💬"}
                </h2>
                <p className="text-gray-600 text-sm">
                  {contact.description || "We'd love to hear from you. Visit us, call us, or drop an email — we're here for you! 🌟"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { emoji: "📍", label: "Address", value: address || city, ...contactCardColors[0] },
                  { emoji: "📞", label: "Phone", value: phone || "—", ...contactCardColors[1] },
                  { emoji: "✉️", label: "Email", value: email || "—", ...contactCardColors[2] },
                  { emoji: "🕐", label: "School Hours", value: "Mon–Sat, 8:00 AM – 2:30 PM", ...contactCardColors[3] },
                ].map(({ emoji, label, value, bg, border, text }) => (
                  <div
                    key={label}
                    className={`${bg} border-2 ${border} rounded-2xl p-5 text-center shadow-sm hover:scale-105 transition-all duration-200`}
                    style={{ borderTop: `4px solid` }}
                  >
                    <div className="text-3xl mb-2">{emoji}</div>
                    <p className={`text-xs font-black uppercase tracking-wider mb-1 ${text}`}>{label}</p>
                    <p className="text-gray-700 text-sm font-bold leading-snug break-words">{value}</p>
                  </div>
                ))}
              </div>

              {/* Google Map */}
              <div className="mt-8 rounded-2xl overflow-hidden border-4 border-yellow-200 shadow-md">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3572.8608563176817!2d82.52597947222179!3d26.427966480760162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3990928e2ecacf07%3A0x45812ae7e2c0ee77!2sDOYEN%20INTERNATIONAL%20SCHOOL!5e0!3m2!1sen!2sin!4v1792572714179!5m2!1sen!2sin"
                  width="100%"
                  height="250"
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

      </div>
    </WebsiteShell>
  );
}
