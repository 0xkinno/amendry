import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireTender, requireOwned } from "./lib/auth";
import { clarificationStatus } from "./lib/validators";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * P4.3 — Clarifications: draft, approve, send workflow.
 *
 * A clarification is an outbound email to the buyer asking about an
 * ambiguity or requesting confirmation of a changed requirement.
 *
 * Flow:
 *   DRAFT -> PENDING_APPROVAL -> APPROVED -> SENDING -> SENT
 *                                                         |
 *                                                    ANSWERED (when reply arrives)
 *
 * AUTO_SEND is OFF by default — a human must approve every outbound email.
 */

/** List clarifications for a tender. */
export const list = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    return await ctx.db
      .query("clarifications")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .collect();
  },
});

/** Get a single clarification. */
export const get = query({
  args: { clarificationId: v.id("clarifications") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.clarificationId);
  },
});

/** Create a clarification (DRAFT). */
export const create = mutation({
  args: {
    tenderId: v.id("tenders"),
    requirementId: v.optional(v.id("requirements")),
    subject: v.string(),
    body: v.string(),
    toAddress: v.string(),
    isDemoBuyer: v.boolean(),
    draftModel: v.optional(v.string()),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const { tender, workspace } = await requireTender(ctx, args.tenderId);
    if (!tender.currentRevisionId) {
      throw new Error("Tender has no current revision.");
    }
    const now = Date.now();
    return await ctx.db.insert("clarifications", {
      tenderId: args.tenderId,
      workspaceId: workspace._id,
      requirementId: args.requirementId,
      revisionId: tender.currentRevisionId,
      subject: args.subject,
      body: args.body,
      toAddress: args.toAddress,
      status: "DRAFT",
      isDemoBuyer: args.isDemoBuyer,
      draftModel: args.draftModel,
      idempotencyKey: args.idempotencyKey,
      createdAt: now,
    });
  },
});

/** Submit a clarification for human approval. */
export const submitForApproval = mutation({
  args: { clarificationId: v.id("clarifications") },
  handler: async (ctx, args) => {
    const clar = await ctx.db.get(args.clarificationId);
    if (!clar) throw new Error("Clarification not found.");
    if (clar.status !== "DRAFT") {
      throw new Error("Only DRAFT clarifications can be submitted for approval.");
    }
    await ctx.db.patch(args.clarificationId, {
      status: "PENDING_APPROVAL",
      updatedAt: Date.now(),
    });
  },
});

/** Approve a clarification (human action). */
export const approve = mutation({
  args: { clarificationId: v.id("clarifications") },
  handler: async (ctx, args) => {
    const clar = await ctx.db.get(args.clarificationId);
    if (!clar) throw new Error("Clarification not found.");
    if (clar.status !== "PENDING_APPROVAL") {
      throw new Error("Only PENDING_APPROVAL clarifications can be approved.");
    }
    const userId = await getAuthUserId(ctx);

    await ctx.db.patch(args.clarificationId, {
      status: "APPROVED",
      approvedBy: userId ?? undefined,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("proofEvents", {
      tenderId: clar.tenderId,
      revisionId: clar.revisionId,
      kind: "CLARIFICATION_APPROVED",
      summary: `Clarification approved: ${clar.subject}`,
      seq: Date.now(),
      at: Date.now(),
    });
  },
});

/** Mark a clarification as SENT. */
export const markSent = mutation({
  args: {
    clarificationId: v.id("clarifications"),
    providerMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clar = await ctx.db.get(args.clarificationId);
    if (!clar) throw new Error("Clarification not found.");

    const now = Date.now();
    await ctx.db.patch(args.clarificationId, {
      status: "SENT",
      sentAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("proofEvents", {
      tenderId: clar.tenderId,
      revisionId: clar.revisionId,
      kind: "CLARIFICATION_SENT",
      summary: `Clarification sent: ${clar.subject}`,
      seq: now,
      at: now,
    });
  },
});

/** Mark a clarification as FAILED. */
export const markFailed = mutation({
  args: {
    clarificationId: v.id("clarifications"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clarificationId, {
      status: "FAILED",
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});

/** Mark a clarification as ANSWERED (when reply arrives). */
export const markAnswered = mutation({
  args: { clarificationId: v.id("clarifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clarificationId, {
      status: "ANSWERED",
      updatedAt: Date.now(),
    });
  },
});
