import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow any HTTPS source — covers school logos, gallery images hosted on S3,
      // Cloudinary, or any other external URL the backend may return.
      {
        protocol: "https",
        hostname: "**",
      },
      // Allow HTTP for local/dev backend (e.g. localhost minio/uploads)
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Subdomain-based routing is handled by src/middleware.ts.
  // No additional rewrites needed here — middleware covers the rewrite logic.
  //
  // Domain strategy (controlled by NEXT_PUBLIC_APP_DOMAIN env var):
  //
  //   1. Subdomain routing — {slug}.APP_DOMAIN → middleware rewrites to /{slug}/...
  //      The x-school-slug header is set on the request for downstream use.
  //      Example: school-a.yourdomain.com → /school-a/dashboard
  //
  //   2. Custom domain routing — school.ownerdomain.com (not a subdomain of APP_DOMAIN)
  //      The middleware sets the x-custom-domain header with the full host.
  //      Pages/layouts call GET /api/v1/public/resolve?domain=<host> to get the slug
  //      and then render the correct school tenant.
  //      The school's CNAME record must point to {slug}.APP_DOMAIN for TLS termination.
  //
  //   Set NEXT_PUBLIC_APP_DOMAIN=localhost for local development (default).
  //   Set NEXT_PUBLIC_APP_DOMAIN=yourdomain.com in production.
};

export default nextConfig;
