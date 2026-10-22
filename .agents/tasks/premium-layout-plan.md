# PremiumLayout.tsx — Dark Luxury Redesign (Implementation Plan)

Task: Redesign `frontend/src/app/[school_slug]/_layouts/PremiumLayout.tsx` into a dark
luxury school website theme (black/zinc backgrounds, gold accent), fully responsive,
matching the 9-section reference design. **Do NOT change any existing functionality —
only the layout/theme.** One file is touched (`PremiumLayout.tsx`); `WebsiteShell.tsx`,
`HeroSlider.tsx`, `MobileNav.tsx`, and the page/route files are NOT modified.

All facts below were read directly from the current source and are to be preserved
verbatim unless explicitly restated as a change.

---

## 1. Source of truth — current code facts (preserve verbatim)

### 1a. Data fields actually used by this layout (`SchoolWebsiteData` from `@/types/website`)
- Top-level destructured today: `const { branding, name, phone, email, address, city, state, established_year } = data;`
  - `name: string`, `phone: string`, `email: string`, `address: string`, `city: string`, `state: string`, `established_year: number | null`, `school_type: string`, `slug: string`
- `branding` object: `primary_color`, `secondary_color`, `accent_color`, `font_family`, `logo_url` (string|null), `favicon_url` (string|null), `welcome_message` (string|null), `footer_text` (string|null), `support_phone` (string|null), `support_email` (string|null)
- `data.hero_banner_url?: string | null` and `data.hero_banners?: Array<{ id: string; image_url: string; title: string|null; subtitle: string|null; display_order: number }>`
- `data.gallery_items?: Array<{ id: string; title: string; image_url: string; category: string|null }>`
- `data.website_sections?: Array<{ section_key: string; is_enabled: boolean; heading: string|null; description: string|null; content: Record<string,unknown>|null; display_order: number }>`

### 1b. `getSection` signature (keep exactly as-is)
```ts
function getSection(data: SchoolWebsiteData, key: string) {
  if (!data.website_sections || data.website_sections.length === 0) {
    return { show: true, heading: null, description: null, content: null };
  }
  const s = data.website_sections.find((sec) => sec.section_key === key);
  if (!s) return { show: false, heading: null, description: null, content: null };
  return { show: s.is_enabled, heading: s.heading, description: s.description, content: s.content };
}
```
Section keys used: `"hero"`, `"stats"`, `"about"`, `"academics"`, `"gallery"`, `"admissions"`, `"contact"`.

### 1c. Section guards (keep exactly as-is — including the gallery data guard)
- Hero: `{hero.show && (() => { ... })()}`
- Stats: `{stats.show && ( ... )}`
- About: `{about.show && ( ... )}`
- Academics: `{academics.show && ( ... )}`
- Gallery: `{gallery.show && data.gallery_items && data.gallery_items.length > 0 && ( ... )}`
- Admissions: `{admissions.show && ( ... )}`
- Contact: `{contact.show && ( ... )}`

### 1d. Anchor IDs (keep exactly)
- About section: `id="about"`
- Academics section: `id="academics"`
- Gallery section: `id="gallery"`
- Admissions section: `id="admissions"`  (see decision D5 — the CTA band carries this anchor)
- Contact section: `id="contact"`

### 1e. HeroSlider pattern (keep exactly — NO admission enquiry card in hero)
```tsx
const banners: Array<{ id: string; image_url: string; title: string | null; subtitle: string | null }> =
  data.hero_banners && data.hero_banners.length > 0
    ? data.hero_banners
    : data.hero_banner_url
      ? [{ id: "single", image_url: data.hero_banner_url, title: null, subtitle: null }]
      : [];
const hasBanner = banners.length > 0;
// ... build heroContent JSX ...
if (hasBanner) {
  return (
    <HeroSlider banners={banners} overlayStyle={...} className="min-h-[60vh] md:min-h-[95vh] flex flex-col">
      {heroContent}
    </HeroSlider>
  );
}
return ( <section className="relative min-h-[60vh] md:min-h-[95vh] flex flex-col bg-black"> ... {heroContent} </section> );
```
The current hero already has NO admission enquiry card. Keep it that way.

