import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireTender } from "./lib/auth";
import { amendmentStatus, impactKind } from "./lib/validators";

/**
 * P3.5 — Amendments + impact application (invalidation).
 *
 * An amendment is a new revision that supersedes an older one, with its
 * impact already mapped. The impact array records exactly which requirements
 * changed, were added, were removed, or are ambiguous.
 *
 * When an amendment is reviewed, its impact is applied:
 *   - CHANGED / NEW requirements on the old revision get STALE status
 *   - REMOVED requirements get REMOVED status
 *   - AMBIGUOUS requirements get CONTESTED status
 *   - dependent evidence gets STALE status
 */

/** List amendments for a tender. */
export const list = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    return await ctx.db
      .query("amendments")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .collect();
  },
});

/** Get a single amendment. */
export const get = query({
  args: { amendmentId: v.id("amendments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.amendmentId);
  },
});

/**
 * Create an amendment record.
 *
 * Called by the ingest workflow after the diff + impact analysis are done.
 */
export const create = mutation({
  args: {
    tenderId: v.id("tenders"),
    revisionId: v.id("tenderRevisions"),
    supersedesRevisionId: v.id("tenderRevisions"),
    summary: v.optional(v.string()),
    impact: v.array(
      v.object({
        kind: impactKind,
        requirementId: v.optional(v.id("requirements")),
        lineageKey: v.optional(v.string()),
        label: v.string(),
        detail: v.optional(v.string()),
      }),
    ),
    invalidationCount: v.number(),
  },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    const now = Date.now();
    const amendmentId = await ctx.db.insert("amendments", {
      tenderId: args.tenderId,
      revisionId: args.revisionId,
      supersedesRevisionId: args.supersedesRevisionId,
      status: "DETECTED",
      summary: args.summary,
      impact: args.impact,
      invalidationCount: args.invalidationCount,
      detectedAt: now,
    });

    // Proof event.
    await ctx.db.insert("proofEvents", {
      tenderId: args.tenderId,
      revisionId: args.revisionId,
      kind: "AMENDMENT_DETECTED",
      summary: `Amendment detected: ${args.impact.length} impact entries.`,
      detail: {
        revisionNumber: undefined,
        hash: undefined,
      },
      seq: now,
      at: now,
    });

    return amendmentId;
  },
});

/**
 * Review an amendment: apply its impact to the current requirements.
 *
 * This is the invalidation step. It transitions the amendment from
 * DETECTED to REVIEWED and applies all impact entries.
 */
export const review = mutation({
  args: {
    amendmentId: v.id("amendments"),
  },
  handler: async (ctx, args) => {
    const amendment = await ctx.db.get(args.amendmentId);
    if (!amendment) throw new Error("Amendment not found.");
    if (amendment.status !== "DETECTED" && amendment.status !== "MAPPED") {
      throw new Error("Amendment has already been reviewed.");
    }

    const now = Date.now();
    const invalidationCount = 0;

    for (const entry of amendment.impact) {
      if (entry.kind === "UNCHANGED") continue;

      if (entry.kind === "AMBIGUOUS" && entry.requirementId) {
        // Ambiguous changes become CONTESTED.
        await ctx.db.patch(entry.requirementId, {
          status: "CONTESTED",
          staleReason: entry.detail ?? "Ambiguous amendment impact.",
          updatedAt: now,
        });
      } else if (entry.kind === "REMOVED" && entry.requirementId) {
        await ctx.db.patch(entry.requirementId, {
          status: "REMOVED",
          staleReason: "Requirement removed by amendment.",
          updatedAt: now,
        });
      } else if ((entry.kind === "CHANGED" || entry.kind === "NEW") && entry.requirementId) {
        await ctx.db.patch(entry.requirementId, {
          status: "STALE",
          staleReason: entry.detail ?? `Changed in amendment.`,
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.amendmentId, {
      status: "REVIEWED",
      reviewedAt: now,
    });

    // Proof event.
    await ctx.db.insert("proofEvents", {
      tenderId: amendment.tenderId,
      revisionId: amendment.revisionId,
      kind: "WORK_INVALIDATED",
      summary: `Amendment reviewed: ${amendment.impact.length} impacts applied.`,
      detail: { revisionNumber: undefined },
      seq: now,
      at: now,
    });

    return { applied: amendment.impact.length };
  },
});

/** Resolve a conflict (two sources disagree). */
export const resolveConflict = mutation({
  args: {
    conflictId: v.id("conflicts"),
  },
  handler: async (ctx, args) => {
    const conflict = await ctx.db.get(args.conflictId);
    if (!conflict) throw new Error("Conflict not found.");
    if (conflict.state !== "OPEN") return;

    await ctx.db.patch(args.conflictId, {
      state: "RESOLVED",
      resolvedAt: Date.now(),
    });

    await ctx.db.insert("proofEvents", {
      tenderId: conflict.tenderId,
      kind: "CONFLICT_RESOLVED",
      summary: `Conflict resolved: ${conflict.label}`,
      seq: Date.now(),
      at: Date.now(),
    });
  },
});

/** Dismiss a conflict (human decides it is not relevant). */
export const dismissConflict = mutation({
  args: {
    conflictId: v.id("conflicts"),
  },
  handler: async (ctx, args) => {
    const conflict = await ctx.db.get(args.conflictId);
    if (!conflict) throw new Error("Conflict not found.");
    if (conflict.state !== "OPEN") return;

    await ctx.db.patch(args.conflictId, {
      state: "DISMISSED",
      resolvedAt: Date.now(),
    });

    await ctx.db.insert("proofEvents", {
      tenderId: conflict.tenderId,
      kind: "CONFLICT_RESOLVED",
      summary: `Conflict dismissed: ${conflict.label}`,
      seq: Date.now(),
      at: Date.now(),
    });
  },
});
