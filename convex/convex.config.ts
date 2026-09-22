import { defineApp } from "convex/server";
import { v } from "convex/values";
import agentmail from "@agentmail/convex/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import staticHosting from "@convex-dev/static-hosting/convex.config";
import firecrawl from "@firecrawl/firecrawl-convex/convex.config";
import workflow from "@convex-dev/workflow/convex.config";
import workpool from "@convex-dev/workpool/convex.config";

/**
 * Declared, typed environment for the deployment.
 *
 * Nothing here is optional at the type level except the webhook secret and
 * the two behaviour switches, so a missing key fails the push instead of
 * failing at 3am in a demo. Placeholder values boot the app; `xxxLive()`
 * in lib/integrations.ts decides whether the integration is really live.
 */
const app = defineApp({
  env: {
    // Required by the Firecrawl component; a placeholder boots FIXTURE mode.
    FIRECRAWL_API_KEY: v.string(),
    // Required by OpenAI for extraction / impact / drafting / reply parsing.
    OPENAI_API_KEY: v.string(),
    // Optional: without it outbound clarification mail is clearly disabled.
    AGENTMAIL_API_KEY: v.optional(v.string()),
    // Optional: without it inbound replies are polled instead of webhooks.
    AGENTMAIL_WEBHOOK_SECRET: v.optional(v.string()),
    // "LIVE" | "FIXTURE" — forces source mode; auto-detected when unset.
    AMENDRY_SOURCE_MODE: v.optional(v.string()),
    // "1" polls the inbox from a cron where there is no public URL.
    AGENTMAIL_POLL: v.optional(v.string()),
  },
});

// Live source fetch + amendment discovery.
app.use(firecrawl, {
  env: { FIRECRAWL_API_KEY: app.env.FIRECRAWL_API_KEY },
});

// Real inbox: signed inbound webhook, dedupe by event id, reactive store.
app.use(agentmail);

// Caps on anything that spends credits or sends mail.
app.use(rateLimiter);

// Durable multi-step orchestration (ingest / monitor / amendment / revalidate).
app.use(workflow);

// Bounded-parallelism queue for outbound side effects.
app.use(workpool);

// Serves the built SPA from <deployment>.convex.site. No httpPrefix: our own
// http.ts keeps the root so the webhook and auth discovery stay where they are.
app.use(staticHosting);

export default app;
