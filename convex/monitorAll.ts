import { query, action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Scheduler entry point: find all tenders in MONITORING status and
 * trigger the monitor workflow for each one whose interval has elapsed.
 */

/** Query all monitoring tenders whose interval has elapsed. */
export const findDueTenders = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const monitoring = await ctx.db
      .query("tenders")
      .withIndex("by_status", (q) => q.eq("status", "MONITORING"))
      .collect();

    return monitoring.filter((t) => {
      const interval = t.monitorIntervalMs ?? 15 * 60 * 1000; // default 15 min
      const lastChecked = t.lastCheckedAt ?? t.createdAt ?? 0;
      return now - lastChecked >= interval;
    });
  },
});

/** Action entry point called by the cron. */
export const monitorAll = action({
  args: {},
  handler: async (ctx) => {
    const dueTenders = await ctx.runQuery(api.monitorAll.findDueTenders);

    const results = [];
    for (const tender of dueTenders) {
      try {
        const result = await ctx.runAction(api.workflows.monitorTender.monitorTender, {
          tenderId: tender._id,
        });
        results.push({ tenderId: tender._id, ...result });
      } catch (e) {
        results.push({
          tenderId: tender._id,
          outcome: "FAILED" as const,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return results;
  },
});
