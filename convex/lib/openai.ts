import { env } from "../_generated/server";
import OpenAI from "openai";
import type { ParsedResponse } from "openai/resources/responses/responses";
import { openaiLive } from "./integrations";
import { UNTRUSTED_SOURCE_RULES, wrapUntrusted } from "./sourceSafety";

/**
 * OpenAI access, server-side only.
 *
 * The browser never sees this key. Every call happens inside a Convex action
 * (or a workflow step, which is an action), and every response is validated
 * by a zod schema before it is allowed anywhere near the database.
 */

/**
 * Model ids. Primary + one fallback, because a key that has not enabled the
 * primary model should degrade rather than fail the whole workflow. Any other
 * error is rethrown — only "this model is not available to you" is recoverable.
 */
export const MODELS = {
  extract: "gpt-4o",
  impact: "gpt-4o",
  draft: "gpt-4o",
  parse: "gpt-4o",
  fallback: "gpt-4o-mini",
} as const;

/**
 * Null when the key is missing or a placeholder, so callers fall back to a
 * clearly-labelled deterministic path instead of crashing. Always construct
 * inside a handler: the SDK throws without a key and Convex evaluates module
 * top level at push time.
 */
export function getOpenAI(options: { timeoutMs?: number; maxRetries?: number } = {}): OpenAI | null {
  if (!openaiLive()) return null;
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    timeout: options.timeoutMs ?? 90_000,
    maxRetries: options.maxRetries ?? 2,
  });
}

export function isModelUnavailable(e: unknown): boolean {
  return (
    e instanceof OpenAI.APIError &&
    (e.status === 404 || e.status === 403 || e.code === "model_not_found")
  );
}

/** Safe to store and show: OpenAI's 401 message echoes part of the key. */
export function describeOpenAIError(e: unknown): string {
  if (e instanceof OpenAI.APIError) {
    if (e.status === 401) return "OpenAI 401 unauthorized";
    return `OpenAI ${e.status ?? "network"} ${e.code ?? e.type ?? ""}: ${e.message}`;
  }
  return e instanceof Error ? e.message : String(e);
}

/** Run with the primary model, once with the fallback if it is unavailable. */
export async function withModelFallback<T>(
  primary: string,
  fallback: string,
  call: (model: string) => Promise<T>,
): Promise<{ result: T; model: string }> {
  try {
    return { result: await call(primary), model: primary };
  } catch (e) {
    if (!isModelUnavailable(e)) throw e;
    return { result: await call(fallback), model: fallback };
  }
}

/** Unwrap a responses.parse() result or throw a readable error. */
export function requireParsed<T>(r: ParsedResponse<T>, what: string): T {
  if (r.status === "incomplete") {
    throw new Error(`${what}: incomplete (${r.incomplete_details?.reason ?? "unknown"})`);
  }
  if (r.status === "failed") {
    throw new Error(`${what}: failed (${r.error?.code ?? "?"}: ${r.error?.message ?? ""})`);
  }
  for (const item of r.output) {
    if (item.type !== "message") continue;
    for (const part of item.content) {
      if (part.type === "refusal") throw new Error(`${what}: model refused: ${part.refusal}`);
    }
  }
  if (r.output_parsed == null) throw new Error(`${what}: no parsed output (status=${r.status})`);
  return r.output_parsed;
}

/**
 * The two header strings every call passes as `instructions`. Source text is
 * never interpolated into the system prompt — only into the user message,
 * wrapped in delimiters.
 */
export const SYSTEM_GUARDRAILS = UNTRUSTED_SOURCE_RULES;

export { wrapUntrusted };
