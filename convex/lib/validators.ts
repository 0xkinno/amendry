import { v } from "convex/values";

/**
 * Explicit state enumerations.
 *
 * The UI may collapse some of these for legibility, but the backend always
 * preserves the distinction — UNKNOWN is not STALE, and CONTESTED is not
 * STALE. Collapsing them in the model is how a system starts guessing.
 */

export const tenderStatus = v.union(
  v.literal("INGESTING"),
  v.literal("MONITORING"),
  v.literal("PAUSED"),
  v.literal("ERROR"),
);

export const sourceMode = v.union(v.literal("LIVE"), v.literal("FIXTURE"));

export const sourceState = v.union(
  v.literal("UNKNOWN"),
  v.literal("CURRENT"),
  v.literal("UNCHANGED"),
  v.literal("SOURCE_UNAVAILABLE"),
);

export const revisionKind = v.union(
  v.literal("INITIAL"),
  v.literal("AMENDMENT"),
  v.literal("RECHECK"),
  v.literal("CONFLICT"),
);

export const revisionStatus = v.union(
  v.literal("PENDING"),
  v.literal("CURRENT"),
  v.literal("SUPERSEDED"),
  v.literal("SOURCE_UNAVAILABLE"),
);

export const requirementStatus = v.union(
  v.literal("UNKNOWN"),
  v.literal("VERIFIED"),
  v.literal("STALE"),
  v.literal("CONTESTED"),
  v.literal("SUPERSEDED"),
  v.literal("SOURCE_UNAVAILABLE"),
  v.literal("REMOVED"),
);

export const requirementCategory = v.union(
  v.literal("ELIGIBILITY"),
  v.literal("TECHNICAL"),
  v.literal("FINANCIAL"),
  v.literal("INSURANCE"),
  v.literal("LEGAL"),
  v.literal("SUBMISSION"),
  v.literal("SCHEDULE"),
  v.literal("EVALUATION"),
  v.literal("ATTACHMENT"),
  v.literal("CONTACT"),
  v.literal("OTHER"),
);

export const impactKind = v.union(
  v.literal("UNCHANGED"),
  v.literal("CHANGED"),
  v.literal("NEW"),
  v.literal("REMOVED"),
  v.literal("AMBIGUOUS"),
);

export const evidenceType = v.union(
  v.literal("CERTIFICATE"),
  v.literal("CAPABILITY_STATEMENT"),
  v.literal("PRIOR_EXPERIENCE"),
  v.literal("PRICING_SHEET"),
  v.literal("INSURANCE"),
  v.literal("RESPONSE_PARAGRAPH"),
  v.literal("CLARIFICATION_ANSWER"),
  v.literal("DOCUMENT"),
);

export const verificationStatus = v.union(
  v.literal("UNVERIFIED"),
  v.literal("VERIFIED"),
  v.literal("STALE"),
  v.literal("REJECTED"),
);

export const evidenceStatus = v.union(
  v.literal("CURRENT"),
  v.literal("STALE"),
  v.literal("MISSING"),
  v.literal("CONTESTED"),
);

export const conflictState = v.union(
  v.literal("OPEN"),
  v.literal("RESOLVED"),
  v.literal("DISMISSED"),
);

export const amendmentStatus = v.union(
  v.literal("DETECTED"),
  v.literal("MAPPED"),
  v.literal("REVIEWED"),
  v.literal("CONFLICTED"),
);

export const clarificationStatus = v.union(
  v.literal("DRAFT"),
  v.literal("PENDING_APPROVAL"),
  v.literal("APPROVED"),
  v.literal("SENDING"),
  v.literal("SENT"),
  v.literal("FAILED"),
  v.literal("ANSWERED"),
);

export const messageDirection = v.union(v.literal("outbound"), v.literal("inbound"));

export const outboundKind = v.union(
  v.literal("FIRECRAWL_FETCH"),
  v.literal("OPENAI_EXTRACTION"),
  v.literal("OPENAI_IMPACT"),
  v.literal("OPENAI_DRAFT"),
  v.literal("OPENAI_PARSE"),
  v.literal("AGENTMAIL_SEND"),
  v.literal("WORKFLOW_STAGE"),
);

export const outboundStatus = v.union(
  v.literal("WORKING"),
  v.literal("COMPLETED"),
  v.literal("FAILED"),
  v.literal("RECONCILING"),
);

export const workflowStatus = v.union(
  v.literal("PENDING"),
  v.literal("RUNNING"),
  v.literal("PAUSED"),
  v.literal("COMPLETED"),
  v.literal("FAILED"),
  v.literal("CANCELED"),
);

export const workflowStage = v.union(
  v.literal("CREATED"),
  v.literal("FETCH"),
  v.literal("NORMALIZE"),
  v.literal("EXTRACT"),
  v.literal("DIFF"),
  v.literal("IMPACT_MAP"),
  v.literal("INVALIDATE"),
  v.literal("REQUEST_REVIEW"),
  v.literal("PACKAGE"),
  v.literal("DONE"),
  v.literal("FAILED"),
);

export const approvalState = v.union(v.literal("pending"), v.literal("approved"), v.literal("expired"));

export const proofKind = v.union(
  v.literal("REVISION_CREATED"),
  v.literal("REVISION_SUPERSEDED"),
  v.literal("SOURCE_UNAVAILABLE"),
  v.literal("REQUIREMENTS_EXTRACTED"),
  v.literal("AMENDMENT_DETECTED"),
  v.literal("IMPACT_MAPPED"),
  v.literal("WORK_INVALIDATED"),
  v.literal("CONFLICT_OPENED"),
  v.literal("CONFLICT_RESOLVED"),
  v.literal("EVIDENCE_VERIFIED"),
  v.literal("EVIDENCE_STALE"),
  v.literal("CLARIFICATION_DRAFTED"),
  v.literal("CLARIFICATION_APPROVED"),
  v.literal("CLARIFICATION_SENT"),
  v.literal("REPLY_RECEIVED"),
  v.literal("READINESS_CHECKED"),
  v.literal("READY_GRANTED"),
  v.literal("READY_REFUSED"),
  v.literal("PACKAGE_GENERATED"),
  v.literal("PACKAGE_STALE"),
  v.literal("WORKFLOW_STARTED"),
  v.literal("WORKFLOW_CHECKPOINT"),
  v.literal("WORKFLOW_COMPLETED"),
  v.literal("WORKFLOW_RESUMED"),
  v.literal("WORKFLOW_FAILED"),
  v.literal("IDEMPOTENT_REPLAY"),
  v.literal("CERTIFICATE_ISSUED"),
);

/** Reusable nested object validators. */
export const impactEntry = v.object({
  kind: impactKind,
  requirementId: v.optional(v.id("requirements")),
  lineageKey: v.optional(v.string()),
  label: v.string(),
  detail: v.optional(v.string()),
});

export const checkpoint = v.object({
  stage: v.string(),
  at: v.number(),
  receipt: v.optional(v.string()),
});

export const parsedFact = v.object({
  requirementLineageKey: v.optional(v.string()),
  fact: v.string(),
  confidence: v.optional(v.number()),
});
