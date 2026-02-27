// ─── Input Validation Utilities ────────────────────────────
// Used across API routes to validate user inputs and prevent abuse.

/** Prisma cuid format (default @id in schema) */
const CUID_REGEX = /^c[a-z0-9]{20,30}$/;

/** UUID v4 format */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate a database ID (cuid or UUID v4).
 * Use this for all [id] route params before querying the database.
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return CUID_REGEX.test(id) || UUID_V4_REGEX.test(id);
}

/**
 * Sanitize a search query string.
 * - Trims whitespace
 * - Limits length (default 200 chars)
 * - Strips < > to prevent HTML injection
 */
export function sanitizeSearchQuery(
  query: string,
  maxLength = 200
): string {
  if (!query || typeof query !== "string") return "";
  return query.trim().slice(0, maxLength).replace(/[<>]/g, "");
}

/**
 * Validate string length is within bounds.
 */
export function validateStringLength(
  value: string,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  if (!value || typeof value !== "string") {
    return { valid: false, error: `Must be at least ${min} characters` };
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    return { valid: false, error: `Must be at least ${min} characters` };
  }
  if (trimmed.length > max) {
    return { valid: false, error: `Must be at most ${max} characters` };
  }
  return { valid: true };
}

/**
 * Validate that a string is a valid HTTPS URL.
 */
export function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validate that a string is a valid URL (http or https).
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Validate and clamp pagination parameters.
 */
export function validatePaginationParams(
  page: string | null,
  limit: string | null,
  maxLimit = 50
): { page: number; limit: number } {
  const parsedPage = Math.max(1, parseInt(page || "1") || 1);
  const parsedLimit = Math.min(
    maxLimit,
    Math.max(1, parseInt(limit || "20") || 20)
  );
  return { page: parsedPage, limit: parsedLimit };
}
