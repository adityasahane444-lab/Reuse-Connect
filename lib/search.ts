/**
 * Strip characters that have special meaning in PostgREST filter strings or LIKE patterns,
 * so user input can be interpolated into `.or(...)` safely.
 */
export function sanitizeSearch(input: string | null | undefined): string {
  return (input ?? "")
    .replace(/[,()"'\\%*_:{}\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** Tags are lowercase, hyphenated, [a-z0-9-] only. */
export function slugTag(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

export function parseTags(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : typeof input === "string" ? input.split(",") : [];
  const out = new Set<string>();
  for (const t of raw) {
    if (typeof t !== "string") continue;
    const s = slugTag(t);
    if (s) out.add(s);
    if (out.size >= 6) break;
  }
  return [...out];
}

export function parseCoord(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n * 1e6) / 1e6;
}

export const parseLat = (v: unknown) => parseCoord(v, -90, 90);
export const parseLng = (v: unknown) => parseCoord(v, -180, 180);
