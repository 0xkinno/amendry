import { createHash } from "node:crypto";

/**
 * Content hashing and source normalization.
 *
 * Two hashes per snapshot, deliberately:
 *
 *   contentHash            sha256 of the raw bytes/markdown — proves we
 *                          fetched exactly this.
 *   normalizedSourceHash   sha256 after stripping the noise that would
 *                          otherwise create phantom revisions — proves the
 *                          *meaningful* content is or is not different.
 *
 * Normalization must never remove meaningful content. It strips whitespace
 * runs, tracking parameters, non-semantic timestamps and repeated
 * navigation boilerplate — nothing else. When in doubt, keep it: a phantom
 * revision is annoying, a missed amendment is the failure we exist to
 * prevent.
 */

const TRACKING_PARAM = /^(utm_|fbclid|gclid|mc_|ref|ref_src|igshid|vero_)/i;

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Strip query parameters that never change page meaning. */
export function normalizeUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    const keep = [...u.searchParams.entries()].filter(([k]) => !TRACKING_PARAM.test(k));
    keep.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    u.search = "";
    for (const [k, v] of keep) u.searchParams.append(k, v);
    u.hash = "";
    // Drop a trailing slash on the path root for stable comparison.
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.replace(/\/+$/, "");
    }
    return u.toString();
  } catch {
    return rawUrl;
  }
}

/** Collapse whitespace runs and trim. Keeps every character that matters. */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    // Collapse horizontal whitespace runs but keep line structure.
    .replace(/[ \t\f\v]+/g, " ")
    // Collapse 3+ blank lines to one.
    .replace(/\n{3,}/g, "\n\n")
    // Trim trailing spaces on each line.
    .replace(/[ \t]+$/gm, "")
    .trim();
}

/**
 * Remove navigation/boilerplate blocks that would otherwise register as a
 * change. Conservative: only drops lines that are pure link farms or pure
 * date stamps, and only when short.
 */
const NAV_LINE = /^\s*[-•*]?\s*\[?[^\]]{0,60}\]?\s*(home|about|contact|privacy|terms|cookie|login|sign in|menu)\s*$/i;
const BARE_TIMESTAMP = /^\s*(updated|posted|published)?\s*:?\s*\d{1,2}[:/]\d{2}([:/]\d{2})?\s*(am|pm)?\s*$/i;
const ISO_LINE = /^\s*\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?\s*$/;

export function stripBoilerplate(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      if (NAV_LINE.test(line)) return false;
      if (ISO_LINE.test(line)) return false;
      if (BARE_TIMESTAMP.test(line)) return false;
      return true;
    })
    .join("\n");
}

/** Full normalization pipeline used to decide whether a revision changed. */
export function normalizeSource(markdown: string): string {
  return normalizeText(stripBoilerplate(markdown));
}

export type SourceHashes = {
  contentHash: string;
  normalizedSourceHash: string;
};

/** Compute both hashes for one snapshot. */
export function hashSource(markdown: string): SourceHashes {
  const normalized = normalizeSource(markdown);
  return {
    // Raw hash first, so the raw reference is always provable.
    contentHash: sha256(markdown),
    normalizedSourceHash: sha256(normalized),
  };
}

/** Hash an arbitrary payload for idempotency keys and digests. */
export function hashPayload(payload: unknown): string {
  return sha256(stableStringify(payload));
}

/**
 * JSON.stringify with sorted keys, so two structurally identical objects
 * always produce the same digest regardless of insertion order.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

export { sha256 };
