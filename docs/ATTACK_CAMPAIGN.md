# AMENDRY — Attack Campaign

Ten attacks against the primary invariant. Each attack has a deterministic reproduction path and a machine-readable evidence record.

## Attack 1: READY vs AMENDMENT Race

**Sequence:**
1. Tender at Revision 7, all requirements verified
2. User clicks "Mark Ready" at T0
3. Amendment creates Revision 8 at T0
4. Ready mutation tries to commit at T1

**Expected:** Revision 8 wins. Package is stale. No false READY.

**Mechanism:** The readiness check and the write that honors it happen in one Convex mutation. A concurrent revision advance either commits before the check (kernel blocks) or after it (the package is immediately STALE).

**Evidence:** `evidence/revision-race.json`

## Attack 2: Duplicate Firecrawl Result

**Sequence:** Submit the same content twice via the ingest workflow.

**Expected:** One revision, one content hash, one event lineage.

**Mechanism:** The idempotency key is derived from tenderId + sourceUrl + contentHash. A duplicate submission finds the COMPLETED receipt and returns the previous result.

**Evidence:** `proof/duplicate-webhook.md`

## Attack 3: Duplicate AgentMail Webhook

**Sequence:** Replay the exact webhook payload.

**Expected:** One message, one parse, one state transition.

**Mechanism:** The webhook handler checks the providerEventId against existing mailMessages. A duplicate returns 204 with no state transition.

**Evidence:** `evidence/webhook-idempotency.json`

## Attack 4: Action Replay

**Sequence:** Force an external action to retry (e.g., AgentMail send).

**Expected:** No duplicate email, no duplicate submission package.

**Mechanism:** The outboundActions table records each side effect with a deterministic idempotency key. A replayed action finds the COMPLETED receipt and skips the provider call.

**Evidence:** `proof/duplicate-webhook.md`

## Attack 5: Workflow Interruption

**Sequence:**
1. Start an ingest workflow
2. Stop after source fetch but before impact mapping
3. Restart the workflow

**Expected:** Resume from persisted state. No duplicated side effects.

**Mechanism:** The workflowRuns table records checkpoints. A restarted workflow checks the last checkpoint and resumes from there.

**Evidence:** `evidence/workflow-recovery.json`

## Attack 6: Source Outage

**Sequence:** Firecrawl is unavailable during a source check.

**Expected:** sourceState = SOURCE_UNAVAILABLE. No guessed revision. No false unchanged state.

**Mechanism:** The revisions.markSourceUnavailable mutation records the outage explicitly. The readiness kernel checks sourceUnavailable and blocks if true.

**Evidence:** `proof/source-outage.md`

## Attack 7: Malformed Model Output

**Sequence:** OpenAI returns invalid structured output (missing required fields).

**Expected:** Schema validation fails. State remains safe. Manual review requested.

**Mechanism:** Every model output is validated by a zod schema before persistence. Invalid output produces a controlled failure (stored error + manual review request).

**Evidence:** `proof/malformed-output.md`

## Attack 8: Conflicting Amendments

**Sequence:** Two official sources produce conflicting requirements.

**Expected:** CONTESTED state. Readiness blocked. Human review required.

**Mechanism:** The conflicts table records disagreements. The readiness kernel checks for OPEN conflicts and blocks if any exist.

**Evidence:** `proof/source-conflict.md`

## Attack 9: Stale Evidence

**Sequence:** Old evidence still exists after a revision advance.

**Expected:** Visible, linked historically, not valid for current revision.

**Mechanism:** Evidence items are pinned to the revision they were verified against. The readiness kernel checks that evidence revision matches currentRevisionId.

**Evidence:** `proof/stale-evidence.md`

## Attack 10: Historical Revision Access

**Sequence:** Open Revision 3 after Revision 8 exists.

**Expected:** Read-only historical view. Cannot mutate current state from history.

**Mechanism:** Requirements are scoped to revisionId. The current requirement set is simply the rows for tenders.currentRevisionId. Historical rows remain immutable.

**Evidence:** `proof/historical-access.md`
