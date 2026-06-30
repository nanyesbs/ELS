import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─────────────────────────────────────────────────────────────
// ELS App — Vercel Edge Middleware (rate limiting)
//
// Runs at the network edge before any request reaches the SPA.
// Protects two surfaces:
//
//  /sign-up  — POST spam / fake registration flood
//              Limit: 5 requests per IP per 15 minutes
//
//  /:token   — Token enumeration / brute-force attempts
//              Limit: 30 requests per IP per 15 minutes
//              (higher than sign-up: legitimate users may reload their
//               personal URL multiple times in a session)
//
// Note on per-token rate limiting (Security Point 5):
//   UUID v4 has 2^122 ≈ 5.3×10^36 possible values.
//   Even at 30 requests/15 min per IP, it would take ~10^33 years
//   to exhaust the token space. Brute-force is computationally
//   infeasible — per-IP limiting is sufficient for this threat model.
//   Per-token failure counting (e.g. lock after N invalid hits on same token)
//   would require persistent KV storage (Vercel KV / Redis).
//   Upgrade path: replace the in-memory Map with Vercel KV calls if needed.
// ─────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store — sufficient for single-region Edge deployments.
// For multi-region, replace with Vercel KV (Redis) for cross-edge persistence.
const store = new Map<string, RateLimitEntry>();

// UUID v4 pattern — only apply token rate-limit to UUID-shaped paths
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  'sign-up': { max: 5,  windowMs: 15 * 60 * 1000 },
  'token':   { max: 30, windowMs: 15 * 60 * 1000 },
};

function rateLimit(ip: string, bucket: string): boolean {
  const rule = LIMITS[bucket];
  if (!rule) return true;

  const key = `${ip}:${bucket}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + rule.windowMs });
    return true;
  }

  if (entry.count >= rule.max) return false;
  entry.count++;
  return true;
}

function tooManyResponse(): Response {
  return new NextResponse(
    JSON.stringify({
      error: 'Too many requests. Please wait and try again.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '900',
        'X-RateLimit-Reset': String(Date.now() + 15 * 60 * 1000),
      },
    }
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '0.0.0.0';

  // Rate-limit the sign-up form
  if (pathname === '/sign-up') {
    if (!rateLimit(ip, 'sign-up')) return tooManyResponse();
    return NextResponse.next();
  }

  // Rate-limit UUID-shaped token routes (/:token)
  // Named routes like /admin and /admin/login are excluded — only UUIDs match.
  const segment = pathname.slice(1); // strip leading /
  if (UUID_V4.test(segment)) {
    if (!rateLimit(ip, 'token')) return tooManyResponse();
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths; the function itself decides which ones to throttle.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
