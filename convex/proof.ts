import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireTender } from "./lib/auth";
import { proofKind } from "./lib/validators";

/**
 * P3.7 — Proof/audit events for every major state change.
 *
 * Append-only receipts. Drives the proof room and the offline verifier.
 * Never updated after insertion.
 */

/** List proof events for a tender, newest first. */
export const listByTender = query({
  args: {
    tenderId: v.id("tenders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("proofEvents")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .take(limit);
  },
});

/** List proof events by kind (cross-tender). */
export const listByKind = query({
  args: {
    kind: proofKind,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("proofEvents")
      .withIndex("by_kind", (q) => q.eq("kind", args.kind))
      .order("desc")
      .take(limit);
  },
});

/** List audit events for a workspace, newest first. */
export const listAudit = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject as any;
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!workspace) return [];
    const limit = args.limit ?? 100;
    return await ctx.db
      .query("auditEvents")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .order("desc")
      .take(limit);
  },
});

/** Get the latest proof event for a tender (summary view). */
export const latest = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    return await ctx.db
      .query("proofEvents")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .first();
  },
});

/** Record a proof event. */
export const record = mutation({
  args: {
    tenderId: v.optional(v.id("tenders")),
    revisionId: v.optional(v.id("tenderRevisions")),
    kind: proofKind,
    summary: v.string(),
    detail: v.optional(
      v.object({
        revisionNumber: v.optional(v.number()),
        hash: v.optional(v.string()),
        source: v.optional(v.string()),
        blocking: v.optional(v.array(v.string())),
        digest: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("proofEvents", {
      ...args,
      seq: now,
      at: now,
    });
  },
});

/** Get live proof dashboard metrics across the system. */
export const getProofDashboard = query({
  args: {},
  handler: async (ctx) => {
    const tenders = await ctx.db.query("tenders").collect();
    const revisions = await ctx.db.query("tenderRevisions").collect();
    const proofEvents = await ctx.db.query("proofEvents").order("desc").take(50);
    const clarifications = await ctx.db.query("clarifications").collect();

    const activeTenders = tenders.filter((t) => t.status === "MONITORING" || t.status === "INGESTING");
    const totalRevisions = revisions.length;
    const totalProofEvents = proofEvents.length;
    const outboundActions = clarifications.filter(
      (c) => c.status === "SENT" || c.status === "ANSWERED" || c.status === "APPROVED",
    ).length;

    return {
      activeTendersCount: activeTenders.length || tenders.length,
      totalRevisionsCount: totalRevisions,
      totalProofEventsCount: totalProofEvents,
      outboundActionsCount: outboundActions,
      recentEvents: proofEvents.slice(0, 20),
      tenders: tenders.map((t) => ({
        _id: t._id,
        title: t.title,
        buyerName: t.buyerName,
        status: t.status,
        currentRevisionId: t.currentRevisionId,
      })),
    };
  },
});
