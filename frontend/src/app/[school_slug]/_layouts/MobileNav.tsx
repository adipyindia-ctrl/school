"use client";

import { useState } from "react";

interface NavItem {
  id: string;
  label: string;
  url: string | null;
  parent_id: string | null;
  display_order: number;
}

interface MobileNavProps {
  navItems: NavItem[];
  slug: string;
  primaryColor: string;
}

export function MobileNav({ navItems, slug, primaryColor }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Hamburger / close button */}
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        onClick={() => setOpen((prev) => !prev)}
        className="flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {open ? (
          /* X icon */
          <>
            <span
              className="block w-6 h-0.5 bg-white rotate-45 translate-y-2 transition-transform duration-200"
            />
            <span className="block w-6 h-0.5 bg-white opacity-0 transition-opacity duration-200" />
            <span
              className="block w-6 h-0.5 bg-white -rotate-45 -translate-y-2 transition-transform duration-200"
            />
          </>
        ) : (
          /* Hamburger icon */
          <>
            <span className="block w-6 h-0.5 bg-white transition-transform duration-200" />
            <span className="block w-6 h-0.5 bg-white transition-opacity duration-200" />
            <span className="block w-6 h-0.5 bg-white transition-transform duration-200" />
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          id="mobile-nav-menu"
          style={{ backgroundColor: primaryColor }}
          className="absolute top-full left-0 right-0 shadow-lg z-40 flex flex-col py-2"
        >
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.url ?? "#"}
              onClick={() => setOpen(false)}
              className="px-6 py-3 text-white/90 hover:text-white hover:bg-black/10 text-sm font-medium transition-colors"
            >
              {item.label}
            </a>
          ))}
          {/* <div className="border-t border-white/20 mt-2 pt-2 px-6 pb-3"> */}
            {/* <a
              href="/login"
              onClick={() => setOpen(false)}
              className="block text-center py-2 rounded-full bg-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ color: primaryColor }}
            >
              Student Login
            </a> */}
          {/* </div> */}
        </div>
      )}
    </div>
  );
}
