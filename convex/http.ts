import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { httpRouter } from "convex/server";
import { components } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();

// Convex Auth: OIDC discovery and JWKS under /.well-known/
auth.addHttpRoutes(http);

/**
 * Inbound replies from the buyer.
 *
 *   POST /agentmail/webhook
 *     -> signature verification   (invalid/unsigned -> 401)
 *     -> event-id dedupe          (duplicate -> 204, no state transition)
 *     -> persist message
 *     -> thread matching          (unknown thread -> 204, stored unmatched,
 *                                  no tender mutated)
 *     -> model parse -> requirement mutation -> realtime UI
 *
 * Registered by the AgentMail component at this path; the handler itself
 * lives in webhooks.ts so the route file stays a routing table.
 */
http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { handleAgentMailWebhook } = await import("./webhooks");
    return await handleAgentMailWebhook(ctx, request);
  }),
});

/**
 * The SPA. A GET catch-all on "/", so exact routes above always win and deep
 * links like /app/tenders/<id>/submission fall back to index.html.
 */
registerStaticRoutes(http, components.staticHosting);

export default http;
