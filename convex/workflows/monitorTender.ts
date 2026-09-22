import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * P5.2 — Monitor workflow (scheduled recheck, heartbeat vs revision).
 *
 * This is a simplified version of the ingest workflow that runs on a
 * schedule to check if the source has changed.
 */

export const monitorTender = action({
  args: {
    tenderId: v.id("tenders"),
  },
  handler: async (ctx, args) => {
    const tender = await ctx.runQuery(api.tenders.get, { tenderId: args.tenderId });
    if (!tender) throw new Error("Tender not found.");
    if (tender.status !== "MONITORING") {
      return { outcome: "SKIPPED" as const, reason: `Tender status is ${tender.status}.` };
    }

    // Re-use the ingest workflow for the actual fetch + diff.
    const result = await ctx.runAction(api.ingest.ingestTender, {
      tenderId: args.tenderId,
    });

    return result;
  },
});
