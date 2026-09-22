import { DAY, HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError } from "convex/values";
import { components } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";

/*
 * Everything that spends credits or sends mail is capped, twice:
 *
 *   1. per-user   — one account cannot exhaust the pool
 *   2. deployment-wide — a public demo page cannot either
 *
 * The two-stage check exists so the throw rolls back *before* the user's own
 * token is consumed: check the shared cap first, then the personal one, so a
 * rejection costs the caller nothing.
 *
 *   await limitOrThrow(ctx, "sourceScan", workspaceId, "source scans", "globalSourceScan");
 */

const definitions = {
  // Firecrawl source scans (each scrape costs credits)
  sourceScan: { kind: "token bucket" as const, rate: 12, period: HOUR, capacity: 6 },
  globalSourceScan: { kind: "fixed window" as const, rate: 150, period: DAY },

  // OpenAI calls: extraction, impact analysis, drafting, reply parsing
  modelCall: { kind: "token bucket" as const, rate: 30, period: HOUR, capacity: 10 },
  globalModelCall: { kind: "fixed window" as const, rate: 200, period: DAY },

  // Outbound clarification email
  emailSend: { kind: "fixed window" as const, rate: 10, period: DAY },
  globalEmailSend: { kind: "fixed window" as const, rate: 40, period: DAY },

  // Inbound webhook processing
  webhook: { kind: "fixed window" as const, rate: 120, period: MINUTE },
  globalWebhook: { kind: "fixed window" as const, rate: 1000, period: HOUR },

  // Readiness checks are cheap but not free; keep the demo honest.
  readinessCheck: { kind: "fixed window" as const, rate: 60, period: MINUTE },
} as const;

export const limits = new RateLimiter(components.rateLimiter, definitions);

export type LimitName = keyof typeof definitions;

function waitPhrase(retryAfterMs: number): string {
  const minutes = Math.ceil(retryAfterMs / MINUTE);
  if (minutes <= 1) return "in a minute";
  if (minutes < 90) return `in about ${minutes} minutes`;
  return `in about ${Math.ceil(minutes / 60)} hours`;
}

/**
 * Shared cap first, then the personal cap, so a rejected call never spends
 * the caller's tokens. Throws a plain sentence, not "[object Object]".
 */
export async function limitOrThrow(
  ctx: MutationCtx,
  name: LimitName,
  key: string,
  what: string,
  globalName?: LimitName,
): Promise<void> {
  if (globalName !== undefined) {
    const shared = await limits.limit(ctx, globalName);
    if (!shared.ok) {
      throw new ConvexError(
        `This deployment has used today's shared allowance for ${what}. Try again ${waitPhrase(shared.retryAfter)}.`,
      );
    }
  }
  const status = await limits.limit(ctx, name, { key });
  if (!status.ok) {
    throw new ConvexError(
      `You have reached the limit for ${what}. Try again ${waitPhrase(status.retryAfter)}.`,
    );
  }
}

/** Read-only check, for the UI to grey a button before the user clicks it. */
export async function checkLimit(
  ctx: MutationCtx,
  name: LimitName,
  key: string,
): Promise<{ ok: boolean; retryAfterMs: number }> {
  const status = await limits.limit(ctx, name, { key, reserve: false });
  return { ok: status.ok, retryAfterMs: status.retryAfter ?? 0 };
}