### 1f. Google Maps iframe `src` (keep VERBATIM — do not shorten)
```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3572.8608563176817!2d82.52597947222179!3d26.427966480760162!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3990928e2ecacf07%3A0x45812ae7e2c0ee77!2sDOYEN%20INTERNATIONAL%20SCHOOL!5e0!3m2!1sen!2sin!4v1792572714179!5m2!1sen!2sin
```
iframe attributes to keep: `width="100%"`, `height="100%"` (or a fixed height), `style={{ border: 0, display: "block", minHeight: <n> }}`, `allowFullScreen`, `loading="lazy"`, `referrerPolicy="strict-origin-when-cross-origin"`, `title="..."`.

### 1g. Wrapper & accent (keep)
- Outer: `<WebsiteShell data={data}>` ... `</WebsiteShell>`
- Inner root: `<div className="bg-black text-white" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>`
- Accent: `const accent = branding.accent_color || "#C9A84C";` (keep this exact fallback).

### 1h. Verification command (proven during exploration)
From `frontend/`:
```
npx tsc --noEmit -p tsconfig.sourcecheck.json
```
`tsconfig.sourcecheck.json` is a source-only typecheck (excludes generated `.next` types) — see item 1 of the plan for its content. Full `npx tsc --noEmit` (default project config) currently BAILS on a stale generated parse error in `.next/dev/types/validator.ts`, which masks other checks; the sourcecheck config avoids that.

**Baseline (pre-existing, unrelated to this task — must NOT increase):**
- `src/app/dashboard/reports/page.tsx(5,81): error TS7016: Could not find a declaration file for module 'recharts'`
- `src/app/dashboard/reports/page.tsx(349,38): error TS7006: Parameter 'v' implicitly has an 'any' type.`

