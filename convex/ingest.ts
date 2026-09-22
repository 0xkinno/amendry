import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireTender } from "./lib/auth";
import { workflowStage } from "./lib/validators";

/**
 * Workflow helper mutations for the ingest workflow.
 * These are separate from the main tenders.ts to keep modules focused.
 */

/** Record a workflow run start. */
export const recordWorkflowStart = mutation({
  args: {
    tenderId: v.id("tenders"),
    kind: v.union(
      v.literal("INGEST"),
      v.literal("MONITOR"),
      v.literal("PROCESS_AMENDMENT"),
      v.literal("REVALIDATE"),
      v.literal("PREPARE_CLARIFICATION"),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("workflowRuns", {
      tenderId: args.tenderId,
      kind: args.kind,
      status: "RUNNING",
      stage: "CREATED",
      checkpoints: [],
      startedAt: now,
      updatedAt: now,
    });
  },
});

/** Record a workflow checkpoint. */
export const recordCheckpoint = mutation({
  args: {
    workflowId: v.id("workflowRuns"),
    stage: workflowStage,
    receipt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const wf = await ctx.db.get(args.workflowId);
    if (!wf) return;
    await ctx.db.patch(args.workflowId, {
      stage: args.stage,
      checkpoints: [
        ...wf.checkpoints,
        { stage: args.stage, at: now, receipt: args.receipt },
      ],
      updatedAt: now,
    });
  },
});

/** Mark a workflow as completed. */
export const recordWorkflowCompleted = mutation({
  args: {
    workflowId: v.id("workflowRuns"),
    stage: workflowStage,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.workflowId, {
      status: "COMPLETED",
      stage: args.stage,
      completedAt: now,
      updatedAt: now,
    });
  },
});

/** Mark a workflow as failed. */
export const recordWorkflowFailed = mutation({
  args: {
    workflowId: v.id("workflowRuns"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.workflowId, {
      status: "FAILED",
      error: args.error,
      updatedAt: now,
    });
  },
});

/** Transition tender status to MONITORING after successful ingest. */
export const completeIngest = mutation({
  args: {
    tenderId: v.id("tenders"),
  },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    await ctx.db.patch(args.tenderId, {
      status: "MONITORING",
      error: undefined,
      updatedAt: Date.now(),
    });
  },
});
