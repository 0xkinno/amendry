import { describe, expect, it } from "vitest";
import { diffRequirements, isBlockingChange, summarizeDiff, type DiffableRequirement } from "../../convex/lib/revisionDiff";

const base: DiffableRequirement = {
  lineageKey: "insurance/public-liability",
  title: "Public liability insurance",
  body: "Provide certificates of currency for public liability cover.",
  structuredValue: "$2,000,000",
  status: "VERIFIED",
  mandatory: true,
};

describe("diffRequirements", () => {
  it("reports UNCHANGED for identical sets and suppresses them from .changes", () => {
    const r = diffRequirements([base], [base]);
    expect(r.unchangedCount).toBe(1);
    expect(r.changes).toEqual([]);
    expect(r.blockingChange).toBe(false);
    expect(summarizeDiff(r)).toBe("No requirement-level changes detected.");
  });

  it("detects a value change and reports the field-level diff", () => {
    const after = { ...base, structuredValue: "$5,000,000" };
    const r = diffRequirements([base], [after]);
    expect(r.changedCount).toBe(1);
    expect(r.blockingChange).toBe(true);
    const c = r.changes[0];
    expect(c?.outcome).toBe("CHANGED");
    expect(c?.fields).toEqual([{ field: "structuredValue", before: "$2,000,000", after: "$5,000,000" }]);
  });

  it("detects a title change", () => {
    const r = diffRequirements([base], [{ ...base, title: "Public & products liability insurance" }]);
    expect(r.changes[0]?.fields.some((f) => f.field === "title")).toBe(true);
  });

  it("detects a body change", () => {
    const r = diffRequirements([base], [{ ...base, body: "New wording." }]);
    expect(r.changes[0]?.fields.some((f) => f.field === "body")).toBe(true);
  });

  it("detects an added requirement", () => {
    const added: DiffableRequirement = {
      lineageKey: "submission/pricing-schedule",
      title: "Revised pricing schedule",
      status: "UNKNOWN",
      mandatory: true,
    };
    const r = diffRequirements([base], [base, added]);
    expect(r.addedCount).toBe(1);
    expect(r.changes[0]?.outcome).toBe("NEW");
    expect(r.blockingChange).toBe(true);
  });

  it("detects a removed requirement", () => {
    const r = diffRequirements([base, { ...base, lineageKey: "x", title: "X" }], [base]);
    expect(r.removedCount).toBe(1);
    expect(r.changes.find((c) => c.lineageKey === "x")?.outcome).toBe("REMOVED");
  });

  it("a changed NON-mandatory requirement is not a blocking change", () => {
    const optional: DiffableRequirement = { ...base, mandatory: false };
    const r = diffRequirements([optional], [{ ...optional, structuredValue: "$3,000,000" }]);
    expect(r.changedCount).toBe(1);
    expect(r.blockingChange).toBe(false);
  });

  it("an added NON-mandatory requirement is not a blocking change", () => {
    const added: DiffableRequirement = { ...base, lineageKey: "n", title: "Nice to have", mandatory: false };
    const r = diffRequirements([base], [base, added]);
    expect(r.addedCount).toBe(1);
    expect(r.blockingChange).toBe(false);
  });

  it("a mandatory line losing mandatory status is itself a blocking change", () => {
    const wasMandatory: DiffableRequirement = { ...base, mandatory: true };
    const nowOptional: DiffableRequirement = { ...base, mandatory: false, title: "Optional now" };
    const r = diffRequirements([wasMandatory], [nowOptional]);
    expect(r.blockingChange).toBe(true);
  });

  it("any AMBIGUOUS outcome forces a blocking change (fail closed)", () => {
    // The deterministic diff alone never emits AMBIGUOUS — that tag comes from
    // the impact mapper when the model cannot tell. Policy lives in
    // isBlockingChange so mapper and tests share one implementation.
    const ambiguous: DiffableRequirement = {
      ...base,
      lineageKey: "ambiguous",
      title: "Ambiguous clause",
      status: "UNKNOWN",
    };
    const r = diffRequirements([ambiguous], [ambiguous]);
    expect(r.ambiguousCount).toBe(0);
    expect(r.blockingChange).toBe(false); // nothing changed, so nothing blocks

    // The mapper tags the pair AMBIGUOUS (mandatory line):
    const tagged = [
      {
        outcome: "AMBIGUOUS" as const,
        before: ambiguous,
        after: ambiguous,
      },
    ];
    expect(isBlockingChange(tagged, 1)).toBe(true);

    // Even an ambiguous OPTIONAL line blocks: ambiguity is not a clean pass.
    const taggedOptional = [{ outcome: "AMBIGUOUS" as const, before: { ...ambiguous, mandatory: false }, after: { ...ambiguous, mandatory: false } }];
    expect(isBlockingChange(taggedOptional, 1)).toBe(true);
    expect(isBlockingChange(taggedOptional, 0)).toBe(false);
  });

  it("is order-insensitive", () => {
    const a = { ...base, lineageKey: "a", title: "A" };
    const b = { ...base, lineageKey: "b", title: "B" };
    const r1 = diffRequirements([a, b], [a, { ...b, title: "B2" }]);
    const r2 = diffRequirements([b, a], [{ ...b, title: "B2" }, a]);
    expect(r1.changedCount).toBe(r2.changedCount);
    expect(r1.changes.map((c) => c.lineageKey)).toEqual(r2.changes.map((c) => c.lineageKey));
  });

  it("treats whitespace differences as no change (normalization)", () => {
    const r = diffRequirements([base], [{ ...base, title: "  Public   liability   insurance " }]);
    expect(r.unchangedCount).toBe(1);
    expect(r.changes).toEqual([]);
  });

  it("summarizeDiff renders counts", () => {
    const r = diffRequirements(
      [base, { ...base, lineageKey: "n", title: "N" }],
      [{ ...base, structuredValue: "$5,000,000" }, { ...base, lineageKey: "n2", title: "N2" }],
    );
    const s = summarizeDiff(r);
    expect(s).toMatch(/1 requirement changed/);
    expect(s).toMatch(/1 added/);
    expect(s).toMatch(/1 removed/);
  });
});
