import { env } from "../_generated/server";

/**
 * Which sponsor integrations are live on this deployment.
 *
 * A placeholder key boots the app so development can start before accounts
 * exist; the product then runs in a clearly-labelled FIXTURE/DRAFT mode and
 * the UI says so. Nothing here ever pretends to be live.
 */

export function firecrawlLive(): boolean {
  const key = env.FIRECRAWL_API_KEY ?? "";
  // Real Firecrawl keys start with "fc-". A placeholder boots the project.
  return key.startsWith("fc-") && key.length > 8;
}

export function openaiLive(): boolean {
  const key = env.OPENAI_API_KEY ?? "";
  return key.startsWith("sk-") && key.length > 12;
}

export function agentmailLive(): boolean {
  return Boolean(env.AGENTMAIL_API_KEY);
}

export function webhookVerified(): boolean {
  return Boolean(env.AGENTMAIL_WEBHOOK_SECRET);
}

/** True where there is no public URL for webhooks, so the inbox is polled. */
export function agentmailPolling(): boolean {
  return agentmailLive() && env.AGENTMAIL_POLL === "1";
}

/** True when a reply to one of our clarifications can actually get back in. */
export function inboundLive(): boolean {
  return agentmailLive() && (agentmailPolling() || webhookVerified());
}

/**
 * Source mode for this deployment. Explicit override wins, otherwise it is
 * derived from the Firecrawl key so the badge in the UI is never a lie.
 */
export function sourceMode(): "LIVE" | "FIXTURE" {
  const forced = env.AMENDRY_SOURCE_MODE;
  if (forced === "LIVE") return "LIVE";
  if (forced === "FIXTURE") return "FIXTURE";
  return firecrawlLive() ? "LIVE" : "FIXTURE";
}

/** One object the UI can render as a single status badge. */
export type IntegrationStatus = {
  sourceMode: "LIVE" | "FIXTURE";
  firecrawl: boolean;
  openai: boolean;
  agentmail: boolean;
  webhook: boolean;
  polling: boolean;
};

export function integrationStatus(): IntegrationStatus {
  return {
    sourceMode: sourceMode(),
    firecrawl: firecrawlLive(),
    openai: openaiLive(),
    agentmail: agentmailLive(),
    webhook: webhookVerified(),
    polling: agentmailPolling(),
  };
}
