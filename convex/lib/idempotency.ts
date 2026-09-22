/**
 * Deterministic idempotency keys.
 *
 * Every external side effect gets one. Before executing, the caller looks
 * the key up in `outboundActions`:
 *
 *   COMPLETED  -> return the previous result, do not call the provider
 *   WORKING    -> reconcile: the previous attempt may or may not have
 *                 landed; re-check provider state rather than re-firing
 *   absent     -> claim it by inserting WORKING, then execute
 *   FAILED     -> a new attempt is allowed, with attemptCount++ recorded
 *
 * Keys are derived from stable domain identity, never from timestamps or
 * random values — otherwise a replay would mint a fresh key and defeat the
 * whole mechanism.
 */

export type IdempotencyInput =
  | { kind: "FIRECRAWL_FETCH"; tenderId: string; sourceUrl: string; contentHash: string }
  | { kind: "OPENAI_EXTRACTION"; revisionId: string; contentHash: string }
  | { kind: "OPENAI_IMPACT"; fromRevisionId: string; toRevisionId: string }
  | { kind: "OPENAI_DRAFT"; clarificationId: string; bodyHash: string }
  | { kind: "OPENAI_PARSE"; providerMessageId: string }
  | { kind: "AGENTMAIL_SEND"; clarificationId: string; bodyHash: string }
  | { kind: "WORKFLOW_STAGE"; tenderId: string; revisionId: string; stage: string };

/**
 * Build a deterministic key. Format mirrors the contract in the build
 * instructions, e.g. `agentmail:clarification:{id}:{bodyHash}`.
 */
export function idempotencyKey(input: IdempotencyInput): string {
  switch (input.kind) {
    case "FIRECRAWL_FETCH":
      return `firecrawl:tender:${input.tenderId}:source:${input.sourceUrl}:hash:${input.contentHash}`;
    case "OPENAI_EXTRACTION":
      return `openai:extract:revision:${input.revisionId}:hash:${input.contentHash}`;
    case "OPENAI_IMPACT":
      return `openai:impact:from:${input.fromRevisionId}:to:${input.toRevisionId}`;
    case "OPENAI_DRAFT":
      return `openai:draft:clarification:${input.clarificationId}:hash:${input.bodyHash}`;
    case "OPENAI_PARSE":
      return `openai:parse:message:${input.providerMessageId}`;
    case "AGENTMAIL_SEND":
      return `agentmail:clarification:${input.clarificationId}:hash:${input.bodyHash}`;
    case "WORKFLOW_STAGE":
      return `workflow:tender:${input.tenderId}:revision:${input.revisionId}:stage:${input.stage}`;
  }
}

/** Where a stage-level key is needed but only the run is known. */
export function stageKey(tenderId: string, revisionId: string, stage: string): string {
  return idempotencyKey({ kind: "WORKFLOW_STAGE", tenderId, revisionId, stage });
}

export type OutboundStatus = "WORKING" | "COMPLETED" | "FAILED" | "RECONCILING";

export type OutboundRecord = {
  idempotencyKey: string;
  status: OutboundStatus;
  attemptCount: number;
  resultDigest?: string | undefined;
};

export type Decision =
  | { action: "EXECUTE"; reason: string }
  | { action: "RETURN_CACHED"; reason: string; resultDigest: string | undefined }
  | { action: "RECONCILE"; reason: string };

/**
 * Pure decision function. The mutation reads the record, calls this, and
 * acts on the verdict — so the policy itself is testable without a database.
 */
export function decide(record: OutboundRecord | null | undefined): Decision {
  if (!record) {
    return { action: "EXECUTE", reason: "no prior attempt recorded" };
  }
  switch (record.status) {
    case "COMPLETED":
      return {
        action: "RETURN_CACHED",
        reason: "prior attempt completed; replay is a no-op",
        resultDigest: record.resultDigest,
      };
    case "WORKING":
      return {
        action: "RECONCILE",
        reason: "an attempt is in flight; re-check provider state instead of re-firing",
      };
    case "RECONCILING":
      return {
        action: "RECONCILE",
        reason: "a reconciliation is already in progress",
      };
    case "FAILED":
      return {
        action: "EXECUTE",
        reason: `prior attempt failed (attempt ${record.attemptCount}); retry allowed`,
      };
  }
}
