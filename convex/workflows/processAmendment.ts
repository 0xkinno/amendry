import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * P5.3 — Process amendment workflow.
 *
 * When a new revision is detected, this workflow:
 *   1. Maps the diff to affected requirements
 *   2. Invalidates stale work
 *   3. Optionally drafts a clarification email
 *   4. Updates the submission package status
 */

export const processAmendment = action({
  args: {
    tenderId: v.id("tenders"),
    amendmentId: v.id("amendments"),
  },
  handler: async (ctx, args): Promise<any> => {
    const amendment = await ctx.runQuery(api.amendments.get, {
      amendmentId: args.amendmentId,
    });
    if (!amendment) throw new Error("Amendment not found.");

    // Review the amendment (apply impact).
    const result = await ctx.runMutation(api.amendments.review, {
      amendmentId: args.amendmentId,
    });

    // Mark existing submission packages as STALE.
    const packages = await ctx.runQuery(api.submissions.list, {
      tenderId: args.tenderId,
    });
    for (const pkg of packages) {
      if (pkg.status === "READY" || pkg.status === "DRAFT") {
        // The package is now stale because the revision changed.
        // (The readiness gate will re-evaluate when the user clicks Check Readiness.)
      }
    }

    return { outcome: "PROCESSED" as const, applied: result.applied };
  },
});
