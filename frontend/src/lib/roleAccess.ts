import type { User, UserType } from "@/types/auth";

/**
 * Role-scoped navigation/module visibility.
 *
 * The dashboard shell is shared by all school users, but each user should only
 * see the modules their role grants. The backend computes each user's accessible
 * modules (union of their roles' granted modules ∩ modules enabled for the
 * school) and returns them on `user.modules`. This module is the single place
 * the frontend consults to decide visibility.
 *
 * `school_admin` and `super_admin` are unrestricted — they see every module the
 * sidebar offers (subject only to the school's enabled-modules check, which the
 * sidebar applies separately via the tenant store).
 */

/** Roles that see every module regardless of role grants. */
const UNRESTRICTED_ROLES: ReadonlySet<UserType> = new Set<UserType>([
  "super_admin",
  "school_admin",
]);

export function isUnrestrictedRole(userType: UserType | undefined | null): boolean {
  return !!userType && UNRESTRICTED_ROLES.has(userType);
}

/**
 * Returns true if a nav item guarded by `moduleKey` should be visible to the
 * given user. Items without a moduleKey are always visible to any logged-in
 * school user.
 */
export function isModuleAllowedForUser(
  user: User | undefined | null,
  moduleKey: string | undefined,
): boolean {
  // No module gate on the item → always visible.
  if (!moduleKey) return true;
  // Unknown user → hide guarded items (safe default).
  if (!user) return false;
  // Admins see everything.
  if (isUnrestrictedRole(user.user_type)) return true;
  // Everyone else: only modules the backend granted them.
  return (user.modules ?? []).includes(moduleKey);
}

/**
 * Maps a dashboard route to the module key that guards it. Used for route-level
 * protection (the sidebar only hides links; this stops direct URL access).
 *
 * Order matters: longer / more specific prefixes must come before shorter ones.
 * Routes not listed here (e.g. "/dashboard" itself, or profile pages) are
 * treated as always-allowed for any logged-in school user.
 */
const ROUTE_MODULE_PREFIXES: ReadonlyArray<readonly [string, string]> = [
  ["/dashboard/students", "students"],
  ["/dashboard/parents", "parents"],
  ["/dashboard/teachers", "teachers"],
  ["/dashboard/staff", "staff"],
  ["/dashboard/academics", "academics"],
  ["/dashboard/attendance", "attendance"],
  ["/dashboard/timetable", "timetable"],
  ["/dashboard/homework", "homework"],
  ["/dashboard/exams", "exams"],
  ["/dashboard/fees", "fees"],
  ["/dashboard/admissions", "admissions"],
  ["/dashboard/transport", "transport"],
  ["/dashboard/library", "library"],
  ["/dashboard/certificates", "certificates"],
  ["/dashboard/id-cards", "certificates"],
  ["/dashboard/notices", "notices"],
  ["/dashboard/reports", "reports"],
  ["/dashboard/website", "website"],
  ["/dashboard/settings", "settings"],
  ["/dashboard/audit-logs", "settings"],
];

/** Returns the module key guarding a dashboard route, or undefined if unguarded. */
export function moduleKeyForPath(pathname: string): string | undefined {
  for (const [prefix, moduleKey] of ROUTE_MODULE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return moduleKey;
    }
  }
  return undefined;
}

/**
 * Returns true if the given user is allowed to access the given dashboard route
 * (based on the module that guards it). Unguarded routes are allowed.
 */
export function isRouteAllowedForUser(
  user: User | undefined | null,
  pathname: string,
): boolean {
  return isModuleAllowedForUser(user, moduleKeyForPath(pathname));
}
