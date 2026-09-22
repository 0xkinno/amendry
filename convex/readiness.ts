import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireTender } from "./lib/auth";
import {
  evaluateReadiness,
  type ReadinessInput,
  type RequirementState,
  type EvidenceState,
  type ConflictState,
  type EvidenceStateKind,
} from "./lib/readinessKernel";
import { limits } from "./lib/rateLimit";

function mapEvidenceItemToState(e: Doc<"evidenceItems">): EvidenceState {
  let status: EvidenceStateKind = "CURRENT";
  if (e.verificationStatus === "STALE") {
    status = "STALE";
  } else if (e.verificationStatus === "REJECTED") {
    status = "CONTESTED";
  } else if (e.verificationStatus === "UNVERIFIED") {
    status = "MISSING";
  }
  return {
    id: e._id,
    title: e.title,
    status,
    revisionId: e.revisionId,
    staleReason: e.staleReason ?? undefined,
  };
}

function mapReqEvidence(
  m: Doc<"requirementEvidence">,
  ev: Doc<"evidenceItems"> | undefined,
): EvidenceState {
  let status: EvidenceStateKind = m.status as EvidenceStateKind;
  const staleReason = m.staleReason ?? ev?.staleReason ?? undefined;
  if (ev) {
    if (ev.verificationStatus === "STALE") {
      status = "STALE";
    } else if (ev.verificationStatus === "REJECTED") {
      status = "CONTESTED";
    } else if (ev.verificationStatus === "UNVERIFIED" && status === "CURRENT") {
      status = "MISSING";
    }
  }
  return {
    id: m.evidenceId,
    title: ev?.title ?? "Unknown",
    status,
    revisionId: m.revisionId,
    staleReason,
  };
}

/**
 * P3.6 — Readiness query/mutation (fail-closed gate) + submission packages.
 *
 * The readiness gate is the product's central invariant:
 *
 *   A submission packet MUST NOT be marked READY when any mandatory
 *   requirement is UNKNOWN, CONTESTED, STALE, SUPERSEDED,
 *   SOURCE_UNAVAILABLE, or derived from a revision other than the
 *   current verified tender revision.
 *
 * The check and the write that honors it happen in one Convex mutation,
 * so a concurrent revision advance either commits before the check
 * (kernel blocks) or after it (the package is immediately STALE).
 * It can never be observed as false-current-ready.
 */

/** Evaluate readiness for a tender. Read-only, rate-limited. */
export const evaluate = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    const { tender } = await requireTender(ctx, args.tenderId);
    if (!tender.currentRevisionId) {
      return {
        status: "BLOCKED" as const,
        reasons: ["No revision exists for this tender."],
        blockingRequirementIds: [],
        revisionId: null,
        digest: "",
        blocking: [
          {
            code: "PACKAGE_MISSING" as const,
            message: "No revision exists for this tender.",
          },
        ],
        coverage: { mandatory: 0, verified: 0, evidenceCurrent: 0 },
      };
    }

    // Load requirements for the current revision.
    const reqs = await ctx.db
      .query("requirements")
      .withIndex("by_revision", (q) => q.eq("revisionId", tender.currentRevisionId!))
      .collect();

    // Load evidence mappings for the current revision.
    const mappings = await ctx.db
      .query("requirementEvidence")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .collect();

    const evidenceItems = await ctx.db
      .query("evidenceItems")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .collect();

    // Load conflicts.
    const conflicts = await ctx.db
      .query("conflicts")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .collect();

    // Load the current submission package.
    const packages = await ctx.db
      .query("submissionPackages")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .collect();
    const currentPackage = packages[0] ?? null;

    // Build the readiness input.
    const requirementStates: RequirementState[] = reqs.map((r) => {
      const reqMappings = mappings.filter((m) => m.requirementId === r._id);
      const reqEvidence: EvidenceState[] = reqMappings.map((m) => {
        const ev = evidenceItems.find((e) => e._id === m.evidenceId);
        return mapReqEvidence(m, ev);
      });
      return {
        id: r._id,
        lineageKey: r.lineageKey,
        title: r.title,
        mandatory: r.mandatory,
        status: r.status as RequirementState["status"],
        revisionId: r.revisionId,
        evidence: reqEvidence,
      };
    });

    const conflictStates: ConflictState[] = conflicts.map((c) => ({
      id: c._id,
      label: c.label,
      state: c.state as ConflictState["state"],
      revisionId: c.revisionId ?? undefined,
    }));

    const input: ReadinessInput = {
      currentRevisionId: tender.currentRevisionId,
      requirements: requirementStates,
      evidence: evidenceItems.map(mapEvidenceItemToState),
      conflicts: conflictStates,
      packageRevisionId: currentPackage?.revisionId ?? null,
      approvalState: currentPackage?.approvalState ?? "pending",
      sourceUnavailable: tender.sourceState === "SOURCE_UNAVAILABLE",
    };

    return evaluateReadiness(input);
  },
});

