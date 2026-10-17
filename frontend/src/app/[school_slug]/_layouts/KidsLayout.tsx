import type { SchoolWebsiteData } from "@/types/website";
import { WebsiteShell } from "./WebsiteShell";

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
  const about = getSection(data, "about");
  const gallery = getSection(data, "gallery");
  const admissions = getSection(data, "admissions");
  const contact = getSection(data, "contact");

  const activityCardColors = ["bg-pink-50", "bg-blue-50", "bg-green-50", "bg-yellow-50", "bg-purple-50", "bg-orange-50", "bg-red-50", "bg-teal-50"];
  const borderColors = [bg1, bg2, bg3, "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
  const galleryBorderColors = [bg1, bg2, bg3, "#10b981"];
  const contactPillColors = ["bg-pink-50 border-pink-200", "bg-blue-50 border-blue-200", "bg-green-50 border-green-200"];

  return (
    <WebsiteShell data={data}>
      <div style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive" }} className="bg-yellow-50">
        {/* Hero */}
        {hero.show && (
          <section className="min-h-[85vh] flex items-center relative overflow-hidden py-16 px-6 text-center">
            {/* Floating decorative circles */}
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full opacity-20" style={{ backgroundColor: bg1 }} />
            <div className="absolute top-20 right-16 w-20 h-20 rounded-full opacity-30" style={{ backgroundColor: bg2 }} />
            <div className="absolute bottom-20 left-24 w-24 h-24 rounded-full opacity-20" style={{ backgroundColor: bg3 }} />

            <div className="max-w-3xl mx-auto relative z-10">
              <div className="text-8xl mb-4 animate-bounce" style={{ display: "inline-block" }}>🏫</div>
              <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight" style={{ color: bg1 }}>
                {hero.heading || branding.welcome_message || `Welcome to ${name}!`}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {hero.description ||
                  `A fun, safe, and nurturing place where children discover the joy of learning,
                  make lifelong friends, and grow into confident young individuals! 🌈`}
              </p>
              <div className="flex justify-center gap-2 mb-8 text-3xl">🌈 ⭐ 🎨 🏃 🎵 🌱</div>
              <div className="flex gap-4 justify-center flex-wrap">
                <a
                  href="#admissions"
                  style={{ backgroundColor: bg2 }}
                  className="px-8 py-3 text-white font-black rounded-full text-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:scale-110 hover:shadow-xl"
                >
                  🎉 Join Our Family!
                </a>
                <a
                  href="#about"
                  style={{ backgroundColor: bg1 }}
                  className="px-8 py-3 text-white font-black rounded-full text-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:scale-110 hover:shadow-xl"
                >
                  📖 Learn More
                </a>
              </div>
            </div>

            {/* Wavy bottom divider */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
          </section>
        )}

        {/* Fun Features Grid */}
        {activities.show && (
          <section id="activities" className="py-12 px-6 bg-white">
            <h2 className="text-center text-3xl font-black mb-10" style={{ color: bg1 }}>
              {activities.heading || "What We Offer 🌟"}
            </h2>
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { emoji: "📚", title: "Learning", desc: "Fun & interactive classes" },
                { emoji: "🎨", title: "Arts & Crafts", desc: "Creative expression daily" },
                { emoji: "⚽", title: "Sports", desc: "Active play every day" },
                { emoji: "🎵", title: "Music", desc: "Sing, dance, perform!" },
                { emoji: "🔬", title: "Science", desc: "Experiments & discovery" },
                { emoji: "💻", title: "Technology", desc: "Digital skills for life" },
                { emoji: "🌱", title: "Values", desc: "Kindness & respect" },
                { emoji: "🤝", title: "Community", desc: "Together we grow" },
              ].map(({ emoji, title, desc }, index) => (
                <div
                  key={title}
                  className={`rounded-2xl p-4 text-center shadow-sm border-2 border-yellow-100 hover:scale-105 transition-all duration-300 hover:shadow-lg ${activityCardColors[index % activityCardColors.length]}`}
                  style={{ borderTop: `4px solid ${borderColors[index % borderColors.length]}` }}
                >
                  <div className="text-4xl mb-3">{emoji}</div>
                  <p className="font-bold text-gray-800 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {about.show && (
          <section
            id="about"
            className="py-16 px-6 pt-12 pb-16 min-h-[300px]"
            style={{ background: `linear-gradient(135deg, ${bg1}15, ${bg2}15, ${bg3}15)` }}
          >
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-black mb-6" style={{ color: bg1 }}>
                {about.heading || "About Us 💛"}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {about.description ||
                  `Founded in ${established_year ?? "—"}, ${name} in ${city} has been a beacon of quality early
                  education. Our caring teachers create a warm, inclusive environment where every child
                  feels loved and valued while reaching their full potential.`}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                {[
                  `📍 ${city}`,
                  `📞 ${phone || "—"}`,
                  `✉️ ${email || "—"}`,
                ].map((item) => (
                  <span
                    key={item}
                    className="bg-white px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:scale-105 transition-all duration-200 hover:shadow-md"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery */}
        {gallery.show && data.gallery_items && data.gallery_items.length > 0 && (
          <section className="py-12 px-6 bg-white">
            <h2 className="text-center text-3xl font-black mb-8" style={{ color: bg1 }}>
              {gallery.heading || "Our Happy Moments 📸 🎉"}
            </h2>
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.gallery_items.map((img, index) => (
                <div
                  key={img.id}
                  className="aspect-square relative group overflow-hidden rounded-2xl border-4 shadow-sm"
                  style={{ borderColor: galleryBorderColors[index % galleryBorderColors.length] }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={img.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <p className="text-white text-sm font-black text-center px-2">{img.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Admissions */}
        {admissions.show && (
          <section
            id="admissions"
            className="py-16 px-6 text-center min-h-[50vh] flex items-center justify-center relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${bg1}, ${bg2}, ${bg3})` }}
          >
            {/* Floating star decorations */}
            <div className="absolute top-4 left-4 text-4xl opacity-60">⭐</div>
            <div className="absolute top-8 right-8 text-3xl opacity-60">🌟</div>
            <div className="absolute bottom-4 left-12 text-2xl opacity-60">✨</div>

            <div className="max-w-2xl mx-auto text-white relative z-10">
              <div className="text-5xl mb-4">🎓</div>
              <h2 className="text-3xl font-black mb-4">
                {admissions.heading || "Enrol Your Child Today!"}
              </h2>
              <p className="text-white/80 mb-8">
                {admissions.description ||
                  "Limited seats available. Give your child the best start in life!"}
              </p>
              <a
                href="/login"
                className="inline-block px-10 py-4 bg-white font-black text-lg rounded-full shadow-lg hover:scale-110 transition-all duration-300 hover:shadow-2xl"
                style={{ color: bg2 }}
              >
                ✏️ Register Now!
              </a>
            </div>
          </section>
        )}

        {/* Contact Us */}
        {contact.show && (
          <section id="contact" className="py-20 px-6 bg-white">
            <div className="max-w-3xl mx-auto text-center">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-3xl font-black mb-4" style={{ color: bg1 }}>
                {contact.heading || "Talk to Us! 💬"}
              </h2>
              <p className="text-gray-600 mb-10">
                {contact.description || "We'd love to hear from you! Drop us a message anytime 🌟"}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { label: `📍 ${address || city}`, colorClass: "bg-pink-50 border-pink-200" },
                  { label: `📞 ${phone || "—"}`, colorClass: "bg-blue-50 border-blue-200" },
                  { label: `✉️ ${email || "—"}`, colorClass: "bg-green-50 border-green-200" },
                ].map((item, index) => (
                  <span
                    key={item.label}
                    className={`px-6 py-3 rounded-full text-sm font-bold shadow-sm border-2 hover:scale-105 transition-all duration-200 ${contactPillColors[index % contactPillColors.length]}`}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </WebsiteShell>
  );
}
