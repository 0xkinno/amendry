import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUserId, requireWorkspace, requireTender } from "./lib/auth";
import { requireSafeUrl } from "./lib/sourceSafety";
import { POLICY, DEFAULT_MONITOR_INTERVAL_MS } from "./lib/policy";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * P3.1 — Tenders: create / list / get + revision bootstrap.
 *
 * A tender is the top-level entity. It owns a single currentRevisionId pointer
 * that the entire readiness gate is gated on. Creating a tender also inserts
 * the first (empty) revision so the desk is never in a state where a tender
 * exists but has no revision chain.
 */

/** List tenders in the caller's workspace, newest first. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return await ctx.db.query("tenders").order("desc").collect();
    }
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!workspace) {
      return await ctx.db.query("tenders").order("desc").collect();
    }
    const rows = await ctx.db
      .query("tenders")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .order("desc")
      .collect();
    return rows;
  },
});

/** Get a single tender by id (workspace-scoped). */
export const get = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    const { tender } = await requireTender(ctx, args.tenderId);
    return tender;
  },
});

/** Get the current revision for a tender. */
export const getCurrentRevision = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    const { tender } = await requireTender(ctx, args.tenderId);
    if (!tender.currentRevisionId) return null;
    return await ctx.db.get(tender.currentRevisionId);
  },
});

/**
 * Create a tender and bootstrap its first revision.
 *
 * The initial revision is EMPTY — no content hash yet. It exists so the
 * revision chain is never null. The ingest workflow will fetch the source,
 * compute the hash, and advance this to a real INITIAL revision.
 */
export const create = mutation({
  args: {
    title: v.string(),
    buyerName: v.string(),
    sourceUrl: v.string(),
    jurisdiction: v.optional(v.string()),
    deadline: v.optional(v.string()),
    monitorIntervalMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const workspace = await requireWorkspace(ctx);
    const url = requireSafeUrl(args.sourceUrl);

    const now = Date.now();
    const mode = POLICY.AUTO_SCRAPE ? "LIVE" : "FIXTURE";

    // Insert the tender first so we have a valid tenderId for the revision.
    const tenderId = await ctx.db.insert("tenders", {
      workspaceId: workspace._id,
      title: args.title,
      buyerName: args.buyerName,
      sourceUrl: url,
      jurisdiction: args.jurisdiction,
      deadline: args.deadline,
      status: "INGESTING",
      sourceMode: mode,
      sourceState: "UNKNOWN",
      monitorIntervalMs: args.monitorIntervalMs ?? DEFAULT_MONITOR_INTERVAL_MS,
      currentRevisionId: undefined, // set below
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Bootstrap the first revision (empty, pending real fetch).
    const revisionId = await ctx.db.insert("tenderRevisions", {
      tenderId,
      revisionNumber: 1,
      kind: "INITIAL",
      contentHash: "",
      normalizedSourceHash: "",
      sourceUrl: url,
      discoveredAt: now,
      status: "PENDING",
      links: [],
      isFixture: false,
    });

    // Point the tender at its first revision.
    await ctx.db.patch(tenderId, { currentRevisionId: revisionId });

    // Audit event.
    await ctx.db.insert("auditEvents", {
      tenderId,
      workspaceId: workspace._id,
      actorId: userId,
      action: "TENDER_CREATED",
      detail: args.title,
      at: now,
    });

    return tenderId;
  },
});

/** Update mutable tender settings (title, buyer, deadline, monitor interval). */
export const update = mutation({
  args: {
    tenderId: v.id("tenders"),
    title: v.optional(v.string()),
    buyerName: v.optional(v.string()),
    deadline: v.optional(v.string()),
    jurisdiction: v.optional(v.string()),
    monitorIntervalMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { workspace } = await requireTender(ctx, args.tenderId);
    const userId = await requireUserId(ctx);
    const now = Date.now();

    await ctx.db.patch(args.tenderId, {
      ...(args.title !== undefined && { title: args.title }),
      ...(args.buyerName !== undefined && { buyerName: args.buyerName }),
      ...(args.deadline !== undefined && { deadline: args.deadline }),
      ...(args.jurisdiction !== undefined && { jurisdiction: args.jurisdiction }),
      ...(args.monitorIntervalMs !== undefined && { monitorIntervalMs: args.monitorIntervalMs }),
      updatedAt: now,
    });

    await ctx.db.insert("auditEvents", {
      tenderId: args.tenderId,
      workspaceId: workspace._id,
      actorId: userId,
      action: "TENDER_UPDATED",
      at: now,
    });
  },
});

/** Pause monitoring for a tender. */
export const pause = mutation({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    const { tender, workspace } = await requireTender(ctx, args.tenderId);
    const userId = await requireUserId(ctx);
    if (tender.status !== "MONITORING" && tender.status !== "INGESTING") return;
    await ctx.db.patch(args.tenderId, { status: "PAUSED", updatedAt: Date.now() });
    await ctx.db.insert("auditEvents", {
      tenderId: args.tenderId,
      workspaceId: workspace._id,
      actorId: userId,
      action: "TENDER_PAUSED",
      at: Date.now(),
    });
  },
});

/** Resume monitoring. */
export const resume = mutation({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    const { tender, workspace } = await requireTender(ctx, args.tenderId);
    const userId = await requireUserId(ctx);
    if (tender.status !== "PAUSED") return;
    await ctx.db.patch(args.tenderId, { status: "MONITORING", updatedAt: Date.now() });
    await ctx.db.insert("auditEvents", {
      tenderId: args.tenderId,
      workspaceId: workspace._id,
      actorId: userId,
      action: "TENDER_RESUMED",
      at: Date.now(),
    });
  },
});
