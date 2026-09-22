/**
 * Product policy — the human-control defaults from the contract, in one
 * place the backend and the UI both read.
 *
 * The system may detect, classify, warn, recommend, draft, and revalidate.
 * A human approves outbound mail, the final packet, and the final ready
 * state. AUTO-READY does not exist as a mode: readiness is a deterministic
 * invariant, not a preference.
 */

export const POLICY = {
  AUTO_SCRAPE: true,
  AUTO_ANALYZE: true,
  AUTO_INVALIDATE: true,
  AUTO_DRAFT: true,
  AUTO_SEND: false,
  AUTO_READY: false,
} as const;

export type PolicyFlag = keyof typeof POLICY;

/** How long a human approval of a packet stays good for. */
export const APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;

/** Default monitoring cadence when the user does not choose one. */
export const DEFAULT_MONITOR_INTERVAL_MS = 15 * 60 * 1000;

export const MONITOR_PRESETS = [
  { label: "Every 15 minutes", ms: 15 * 60 * 1000 },
  { label: "Hourly", ms: 60 * 60 * 1000 },
  { label: "Every 6 hours", ms: 6 * 60 * 60 * 1000 },
  { label: "Daily", ms: 24 * 60 * 60 * 1000 },
] as const;

/** Rate limits. Two-stage: per-key, then deployment-wide. */
export const RATE_LIMITS = {
  sourceScan: { perUser: "sourceScan", global: "globalSourceScan" },
  modelCall: { perUser: "modelCall", global: "globalModelCall" },
  emailSend: { perUser: "emailSend", global: "globalEmailSend" },
  webhook: { perUser: "webhook", global: "globalWebhook" },
} as const;

/** The states the UI is allowed to collapse for legibility. */
export const UI_STATUS = {
  VERIFIED: "verified",
  STALE: "stale",
  UNKNOWN: "unknown",
  CONTESTED: "contested",
  SUPERSEDED: "superseded",
  SOURCE_UNAVAILABLE: "unavailable",
  REMOVED: "removed",
} as const;

export type UiStatus = (typeof UI_STATUS)[keyof typeof UI_STATUS];

/** Never label synthetic data as live. */
export function sourceBadge(isFixture: boolean, mode: "LIVE" | "FIXTURE"): string {
  if (isFixture) return "DEMO FIXTURE";
  return mode === "LIVE" ? "LIVE" : "FIXTURE";
}
