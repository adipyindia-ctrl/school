"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardList,
  DollarSign,
  FileText,
  Settings,
  Bell,
  UserCheck,
  ChevronDown,
  Building2,
  Bus,
  Library,
  Award,
  CreditCard,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenantStore } from "@/store/tenantStore";
import { useAuthStore } from "@/store/authStore";
import { isModuleAllowedForUser } from "@/lib/roleAccess";
import { useState } from "react";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  moduleKey?: string;
  permission?: string;
  children?: { label: string; href: string; moduleKey?: string }[];
}

const NAV_STRUCTURE: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "People",
    icon: Users,
    children: [
      { label: "Students", href: "/dashboard/students", moduleKey: "students" },
      { label: "Parents", href: "/dashboard/parents", moduleKey: "parents" },
      { label: "Teachers", href: "/dashboard/teachers", moduleKey: "teachers" },
      { label: "Staff", href: "/dashboard/staff", moduleKey: "staff" },
    ],
  },
  {
    label: "Academics",
    icon: BookOpen,
    children: [
      { label: "Sessions", href: "/dashboard/academics/sessions", moduleKey: "academics" },
      { label: "Classes", href: "/dashboard/academics/classes", moduleKey: "academics" },
      { label: "Sections", href: "/dashboard/academics/sections", moduleKey: "academics" },
      { label: "Subjects", href: "/dashboard/academics/subjects", moduleKey: "academics" },
    ],
  },
  { label: "Attendance", href: "/dashboard/attendance", icon: UserCheck, moduleKey: "attendance" },
  { label: "Timetable", href: "/dashboard/timetable", icon: CalendarDays, moduleKey: "timetable" },
  { label: "Homework", href: "/dashboard/homework", icon: ClipboardList, moduleKey: "homework" },
  {
    label: "Examinations",
    icon: GraduationCap,
    moduleKey: "exams",
    children: [
      { label: "Exams", href: "/dashboard/exams", moduleKey: "exams" },
      { label: "Marks", href: "/dashboard/exams/marks", moduleKey: "exams" },
      { label: "Results", href: "/dashboard/exams/results", moduleKey: "exams" },
    ],
  },
  {
    label: "Fees",
    icon: DollarSign,
    moduleKey: "fees",
    children: [
      { label: "Fee Structure", href: "/dashboard/fees/structure", moduleKey: "fees" },
      { label: "Collect Fee", href: "/dashboard/fees/collect", moduleKey: "fees" },
      { label: "Reports", href: "/dashboard/fees/reports", moduleKey: "fees" },
    ],
  },
  { label: "Admissions", href: "/dashboard/admissions", icon: FileText, moduleKey: "admissions" },
  { label: "Transport", href: "/dashboard/transport", icon: Bus, moduleKey: "transport" },
  { label: "Library", href: "/dashboard/library", icon: Library, moduleKey: "library" },
  { label: "Certificates", href: "/dashboard/certificates", icon: Award, moduleKey: "certificates" },
  { label: "ID Cards", href: "/dashboard/id-cards", icon: CreditCard, moduleKey: "certificates" },
  { label: "Notices", href: "/dashboard/notices", icon: Bell, moduleKey: "notices" },
  { label: "Reports", href: "/dashboard/reports", icon: FileText, moduleKey: "reports" },
  {
    label: "Website",
    icon: Building2,
    moduleKey: "website",
    children: [
      { label: "Website Builder", href: "/dashboard/website", moduleKey: "website" },
      { label: "Gallery", href: "/dashboard/website/gallery", moduleKey: "website" },
    ],
  },
  {
    label: "Administration",
    icon: Settings,
    moduleKey: "settings",
    children: [
      { label: "Settings", href: "/dashboard/settings", moduleKey: "settings" },
      { label: "Roles & Access", href: "/dashboard/settings/roles", moduleKey: "settings" },
      { label: "Users", href: "/dashboard/settings/users", moduleKey: "settings" },
      { label: "Audit Logs", href: "/dashboard/audit-logs", moduleKey: "settings" },
    ],
  },
];

function NavGroup({ item, query }: { item: NavItem; query: string }) {
  const pathname = usePathname();
  const { isModuleEnabled } = useTenantStore();
  const user = useAuthStore((s) => s.user);
  const [expanded, setExpanded] = useState(() =>
    item.children?.some((c) => pathname.startsWith(c.href)) ?? false
  );

  const q = query.trim().toLowerCase();
  const hasQuery = q.length > 0;
  const matches = (label: string) => label.toLowerCase().includes(q);
  const groupLabelMatches = hasQuery && matches(item.label);

  // An item is visible only when its module is enabled for the school AND
  // granted to the current user (via their role's modules).
  const canSee = (moduleKey?: string) =>
    (!moduleKey || isModuleEnabled(moduleKey)) &&
    isModuleAllowedForUser(user, moduleKey);

  if (!canSee(item.moduleKey)) return null;

  // Filter children by module access first, then by the search query. When the
  // group's own label matches the query, keep all of its accessible children.
  let visibleChildren = item.children?.filter((c) => canSee(c.moduleKey));
  if (hasQuery && visibleChildren && !groupLabelMatches) {
    visibleChildren = visibleChildren.filter((c) => matches(c.label));
  }

  if (item.children) {
    // A group with children: hide it entirely if none survive filtering.
    if (!visibleChildren?.length) return null;
  } else if (hasQuery && !matches(item.label)) {
    // A leaf item: hide it when it doesn't match the query.
    return null;
  }

  // While searching, expand any group that has matching children so results
  // are immediately visible.
  const isExpanded = hasQuery ? true : expanded;

  const Icon = item.icon;

  if (item.href && !item.children) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-white/10 text-white"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    );
  }

  const isGroupActive = visibleChildren?.some((c) => pathname.startsWith(c.href));

  return (
    <div>
      <button
        onClick={() => setExpanded((e) => !e)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isGroupActive
            ? "text-white"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            isExpanded ? "rotate-180" : ""
          )}
        />
      </button>
      {isExpanded && visibleChildren && (
        <div className="ml-7 mt-0.5 space-y-0.5">
          {visibleChildren.map((child) => {
            const isActive = pathname.startsWith(child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-white/10 text-white font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardSidebar() {
  const { tenant, isModuleEnabled } = useTenantStore();
  const isWhiteLabel = isModuleEnabled("white_label");
  const [query, setQuery] = useState("");

  const sidebarColor = (tenant?.branding as { sidebar_color?: string })?.sidebar_color || "#0f172a";
  const primaryColor = (tenant?.branding as { primary_color?: string })?.primary_color || "#1a73e8";

  return (
    <aside
      className="flex flex-col w-64 h-screen overflow-y-auto shrink-0 text-white sticky top-0"
      style={{ backgroundColor: sidebarColor }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {tenant?.name?.[0] ?? "S"}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">
            {tenant?.name ?? "School Portal"}
          </p>
          {!isWhiteLabel && (
            <p className="text-xs text-slate-400">School Portal</p>
          )}
        </div>
      </div>

      {/* Menu search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu..."
            aria-label="Search menu"
            className="w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_STRUCTURE.map((item) => (
          <NavGroup key={item.label} item={item} query={query} />
        ))}
      </nav>

      {/* Vendor branding footer — suppressed when white_label module is enabled */}
      {!isWhiteLabel && (
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs text-slate-500 text-center">Powered by SchoolERP</p>
        </div>
      )}
    </aside>
  );
}
