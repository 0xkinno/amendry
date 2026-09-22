import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireTender } from "./lib/auth";
import { requirementStatus, requirementCategory } from "./lib/validators";

/**
 * P3.3 — Requirements CRUD + status transitions.
 *
 * Requirements are scoped to a revision. The current requirement set is
 * simply the rows where revisionId == tenders.currentRevisionId. Historical
 * requirements remain immutable — that is the read-only history guarantee.
 */

/** List current requirements for a tender. */
export const listCurrent = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    const { tender } = await requireTender(ctx, args.tenderId);
    if (!tender.currentRevisionId) return [];
    return await ctx.db
      .query("requirements")
      .withIndex("by_revision", (q) => q.eq("revisionId", tender.currentRevisionId!))
      .collect();
  },
});

/** List requirements for a specific revision (historical view). */
export const listByRevision = query({
  args: { revisionId: v.id("tenderRevisions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("requirements")
      .withIndex("by_revision", (q) => q.eq("revisionId", args.revisionId))
      .collect();
  },
});

/** Get a single requirement. */
export const get = query({
  args: { requirementId: v.id("requirements") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.requirementId);
  },
});

/**
 * Upsert a batch of extracted requirements for a revision.
 *
 * Called by the ingest workflow after OpenAI extraction. Each requirement
 * is keyed by lineageKey so it can be matched across revisions.
 */
export const upsertBatch = mutation({
  args: {
    tenderId: v.id("tenders"),
    revisionId: v.id("tenderRevisions"),
    requirements: v.array(
      v.object({
        lineageKey: v.string(),
        title: v.string(),
        body: v.optional(v.string()),
        category: requirementCategory,
        mandatory: v.boolean(),
        structuredValue: v.optional(v.string()),
        sourceReference: v.optional(v.string()),
        confidence: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    const now = Date.now();
    const insertedIds: string[] = [];

    for (const req of args.requirements) {
      // Check if a requirement with this lineageKey already exists for this revision.
      const existing = await ctx.db
        .query("requirements")
        .withIndex("by_tender_lineage", (q) =>
          q.eq("tenderId", args.tenderId).eq("lineageKey", req.lineageKey),
        )
        .filter((q) => q.eq(q.field("revisionId"), args.revisionId))
        .first();

      if (existing) {
        // Update in place (same revision, same lineage — this is safe).
        await ctx.db.patch(existing._id, {
          title: req.title,
          body: req.body,
          category: req.category,
          mandatory: req.mandatory,
          structuredValue: req.structuredValue,
          sourceReference: req.sourceReference,
          confidence: req.confidence,
          updatedAt: now,
        });
        insertedIds.push(existing._id);
      } else {
        const id = await ctx.db.insert("requirements", {
          tenderId: args.tenderId,
          revisionId: args.revisionId,
          key: req.lineageKey,
          title: req.title,
          body: req.body,
          category: req.category,
          mandatory: req.mandatory,
          structuredValue: req.structuredValue,
          sourceReference: req.sourceReference,
          confidence: req.confidence,
          status: "UNKNOWN",
          lineageKey: req.lineageKey,
          currentEvidenceCount: 0,
          createdAt: now,
          updatedAt: now,
        });
        insertedIds.push(id);
      }
    }

    // Proof event.
    const seq = Date.now();
    await ctx.db.insert("proofEvents", {
      tenderId: args.tenderId,
      revisionId: args.revisionId,
      kind: "REQUIREMENTS_EXTRACTED",
      summary: `${args.requirements.length} requirements extracted for revision.`,
      detail: { revisionNumber: undefined },
      seq,
      at: seq,
    });

    return insertedIds;
  },
});

/** Transition a requirement's status. */
export const updateStatus = mutation({
  args: {
    requirementId: v.id("requirements"),
    status: requirementStatus,
    staleReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const req = await ctx.db.get(args.requirementId);
    if (!req) throw new Error("Requirement not found.");
    await ctx.db.patch(args.requirementId, {
      status: args.status,
      ...(args.staleReason !== undefined && { staleReason: args.staleReason }),
      updatedAt: Date.now(),
    });
  },
});

/** Mark all requirements for a revision as SUPERSEDED. */
export const supersedeRevision = mutation({
  args: {
    tenderId: v.id("tenders"),
    revisionId: v.id("tenderRevisions"),
  },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    const reqs = await ctx.db
      .query("requirements")
      .withIndex("by_revision", (q) => q.eq("revisionId", args.revisionId))
      .collect();
    const now = Date.now();
    for (const req of reqs) {
      if (req.status !== "REMOVED") {
        await ctx.db.patch(req._id, { status: "SUPERSEDED", updatedAt: now });
      }
    }
  },
});

/** Invalidate requirements that were affected by an amendment. */
export const invalidate = mutation({
  args: {
    tenderId: v.id("tenders"),
    requirementIds: v.array(v.id("requirements")),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    const now = Date.now();
    for (const reqId of args.requirementIds) {
      const req = await ctx.db.get(reqId);
      if (!req || req.tenderId !== args.tenderId) continue;
      await ctx.db.patch(reqId, {
        status: "STALE",
        staleReason: args.reason,
        updatedAt: now,
      });
    }
  },
});
