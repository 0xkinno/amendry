import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireTender, requireOwned } from "./lib/auth";
import { approvalState } from "./lib/validators";

/**
 * P3.6 (continued) — Submission packages.
 *
 * A submission package is never a bare `ready` boolean. Its status is
 * always accompanied by the revision it was computed against and a digest
 * that the offline verifier can recompute.
 */

/** List submission packages for a tender. */
export const list = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    return await ctx.db
      .query("submissionPackages")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .collect();
  },
});

/** Get the current (most recent) submission package. */
export const getCurrent = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    const rows = await ctx.db
      .query("submissionPackages")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .collect();
    return rows[0] ?? null;
  },
});

/** Create a new submission package. */
export const create = mutation({
  args: {
    tenderId: v.id("tenders"),
  },
  handler: async (ctx, args) => {
    const { tender, workspace } = await requireTender(ctx, args.tenderId);
    if (!tender.currentRevisionId) {
      throw new Error("Tender has no current revision.");
    }
    const now = Date.now();
    return await ctx.db.insert("submissionPackages", {
      tenderId: args.tenderId,
      workspaceId: workspace._id,
      revisionId: tender.currentRevisionId,
      status: "DRAFT",
      blockingRequirementIds: [],
      reasons: [],
      approvalState: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Approve a submission package (human approval). */
export const approve = mutation({
  args: {
    packageId: v.id("submissionPackages"),
  },
  handler: async (ctx, args) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) throw new Error("Package not found.");

    const now = Date.now();
    const APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;

    await ctx.db.patch(args.packageId, {
      approvalState: "approved",
      approvedAt: now,
      approvalExpiresAt: now + APPROVAL_TTL_MS,
      updatedAt: now,
    });

    await ctx.db.insert("proofEvents", {
      tenderId: pkg.tenderId,
      revisionId: pkg.revisionId,
      kind: "READY_GRANTED",
      summary: "Human approval granted for submission package.",
      detail: { digest: pkg.readinessDigest ?? undefined },
      seq: now,
      at: now,
    });
  },
});

/** Revoke approval on a submission package. */
export const revokeApproval = mutation({
  args: {
    packageId: v.id("submissionPackages"),
  },
  handler: async (ctx, args) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) throw new Error("Package not found.");

    await ctx.db.patch(args.packageId, {
      approvalState: "pending",
      approvedAt: undefined,
      approvedBy: undefined,
      approvalExpiresAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

/** Mark a package as sent. */
export const markSent = mutation({
  args: {
    packageId: v.id("submissionPackages"),
  },
  handler: async (ctx, args) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) throw new Error("Package not found.");

    const now = Date.now();
    await ctx.db.patch(args.packageId, {
      status: "SENT",
      sentAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("proofEvents", {
      tenderId: pkg.tenderId,
      revisionId: pkg.revisionId,
      kind: "PACKAGE_GENERATED",
      summary: "Submission package marked as sent.",
      detail: { digest: pkg.readinessDigest ?? undefined },
      seq: now,
      at: now,
    });
  },
});
