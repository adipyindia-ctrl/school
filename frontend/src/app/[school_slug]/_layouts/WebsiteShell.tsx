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
  const primary = branding.primary_color;
  const isWhiteLabel = data.enabled_modules?.includes("white_label") ?? false;

  const navItems =
    data.navigation_menu && data.navigation_menu.length > 0
      ? data.navigation_menu.filter((n) => !n.parent_id)
      : DEFAULT_NAV;

  return (
    <div
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
        className="sticky top-0 z-50 shadow-md relative"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
            <a href="/" className="text-white font-bold text-xl hover:opacity-90 transition-opacity">
              {name}
            </a>
          </div>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-6 text-white/90 text-sm font-medium">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.url ?? "#"}
                className="hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Student Login — desktop */}
          <a
            href="/login"
            style={{ backgroundColor: "white", color: primary }}
            className="hidden md:block px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Student Login
          </a>

          {/* Mobile hamburger menu — client component */}
          <MobileNav navItems={navItems} slug={slug} primaryColor={primary} />
        </div>
      </nav>

      {/* Page content */}
      <main>{children}</main>

      {/* Footer */}
      <footer style={{ backgroundColor: primary }} className="px-6 py-10 text-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          <div>
            <p className="font-bold text-lg mb-1">{name}</p>
            <p className="text-white/70 text-sm">
              {branding.footer_text || `© ${new Date().getFullYear()} ${name}. All rights reserved.`}
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">Contact</p>
            {address && <p className="text-white/70 text-sm">{address}</p>}
            {phone && <p className="text-white/70 text-sm mt-0.5">{phone}</p>}
            {email && <p className="text-white/70 text-sm">{email}</p>}
          </div>
          <div>
            <p className="font-semibold mb-2">Quick Links</p>
            {navItems.slice(0, 5).map((item) => (
              <a
                key={item.id}
                href={item.url ?? "#"}
                className="block text-white/70 text-sm hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
