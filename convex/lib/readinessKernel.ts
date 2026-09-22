/**
 * Pure deterministic readiness kernel.
 *
 * THE INVARIANT
 * -------------
 * A submission packet MUST NOT be `READY` when any mandatory requirement is
 * UNKNOWN, CONTESTED, STALE, SUPERSEDED, SOURCE_UNAVAILABLE, or derived from
 * a revision other than the current verified tender revision.
 *
 * This module has no I/O. No network, no model, no database, no clock, no
 * randomness, no hidden side effects. Given the same input it returns the
 * same output, forever. That is what makes the gate auditable and what makes
 * the race test meaningful: the check and the write that honors it happen in
 * one Convex mutation, so a concurrent revision advance either commits
 * before the check (kernel blocks) or after it (the package is immediately
 * STALE). It can never be observed as false-current-ready.
 *
 * States the kernel distinguishes (the UI may collapse some of them; this
 * model never does):
 *
 *   READY                every condition holds against currentRevisionId
 *   BLOCKED              at least one condition fails
 *   STALE                derived from an older revision
 *   UNKNOWN              requirement exists but is not yet verified
 *   CONTESTED            two sources disagree; a human must resolve it
 *   SOURCE_UNAVAILABLE   the source could not be read; we refuse to guess
 *   SUPERSEDED           replaced by a newer revision
 */

/** The seven states the kernel must be able to express. */
export const READINESS_STATES = [
  "READY",
  "BLOCKED",
  "STALE",
  "UNKNOWN",
  "CONTESTED",
  "SOURCE_UNAVAILABLE",
  "SUPERSEDED",
] as const;

export type ReadinessState = (typeof READINESS_STATES)[number];

/** Requirement states the kernel understands. Mirrors convex/lib/validators. */
export type RequirementStateKind =
  | "UNKNOWN"
  | "VERIFIED"
  | "STALE"
  | "CONTESTED"
  | "SUPERSEDED"
  | "SOURCE_UNAVAILABLE"
  | "REMOVED";

export type EvidenceStateKind = "CURRENT" | "STALE" | "MISSING" | "CONTESTED";

export type ConflictStateKind = "OPEN" | "RESOLVED" | "DISMISSED";

export type ApprovalState = "pending" | "approved" | "expired";

export type RequirementState = {
  id: string;
  lineageKey: string;
  title: string;
  mandatory: boolean;
  status: RequirementStateKind;
  /** The revision this requirement row was extracted from. */
  revisionId: string;
  /** Evidence currently mapped to this requirement. */
  evidence: EvidenceState[];
};

export type EvidenceState = {
  id: string;
  title: string;
  status: EvidenceStateKind;
  /** The revision this evidence was verified against. */
  revisionId: string;
  staleReason?: string;
};

export type ConflictState = {
  id: string;
  label: string;
  state: ConflictStateKind;
  revisionId?: string;
};

export type ReadinessInput = {
  currentRevisionId: string;
  requirements: RequirementState[];
  evidence: EvidenceState[];
  conflicts: ConflictState[];
  packageRevisionId: string | null;
  approvalState: ApprovalState;
  /**
   * Set false when the tender's source could not be read on the most recent
   * check. Absent/undefined means the source is fine — an outage is an
   * explicit state, never a default.
   */
  sourceUnavailable?: boolean;
};

export type BlockingReason = {
  code:
    | "PACKAGE_REVISION_MISMATCH"
    | "PACKAGE_MISSING"
    | "REQUIREMENT_NOT_VERIFIED"
    | "EVIDENCE_REVISION_MISMATCH"
    | "EVIDENCE_NOT_CURRENT"
    | "MANDATORY_EVIDENCE_MISSING"
    | "OPEN_CONFLICT"
    | "APPROVAL_MISSING"
    | "APPROVAL_EXPIRED"
    | "SOURCE_UNAVAILABLE";
  requirementId?: string;
  evidenceId?: string;
  conflictId?: string;
  message: string;
};

export type ReadinessResult =
  | {
      status: "READY";
      reasons: string[];
      blockingRequirementIds: [];
      revisionId: string;
      digest: string;
      blocking: [];
      coverage: { mandatory: number; verified: number; evidenceCurrent: number };
    }
  | {
      status: "BLOCKED";
      reasons: string[];
      blockingRequirementIds: string[];
      revisionId: string;
      digest: string;
      blocking: BlockingReason[];
      coverage: { mandatory: number; verified: number; evidenceCurrent: number };
    };

const APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Deterministic 64-bit-ish FNV-1a over a canonical string.
 *
 * Pure and dependency-free so it runs identically in the kernel, in tests,
 * and in scripts/verify-proof.mjs. Not a cryptographic hash — it exists to
 * fingerprint a *decision*, and the real content hashes live in lib/hashes.
 */
