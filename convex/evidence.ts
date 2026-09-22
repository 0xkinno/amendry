import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireTender, requireOwned } from "./lib/auth";
import { evidenceType, verificationStatus } from "./lib/validators";

/**
 * P3.4 — Evidence + requirement↔evidence mapping.
 *
 * Evidence items are workspace-scoped (a certificate can back multiple
 * tenders). The requirementEvidence join table pins each mapping to the
 * revision that needed it, so a stale mapping is visible and auditably
 * invalid for readiness.
 */

/** List all evidence items for a tender. */
export const listByTender = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    return await ctx.db
      .query("evidenceItems")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .collect();
  },
});

/** List requirement↔evidence mappings for a tender. */
export const listMappings = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    return await ctx.db
      .query("requirementEvidence")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .collect();
  },
});

/** List mappings for a specific requirement. */
export const listByRequirement = query({
  args: { requirementId: v.id("requirements") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("requirementEvidence")
      .withIndex("by_requirement", (q) => q.eq("requirementId", args.requirementId))
      .collect();
  },
});

/** Get a single evidence item. */
export const get = query({
  args: { evidenceId: v.id("evidenceItems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.evidenceId);
  },
});

/** Create a new evidence item. */
export const create = mutation({
  args: {
    tenderId: v.id("tenders"),
    type: evidenceType,
    title: v.string(),
    source: v.optional(v.string()),
    body: v.optional(v.string()),
    owner: v.optional(v.string()),
    isFixture: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { tender, workspace } = await requireTender(ctx, args.tenderId);
    if (!tender.currentRevisionId) {
      throw new Error("Tender has no current revision.");
    }
    const now = Date.now();
    return await ctx.db.insert("evidenceItems", {
      tenderId: args.tenderId,
      workspaceId: workspace._id,
      type: args.type,
      title: args.title,
      source: args.source,
      body: args.body,
      revisionId: tender.currentRevisionId,
      verificationStatus: "UNVERIFIED",
      owner: args.owner,
      isFixture: args.isFixture,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Map evidence to a requirement. */
export const mapToRequirement = mutation({
  args: {
    requirementId: v.id("requirements"),
    evidenceId: v.id("evidenceItems"),
  },
  handler: async (ctx, args) => {
    const req = await ctx.db.get(args.requirementId);
    if (!req) throw new Error("Requirement not found.");
    const ev = await ctx.db.get(args.evidenceId);
    if (!ev) throw new Error("Evidence not found.");
    if (req.tenderId !== ev.tenderId) {
      throw new Error("Requirement and evidence belong to different tenders.");
    }

    // Check for existing mapping.
    const existing = await ctx.db
      .query("requirementEvidence")
      .withIndex("by_requirement", (q) => q.eq("requirementId", args.requirementId))
      .filter((q) => q.eq(q.field("evidenceId"), args.evidenceId))
      .first();

    if (existing) return existing._id;

    const now = Date.now();
    const mappingId = await ctx.db.insert("requirementEvidence", {
      tenderId: req.tenderId,
      requirementId: args.requirementId,
      evidenceId: args.evidenceId,
      revisionId: req.revisionId,
      status: "CURRENT",
      createdAt: now,
    });

    // Update the requirement's evidence count.
    await ctx.db.patch(args.requirementId, {
      currentEvidenceCount: req.currentEvidenceCount + 1,
      updatedAt: now,
    });

    return mappingId;
  },
});

/** Remove a requirement↔evidence mapping. */
export const unmap = mutation({
  args: {
    requirementId: v.id("requirements"),
    evidenceId: v.id("evidenceItems"),
  },
  handler: async (ctx, args) => {
    const mapping = await ctx.db
      .query("requirementEvidence")
      .withIndex("by_requirement", (q) => q.eq("requirementId", args.requirementId))
      .filter((q) => q.eq(q.field("evidenceId"), args.evidenceId))
      .first();

    if (!mapping) return;

    await ctx.db.delete(mapping._id);

    const req = await ctx.db.get(args.requirementId);
    if (req && req.currentEvidenceCount > 0) {
      await ctx.db.patch(args.requirementId, {
        currentEvidenceCount: req.currentEvidenceCount - 1,
        updatedAt: Date.now(),
      });
    }
  },
});

/** Verify an evidence item. */
export const verify = mutation({
  args: {
    evidenceId: v.id("evidenceItems"),
    status: verificationStatus,
  },
  handler: async (ctx, args) => {
    const ev = await ctx.db.get(args.evidenceId);
    if (!ev) throw new Error("Evidence not found.");
    await ctx.db.patch(args.evidenceId, {
      verificationStatus: args.status,
      verifiedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark all evidence for a revision as STALE.
 * Called when a new revision supersedes the old one.
 */
export const staleEvidenceForRevision = mutation({
  args: {
    tenderId: v.id("tenders"),
    revisionId: v.id("tenderRevisions"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    const items = await ctx.db
      .query("evidenceItems")
      .withIndex("by_revision", (q) => q.eq("revisionId", args.revisionId))
      .collect();

    const now = Date.now();
    for (const item of items) {
      await ctx.db.patch(item._id, {
        verificationStatus: "STALE",
        staleReason: args.reason,
        updatedAt: now,
      });
    }

    // Also mark the mappings as stale.
    const mappings = await ctx.db
      .query("requirementEvidence")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .collect();

    for (const m of mappings) {
      if (m.revisionId === args.revisionId) {
        await ctx.db.patch(m._id, { status: "STALE", staleReason: args.reason });
      }
    }
  },
});
