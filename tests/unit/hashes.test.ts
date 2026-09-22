import { describe, expect, it } from "vitest";
import {
  hashSource,
  hashPayload,
  normalizeSource,
  normalizeText,
  normalizeUrl,
  sha256,
  stableStringify,
  stripBoilerplate,
} from "../../convex/lib/hashes";

describe("normalizeUrl", () => {
  it("drops tracking parameters", () => {
    expect(normalizeUrl("https://x.gov/t?utm_source=a&utm_medium=b&id=7")).toBe("https://x.gov/t?id=7");
  });
  it("drops fbclid / gclid / ref", () => {
    expect(normalizeUrl("https://x.gov/t?fbclid=1&gclid=2&ref=3")).toBe("https://x.gov/t");
  });
  it("drops the fragment", () => {
    expect(normalizeUrl("https://x.gov/t#section")).toBe("https://x.gov/t");
  });
  it("keeps meaningful query parameters", () => {
    expect(normalizeUrl("https://x.gov/t?notice=2026-14")).toBe("https://x.gov/t?notice=2026-14");
  });
  it("sorts surviving params so order is not a change", () => {
    expect(normalizeUrl("https://x.gov/t?b=2&a=1")).toBe(normalizeUrl("https://x.gov/t?a=1&b=2"));
  });
  it("trailing slash on root path is stable", () => {
    expect(normalizeUrl("https://x.gov/")).toBe("https://x.gov/");
  });
  it("returns input unchanged when unparseable", () => {
    expect(normalizeUrl("not a url")).toBe("not a url");
  });
});

describe("normalizeText", () => {
  it("normalizes CRLF to LF", () => {
    expect(normalizeText("a\r\nb")).toBe("a\nb");
  });
  it("collapses horizontal whitespace runs", () => {
    expect(normalizeText("a     b")).toBe("a b");
  });
  it("collapses 3+ blank lines to one", () => {
    expect(normalizeText("a\n\n\n\n\nb")).toBe("a\n\nb");
  });
  it("trims trailing spaces per line", () => {
    expect(normalizeText("a   \nb  ")).toBe("a\nb");
  });
  it("trims the whole string", () => {
    expect(normalizeText("  hi  ")).toBe("hi");
  });
  it("does NOT collapse meaningful single newlines", () => {
    expect(normalizeText("line1\nline2")).toBe("line1\nline2");
  });
});

describe("stripBoilerplate", () => {
  it("removes bare navigation lines", () => {
    expect(stripBoilerplate("Home\nSubmit\nPrivacy")).toBe("Submit");
  });
  it("removes ISO date-only lines", () => {
    expect(stripBoilerplate("2026-09-22\nKeep")).toBe("Keep");
    expect(stripBoilerplate("2026-09-22T10:00:00Z\nKeep")).toBe("Keep");
  });
  it("removes bare clock timestamps", () => {
    expect(stripBoilerplate("10:41\nKeep")).toBe("Keep");
    expect(stripBoilerplate("Updated: 9:30 am\nKeep")).toBe("Keep");
  });
  it("keeps a sentence that merely mentions a date", () => {
    expect(stripBoilerplate("The deadline is 2026-10-01 at noon.")).toBe(
      "The deadline is 2026-10-01 at noon.",
    );
  });
  it("keeps requirement content", () => {
    const t = "Provide valid public liability insurance of at least $2,000,000.";
    expect(stripBoilerplate(t)).toBe(t);
  });
});

describe("normalizeSource", () => {
  it("pipeline composes boilerplate strip + text normalize", () => {
    // "  Home  " is a nav line and "2026-09-22 " is a bare timestamp; both are
    // stripped. Trailing whitespace and the blank-line run collapse.
    const raw = "  Home  \n\n\n\nThe insurance threshold is $2,000,000.   \n2026-09-22 ";
    expect(normalizeSource(raw)).toBe("The insurance threshold is $2,000,000.");
  });

  it("keeps every meaningful line", () => {
    const raw = "R-014 Provide cover.\nR-015 Submit pricing.";
    expect(normalizeSource(raw)).toBe(raw);
  });
});

describe("hashSource", () => {
  it("returns two 64-char hex digests", () => {
    const h = hashSource("# Tender\n\nBody");
    expect(h.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(h.normalizedSourceHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("contentHash tracks the raw bytes while normalizedSourceHash tracks meaning", () => {
    // Raw has trailing whitespace, so the two hashes must differ...
    const raw = "R-014 Provide cover.  ";
    const h = hashSource(raw);
    expect(h.contentHash).not.toBe(h.normalizedSourceHash);
    // ...but the normalized hash equals the hash of the tidy version.
    expect(h.normalizedSourceHash).toBe(hashSource("R-014 Provide cover.").normalizedSourceHash);
  });

  it("contentHash differs when the raw text differs", () => {
    expect(hashSource("a").contentHash).not.toBe(hashSource("b").contentHash);
  });

  it("normalization makes tracking-only changes invisible", () => {
    const a = hashSource("# T\n\nDeadline 2026-10-01");
    const b = hashSource("# T\n\nDeadline 2026-10-01\n\n");
    expect(a.contentHash).not.toBe(b.contentHash);
    expect(a.normalizedSourceHash).toBe(b.normalizedSourceHash);
  });

  it("a real insurance change IS visible in the normalized hash", () => {
    const a = hashSource("Public liability: $2,000,000");
    const b = hashSource("Public liability: $5,000,000");
    expect(a.normalizedSourceHash).not.toBe(b.normalizedSourceHash);
  });

  it("whitespace-only change is invisible in the normalized hash", () => {
    const a = hashSource("R-014  Provide   cover.");
    const b = hashSource("R-014 Provide cover.");
    expect(a.normalizedSourceHash).toBe(b.normalizedSourceHash);
  });

  it("is deterministic", () => {
    expect(hashSource("x")).toEqual(hashSource("x"));
  });
});

describe("stableStringify / hashPayload", () => {
  it("is key-order insensitive", () => {
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }));
    expect(hashPayload({ a: 1, b: 2 })).toBe(hashPayload({ b: 2, a: 1 }));
  });
  it("distinguishes values", () => {
    expect(hashPayload({ a: 1 })).not.toBe(hashPayload({ a: 2 }));
  });
  it("drops undefined fields like a receipt would", () => {
    expect(stableStringify({ a: 1, b: undefined })).toBe(stableStringify({ a: 1 }));
  });
  it("handles nested arrays and objects", () => {
    expect(stableStringify({ z: [{ b: 1, a: 2 }] })).toBe(stableStringify({ z: [{ a: 2, b: 1 }] }));
  });
  it("handles null and primitives", () => {
    expect(stableStringify(null)).toBe("null");
    expect(stableStringify(3)).toBe("3");
    expect(stableStringify("s")).toBe('"s"');
  });
});

describe("sha256", () => {
  it("matches the canonical empty digest", () => {
    expect(sha256("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });
  it("matches the canonical abc digest", () => {
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
