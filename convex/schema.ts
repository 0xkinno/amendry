import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import {
  approvalState,
  amendmentStatus,
  clarificationStatus,
  conflictState,
  evidenceStatus,
  evidenceType,
  impactKind,
  messageDirection,
  outboundKind,
  outboundStatus,
  requirementCategory,
  requirementStatus,
  revisionKind,
  revisionStatus,
  sourceMode,
  sourceState,
  tenderStatus,
  verificationStatus,
  workflowStage,
  workflowStatus,
  proofKind,
} from "./lib/validators";

/**
 * Amendry — normalized, explicit schema.
 *
 * Two rules shape every table here:
 *
 * 1. A revision is immutable. Historical revisions are never edited in
 *    place; a change creates a new revision that supersedes the old one.
 * 2. Nothing stores a bare `ready` boolean. Readiness is always derived,
 *    transactionally, by the kernel from revision-pinned inputs.
 */
export default defineSchema({
  ...authTables,

  /** One row per signed-in user's workspace. */
  workspaces: defineTable({
    userId: v.id("users"),
    name: v.string(),
    role: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  /** AgentMail mailboxes this deployment operates. */
  mailboxes: defineTable({
    role: v.union(v.literal("amendry"), v.literal("demoBuyer")),
    inboxId: v.string(),
    email: v.string(),
    displayName: v.string(),
    isDemo: v.boolean(),
    lastPolledAt: v.optional(v.number()),
  })
    .index("by_role", ["role"])
    .index("by_inbox", ["inboxId"]),

  /**
   * A tender being tracked. `currentRevisionId` is the single pointer the
   * whole product is gated on — advancing it invalidates everything derived
   * from any earlier revision in the same transaction.
   */
  tenders: defineTable({
    workspaceId: v.id("workspaces"),
    title: v.string(),
    buyerName: v.string(),
    sourceUrl: v.string(),
    jurisdiction: v.optional(v.string()),
    deadline: v.optional(v.string()),
    status: tenderStatus,
    sourceMode: sourceMode,
    sourceState: sourceState,
    monitorIntervalMs: v.optional(v.number()),
    currentRevisionId: v.optional(v.id("tenderRevisions")),
    lastCheckedAt: v.optional(v.number()),
    lastVerifiedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    /** Sentinel while no revision exists yet. */
    error: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_status", ["status"])
    .index("by_source_url", ["sourceUrl"]),

  /**
   * Immutable. One row per distinct normalized content hash. Revisions are
   * never patched except for `status` transitions on the *current* row
   * (SOURCE_UNAVAILABLE), which is a state about the source, not content.
   */
  tenderRevisions: defineTable({
    tenderId: v.id("tenders"),
    revisionNumber: v.number(),
    kind: revisionKind,
    contentHash: v.string(),
    normalizedSourceHash: v.string(),
    sourceUrl: v.string(),
    canonicalUrl: v.optional(v.string()),
    discoveredAt: v.number(),
    publishedAt: v.optional(v.number()),
    documentTitle: v.optional(v.string()),
    firecrawlRunId: v.optional(v.string()),
    rawReference: v.optional(v.string()),
    markdown: v.optional(v.string()),
    links: v.array(v.string()),
    supersedesRevisionId: v.optional(v.id("tenderRevisions")),
    changeSummary: v.optional(v.string()),
    isFixture: v.boolean(),
    status: revisionStatus,
    /** Set when a fetch failed; the row then records the outage explicitly. */
    sourceError: v.optional(v.string()),
  })
    .index("by_tender", ["tenderId", "revisionNumber"])
    .index("by_tender_hash", ["tenderId", "normalizedSourceHash"])
    .index("by_hash", ["normalizedSourceHash"]),

  /**
   * Raw source snapshots, kept separate from revisions so a heartbeat
   * (no change) never muddies the revision chain.
   */
  sourceDocuments: defineTable({
    tenderId: v.id("tenders"),
    revisionId: v.optional(v.id("tenderRevisions")),
    url: v.string(),
    canonicalUrl: v.optional(v.string()),
    contentHash: v.string(),
    normalizedContentHash: v.string(),
    fetchedAt: v.number(),
    sourceType: v.string(),
    documentTitle: v.optional(v.string()),
    firecrawlRunId: v.optional(v.string()),
    rawReference: v.optional(v.string()),
    markdownLength: v.number(),
    isFixture: v.boolean(),
    mode: sourceMode,
  })
    .index("by_tender", ["tenderId", "fetchedAt"])
    .index("by_hash", ["normalizedContentHash"]),

  /**
   * Every external observation: fetches, heartbeats, outages, conflicts.
   * Append-only. This is where "the source was unavailable" becomes an
   * explicit recorded state instead of a guess.
   */
  sourceEvents: defineTable({
    tenderId: v.id("tenders"),
    revisionId: v.optional(v.id("tenderRevisions")),
    kind: v.union(
      v.literal("FETCH_OK"),
      v.literal("FETCH_FAILED"),
      v.literal("HEARTBEAT_UNCHANGED"),
      v.literal("REVISION_CREATED"),
      v.literal("SOURCE_UNAVAILABLE"),
      v.literal("CONFLICT_DETECTED"),
    ),
    detail: v.optional(v.string()),
    idempotencyKey: v.string(),
    at: v.number(),
  })
    .index("by_tender", ["tenderId", "at"])
    .index("by_idempotency", ["idempotencyKey"]),

  /**
   * A requirement as extracted from a specific revision. Rows are scoped to
   * a revisionId so history is read-only by construction: the current
   * requirement set is simply the rows for `tenders.currentRevisionId`.
   */
  requirements: defineTable({
    tenderId: v.id("tenders"),
    revisionId: v.id("tenderRevisions"),
    key: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    category: requirementCategory,
    mandatory: v.boolean(),
    structuredValue: v.optional(v.string()),
    sourceReference: v.optional(v.string()),
    confidence: v.optional(v.number()),
    status: requirementStatus,
    staleReason: v.optional(v.string()),
    /** Stable identity across revisions, so impact can be mapped. */
    lineageKey: v.string(),
    currentEvidenceCount: v.number(),
    model: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_revision", ["revisionId"])
    .index("by_tender_current", ["tenderId", "status"])
    .index("by_tender_lineage", ["tenderId", "lineageKey"]),

  /** Requirement ⇄ evidence edges, each pinned to the revision that needed it. */
  requirementEvidence: defineTable({
    tenderId: v.id("tenders"),
    requirementId: v.id("requirements"),
    evidenceId: v.id("evidenceItems"),
    revisionId: v.id("tenderRevisions"),
    status: evidenceStatus,
    staleReason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_requirement", ["requirementId"])
    .index("by_evidence", ["evidenceId"])
    .index("by_tender", ["tenderId"]),

  evidenceItems: defineTable({
    tenderId: v.id("tenders"),
    workspaceId: v.id("workspaces"),
    type: evidenceType,
    title: v.string(),
    source: v.optional(v.string()),
    /** Storage id for uploaded artifacts; optional for typed records. */
    storageId: v.optional(v.id("_storage")),
    body: v.optional(v.string()),
    revisionId: v.id("tenderRevisions"),
    verificationStatus: verificationStatus,
    verifiedBy: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
    staleReason: v.optional(v.string()),
    owner: v.optional(v.string()),
    isFixture: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tender", ["tenderId"])
    .index("by_revision", ["revisionId"]),

  /**
   * An amendment: a new revision superseding an old one, with its impact
   * already mapped. `conflict` is what Attack 8 produces — two official
   * sources disagreeing, which must block rather than silently resolve.
   */
  amendments: defineTable({
    tenderId: v.id("tenders"),
    revisionId: v.id("tenderRevisions"),
    supersedesRevisionId: v.id("tenderRevisions"),
    status: amendmentStatus,
    summary: v.optional(v.string()),
    impact: v.array(
      v.object({
        kind: impactKind,
        requirementId: v.optional(v.id("requirements")),
        lineageKey: v.optional(v.string()),
        label: v.string(),
        detail: v.optional(v.string()),
      }),
    ),
    invalidationCount: v.number(),
    reviewedAt: v.optional(v.number()),
    detectedAt: v.number(),
  })
    .index("by_tender", ["tenderId", "detectedAt"])
    .index("by_revision", ["revisionId"]),

  /** Two sources that disagree. Blocks readiness until a human resolves it. */
  conflicts: defineTable({
    tenderId: v.id("tenders"),
    state: conflictState,
    label: v.string(),
    detail: v.string(),
    sourceA: v.optional(v.string()),
    sourceB: v.optional(v.string()),
    revisionId: v.optional(v.id("tenderRevisions")),
    resolvedBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_tender", ["tenderId"])
    .index("by_state", ["state"]),

  clarifications: defineTable({
    tenderId: v.id("tenders"),
    workspaceId: v.id("workspaces"),
    requirementId: v.optional(v.id("requirements")),
    revisionId: v.id("tenderRevisions"),
    subject: v.string(),
    body: v.string(),
    toAddress: v.string(),
    status: clarificationStatus,
    isDemoBuyer: v.boolean(),
    draftModel: v.optional(v.string()),
    idempotencyKey: v.string(),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_tender", ["tenderId", "createdAt"])
    .index("by_idempotency", ["idempotencyKey"]),

  mailMessages: defineTable({
    tenderId: v.optional(v.id("tenders")),
    clarificationId: v.optional(v.id("clarifications")),
    direction: messageDirection,
    threadKey: v.string(),
    providerMessageId: v.optional(v.string()),
    providerThreadId: v.optional(v.string()),
    providerEventId: v.optional(v.string()),
    fromAddress: v.string(),
    toAddress: v.string(),
    subject: v.string(),
    body: v.string(),
    /** Structured facts the model extracted; validated before persisting. */
    parsedFacts: v.optional(
      v.array(
        v.object({
          requirementLineageKey: v.optional(v.string()),
          fact: v.string(),
          confidence: v.optional(v.number()),
        }),
      ),
    ),
    parseStatus: v.optional(
      v.union(v.literal("PENDING"), v.literal("PARSED"), v.literal("FAILED"), v.literal("NOT_MATCHED")),
    ),
    at: v.number(),
  })
    .index("by_thread", ["threadKey"])
    .index("by_provider_message", ["providerMessageId"])
    .index("by_event", ["providerEventId"])
    .index("by_tender", ["tenderId"]),

  /**
   * Receipts for every external side effect. Lookup key = `idempotencyKey`.
   * Before executing, consult this table: completed -> return previous
   * result, working -> reconcile, absent -> execute. This is what makes a
   * replayed workflow harmless.
   */
  outboundActions: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    kind: outboundKind,
    idempotencyKey: v.string(),
    status: outboundStatus,
    attemptCount: v.number(),
    providerRef: v.optional(v.string()),
    requestDigest: v.optional(v.string()),
    resultDigest: v.optional(v.string()),
    error: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    at: v.number(),
  })
    .index("by_idempotency", ["idempotencyKey"])
    .index("by_status", ["status"]),

  /** Durable orchestration state: one row per workflow run. */
  workflowRuns: defineTable({
    tenderId: v.optional(v.id("tenders")),
    kind: v.union(
      v.literal("INGEST"),
      v.literal("MONITOR"),
      v.literal("PROCESS_AMENDMENT"),
      v.literal("REVALIDATE"),
      v.literal("PREPARE_CLARIFICATION"),
    ),
    status: workflowStatus,
    stage: workflowStage,
    /** Committed checkpoints, so a restart resumes instead of repeating. */
    checkpoints: v.array(
      v.object({
        stage: v.string(),
        at: v.number(),
        receipt: v.optional(v.string()),
      }),
    ),
    context: v.optional(v.string()),
    error: v.optional(v.string()),
    startedAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_tender", ["tenderId"])
    .index("by_status", ["status"]),

  /**
   * Submission packages. Never a bare `ready`: the status is always
   * accompanied by the revision it was computed against and a digest that
   * the offline verifier can recompute.
   */
  submissionPackages: defineTable({
    tenderId: v.id("tenders"),
    workspaceId: v.id("workspaces"),
    revisionId: v.optional(v.id("tenderRevisions")),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("READY"),
      v.literal("BLOCKED"),
      v.literal("STALE"),
      v.literal("SENT"),
    ),
    readinessDigest: v.optional(v.string()),
    blockingRequirementIds: v.array(v.id("requirements")),
    reasons: v.array(v.string()),
    approvalState: approvalState,
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    approvalExpiresAt: v.optional(v.number()),
    generatedAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tender", ["tenderId"])
    .index("by_workspace", ["workspaceId"]),

  /**
   * Append-only receipts of major state changes. Drives the proof room and
   * the offline verifier. Never updated after insertion.
   */
  proofEvents: defineTable({
    tenderId: v.optional(v.id("tenders")),
    revisionId: v.optional(v.id("tenderRevisions")),
    kind: proofKind,
    summary: v.string(),
    detail: v.optional(
      v.object({
        revisionNumber: v.optional(v.number()),
        hash: v.optional(v.string()),
        source: v.optional(v.string()),
        blocking: v.optional(v.array(v.string())),
        digest: v.optional(v.string()),
      }),
    ),
    seq: v.number(),
    at: v.number(),
  })
    .index("by_tender", ["tenderId", "seq"])
    .index("by_kind", ["kind"]),

  auditEvents: defineTable({
    tenderId: v.optional(v.id("tenders")),
    workspaceId: v.optional(v.id("workspaces")),
    actorId: v.optional(v.id("users")),
    action: v.string(),
    detail: v.optional(v.string()),
    at: v.number(),
  }).index("by_workspace", ["workspaceId", "at"]),

  /** Rate-limit and quota observations, so a public demo cannot burn the pool. */
  rateLimitEvents: defineTable({
    scope: v.string(),
    key: v.string(),
    at: v.number(),
  }).index("by_scope_key", ["scope", "key", "at"]),
});
