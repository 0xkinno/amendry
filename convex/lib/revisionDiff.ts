import type { RequirementStateKind, EvidenceStateKind } from "./readinessKernel";

/**
 * Deterministic diff between two extracted requirement sets.
 *
 * Runs *before* any model call. The model never decides whether the source
 * changed — a hash does that. The model may then explain and classify what
 * this function already found.
 */

export type DiffableRequirement = {
  lineageKey: string;
  title: string;
  body?: string | undefined;
  structuredValue?: string | undefined;
  status: RequirementStateKind;
  /**
   * Whether the current revision makes this obligation mandatory. The diff
   * uses it to decide `blockingChange`: a change to an optional line is
   * informational, a change to a mandatory line invalidates dependent work.
   */
  mandatory: boolean;
  evidence?: Array<{ id: string; status: EvidenceStateKind; revisionId: string }>;
};

export type DiffOutcome = "UNCHANGED" | "CHANGED" | "NEW" | "REMOVED" | "AMBIGUOUS";

export type RequirementDiff = {
  lineageKey: string;
  outcome: DiffOutcome;
  before?: DiffableRequirement;
  after?: DiffableRequirement;
  /** Field-level detail for the editorial amendment timeline. */
  fields: Array<{ field: string; before?: string; after?: string }>;
};

export type DiffResult = {
  changes: RequirementDiff[];
  changedCount: number;
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
  ambiguousCount: number;
  /** True when at least one mandatory requirement changed or was added. */
  blockingChange: boolean;
};

function norm(v: string | undefined): string {
  return (v ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Compare two requirement sets keyed by stable lineage.
 *
 * `lineageKey` is the identity across revisions: the extractor derives a
 * stable key (category + normalized title) so R-014 in revision 3 is
 * recognizably the same obligation as R-014 in revision 8.
 */
export function diffRequirements(
  before: DiffableRequirement[],
  after: DiffableRequirement[],
): DiffResult {
  const beforeByKey = new Map(before.map((r) => [r.lineageKey, r]));
  const afterByKey = new Map(after.map((r) => [r.lineageKey, r]));
  const keys = [...new Set([...beforeByKey.keys(), ...afterByKey.keys()])].sort();

  const changes: RequirementDiff[] = [];

  for (const key of keys) {
    const b = beforeByKey.get(key);
    const a = afterByKey.get(key);

    if (b && !a) {
      changes.push({ lineageKey: key, outcome: "REMOVED", before: b, after: undefined, fields: [] });
      continue;
    }
    if (!b && a) {
      changes.push({ lineageKey: key, outcome: "NEW", before: undefined, after: a, fields: [] });
      continue;
    }
    if (!b || !a) continue; // unreachable; narrows for the checker

    const fields: RequirementDiff["fields"] = [];
    if (norm(b.title) !== norm(a.title)) {
      fields.push({ field: "title", before: b.title, after: a.title });
    }
    if (norm(b.body) !== norm(a.body)) {
      fields.push({ field: "body", before: b.body, after: a.body });
    }
    if (norm(b.structuredValue) !== norm(a.structuredValue)) {
      fields.push({
        field: "structuredValue",
        before: b.structuredValue,
        after: a.structuredValue,
      });
    }

    if (fields.length === 0) {
      changes.push({ lineageKey: key, outcome: "UNCHANGED", before: b, after: a, fields: [] });
    } else {
      changes.push({ lineageKey: key, outcome: "CHANGED", before: b, after: a, fields });
    }
  }

  const count = (o: DiffOutcome) => changes.filter((c) => c.outcome === o).length;
  const changedCount = count("CHANGED");
  const addedCount = count("NEW");
  const removedCount = count("REMOVED");
  const unchangedCount = count("UNCHANGED");
  const ambiguousCount = count("AMBIGUOUS");

  // A change to a mandatory line invalidates dependent work. A change to an
  // optional line is informational. Anything ambiguous blocks too: when the
  // extractor cannot tell, we fail closed rather than pass quietly.
  const blockingChange = isBlockingChange(changes, ambiguousCount);

  return {
    changes: changes.filter((c) => c.outcome !== "UNCHANGED"),
    changedCount,
    addedCount,
    removedCount,
    unchangedCount,
    ambiguousCount,
    blockingChange,
  };
}

/**
 * Does this set of changes invalidate dependent work?
 *
 * Exported so the impact mapper (which can add AMBIGUOUS classifications the
 * deterministic diff never produces on its own) and the tests share exactly
 * one policy:
 *
 *   - CHANGED / NEW / AMBIGUOUS on a mandatory line  -> blocks
 *   - any ambiguity at all                            -> blocks (fail closed)
 *   - a line that was mandatory and became optional   -> blocks (the
 *     obligation did not vanish, we just stopped recognizing it)
 */
export function isBlockingChange(
  changes: Array<{ outcome: DiffOutcome; before?: DiffableRequirement; after?: DiffableRequirement }>,
  ambiguousCount: number,
): boolean {
  if (ambiguousCount > 0) return true;
  return changes.some((c) => {
    if (c.outcome === "CHANGED" || c.outcome === "NEW" || c.outcome === "AMBIGUOUS") {
      if ((c.after?.mandatory ?? c.before?.mandatory) === true) return true;
    }
    if (c.outcome === "CHANGED" && c.before?.mandatory === true && c.after?.mandatory === false) {
      return true;
    }
    return false;
  });
}

/** Field-level summary sentence for the amendment timeline. */
export function summarizeDiff(diff: DiffResult): string {
  const parts: string[] = [];
  if (diff.changedCount > 0) parts.push(`${diff.changedCount} requirement${diff.changedCount === 1 ? "" : "s"} changed`);
  if (diff.addedCount > 0) parts.push(`${diff.addedCount} added`);
  if (diff.removedCount > 0) parts.push(`${diff.removedCount} removed`);
  if (diff.ambiguousCount > 0) parts.push(`${diff.ambiguousCount} ambiguous`);
  if (parts.length === 0) return "No requirement-level changes detected.";
  return parts.join(", ") + ".";
}
