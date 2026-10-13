import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NEXT_PUBLIC_APP_DOMAIN controls which domain is treated as the "main" platform domain.
// Subdomains of APP_DOMAIN are resolved by extracting the slug directly.
// Any other host (not APP_DOMAIN and not a known subdomain) is treated as a custom domain
// and resolved via the /api/v1/public/resolve?domain=<host> endpoint.
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost";

// Reserved slugs that must never be treated as school subdomains
const RESERVED_SLUGS = new Set(["www", "api", "admin", "super-admin"]);

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // Strip port for comparison (e.g. "localhost:3000" → "localhost")
  const hostWithoutPort = hostname.split(":")[0];

  // ── 1. Bare app domain / bare localhost — pass through (Super Admin / main site) ──
  if (hostWithoutPort === APP_DOMAIN || hostWithoutPort === "localhost") {
    return NextResponse.next();
  }

  // ── 2. Subdomain of APP_DOMAIN — extract slug and rewrite ──
  // e.g. "school-a.yourdomain.com" → slug = "school-a"
  if (hostWithoutPort.endsWith(`.${APP_DOMAIN}`)) {
    const slug = hostWithoutPort.slice(0, -(APP_DOMAIN.length + 1)).split(".")[0];

    if (RESERVED_SLUGS.has(slug)) {
      return NextResponse.next();
    }

    // Avoid double-rewriting
    if (url.pathname.startsWith(`/${slug}`)) {
      return NextResponse.next();
    }

    url.pathname = `/${slug}${url.pathname === "/" ? "" : url.pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set("x-school-slug", slug);
    return response;
  }

  // ── 3. Subdomain on localhost during development — e.g. "school-a.localhost:3000" ──
  if (hostWithoutPort.endsWith(".localhost")) {
    const slug = hostWithoutPort.slice(0, -(".localhost".length)).split(".")[0];

    if (RESERVED_SLUGS.has(slug)) {
      return NextResponse.next();
    }

    if (url.pathname.startsWith(`/${slug}`)) {
      return NextResponse.next();
    }

    url.pathname = `/${slug}${url.pathname === "/" ? "" : url.pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set("x-school-slug", slug);
    return response;
  }

  // ── 4. Custom domain — not the app domain and not a subdomain of it ──
  // e.g. "school.customdomain.com" — pass the full host in a header so downstream
  // pages/layouts can call /api/v1/public/resolve?domain=<host> to get the slug.
  const response = NextResponse.next();
  response.headers.set("x-custom-domain", hostname);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - api/ routes
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/).*)",
  ],
};
