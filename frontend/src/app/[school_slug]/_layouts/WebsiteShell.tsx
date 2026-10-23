import React from "react";
import type { SchoolWebsiteData } from "@/types/website";
import { MobileNav } from "./MobileNav";

interface WebsiteShellProps {
  data: SchoolWebsiteData;
  children: React.ReactNode;
}

const DEFAULT_NAV = [
  { id: "about",      label: "About",      url: "#about",      parent_id: null, display_order: 1 },
  { id: "academics",  label: "Academics",  url: "#academics",  parent_id: null, display_order: 2 },
  { id: "admissions", label: "Admissions", url: "#admissions", parent_id: null, display_order: 3 },
  { id: "gallery",    label: "Gallery",    url: "#gallery",    parent_id: null, display_order: 4 },
  { id: "contact",    label: "Contact",    url: "#contact",    parent_id: null, display_order: 5 },
];

export function WebsiteShell({ data, children }: WebsiteShellProps) {
  const { branding, name, slug, phone, email, address } = data;
  const established_year = data.established_year;
  const primary = branding.primary_color;
  const isWhiteLabel = data.enabled_modules?.includes("white_label") ?? false;

  const navItems =
    data.navigation_menu && data.navigation_menu.length > 0
      ? data.navigation_menu.filter((n) => !n.parent_id)
      : DEFAULT_NAV;

  return (
    <div
      className="w-full min-w-0 block"
      style={
        {
          fontFamily: branding.font_family || "Inter, sans-serif",
          "--primary": primary,
          "--secondary": branding.secondary_color,
          "--accent": branding.accent_color,
        } as React.CSSProperties
      }
    >
      {/* Sticky Navbar */}
      <nav
        style={{ backgroundColor: primary }}
        className="sticky top-0 z-50 shadow-md relative backdrop-blur-sm bg-opacity-95 border-b border-white/20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo + School Name */}
          <div className="flex items-center gap-3">
            {branding.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logo_url}
                alt={name}
                className="h-10 w-10 object-contain rounded-lg bg-white p-0.5"
              />
            )}
            <a href="/" className="text-white font-bold text-xl hover:opacity-90 transition-opacity shadow-md">
              {name}
            </a>
          </div>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-6 text-white/90 text-sm font-medium">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.url ?? "#"}
                className="hover:opacity-100 opacity-80 transition-opacity duration-200"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Student Login — desktop */}
          {/* <a
            href="/login"
            style={{ backgroundColor: "white", color: primary }}
            className="hidden md:block px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Student Login
          </a> */}

          {/* Mobile hamburger menu — client component */}
          <MobileNav navItems={navItems} slug={slug} primaryColor={primary} />
        </div>
      </nav>

      {/* Page content */}
      <main className="w-full overflow-x-hidden">{children}</main>

      {/* Footer */}
      <footer style={{ backgroundColor: primary }} className="text-white">
        {/* Main footer content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Column 1: School name, tagline, social links */}
          <div>
            {branding.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logo_url}
                alt={name}
                className="h-12 w-12 object-contain rounded-lg bg-white p-1 mb-4"
              />
            )}
            <h3 className="font-bold text-xl mb-2">{name}</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              {branding.footer_text ||
                `Committed to academic excellence and holistic development since ${established_year ?? "our founding"}.`}
            </p>
            {/* Social links placeholders */}
            <div className="flex gap-3">
              {["f", "in", "tw", "yt"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 transition-colors flex items-center justify-center text-xs font-bold"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick links */}
          <div>
            <h4 className="font-semibold text-lg mb-4 pb-2 border-b border-white/20">Quick Links</h4>
            <ul className="space-y-2">
              {navItems.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <a
                    href={item.url ?? "#"}
                    className="text-white/70 text-sm hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span className="text-white/40">›</span> {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact info */}
          <div>
            <h4 className="font-semibold text-lg mb-4 pb-2 border-b border-white/20">Get In Touch</h4>
            <div className="space-y-3 text-sm text-white/70">
              {address && (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">📍</span>
                  <span>{address}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span>{phone}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-2">
                  <span>✉️</span>
                  <span>{email}</span>
                </div>
              )}
              {branding.support_phone && (
                <div className="flex items-center gap-2">
                  <span>🛠️</span>
                  <span>Support: {branding.support_phone}</span>
                </div>
              )}
              {branding.support_email && (
                <div className="flex items-center gap-2">
                  <span>📧</span>
                  <span>Support: {branding.support_email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-white/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-white/60 text-xs">
            <p>© {new Date().getFullYear()} {name}. All rights reserved.</p>
            {!isWhiteLabel && (
              <p>Powered by SchoolCMS</p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