After the redesign, these are the ONLY errors allowed. There must be ZERO new errors, specifically none referencing `PremiumLayout.tsx`, `WebsiteShell.tsx`, `HeroSlider.tsx`, or `types/website.ts`. (The historical `src/app/api/revalidate/route.ts` TS2554 errors from the user's logs are already resolved in the current source — that route now passes 2 args — and do not appear.)

---

## 2. Design decisions (rationale)

- **D1 — One file, full rewrite of the `return` body.** All 9 sections live in one `return` sharing the `accent`/`getSection` scaffolding. Editing the whole body in one pass keeps JSX balanced and avoids half-built intermediate states. No other files change.
- **D2 — Fixed dark zinc backgrounds, not `primary_color`, for the body.** The reference is a fixed dark luxury theme (`bg-zinc-950/900/800`). `branding.primary_color` is already applied by `WebsiteShell` for the nav + footer (which we do not touch). Using fixed zinc inside the body preserves the luxury aesthetic regardless of the school's (possibly light) primary. `primary_color` is therefore read but not applied to the body. This honors "use as dark navy/zinc if very light" by simply using zinc. `accent_color` (gold) is used for all highlights, numbers, borders, and buttons.
- **D3 — Gold accent = `accent` variable (existing), fallback `#C9A84C`.** Keep the current fallback; do not switch to ClassicLayout's `#C8971A`.
- **D4 — Keep Georgia/serif font on the root div** (already set on the inner root) for the luxury editorial feel; use it on headings via the existing `fontFamily: "'Georgia', serif"` inline style on h1/h2.
- **D5 — CTA Band (reference section 8) IS the `admissions` section.** The reference has no separate "admissions steps" section; its section 8 is the gold CTA band with "Apply Now →". To preserve the `admissions.show` guard and the `id="admissions"` anchor (both mandatory), the CTA band is wrapped in `{admissions.show && (<section id="admissions" ...>)}` and binds `admissions.heading` / `admissions.description` (with the reference's static fallbacks). The current 4-step admissions process is static decorative text (not interactive), so replacing it with the CTA band is a layout/theme change, not a functionality change.
- **D6 — Hero buttons.** "Apply for Admission →" → `href="#admissions"` (scrolls to the CTA/admissions band); "Watch Campus Tour" → `href="#about"` (there is no tour video; pointing to About is a behavior-neutral anchor so the link is never dead). This keeps the existing apply-anchor behavior (`#admissions`) used by the current hero.
- **D7 — CTA "Apply Now →" → `href="/login"`.** Preserves the current PremiumLayout admissions "Apply Now" target (`/login`), which is the real apply action. Pointing it to `#admissions` (itself) would be circular, so `/login` is kept.
- **D8 — Static presentational controls (no interactivity).** The contact form (Name/Email/Phone/Program/Message/Submit) and the gallery filter tabs (All/Events/Sports/Academics) are rendered as static styled controls with no `onChange`/`onClick`/`<form>` — exactly as `ClassicLayout.tsx` already does. This keeps `PremiumLayout` a server component (no `"use client"`) and adds no backend wiring, matching "only the layout/theme".
- **D9 — Stats numbers are static per the reference**, except the "Years" stat which is computed dynamically from `established_year` (`${new Date().getFullYear() - established_year}+`), exactly as the current PremiumLayout and ClassicLayout do.
- **D10 — Icons via inline SVG** (small components at the top of the file), copied from `ClassicLayout.tsx` (Award, Users, Book/GraduationCap, Star, MapPin, Phone, Mail, Clock, Flask, Palette, Heart, Shield, Globe) so the dark theme has gold icons without adding npm packages.
- **D11 — Hero overlay = left-darker gradient** (dark on the left for text legibility, fading lighter to the right so the banner image stays visible): `linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.25) 100%)`. The current uniform `rgba(0,0,0,0.70)` is replaced per the reference ("light left gradient so banner image is visible" → readable text on the left, visible image toward the right).
- **D12 — Responsive = mobile-first throughout**: section paddings `py-12 md:py-24 px-4 sm:px-6`; grids `grid-cols-1 sm:grid-cols-2 md:grid-cols-X`; headings `text-3xl sm:text-4xl md:text-5xl`. All containers `max-w-6xl mx-auto`.

---

## 3. Implementation Plan

- [ ] 1. Create the source-only typecheck helper `frontend/tsconfig.sourcecheck.json`
      (if not already present) and confirm the baseline. Content (exactly):
      ```json
      {
        "extends": "./tsconfig.json",
        "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "**/*.mts"],
        "exclude": ["node_modules", ".next"]
      }
      ```
      Files: `frontend/tsconfig.sourcecheck.json`
      Verify: from `frontend/` run `npx tsc --noEmit -p tsconfig.sourcecheck.json`. Expected
      output is exactly the 2 pre-existing errors in `src/app/dashboard/reports/page.tsx`
      (TS7016 recharts + TS7006 implicit any). This establishes the green baseline before
      the redesign. (If this file already exists from a prior step, skip creation.)

- [ ] 2. Rewrite `PremiumLayout.tsx`: keep the imports, `getSection`, the top-of-file
      inline SVG icon components (copy from `ClassicLayout.tsx`), the destructuring,
      `accent`, the 7 `getSection` calls, the `WebsiteShell` wrapper, and the inner
      `<div className="bg-black text-white" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>`.
      Implement the 9 sections in order per the section-by-section spec in §4 below.
      Keep ALL guards, anchor IDs, the HeroSlider IIFE/banner pattern, and the Google
      Maps `src` verbatim. No `"use client"`, no new imports/packages, no new
      dependencies on `data` fields beyond what already exists.
      Files: `frontend/src/app/[school_slug]/_layouts/PremiumLayout.tsx`
      Verify: from `frontend/` run `npx tsc --noEmit -p tsconfig.sourcecheck.json`.
      Expected: still exactly the same 2 pre-existing `dashboard/reports/page.tsx`
      errors and ZERO new errors (none in `PremiumLayout.tsx`, `WebsiteShell.tsx`,
      `HeroSlider.tsx`, or `types/website.ts`).

- [ ] 3. Verify responsiveness and the preserved constraints (no code change).
      Confirm via reading the final file that each of these holds:
      (a) 7 section guards present and unchanged; (b) anchor IDs `about`, `academics`,
      `gallery`, `admissions`, `contact` all present; (c) hero has NO admission enquiry
      card and uses the `HeroSlider` IIFE pattern with `data.hero_banners`/`hero_banner_url`
      fallback; (d) Google Maps `src` matches §1f byte-for-byte; (e) every grid is
      mobile-first (`grid-cols-1 ... sm:... md:...`), every section uses
      `py-12 md:py-24 px-4 sm:px-6`; (f) no `"use client"`, no new package import.
      Files: (read-only check of) `frontend/src/app/[school_slug]/_layouts/PremiumLayout.tsx`
      Verify: re-run `npx tsc --noEmit -p tsconfig.sourcecheck.json` (same 2 pre-existing
      errors only) AND `npx eslint src/app/[school_slug]/_layouts/PremiumLayout.tsx`
      (no new errors; the existing `@next/next/no-img-element` lines are already
      eslint-disabled inline, keep those disable comments).

---

## 4. Section-by-section spec (concrete JSX/Tailwind) — implements item 2

Each section below is wrapped in its guard (§1c) and the listed anchor ID. Dynamic
values come from `data`/sections; static values are marked STATIC. Backgrounds use
fixed zinc for the dark theme; `accent` (gold) for highlights. Paddings:
`py-12 md:py-24 px-4 sm:px-6` unless noted. Container: `max-w-6xl mx-auto`.

### S1 — Hero (guard `hero.show &&`, IIFE banner pattern from §1e)
- `heroContent` container: `max-w-6xl mx-auto px-4 sm:px-6 min-h-[60vh] md:min-h-[95vh] flex flex-col items-start justify-center text-left py-12 md:py-24`, Georgia serif.
  - Eyebrow (STATIC text): `<p className="text-xs tracking-[0.3em] uppercase mb-5" style={{ color: accent }}>LEARN · GROW · ACHIEVE</p>`
  - Heading: `<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-white">`. Render the dynamic title first in white:
    `{hero.heading || branding.welcome_message || name}` in a `<span className="block">`, then a STATIC gold italic second line
    `<span className="block italic" style={{ color: accent }}>for a Brighter Future</span>`.
    (This keeps the dynamic binding while giving the reference's white+gold-italic two-line treatment.)
  - Description (DYNAMIC): `<p className="text-zinc-300 text-base md:text-lg max-w-xl mb-10 leading-relaxed">{hero.description || \`A tradition of excellence in education since ${established_year ?? "our founding"}. Committed to shaping future leaders with knowledge, integrity, and character.\`}</p>`
  - Buttons (`flex flex-wrap gap-4`):
    - "Apply for Admission →": `href="#admissions"`, `style={{ backgroundColor: accent, color: "#000" }}`, classes `px-8 py-3.5 text-sm font-semibold tracking-wide`. (DYNAMIC target preserved.)
    - "Watch Campus Tour": `href="#about"` (D7), `className="px-8 py-3.5 text-sm font-semibold tracking-wide border border-white/40 hover:border-white text-white/90"`. (STATIC text.)
- If `hasBanner`: `<HeroSlider banners={banners} overlayStyle={{ background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.25) 100%)" }} className="min-h-[60vh] md:min-h-[95vh] flex flex-col">{heroContent}</HeroSlider>` (D11).
- Else: `<section className="relative min-h-[60vh] md:min-h-[95vh] flex flex-col bg-black">` with the existing radial-gold accent background, then `{heroContent}`.

### S2 — Stats Bar (guard `stats.show &&`, dark bg `bg-zinc-900` via inline `style={{ backgroundColor: "#0a0a0a" }}` or `bg-zinc-900`)
- `max-w-6xl mx-auto`, `grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-zinc-800/60`.
- 4 cells, each `text-center py-10 px-6`:
  1. Icon `<IconAward/>`, num (DYNAMIC) `${new Date().getFullYear() - (established_year ?? new Date().getFullYear() - 20)}+`, label "Years of Excellence" (STATIC)
  2. Icon `<IconUsers/>`, num "1000+" (STATIC), label "Students Enrolled" (STATIC)
  3. Icon `<IconBook/>` (or GraduationCap), num "50+" (STATIC), label "Expert Faculty" (STATIC)
  4. Icon `<IconStar/>`, num "100%" (STATIC), label "Success Rate" (STATIC)
- Number style: `style={{ color: accent, fontFamily: "'Georgia', serif" }}` `className="text-4xl md:text-5xl font-bold mb-3"`.
- Label: `className="text-zinc-400 text-xs uppercase tracking-[0.25em]"`. Icon color: `style={{ color: accent }}`.

### S3 — About (guard `about.show &&`, `id="about"`, `bg-zinc-950`)
- Eyebrow (STATIC): `text="ABOUT US"` styled gold `text-xs tracking-[0.3em] uppercase`.
- Heading (DYNAMIC): `<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">{about.heading || \`Welcome to ${name}\`}</h2>` Georgia serif.
- Grid `grid-cols-1 md:grid-cols-2 gap-8 md:gap-16`:
  - Left: image. If `data.gallery_items && data.gallery_items.length > 0` → `<img src={data.gallery_items[0].image_url} alt={data.gallery_items[0].title} className="w-full h-72 md:h-96 object-cover" style={{ border: \`1px solid ${accent}25\` }} />` with the `@next/next/no-img-element` eslint-disable comment. Else a `div` placeholder `style={{ backgroundColor: "#18181b" }}` `className="w-full h-72 md:h-96"`.
  - Right: `<h3 className="text-2xl font-bold mb-4 text-white">{name}</h3>` (DYNAMIC); description `<p className="text-zinc-400 leading-relaxed mb-8">{about.description || \`...${name}...${established_year ?? "its founding"}...\`}</p>` (DYNAMIC); 3 feature tiles in `grid grid-cols-1 sm:grid-cols-3 gap-4`:
    - Academic Excellence / `<IconAward/>`
    - Safe & Nurturing Campus / `<IconShield/>`
    - Holistic Development / `<IconHeart/>`
    Each tile: `bg-zinc-900 p-5 border border-zinc-800`, icon in a `w-10 h-10 rounded-full flex items-center justify-center style={{ backgroundColor: \`${accent}18\`, color: accent }}`, title `text-white text-sm font-semibold`, sub `text-zinc-500 text-xs`. Titles/subs STATIC.
  - "Learn More →" button: `href="#academics"`, `className="inline-block mt-2 px-6 py-2.5 text-sm font-semibold border" style={{ borderColor: accent, color: accent }}`.

### S4 — Academics (guard `academics.show &&`, `id="academics"`, `bg-zinc-900`)
- Eyebrow (STATIC): `text="OUR ACADEMICS"` gold. Heading (DYNAMIC): `{academics.heading || "Academic Programs"}` white, `text-3xl sm:text-4xl md:text-5xl font-bold`.
- Header row `flex flex-col md:flex-row md:items-end md:justify-between gap-4`: left heading block; right: subtitle `<p className="text-zinc-400 text-sm max-w-sm">{academics.description || "Comprehensive education from Pre-Primary through Senior Secondary, designed for every stage of your child's growth."}</p>` (DYNAMIC) + link "View All Programs →" `href="#contact"` `style={{ color: accent }}` (STATIC text, matches ClassicLayout target).
- Cards: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4`. 5 cards (STATIC titles/ranges/taglines): 01 Pre-Primary (Nursery–KG), 02 Primary (Class I–V), 03 Middle School (Class VI–VIII), 04 Secondary (Class IX–X), 05 Senior Secondary (Class XI–XII).
- Each card: `bg-zinc-950 p-5 border border-zinc-800 hover:border-zinc-600 hover:-translate-y-1 transition` with a top gold accent `style={{ borderTop: \`3px solid ${accent}\` }}`. Inside:
  - Number badge `w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black style={{ backgroundColor: accent }}` showing `num` (top-right, absolute).
  - Thumbnail: `thumbUrl = data.gallery_items?.[idx % (data.gallery_items?.length ?? 1)]?.image_url ?? null`. If present `<img className="w-full h-24 object-cover mb-3" />` (eslint-disabled); else `div` placeholder `style={{ background: \`linear-gradient(135deg, #18181b 0%, ${accent}22 100%)\` }}` `className="w-full h-24 mb-3"`.
  - Title `text-white text-sm font-semibold`, range `text-zinc-500 text-xs`, tagline `italic text-xs style={{ color: accent }}`.
  - "Explore Classes →" link `href="#contact"` `style={{ color: accent }}` (STATIC text).

### S5 — Campus Life (NO guard — matches ClassicLayout which has no section guard for it; wrap in a plain `<section>`, `bg-zinc-950`)
- Eyebrow (STATIC) `text="CAMPUS LIFE"` gold. Heading (STATIC) "Life Beyond the Classroom" white `text-3xl sm:text-4xl md:text-5xl font-bold`. (No `getSection` key exists for campus life; keep it unguarded like ClassicLayout.)
- Grid `grid-cols-1 md:grid-cols-2 gap-8 md:gap-12`:
  - Left: `<p className="text-zinc-400 leading-relaxed mb-6">At {name}, we believe education extends far beyond textbooks. Our vibrant campus life ensures every student discovers their passion, builds lifelong friendships, and develops the skills needed for a fulfilling future.</p>` ({name} DYNAMIC, rest STATIC) + button "Explore Campus Life →" `href="#about"` `style={{ backgroundColor: accent, color: "#000" }}` `className="inline-block px-6 py-3 text-sm font-semibold"`.
  - Right: `grid grid-cols-2 gap-4` of 4 dark tiles (STATIC): Sports/`<IconUsers/>`, Science Labs/`<IconFlask/>`, Library/`<IconBook/>`, Arts & Culture/`<IconPalette/>`. Each: `bg-zinc-900 p-5 border border-zinc-800 flex gap-4 items-start`, gold icon circle `style={{ backgroundColor: \`${accent}18\`, color: accent }}`, title `text-white text-sm font-semibold`, desc `text-zinc-500 text-xs`.

### S6 — Gallery (guard `gallery.show && data.gallery_items && data.gallery_items.length > 0 &&`, `id="gallery"`, `bg-zinc-900`)
- Eyebrow (STATIC) `text="OUR GALLERY"` gold. Heading (DYNAMIC) `{gallery.heading || "Moments That Matter"}` white.
- Header row: left `<p className="text-zinc-400 text-sm max-w-lg">{gallery.description || \`A glimpse into the vibrant life at ${name}.\`}</p>` (DYNAMIC); right "View All Photos →" button `href="#gallery"` `className="text-sm font-semibold border px-4 py-2" style={{ borderColor: accent, color: accent }}` (STATIC text).
- Filter tabs (STATIC, non-functional — D8): `flex flex-wrap gap-3 mb-8`, labels "All","Events","Sports","Academics", each `className="px-5 py-2 text-xs uppercase tracking-widest" style={{ backgroundColor: cat==="All" ? accent : "transparent", color: cat==="All" ? "#000" : accent, border: \`1px solid ${accent}\` }}`. Render as `<span>` (no interaction).
- Grid: `grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3`. For each `data.gallery_items` item: `div className="aspect-[4/3] overflow-hidden bg-zinc-950 relative group" style={{ border: \`${accent}15 1px solid\` }}` containing `<img src={img.image_url} alt={img.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition" loading="lazy" />` (eslint-disabled) and a hover overlay `absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 p-4 flex flex-col justify-end` with `{img.category && <p className="text-xs uppercase tracking-widest" style={{color:accent}}>{img.category}</p>}` and `<p className="text-white text-sm font-semibold">{img.title}</p>`.

### S7 — Testimonials (NO guard — wrap in a plain `<section>`, `bg-zinc-950`)
- Eyebrow (STATIC) `text="TESTIMONIALS"` gold. Heading (STATIC) "What Parents Say" white.
- `grid grid-cols-1 md:grid-cols-3 gap-6`. 3 STATIC cards (quote/name/role exactly):
  1. "The academic environment here is exceptional. My daughter has grown tremendously in both studies and character." — Priya Sharma — Parent of Grade 8 student
  2. "The teachers are dedicated and the school genuinely cares about every child's individual progress." — Rajesh Verma — Parent of Grade 5 student
  3. "Excellent infrastructure and holistic approach to education. Couldn't have made a better choice." — Sunita Patel — Parent of Grade 11 student
- Each card: `bg-zinc-900 p-7 border border-zinc-800`. 5 gold stars `<IconStar/>` `style={{ color: accent }}`. Big open-quote glyph `text-6xl leading-none mb-2 select-none style={{ color: \`${accent}40\` }}` `&ldquo;`. Quote `<p className="italic text-zinc-300 text-sm leading-relaxed mb-5">{quote}</p>`. Avatar: `w-10 h-10 rounded-full flex items-center justify-center font-bold style={{ backgroundColor: \`${accent}22\`, color: accent }}` showing `{name.charAt(0)}`. Name `text-white text-sm font-semibold`, role `text-zinc-500 text-xs`.

### S8 — CTA Band = admissions section (guard `admissions.show &&`, `id="admissions"`, `style={{ backgroundColor: accent }}` gold band) — D5
- `className="py-14 md:py-20 px-4 sm:px-6 text-center"`.
- Eyebrow (STATIC) "Take the Next Step" `style={{ color: "#000" }}` `className="text-xs tracking-[0.3em] uppercase font-semibold mb-3"`.
- Heading (DYNAMIC): `<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-black">{admissions.heading || "Give Your Child a Brighter Future"}</h2>` Georgia serif.
- Button "Apply Now →" (D7): `href="/login"`, dark button `className="inline-block px-8 py-3.5 text-sm font-semibold" style={{ backgroundColor: "#0a0a0a", color: "#fff" }}`.

### S9 — Contact (guard `contact.show &&`, `id="contact"`, `bg-zinc-950`)
- Eyebrow (STATIC) `text="GET IN TOUCH"` gold. Heading (DYNAMIC) `{contact.heading || "Contact Us"}` white. Sub (DYNAMIC) `{contact.description || "We welcome your enquiries. Reach out to us for admissions guidance or any other information."}` `text-zinc-400`.
- Grid `grid-cols-1 md:grid-cols-3 gap-6 md:gap-8`:
  - Col 1 (info, `space-y-4`): 4 rows, each `flex items-start gap-3`:
    - Address: `<IconMapPin/>`, text `{address || \`${city}, ${state}\`}` (DYNAMIC)
    - Phone: `<IconPhone/>`, text `{phone || "—"}` (DYNAMIC)
    - Email: `<IconMail/>`, text `{email || "—"}` (DYNAMIC)
    - Hours: `<IconClock/>`, text "Mon–Sat: 8:00 AM – 4:00 PM" (STATIC)
    Icon circle `w-9 h-9 rounded-full flex items-center justify-center style={{ backgroundColor: \`${accent}18\`, color: accent }}`; text `text-zinc-300 text-sm`.
  - Col 2 (map): `<iframe src="https://www.google.com/maps/embed?pb=...VERBATIM from §1f..." width="100%" height="100%" style={{ border: 0, display: "block", minHeight: "320px" }} allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" title="School Location" />` wrapped in a `div className="overflow-hidden h-full min-h-[320px]" style={{ border: \`${accent}25 1px solid\` }}`. Keep the `src` byte-for-byte.
  - Col 3 (form, STATIC controls — D8): a heading "Send Us a Message" `text-white font-bold mb-4`, then `input` (Name), `input` (Email), `input` (Phone), `select` (Select Program with options Pre-Primary/Primary/Middle School/Secondary/Senior Secondary), `textarea rows={3}` (Message), `button` "Submit Message →". Inputs: `className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none mb-3"`. Button: `className="w-full py-3 text-sm font-semibold" style={{ backgroundColor: accent, color: "#000" }}`. No `onChange`/`onClick`/`<form>` (mirrors ClassicLayout).

---

## 5. Constraint checklist (verify in item 3)

- [x] Dynamic data: name, city, state, phone, email, address, established_year, school_type referenced where applicable; `branding.accent_color` (gold) used; `branding.primary_color` not applied to body (zinc used) per D2.
- [x] `data.gallery_items[]` used for gallery grid, about image, and academics thumbnails.
- [x] `getSection()` kept verbatim; all section keys unchanged.
- [x] All 7 `*.show &&` guards kept (gallery keeps the `data.gallery_items && length>0` data guard).
- [x] Anchor IDs `about`, `academics`, `gallery`, `admissions`, `contact` present.
- [x] HeroSlider pattern kept exactly; NO admission enquiry card in hero.
- [x] Google Maps iframe `src` preserved verbatim (§1f).
- [x] No new npm packages; Tailwind + inline styles only.
- [x] No `"use client"`; file stays a server component.
- [x] `WebsiteShell` wrapper kept.
- [x] Fully responsive: mobile-first grids, `py-12 md:py-24`, `px-4 sm:px-6`.
- [x] Dark theme: `bg-zinc-950`/`bg-zinc-900`/`bg-zinc-800`; text `text-white`/`text-zinc-300`/`text-zinc-400`; `accent` for gold highlights/numbers/borders/buttons.
- [x] Hero overlay is a left-darker gradient (D11) so the banner image stays visible.

---

## 6. Notes & assumptions

- `tsconfig.sourcecheck.json` is a verification-only helper (extends the project tsconfig,
  excludes generated `.next`). It does not affect the app, build, or runtime. It exists so
  `npx tsc --noEmit` doesn't bail on the stale generated `.next/dev/types/validator.ts`
  parse error that currently masks other checks.
- The historical `revalidate/route.ts` TS2554 errors from the user's logs are already
  fixed in the current source (the route now passes 2 args) and are out of scope for this
  PremiumLayout redesign.
- "Watch Campus Tour" (S1) and the gallery filter tabs (S6) and contact form (S9) are
  presentational/decorative (no JS) to keep the file a server component, matching the
  existing `ClassicLayout.tsx` pattern. This adds no backend wiring and removes none.
