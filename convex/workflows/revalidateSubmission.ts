import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * P5.4 — Revalidate submission workflow.
 *
 * Re-runs the readiness kernel against the current revision and updates
 * the submission package status. This is what the user triggers after
 * resolving stale requirements.
 */

export const revalidateSubmission = action({
  args: {
    tenderId: v.id("tenders"),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runMutation(api.readiness.checkAndUpdate, {
      tenderId: args.tenderId,
    });

    return result;
  },
});
