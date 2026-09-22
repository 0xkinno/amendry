# AMENDRY — Discovery

## Primitive

Revision-gated readiness: treating external source revisions and side-effect receipts as first-class application state, then using that state to gate a transactional human decision.

## Exact Documented Behavior

The readiness kernel (`convex/lib/readinessKernel.ts`) is a pure function:

- Input: currentRevisionId, requirements[], evidence[], conflicts[], packageRevisionId, approvalState
- Output: READY or BLOCKED with reasons, blocking IDs, and a deterministic digest
- No I/O, no network, no model, no database, no clock, no randomness

The kernel enforces:

1. Package must be pinned to currentRevisionId
2. Every mandatory requirement must be VERIFIED at this revision
3. Evidence backing a mandatory requirement must be CURRENT
4. No OPEN conflicts
5. Human approval present and not expired

## Tested Behavior

83 unit tests pass across 4 test files:

- `readinessKernel.test.ts` (25 tests): All 7 states, all blocking conditions, digest determinism
- `revisionDiff.test.ts` (13 tests): Deterministic diff, blocking change detection
- `hashes.test.ts` (34 tests): Content hashing, normalization, URL normalization
- `idempotency.test.ts` (11 tests): Key generation, decision function

## Source URLs

- Convex mutations: https://docs.convex.dev/database/mutations
- Convex queries: https://docs.convex.dev/database/queries
- Convex scheduled functions: https://docs.convex.dev/scheduling/scheduled-functions
- Convex Workflow: https://docs.convex.dev/components/workflow
- Firecrawl Convex component: https://www.convex.dev/components/firecrawl/firecrawl-convex
- AgentMail Convex component: https://www.convex.dev/components/agentmail/convex

## Failure Case

If the kernel crashes, it must not silently pass. The evaluateReadiness function is total: every input shape produces a result. There is no throw path.

## User Pain

Procurement teams lose time and money when a tender changes after work has already started. The hidden problem is not "reading a tender" — it is keeping a decision and its dependent work valid while the external source of truth changes.

## Existing Pattern Gap

Most tender management tools treat tenders as static documents. They detect changes by manual re-reading or simple diffing, but they do not:

1. Pin readiness to a specific revision
2. Invalidate dependent work when the source changes
3. Provide a deterministic, auditable gate for submission
4. Treat side-effect receipts as first-class state

## New Capability

Amendry makes the source revision, readiness, and side-effect receipts explicit state. A response cannot become READY unless every mandatory obligation is valid against the current tender revision.

## Primary Invariant

A submission packet MUST NOT be marked READY when any mandatory requirement is UNKNOWN, CONTESTED, STALE, SUPERSEDED, SOURCE_UNAVAILABLE, or derived from a revision other than the current verified tender revision.

## Proof Plan

1. Unit tests for the readiness kernel (25 tests)
2. Unit tests for the revision diff (13 tests)
3. Attack campaign: 10 attacks covering race conditions, duplicates, outages, conflicts
4. Benchmark: 12 scenarios comparing snapshot-only vs revision-gated readiness
5. Offline proof verifier: scripts/verify-proof.mjs
