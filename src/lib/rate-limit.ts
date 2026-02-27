import { NextRequest, NextResponse } from "next/server";

// ─── In-Memory Sliding Window Rate Limiter ─────────────────

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const WINDOW_MS = 60_000; // 1 minute sliding window

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
      entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
      if (entry.timestamps.length === 0) rateLimitStore.delete(key);
    });
  }, CLEANUP_INTERVAL);
}

// ─── Tiers ─────────────────────────────────────────────────

export type RateLimitTier = "auth" | "write" | "read";

const TIER_LIMITS: Record<RateLimitTier, number> = {
  auth: 10, // 10 req/min — sensitive endpoints (delete, export, admin, webhooks)
  write: 30, // 30 req/min — write operations (votes, profile updates, API keys)
  read: 60, // 60 req/min — read operations (GET endpoints)
};

// ─── Core ──────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  identifier: string,
  tier: RateLimitTier
): RateLimitResult {
  const key = `${tier}:${identifier}`;
  const now = Date.now();
  const limit = TIER_LIMITS[tier];

  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + WINDOW_MS,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetAt: now + WINDOW_MS,
  };
}

// ─── Helpers for API routes ────────────────────────────────

/** Extract client identifier from request (IP or forwarded IP) */
export function getRateLimitIdentifier(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Return a 429 Too Many Requests response with Retry-After header */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "X-RateLimit-Remaining": String(result.remaining),
        "Retry-After": String(
          Math.ceil((result.resetAt - Date.now()) / 1000)
        ),
      },
    }
  );
}

/**
 * One-liner rate limit check for API routes.
 * Returns a NextResponse (429) if rate limited, or null if allowed.
 *
 * Usage:
 *   const blocked = applyRateLimit(req, "write");
 *   if (blocked) return blocked;
 */
export function applyRateLimit(
  req: NextRequest,
  tier: RateLimitTier,
  userId?: string
): NextResponse | null {
  const identifier = userId || getRateLimitIdentifier(req);
  const result = checkRateLimit(identifier, tier);
  if (!result.allowed) return rateLimitResponse(result);
  return null;
}
