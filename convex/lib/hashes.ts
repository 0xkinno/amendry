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

/**
 * Pure, environment-agnostic SHA-256 implementation conforming to FIPS PUB 180-4.
 * Runs synchronously in any JavaScript/V8 runtime without node:crypto dependencies.
 */
function sha256(input: string): string {
  const utf8 = unescape(encodeURIComponent(input));
  const words: number[] = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] = (words[i >> 2] ?? 0) | ((utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8));
  }

  const bitLen = utf8.length * 8;
  words[bitLen >> 5] = (words[bitLen >> 5] ?? 0) | (0x80 << (24 - (bitLen % 32)));
  const totalWords = (((bitLen + 64) >> 9) << 4) + 15;
  while (words.length < totalWords) {
    words.push(0);
  }
  words[totalWords] = bitLen;

  let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a;
  let H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19;

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const W = new Int32Array(64);

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) W[t] = (words[i + t] ?? 0) | 0;
    for (let t = 16; t < 64; t++) {
      const w15 = W[t - 15] ?? 0, w2 = W[t - 2] ?? 0;
      const s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
      const s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
      W[t] = ((W[t - 16] ?? 0) + s0 + (W[t - 7] ?? 0) + s1) | 0;
    }

    let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;

    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + (K[t] ?? 0) + (W[t] ?? 0)) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    H0 = (H0 + a) | 0;
    H1 = (H1 + b) | 0;
    H2 = (H2 + c) | 0;
    H3 = (H3 + d) | 0;
    H4 = (H4 + e) | 0;
    H5 = (H5 + f) | 0;
    H6 = (H6 + g) | 0;
    H7 = (H7 + h) | 0;
  }

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  return toHex(H0) + toHex(H1) + toHex(H2) + toHex(H3) + toHex(H4) + toHex(H5) + toHex(H6) + toHex(H7);
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
