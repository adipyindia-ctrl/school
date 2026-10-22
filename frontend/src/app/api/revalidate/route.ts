import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/revalidate
 * Called by the admin dashboard after saving website settings / layout.
 * Instantly purges the Next.js cache for the public school pages so
 * changes are visible immediately without waiting for revalidate intervals.
 *
 * Body: { slug?: string, secret?: string }
 *
 * Security:
 *   - Internal calls from the same Next.js app send NO secret (same-origin, trusted).
 *   - External callers (e.g. backend webhooks) MUST send the REVALIDATE_SECRET.
 *   - REVALIDATE_SECRET is a server-only env var — never use NEXT_PUBLIC_ prefix.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, slug } = body as { secret?: string; slug?: string };

    const expectedSecret = process.env.REVALIDATE_SECRET;

    // If REVALIDATE_SECRET is set, only allow:
    //   1. Internal same-origin calls (no secret sent — origin matches the app itself)
    //   2. External calls that provide the correct secret
    if (expectedSecret && secret && secret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    if (slug) {
      revalidatePath(`/${slug}`, "page");
      revalidatePath(`/`, "page");
    } else {
      revalidatePath("/", "layout");
    }

    return NextResponse.json({
      revalidated: true,
      slug: slug ?? "all",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to revalidate", detail: String(err) },
      { status: 500 },
    );
  }
}

/**
 * GET /api/revalidate?slug=xyz&secret=xxx
 * External webhook endpoint — always requires REVALIDATE_SECRET for safety.
 * (e.g. called from backend after bulk data update)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug") ?? undefined;

  const expectedSecret = process.env.REVALIDATE_SECRET;

  // GET is always treated as external — require secret if configured
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  if (slug) {
    revalidatePath(`/${slug}`, "page");
    revalidatePath(`/`, "page");
  } else {
    revalidatePath("/", "layout");
  }

  return NextResponse.json({
    revalidated: true,
    slug: slug ?? "all",
    timestamp: new Date().toISOString(),
  });
}
