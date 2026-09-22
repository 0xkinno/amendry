import { v } from "convex/values";
import { httpAction, query, mutation } from "./_generated/server";
import { api, components } from "./_generated/api";
import { webhookVerified } from "./lib/integrations";
import { plainText } from "./lib/sourceSafety";
import {
  getOpenAI,
  SYSTEM_GUARDRAILS,
  wrapUntrusted,
  MODELS,
  withModelFallback,
} from "./lib/openai";
import { buyerReplyParse, validateModelOutput, extractJson } from "./lib/modelSchemas";

/**
 * P4.4 — AgentMail webhook (signature verify, dedupe, thread match, parse,
 * mutate).
 *
 * Flow:
 *   POST /agentmail/webhook
 *     -> signature verification   (invalid/unsigned -> 401)
 *     -> event-id dedupe          (duplicate -> 204, no state transition)
 *     -> persist message
 *     -> thread matching          (unknown thread -> 204, stored unmatched,
 *                                  no tender mutated)
 *     -> model parse -> requirement mutation -> realtime UI
 */

/** Look up a webhook event by provider event id (dedupe). */
export const lookupEvent = query({
  args: { providerEventId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mailMessages")
      .withIndex("by_event", (q) => q.eq("providerEventId", args.providerEventId))
      .first();
  },
});

/** Look up a clarification by thread key. */
export const lookupByThread = query({
  args: { threadKey: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("mailMessages")
      .withIndex("by_thread", (q) => q.eq("threadKey", args.threadKey))
      .collect();
    if (messages.length === 0) return null;
    for (const msg of messages) {
      if (msg.clarificationId) {
        return await ctx.db.get(msg.clarificationId);
      }
    }
    return null;
  },
});

/** Persist an inbound webhook message. */
export const persistMessage = mutation({
  args: {
    providerEventId: v.string(),
    providerMessageId: v.optional(v.string()),
    providerThreadId: v.optional(v.string()),
    fromAddress: v.string(),
    toAddress: v.string(),
    subject: v.string(),
    body: v.string(),
    at: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("mailMessages", {
      direction: "inbound",
      threadKey: args.providerThreadId ?? args.providerEventId,
      providerMessageId: args.providerMessageId,
      providerThreadId: args.providerThreadId,
      providerEventId: args.providerEventId,
      fromAddress: args.fromAddress,
      toAddress: args.toAddress,
      subject: args.subject,
      body: args.body,
      parseStatus: "PENDING",
      at: args.at,
    });
  },
});

/** Update a message with parsed facts. */
export const updateMessageParse = mutation({
  args: {
    messageId: v.id("mailMessages"),
    parsedFacts: v.optional(
      v.array(
        v.object({
          requirementLineageKey: v.optional(v.string()),
          fact: v.string(),
          confidence: v.optional(v.number()),
        }),
      ),
    ),
    parseStatus: v.union(
      v.literal("PENDING"),
      v.literal("PARSED"),
      v.literal("FAILED"),
      v.literal("NOT_MATCHED"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      parsedFacts: args.parsedFacts,
      parseStatus: args.parseStatus,
    });
  },
});

/** Mark a clarification as answered. */
export const markClarificationAnswered = mutation({
  args: { clarificationId: v.id("clarifications") },
  handler: async (ctx, args) => {
    const clar = await ctx.db.get(args.clarificationId);
    if (!clar) return;
    await ctx.db.patch(args.clarificationId, {
      status: "ANSWERED",
      updatedAt: Date.now(),
    });
  },
});

/**
 * The actual HTTP webhook handler.
 */
