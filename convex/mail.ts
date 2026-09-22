import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { idempotencyKey, decide } from "./lib/idempotency";
import { agentmailLive } from "./lib/integrations";
import { components } from "./_generated/api";
import { hashPayload } from "./lib/hashes";

/**
 * P4.3 — AgentMail outbound (draft -> human approval -> send) with
 * idempotency receipts.
 *
 * Every outbound email gets an idempotency key. A replayed workflow step
 * that tries to send the same email twice will find the COMPLETED receipt
 * and skip the provider call.
 */

/** Send a clarification email via AgentMail. */
export const sendClarification = action({
  args: {
    clarificationId: v.id("clarifications"),
  },
  handler: async (ctx, args) => {
    const clar = await ctx.runQuery(api.clarifications.get, {
      clarificationId: args.clarificationId,
    });
    if (!clar) throw new Error("Clarification not found.");
    if (clar.status !== "APPROVED") {
      throw new Error("Only APPROVED clarifications can be sent.");
    }

    // Check idempotency.
    const bodyHash = hashPayload({ subject: clar.subject, body: clar.body, to: clar.toAddress });
    const idk = idempotencyKey({
      kind: "AGENTMAIL_SEND",
      clarificationId: args.clarificationId,
      bodyHash,
    });

    const existing = await ctx.runQuery(api.mutations.lookupOutbound, { idempotencyKey: idk });
    const decision = decide(existing ?? null);
    if (decision.action === "RETURN_CACHED") {
      return { outcome: "ALREADY_SENT" as const };
    }
    if (decision.action === "RECONCILE") {
      return { outcome: "RECONCILING" as const };
    }

    // Record the attempt.
    await ctx.runMutation(api.mutations.claimOutbound, {
      idempotencyKey: idk,
      kind: "AGENTMAIL_SEND",
      workspaceId: clar.workspaceId,
    });

    if (!agentmailLive()) {
      // FIXTURE mode: simulate the send.
      await ctx.runMutation(api.clarifications.markSent, {
        clarificationId: args.clarificationId,
      });
      return { outcome: "FIXTURE_SENT" as const };
    }

    // Live AgentMail send.
    try {
      const agentmail = await ctx.getComponentClient(components.agentmail);
      const result = await agentmail.action("messages.send", {
        from: "amendry-agent@agentmail.to",
        to: clar.toAddress,
        subject: clar.subject,
        body: clar.body,
      });

      await ctx.runMutation(api.clarifications.markSent, {
        clarificationId: args.clarificationId,
        providerMessageId: result.messageId,
      });

      // Mark outbound as completed.
      await ctx.runMutation(api.mutations.completeOutbound, {
        idempotencyKey: idk,
        providerRef: result.messageId,
      });

      return { outcome: "SENT" as const, messageId: result.messageId };
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      await ctx.runMutation(api.clarifications.markFailed, {
        clarificationId: args.clarificationId,
        error,
      });
      await ctx.runMutation(api.mutations.failOutbound, {
        idempotencyKey: idk,
        error,
      });
      return { outcome: "FAILED" as const, error };
    }
  },
});
