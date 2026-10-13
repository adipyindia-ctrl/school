"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  School,
  CreditCard,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard",  href: "/super-admin/dashboard", icon: LayoutDashboard },
  { label: "Schools",    href: "/super-admin/schools",   icon: School },
  { label: "Plans",      href: "/super-admin/plans",     icon: CreditCard },
  { label: "Audit Logs", href: "/super-admin/audit",     icon: ClipboardList },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-700">
        <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-sm">
          SE
        </div>
        <div>
          <p className="font-semibold text-sm leading-tight">SchoolERP</p>
          <p className="text-xs text-slate-400">Super Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">SchoolERP v1.0.0</p>
      </div>
    </aside>
  );
}