/**
 * Force a readiness re-evaluation and update the submission package.
 *
 * This is the fail-closed gate: it re-runs the kernel and writes the
 * result to the package in one transaction.
 */
export const checkAndUpdate = mutation({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    const { tender } = await requireTender(ctx, args.tenderId);
    if (!tender.currentRevisionId) {
      throw new Error("Tender has no current revision.");
    }

    // Rate limit.
    await limits.limit(ctx, "readinessCheck", { key: args.tenderId });

    // Load everything the kernel needs.
    const reqs = await ctx.db
      .query("requirements")
      .withIndex("by_revision", (q) => q.eq("revisionId", tender.currentRevisionId!))
      .collect();

    const mappings = await ctx.db
      .query("requirementEvidence")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .collect();

    const evidenceItems = await ctx.db
      .query("evidenceItems")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .collect();

    const conflicts = await ctx.db
      .query("conflicts")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .collect();

    const packages = await ctx.db
      .query("submissionPackages")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .collect();
    const currentPackage = packages[0] ?? null;

    const requirementStates: RequirementState[] = reqs.map((r) => {
      const reqMappings = mappings.filter((m) => m.requirementId === r._id);
      const reqEvidence: EvidenceState[] = reqMappings.map((m) => {
        const ev = evidenceItems.find((e) => e._id === m.evidenceId);
        return mapReqEvidence(m, ev);
      });
      return {
        id: r._id,
        lineageKey: r.lineageKey,
        title: r.title,
        mandatory: r.mandatory,
        status: r.status as RequirementState["status"],
        revisionId: r.revisionId,
        evidence: reqEvidence,
      };
    });

    const conflictStates: ConflictState[] = conflicts.map((c) => ({
      id: c._id,
      label: c.label,
      state: c.state as ConflictState["state"],
      revisionId: c.revisionId ?? undefined,
    }));

    const input: ReadinessInput = {
      currentRevisionId: tender.currentRevisionId,
      requirements: requirementStates,
      evidence: evidenceItems.map(mapEvidenceItemToState),
      conflicts: conflictStates,
      packageRevisionId: currentPackage?.revisionId ?? null,
      approvalState: currentPackage?.approvalState ?? "pending",
      sourceUnavailable: tender.sourceState === "SOURCE_UNAVAILABLE",
    };

    const result = evaluateReadiness(input);
    const now = Date.now();
    const blockingReqIds = result.blockingRequirementIds as Id<"requirements">[];

    if (currentPackage) {
      await ctx.db.patch(currentPackage._id, {
        status: result.status === "READY" ? "READY" : "BLOCKED",
        revisionId: tender.currentRevisionId,
        readinessDigest: result.digest,
        blockingRequirementIds: blockingReqIds,
        reasons: result.reasons,
        updatedAt: now,
      });
    } else {
      // Create a new package.
      await ctx.db.insert("submissionPackages", {
        tenderId: args.tenderId,
        workspaceId: tender.workspaceId,
        revisionId: tender.currentRevisionId,
        status: result.status === "READY" ? "READY" : "BLOCKED",
        readinessDigest: result.digest,
        blockingRequirementIds: blockingReqIds,
        reasons: result.reasons,
        approvalState: "pending",
        createdAt: now,
        updatedAt: now,
      });
    }

    // Proof event.
    await ctx.db.insert("proofEvents", {
      tenderId: args.tenderId,
      revisionId: tender.currentRevisionId,
      kind: result.status === "READY" ? "READY_GRANTED" : "READY_REFUSED",
      summary:
        result.status === "READY"
          ? "Submission packet is READY."
          : `Submission packet is BLOCKED: ${result.reasons.length} reason(s).`,
      detail: {
        revisionNumber: undefined,
        hash: undefined,
        blocking: result.reasons,
        digest: result.digest,
      },
      seq: now,
      at: now,
    });

    return result;
  },
});
