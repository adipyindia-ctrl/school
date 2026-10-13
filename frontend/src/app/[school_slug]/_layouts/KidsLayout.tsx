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

  return (
    <WebsiteShell data={data}>
      <div style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive" }} className="bg-yellow-50">
        {/* Hero */}
        {hero.show && (
          <section className="py-16 px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="text-6xl mb-4">🏫</div>
              <h2 className="text-4xl font-black mb-4" style={{ color: bg1 }}>
                {hero.heading || branding.welcome_message || `Welcome to ${name}!`}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                {hero.description ||
                  `A fun, safe, and nurturing place where children discover the joy of learning,
                  make lifelong friends, and grow into confident young individuals! 🌈`}
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <a
                  href="#admissions"
                  style={{ backgroundColor: bg2 }}
                  className="px-8 py-3 text-white font-black rounded-full text-lg hover:opacity-90 transition-opacity shadow-lg"
                >
                  🎉 Join Our Family!
                </a>
                <a
                  href="#about"
                  style={{ backgroundColor: bg1 }}
                  className="px-8 py-3 text-white font-black rounded-full text-lg hover:opacity-90 transition-opacity shadow-lg"
                >
                  📖 Learn More
                </a>
              </div>
            </div>
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
              ].map(({ emoji, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl p-4 text-center shadow-sm border-2 border-yellow-100 hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-2">{emoji}</div>
                  <p className="font-bold text-gray-800 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {about.show && (
          <section id="about" className="py-16 px-6" style={{ backgroundColor: `${bg1}15` }}>
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
                    className="bg-white px-4 py-2 rounded-full text-sm font-medium shadow-sm"
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
              {gallery.heading || "Our Happy Moments 📸"}
            </h2>
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.gallery_items.map((img) => (
                <div
                  key={img.id}
                  className="aspect-square overflow-hidden rounded-2xl border-4 border-yellow-100 shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={img.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Admissions */}
        {admissions.show && (
          <section
            id="admissions"
            className="py-16 px-6 text-center"
            style={{ background: `linear-gradient(135deg, ${bg2}, ${bg3})` }}
          >
            <div className="max-w-2xl mx-auto text-white">
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
                className="inline-block px-10 py-4 bg-white font-black text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow"
                style={{ color: bg2 }}
              >
                ✏️ Register Now!
              </a>
            </div>
          </section>
        )}
      </div>
    </WebsiteShell>
  );
}
