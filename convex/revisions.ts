import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireTender } from "./lib/auth";
import { revisionKind, revisionStatus } from "./lib/validators";

/**
 * P3.2 — Revisions: create / advance / supersede + proof events.
 *
 * Revisions are immutable content snapshots. The only mutable field is
 * `status`, which transitions:
 *
 *   PENDING  -> CURRENT          (the source was fetched and verified)
 *   CURRENT  -> SUPERSEDED       (a newer revision replaced it)
 *   PENDING  -> SOURCE_UNAVAILABLE (the fetch failed)
 *   CURRENT  -> SOURCE_UNAVAILABLE (the recheck failed)
 *
 * `currentRevisionId` on the tender is the single pointer the readiness
 * gate uses. Advancing it is always a transactional mutation.
 */

/** List all revisions for a tender, newest first. */
export const list = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    return await ctx.db
      .query("tenderRevisions")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .collect();
  },
});

/** Get a single revision. */
export const get = query({
  args: { revisionId: v.id("tenderRevisions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.revisionId);
  },
});

/**
 * Advance the tender's current revision.
 *
 * Called by the ingest workflow after Firecrawl fetch + OpenAI extraction
 * have confirmed that the content hash differs from the current one.
 *
 * This mutation:
 *   1. Supersedes the old current revision
 *   2. Marks the new revision as CURRENT
 *   3. Points the tender at the new revision
 *   4. Records a proof event
 *
 * All in one transaction — the race test depends on this.
 */
export const advance = mutation({
  args: {
    tenderId: v.id("tenders"),
    newRevisionId: v.id("tenderRevisions"),
    changeSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tender } = await requireTender(ctx, args.tenderId);

    const newRev = await ctx.db.get(args.newRevisionId);
    if (!newRev || newRev.tenderId !== args.tenderId) {
      throw new Error("Revision does not belong to this tender.");
    }

    const now = Date.now();
    const oldRevisionId = tender.currentRevisionId;

    // 1. Supersede the old current revision (if one exists and is different).
    if (oldRevisionId && oldRevisionId !== args.newRevisionId) {
      const oldRev = await ctx.db.get(oldRevisionId);
      if (oldRev && oldRev.status === "CURRENT") {
        await ctx.db.patch(oldRevisionId, { status: "SUPERSEDED" });
      }
    }

    // 2. Mark the new revision as CURRENT.
    await ctx.db.patch(args.newRevisionId, {
      status: "CURRENT",
      changeSummary: args.changeSummary,
    });

    // 3. Point the tender at the new revision.
    await ctx.db.patch(args.tenderId, {
      currentRevisionId: args.newRevisionId,
      sourceState: "CURRENT",
      lastVerifiedAt: now,
      updatedAt: now,
    });

    // 4. Proof event.
    const seq = now;
    await ctx.db.insert("proofEvents", {
      tenderId: args.tenderId,
      revisionId: args.newRevisionId,
      kind: "REVISION_CREATED",
      summary: `Revision ${newRev.revisionNumber} created.`,
      detail: {
        revisionNumber: newRev.revisionNumber,
        hash: newRev.normalizedSourceHash,
        source: newRev.sourceUrl,
      },
      seq,
      at: now,
    });

    // 5. Audit event.
    await ctx.db.insert("auditEvents", {
      tenderId: args.tenderId,
      action: "REVISION_ADVANCED",
      detail: `Revision ${newRev.revisionNumber} is now current.`,
      at: now,
    });

    return args.newRevisionId;
  },
});

/**
 * Record a source outage on the current revision.
 *
 * The tender's sourceState becomes SOURCE_UNAVAILABLE and the revision's
 * status is set to SOURCE_UNAVAILABLE. No revision is created — we refuse
 * to guess whether the content changed.
 */
export const markSourceUnavailable = mutation({
  args: {
    tenderId: v.id("tenders"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const { tender } = await requireTender(ctx, args.tenderId);
    const now = Date.now();

    // Update the tender's source state.
    await ctx.db.patch(args.tenderId, {
      sourceState: "SOURCE_UNAVAILABLE",
      lastCheckedAt: now,
      error: args.error,
      updatedAt: now,
    });

    // If there's a current revision that was PENDING, mark it.
    if (tender.currentRevisionId) {
      const rev = await ctx.db.get(tender.currentRevisionId);
      if (rev && rev.status === "PENDING") {
        await ctx.db.patch(tender.currentRevisionId, {
          status: "SOURCE_UNAVAILABLE",
          sourceError: args.error,
        });
      }
    }

    // Proof event.
    const seq = now;
    await ctx.db.insert("proofEvents", {
      tenderId: args.tenderId,
      kind: "SOURCE_UNAVAILABLE",
      summary: `Source unavailable: ${args.error}`,
      detail: { source: tender.sourceUrl },
      seq,
      at: now,
    });
  },
});

/** Record a heartbeat (source checked, no change detected). */
export const heartbeat = mutation({
  args: {
    tenderId: v.id("tenders"),
    sourceEventId: v.id("sourceEvents"),
  },
  handler: async (ctx, args) => {
    const { tender } = await requireTender(ctx, args.tenderId);
    const now = Date.now();
    await ctx.db.patch(args.tenderId, {
      sourceState: "UNCHANGED",
      lastCheckedAt: now,
      lastVerifiedAt: now,
      error: undefined,
      updatedAt: now,
    });
  },
});

/**
 * Create a new revision record (called by the ingest action before
 * advancing). This is a separate step so the workflow can record the
 * revision before the advance transaction.
 */
export const create = mutation({
  args: {
    tenderId: v.id("tenders"),
    revisionNumber: v.number(),
    kind: revisionKind,
    contentHash: v.string(),
    normalizedSourceHash: v.string(),
    sourceUrl: v.string(),
    canonicalUrl: v.optional(v.string()),
    documentTitle: v.optional(v.string()),
    firecrawlRunId: v.optional(v.string()),
    rawReference: v.optional(v.string()),
    markdown: v.optional(v.string()),
    links: v.array(v.string()),
    supersedesRevisionId: v.optional(v.id("tenderRevisions")),
    isFixture: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    const now = Date.now();
    return await ctx.db.insert("tenderRevisions", {
      ...args,
      discoveredAt: now,
      status: "PENDING",
    });
  },
});