export async function handleAgentMailWebhook(
  ctx: Parameters<Parameters<typeof httpAction>[0]>[0],
  request: Request,
): Promise<Response> {
  // 1. Signature verification.
  if (webhookVerified()) {
    const agentmail = await ctx.getComponentClient(components.agentmail);
    const signature = request.headers.get("x-agentmail-signature");
    const body = await request.text();
    const isValid = await agentmail.action("webhooks.verify", {
      body,
      signature: signature ?? "",
    });
    if (!isValid) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  // 2. Parse the webhook payload.
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const event = payload as {
    id?: string;
    type?: string;
    data?: {
      message?: {
        id?: string;
        threadId?: string;
        from?: string;
        to?: string;
        subject?: string;
        body?: string;
      };
    };
  };

  if (!event.id || !event.data?.message) {
    return new Response("Bad Request", { status: 400 });
  }

  const message = event.data.message;

  // 3. Event-id dedupe.
  const existing = await ctx.runQuery(api.webhooks.lookupEvent, {
    providerEventId: event.id,
  });
  if (existing) {
    return new Response(null, { status: 204 });
  }

  // 4. Persist the raw message.
  const now = Date.now();
  const messageId = await ctx.runMutation(api.webhooks.persistMessage, {
    providerEventId: event.id,
    providerMessageId: message.id,
    providerThreadId: message.threadId,
    fromAddress: message.from ?? "",
    toAddress: message.to ?? "",
    subject: message.subject ?? "",
    body: message.body ?? "",
    at: now,
  });

  // 5. Thread matching.
  if (!message.threadId) {
    return new Response(null, { status: 204 });
  }

  const clarification = await ctx.runQuery(api.webhooks.lookupByThread, {
    threadKey: message.threadId,
  });

  if (!clarification) {
    return new Response(null, { status: 204 });
  }

  // 6. Parse the reply with OpenAI (or controlled demo response).
  const openai = getOpenAI();
  if (openai) {
    try {
      const { result: rawText } = await withModelFallback(
        MODELS.parse,
        MODELS.fallback,
        async (model) => {
          const res = await openai.chat.completions.create({
            model,
            messages: [
              {
                role: "system",
                content:
                  SYSTEM_GUARDRAILS +
                  "\nParse this buyer reply and extract structured facts. Respond with a JSON object: { facts: Array<{ requirementLineageKey?, fact, confidence }>, sentiment: 'CLARIFIED'|'CONTESTED'|'EXTENDED'|'IRRELEVANT'|'AMBIGUOUS', actionRequired: string, confidence: number }",
              },
              {
                role: "user",
                content: `Parse this buyer reply and extract structured facts:\n\n${wrapUntrusted(plainText(message.body ?? ""))}`,
              },
            ],
            response_format: { type: "json_object" },
          });
          return res.choices[0]?.message?.content ?? "{}";
        },
      );

      const parsedJson = extractJson(rawText);
      const validated = validateModelOutput(buyerReplyParse, parsedJson);
      if (validated.ok) {
        await ctx.runMutation(api.webhooks.updateMessageParse, {
          messageId,
          parsedFacts: validated.value.facts.map((f) => ({
            requirementLineageKey: f.requirementLineageKey,
            fact: f.fact,
            confidence: f.confidence,
          })),
          parseStatus: "PARSED",
        });
      } else {
        await ctx.runMutation(api.webhooks.updateMessageParse, {
          messageId,
          parseStatus: "FAILED",
        });
      }
    } catch {
      await ctx.runMutation(api.webhooks.updateMessageParse, {
        messageId,
        parseStatus: "FAILED",
      });
    }
  } else {
    // FIXTURE mode: store a controlled demo response.
    await ctx.runMutation(api.webhooks.updateMessageParse, {
      messageId,
      parsedFacts: [
        {
          fact: "Buyer confirms the revised insurance threshold is mandatory.",
          confidence: 1.0,
        },
      ],
      parseStatus: "PARSED",
    });
  }

  // 7. Update the clarification status.
  await ctx.runMutation(api.webhooks.markClarificationAnswered, {
    clarificationId: clarification._id,
  });

  return new Response(null, { status: 204 });
}