export function readinessDigest(parts: string[]): string {
  const input = parts.join("|");
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c + i, 2246822519) >>> 0;
  }
  let h3 = 0x9e3779b9;
  for (let i = input.length - 1; i >= 0; i--) {
    const c = input.charCodeAt(i);
    h3 = Math.imul(h3 ^ c, 3266489917) >>> 0;
  }
  return [h1, h2, h3].map((n) => n.toString(16).padStart(8, "0")).join("");
}

/**
 * Evaluate readiness. Total function: every input shape produces a result;
 * there is no throw path, because a crash inside the gate must not become a
 * silent pass.
 */
export function evaluateReadiness(input: ReadinessInput): ReadinessResult {
  const blocking: BlockingReason[] = [];
  const reasons: string[] = [];
  const blockingIds = new Set<string>();

  const currentRevisionId = input.currentRevisionId;

  // ── 0. Source outage is an explicit state, never a guess ──────────────
  if (input.sourceUnavailable === true) {
    blocking.push({
      code: "SOURCE_UNAVAILABLE",
      message:
        "The source could not be read on the latest check. Amendry refuses to certify a revision it cannot see.",
    });
    reasons.push("Source unavailable — latest check could not read the tender page.");
  }

  // ── 1. The package must be pinned to the current revision ─────────────
  if (input.packageRevisionId === null) {
    blocking.push({
      code: "PACKAGE_MISSING",
      message: "No submission package has been assembled for this tender yet.",
    });
    reasons.push("No submission package exists for the current revision.");
  } else if (input.packageRevisionId !== currentRevisionId) {
    blocking.push({
      code: "PACKAGE_REVISION_MISMATCH",
      message: `Package is pinned to revision ${input.packageRevisionId} but the current revision is ${currentRevisionId}.`,
    });
    reasons.push("Submission package is pinned to a superseded revision.");
  }

  // ── 2. Every mandatory requirement must be VERIFIED at this revision ──
  const mandatory = input.requirements.filter((r) => r.mandatory);
  let verifiedCount = 0;

  for (const req of mandatory) {
    if (req.revisionId !== currentRevisionId) {
      blockingIds.add(req.id);
      blocking.push({
        code: "EVIDENCE_REVISION_MISMATCH",
        requirementId: req.id,
        message: `Requirement "${req.title}" was derived from a non-current revision.`,
      });
      reasons.push(`Mandatory requirement "${req.title}" is not derived from the current revision.`);
      continue;
    }

    switch (req.status) {
      case "VERIFIED":
        verifiedCount++;
        break;
      case "STALE":
        blockingIds.add(req.id);
        blocking.push({
          code: "EVIDENCE_NOT_CURRENT",
          requirementId: req.id,
          message: `Requirement "${req.title}" is stale: the source changed after it was answered.`,
        });
        reasons.push(`Mandatory requirement "${req.title}" is stale.`);
        break;
      case "CONTESTED":
        blockingIds.add(req.id);
        blocking.push({
          code: "EVIDENCE_NOT_CURRENT",
          requirementId: req.id,
          message: `Requirement "${req.title}" is contested: two official sources disagree.`,
        });
        reasons.push(`Mandatory requirement "${req.title}" is contested.`);
        break;
      case "SUPERSEDED":
        blockingIds.add(req.id);
        blocking.push({
          code: "EVIDENCE_NOT_CURRENT",
          requirementId: req.id,
          message: `Requirement "${req.title}" was superseded by a newer revision.`,
        });
        reasons.push(`Mandatory requirement "${req.title}" is superseded.`);
        break;
      case "SOURCE_UNAVAILABLE":
        blockingIds.add(req.id);
        blocking.push({
          code: "EVIDENCE_NOT_CURRENT",
          requirementId: req.id,
          message: `Requirement "${req.title}" depends on a source that is currently unavailable.`,
        });
        reasons.push(`Mandatory requirement "${req.title}" depends on an unavailable source.`);
        break;
      case "UNKNOWN":
        blockingIds.add(req.id);
        blocking.push({
          code: "REQUIREMENT_NOT_VERIFIED",
          requirementId: req.id,
          message: `Requirement "${req.title}" has not been verified.`,
        });
        reasons.push(`Mandatory requirement "${req.title}" is not yet verified.`);
        break;
      case "REMOVED":
        // A removed mandatory requirement is not a gap: the current revision
        // no longer demands it. It must simply not be counted as coverage.
        break;
    }
  }

  // ── 3. Evidence backing a mandatory requirement must be current ───────
  let evidenceCurrentCount = 0;
  for (const req of mandatory) {
    if (req.status === "REMOVED" || req.revisionId !== currentRevisionId) continue;

    const linked = (input.evidence ?? []).filter((e) => e.id !== undefined);
    const reqEvidence = req.evidence;

    if (reqEvidence.length === 0) {
      blockingIds.add(req.id);
      blocking.push({
        code: "MANDATORY_EVIDENCE_MISSING",
        requirementId: req.id,
        message: `No evidence is mapped to mandatory requirement "${req.title}".`,
      });
      reasons.push(`No evidence mapped to mandatory requirement "${req.title}".`);
      continue;
    }

    for (const ev of reqEvidence) {
      if (ev.revisionId !== currentRevisionId) {
        blockingIds.add(req.id);
        blocking.push({
          code: "EVIDENCE_REVISION_MISMATCH",
          requirementId: req.id,
          evidenceId: ev.id,
          message: `Evidence "${ev.title}" was verified against a superseded revision.`,
        });
        reasons.push(`Evidence "${ev.title}" is not valid for the current revision.`);
        continue;
      }
      if (ev.status !== "CURRENT") {
        blockingIds.add(req.id);
        blocking.push({
          code: "EVIDENCE_NOT_CURRENT",
          requirementId: req.id,
          evidenceId: ev.id,
          message:
            ev.status === "MISSING"
              ? `Evidence "${ev.title}" is missing.`
              : ev.status === "CONTESTED"
                ? `Evidence "${ev.title}" is contested.`
                : `Evidence "${ev.title}" is stale${ev.staleReason ? `: ${ev.staleReason}` : "."}`,
        });
        reasons.push(
          ev.status === "MISSING"
            ? `Evidence "${ev.title}" is missing.`
            : `Evidence "${ev.title}" is not current.`,
        );
        continue;
      }
      evidenceCurrentCount++;
    }
  }

  // ── 4. Conflicts block. They are never silently resolved. ─────────────
  const openConflicts = (input.conflicts ?? []).filter((c) => c.state === "OPEN");
  for (const conflict of openConflicts) {
    blocking.push({
      code: "OPEN_CONFLICT",
      conflictId: conflict.id,
      message: `Unresolved conflict: ${conflict.label}.`,
    });
    reasons.push(`Unresolved conflict: ${conflict.label}.`);
    for (const req of mandatory) blockingIds.add(req.id);
  }

  // ── 5. A human must have approved, and the approval must not have aged out.
  if (input.approvalState === "pending") {
    blocking.push({
      code: "APPROVAL_MISSING",
      message: "Human approval is required before a packet can be marked ready.",
    });
    reasons.push("Human approval is missing.");
  } else if (input.approvalState === "expired") {
    blocking.push({
      code: "APPROVAL_EXPIRED",
      message: "The human approval on this packet has expired; re-approval is required.",
    });
    reasons.push("Human approval has expired.");
  }

  const coverage = {
    mandatory: mandatory.length,
    verified: verifiedCount,
    evidenceCurrent: evidenceCurrentCount,
  };

  const digest = readinessDigest([
    `revision:${currentRevisionId}`,
    `package:${input.packageRevisionId ?? "none"}`,
    `approval:${input.approvalState}`,
    `conflicts:${openConflicts.length}`,
    `source:${input.sourceUnavailable === true ? "unavailable" : "ok"}`,
    `mandatory:${mandatory.length}`,
    `verified:${verifiedCount}`,
    `evidenceCurrent:${evidenceCurrentCount}`,
    `blocking:${[...blockingIds].sort().join(",") || "none"}`,
    `reasons:${[...reasons].sort().join("~") || "none"}`,
  ]);

  if (blocking.length === 0) {
    return {
      status: "READY",
      reasons:
        reasons.length > 0
          ? reasons
          : [
              `Revision verified.`,
              `${verifiedCount}/${mandatory.length} mandatory requirements verified.`,
              "0 conflicts.",
              "0 stale evidence.",
              "Human approval present.",
            ],
      blockingRequirementIds: [],
      revisionId: currentRevisionId,
      digest,
      blocking: [],
      coverage,
    };
  }

  return {
    status: "BLOCKED",
    reasons,
    blockingRequirementIds: [...blockingIds].sort(),
    revisionId: currentRevisionId,
    digest,
    blocking,
    coverage,
  };
}

/** Convenience: is this exact input READY? Used by the mutation's fail-closed gate. */
export function isReady(input: ReadinessInput): boolean {
  return evaluateReadiness(input).status === "READY";
}

/**
 * Expiry helper kept pure so the mutation and the tests agree. An approval
 * older than the TTL is expired regardless of what the stored flag says.
 */
export function effectiveApprovalState(
  state: ApprovalState,
  approvedAt: number | null | undefined,
  now: number,
  ttlMs: number = APPROVAL_TTL_MS,
): ApprovalState {
  if (state !== "approved") return state;
  if (approvedAt === null || approvedAt === undefined) return "pending";
  if (now - approvedAt > ttlMs) return "expired";
  return "approved";
}
