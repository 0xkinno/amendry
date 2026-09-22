import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Shared query/mutation helpers used by actions and the webhook handler
 * to avoid circular imports.
 */

/** Look up an outbound action by idempotency key. */
export const lookupOutbound = query({
  args: { idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("outboundActions")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
  },
});

/** Claim an outbound action (insert WORKING record). */
export const claimOutbound = mutation({
  args: {
    idempotencyKey: v.string(),
    kind: v.union(
      v.literal("FIRECRAWL_FETCH"),
      v.literal("OPENAI_EXTRACTION"),
      v.literal("OPENAI_IMPACT"),
      v.literal("OPENAI_DRAFT"),
      v.literal("OPENAI_PARSE"),
      v.literal("AGENTMAIL_SEND"),
      v.literal("WORKFLOW_STAGE"),
    ),
    workspaceId: v.optional(v.id("workspaces")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("outboundActions", {
      workspaceId: args.workspaceId,
      kind: args.kind,
      idempotencyKey: args.idempotencyKey,
      status: "WORKING",
      attemptCount: 1,
      at: Date.now(),
    });
  },
});

/** Mark an outbound action as completed. */
export const completeOutbound = mutation({
  args: {
    idempotencyKey: v.string(),
    providerRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("outboundActions")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (record) {
      await ctx.db.patch(record._id, {
        status: "COMPLETED",
        providerRef: args.providerRef,
        completedAt: Date.now(),
      });
    }
  },
});

/** Mark an outbound action as failed. */
export const failOutbound = mutation({
  args: {
    idempotencyKey: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("outboundActions")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (record) {
      await ctx.db.patch(record._id, {
        status: "FAILED",
        error: args.error,
        attemptCount: record.attemptCount + 1,
      });
    }
  },
});
