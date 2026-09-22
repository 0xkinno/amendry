import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

/**
 * P5.2 (continued) — Scheduler for periodic source monitoring.
 *
 * The cron job checks all tenders in MONITORING status and triggers
 * the monitor workflow for each one whose interval has elapsed.
 */

const crons = cronJobs();

/**
 * Monitor all active tenders every 5 minutes.
 *
 * The cron fires every 5 minutes; the monitor workflow itself checks
 * whether enough time has passed since the last check for each tender.
 */
crons.interval(
  "monitor active tenders",
  { minutes: 5 },
  api.monitorAll.monitorAll,
);

export default crons;
