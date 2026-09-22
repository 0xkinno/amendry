# AMENDRY — MASTER TASK TRACKER

Execution contracts: `BUILD_INSTRUCTION.md` & `AMENDRY_FINAL_FINISHING_INSTRUCTION.md`
Status legend: `[ ]` pending · `[~]` in progress · `[x]` done · `[-]` blocked (needs human input)

---

## P0 DISCOVERY & FORENSIC AUDIT

- [x] P0.1 Read all supplied instruction files (`BUILD_INSTRUCTION.md`, `AMENDRY_FINAL_FINISHING_INSTRUCTION.md`)
  - objective: internalize the execution contracts in full before modifying code
  - files: `BUILD_INSTRUCTION.md`, `AMENDRY_FINAL_FINISHING_INSTRUCTION.md`
  - commands: —
  - acceptance: contracts read in full; audit findings recorded
  - evidence: `TASK.md`, `docs/DISCOVERY.md`
  - status: [x]
- [x] P0.2 Setup gitignored forensic reference environment
  - objective: configure reference workspace isolated in gitignored folders
  - files: `.references/`, `references/`
  - commands: —
  - acceptance: reference environment configured and completely gitignored
  - evidence: `.gitignore`
  - status: [x]
- [x] P0.3 Inspect reference architecture (schema, adapters, workflows, UI language)
  - objective: extract strongest architectural patterns, identify limits
  - files: `references/**`
  - commands: —
  - acceptance: patterns catalogued in detail
  - evidence: `references/REFERENCE_DELTA.md`, `references/FORENSIC_DELTA.md`
  - status: [x]
- [x] P0.4 Validate Convex primitives (scheduling, Workflow, Workpool, static hosting, components)
  - objective: confirm documented behavior before architecture freeze
  - files: `docs/DISCOVERY.md`
  - commands: —
  - acceptance: all discovery gate questions answered with source URLs
  - evidence: `docs/DISCOVERY.md`
  - status: [x]
- [x] P0.5 Write `docs/DISCOVERY.md`
  - objective: answer the discovery gate questions
  - files: `docs/DISCOVERY.md`
  - commands: —
  - acceptance: primitive, boundary, pain, mechanism, invariant, proof plan present
  - evidence: `docs/DISCOVERY.md`
  - status: [x]
  - status: [x]

---

## P1 SECURITY & BUILD HYGIENE

- [x] P1.1 Sanitize exposed secrets & gitignore hygiene
  - objective: prevent any plaintext credentials in git; move keys to local environment
  - files: `.env.local`, `.env.keys.example`, `.env.example`, `.gitignore`
  - commands: create `.env.local`, sanitize `.env.keys.example` and `.env.example`, add `.references/` to `.gitignore`
  - acceptance: no plaintext secrets in committed files; `.env.local` safely gitignored
  - evidence: `.gitignore`, `.env.keys.example`
  - status: [x]
- [x] P1.2 Eliminate all `as any` escapes in backend code
  - objective: strictly type all mutations, actions, and workflows without any `as any`, `@ts-ignore`, or `@ts-nocheck`
  - files: `convex/ingest.ts`, `convex/workflows/ingestTender.ts`, `convex/readiness.ts`
  - commands: code edits using `workflowStage`, `RequirementStateKind`, and `Id<"requirements">[]`
  - acceptance: zero instances of `as any` in `convex/`
  - evidence: `grep_search` returns 0 results
  - status: [x]
- [x] P1.3 Fix TypeScript compilation errors in frontend
  - objective: ensure strict compilation passes without errors
  - files: `src/pages/Workspace.tsx`
  - commands: provide fallback default tender to satisfy strict null/undefined checks
  - acceptance: `tsc -b` and `tsc -p convex --noEmit` pass clean
  - evidence: typecheck output
  - status: [x]
- [x] P1.4 Fix readiness status flattening bug in `convex/readiness.ts`
  - objective: preserve evidence verification statuses (`STALE`, `MISSING`, `CONTESTED`, `CURRENT`) and mapping status instead of hardcoding `"CURRENT" as const`
  - files: `convex/readiness.ts`
  - commands: implement `mapEvidenceItemToState` and `mapReqEvidence`
  - acceptance: kernel receives accurate evidence states; stale/unverified items block readiness fail-closed
  - evidence: `convex/readiness.ts` diff
  - status: [x]
- [x] P1.5 Unit tests for readiness input assembly & kernel evidence matrix
  - objective: verify that `CURRENT`, `STALE`, `MISSING`, `CONTESTED`, and revision mismatch all produce expected verdicts
  - files: `tests/unit/readinessKernel.test.ts`
  - commands: `npm test`
  - acceptance: all tests pass clean
  - evidence: vitest test run output
  - status: [x]

---

## P2 DOMAIN MODEL

- [x] P2.1 Project scaffold (Vite + React + TS strict + Convex)
  - files: `package.json`, `tsconfig.json`, `vite.config.ts`, `convex/`
  - commands: `npm install`
  - acceptance: `npx tsc --noEmit` clean
  - evidence: typecheck log
  - status: [x]
- [x] P2.2 Convex schema (all primary tables, indexes)
  - files: `convex/schema.ts`
  - status: [x]
- [x] P2.3 Validators + auth/session helpers
  - files: `convex/lib/validators.ts`, `convex/lib/auth.ts`
  - status: [x]
- [x] P2.4 Revision model (immutable revisions, content hashes, normalization)
  - files: `convex/lib/hashes.ts`, `convex/lib/revisionDiff.ts`
  - status: [x]
- [x] P2.5 Idempotency key model
  - files: `convex/lib/idempotency.ts`
  - status: [x]
- [x] P2.6 Readiness kernel (pure deterministic, no I/O)
  - files: `convex/lib/readinessKernel.ts`
  - status: [x]
- [x] P2.7 Unit tests (kernel, diff, hashes, idempotency)
  - files: `tests/unit/**`
  - commands: `npm test`
  - acceptance: 83 tests pass
  - evidence: `evidence/readiness-kernel.json`
  - status: [x]

---

## P3 BACKEND KERNEL & INTEGRITY ENGINE

- [x] P3.1 Tenders: create/list/get + revision bootstrap
  - files: `convex/tenders.ts`
  - status: [x]
- [x] P3.2 Revisions: create/advance/supersede + proof events
  - files: `convex/revisions.ts`
  - status: [x]
- [x] P3.3 Requirements CRUD + status transitions
  - files: `convex/requirements.ts`
  - status: [x]
- [x] P3.4 Evidence + requirement↔evidence mapping
  - files: `convex/evidence.ts`
  - status: [x]
- [x] P3.5 Amendments + impact application (invalidation)
  - files: `convex/amendments.ts`
  - status: [x]
- [x] P3.6 Readiness query/mutation (fail-closed gate) + submission packages
  - files: `convex/readiness.ts`, `convex/submissions.ts`
  - status: [x]
- [x] P3.7 Proof/audit events for every major state change
  - files: `convex/proof.ts`
  - status: [x]
- [x] P3.8 Proof dashboard live aggregation query
  - objective: query database directly for live active tenders, revision counts, proof event counts, outbound action receipts, and readiness digests
  - files: `convex/proof.ts` (`getProofDashboard`)
  - acceptance: returns real database metrics without hardcoded numbers
  - status: [x]

---

## P4 EXTERNAL INTEGRATIONS

- [x] P4.1 Firecrawl ingestion (fetch, normalize, hash, links, amendment discovery) + FIXTURE mode
  - files: `convex/sources.ts`, `convex/lib/sourceSafety.ts`
  - status: [x]
- [x] P4.2 OpenAI structured extraction (requirements, impact, clarification draft, reply parse)
  - files: `convex/lib/modelSchemas.ts`, `convex/lib/openai.ts`
  - status: [x]
- [x] P4.3 AgentMail outbound (draft -> human approval -> send) with idempotency receipts
  - files: `convex/mail.ts`, `convex/clarifications.ts`
  - status: [x]
- [x] P4.4 AgentMail webhook (signature verify, dedupe, thread match, parse, mutate)
  - files: `convex/http.ts`, `convex/webhooks.ts`
  - status: [x]
- [x] P4.5 Rate limiting (per-user + deployment-wide) for expensive ops
  - files: `convex/lib/rateLimit.ts`
  - status: [x]
- [x] P4.6 Document genuine public procurement demo source
  - objective: identify stable public URL, no login, scrapeable by Firecrawl
  - files: `docs/DEMO_SOURCE.md`
  - acceptance: real URL documented with expected extraction schema
  - status: [x]

---

## P5 WORKFLOW / DURABILITY & SERVER DEMO ENGINE

- [x] P5.1 Ingest workflow (FETCH→NORMALIZE→EXTRACT→DIFF→IMPACT→INVALIDATE→REVIEW→PACKAGE)
  - files: `convex/workflows/ingestTender.ts`, `convex/ingest.ts`
  - status: [x]
- [x] P5.2 Monitor workflow (scheduled recheck, heartbeat vs revision)
  - files: `convex/workflows/monitorTender.ts`, `convex/scheduler.ts`
  - status: [x]
- [x] P5.3 Process amendment workflow
  - files: `convex/workflows/processAmendment.ts`
  - status: [x]
- [x] P5.4 Revalidate submission workflow
  - files: `convex/workflows/revalidateSubmission.ts`
  - status: [x]
- [x] P5.5 Durable receipts for every external side effect
  - files: `convex/outboundActions` (table), `convex/lib/idempotency.ts`
  - status: [x]
- [x] P5.6 Server-authoritative demo seeder (`convex/demo/seed.ts`)
  - objective: seed realistic tender, Revisions 1-8, requirements, evidence, and verified package in a single server mutation
  - files: `convex/demo/seed.ts`
  - status: [x]
- [x] P5.7 Server-authoritative amendment simulator (`convex/demo/simulateAmendment.ts`)
  - objective: inject Revision 9 with revised liability requirement ($5M) and extended deadline, compute blast radius, set dependent evidence to STALE, block submission package
  - files: `convex/demo/simulateAmendment.ts`
  - status: [x]

---

## P6 PRODUCT UI — REACTIVE CONVEX INTEGRATION

- [x] P6.1 Setup `ConvexAuthProvider` and `ConvexReactClient` in client entry points
  - files: `src/main.tsx`, `src/App.tsx`
  - acceptance: client is connected to backend; anonymous auth works seamlessly
  - status: [x]
- [x] P6.2 Wire Operations Desk `/app` to live Convex queries
  - files: `src/pages/Workspace.tsx`
  - acceptance: live tender list via `useQuery(api.tenders.list)`, quick stats, create tender action
  - status: [x]
- [x] P6.3 Wire Tender Workspace `/app/tenders/:id` to live Convex queries & mutations
  - files: `src/pages/Tender.tsx`
  - acceptance: all 7 tabs (Overview, Requirements, Changes, Evidence, Inbox, Submission, History) powered by real Convex state
  - status: [x]
- [x] P6.4 Build interactive Revision Impact Graph component
  - objective: visual blast radius display: changed source clause -> old vs new text -> affected obligation -> dependent evidence -> invalidation reason
  - files: `src/components/revisions/ImpactGraph.tsx`
  - acceptance: interactive drill-down for any blocked or stale requirement
  - status: [x]
- [x] P6.5 Wire Proof Room `/proof` to live database queries
  - files: `src/pages/Proof.tsx`
  - acceptance: live tender count, revision count, proof receipts list, offline verification card
  - status: [x]
- [x] P6.6 Update Landing page `/` with one-click live demo onboarding
  - files: `src/pages/Landing.tsx`
  - acceptance: guest session established, demo workspace loaded in under 5 seconds
  - status: [x]

---

## P7 JUDGE MODE ROUTE (`/judges`)

- [x] P7.1 Build dedicated `/judges` evaluation route
  - objective: real interactive judge surface with one-click demo load, amendment trigger, blast radius visualization, clarification send/receive, and attack suite runner
  - files: `src/pages/Judges.tsx`, `src/App.tsx`
  - acceptance: judge can test and observe every core mechanism in under 2 minutes
  - status: [x]

---

## P8 MISSING AUTOMATION SCRIPTS

- [x] P8.1 Implement `scripts/attack-campaign.mjs` (all 12 executable attacks)
  - objective: execute attacks A01 through A12 against the system logic and verify invariants
  - files: `scripts/attack-campaign.mjs`
  - acceptance: all 12 attacks execute and pass; evidence written to `docs/ATTACK_CAMPAIGN.md` and `evidence/`
  - status: [x]
- [x] P8.2 Implement `scripts/run-benchmark.mjs` and populate `benchmark/corpus/`
  - objective: run 12-scenario corpus comparing baseline (snapshot-only) vs Amendry (revision-gated)
  - files: `scripts/run-benchmark.mjs`, `benchmark/corpus/*.json`
  - acceptance: emits `benchmark/results.json` and `benchmark/results.md` showing 0 false current-ready escapes for Amendry
  - status: [x]
- [x] P8.3 Implement `scripts/verify-proof.mjs` (standalone offline proof verifier)
  - objective: recompute SHA-256 hashes, normalized hashes, FNV-1a digests, and revision lineage independently
  - files: `scripts/verify-proof.mjs`
  - acceptance: recomputes and verifies proof events without UI dependencies
  - status: [x]
- [x] P8.4 Implement `scripts/check-wording.mjs`
  - objective: scan codebase for forbidden claims and credentials
  - files: `scripts/check-wording.mjs`
  - acceptance: passes cleanly with 0 forbidden occurrences
  - status: [x]
- [x] P8.5 Implement `scripts/collect-evidence.mjs`
  - objective: aggregate test and verification outputs into `evidence/run-manifest.json`
  - files: `scripts/collect-evidence.mjs`
  - acceptance: updates `evidence/run-manifest.json`
  - status: [x]
- [x] P8.6 Implement `scripts/push-env.mjs`
  - objective: push `.env.local` keys to Convex deployment via `npx convex env set`
  - files: `scripts/push-env.mjs`
  - status: [x]

---

## P9 E2E PLAYWRIGHT SUITE & RESPONSIVE QA

- [x] P9.1 Setup `playwright.config.ts`
  - objective: configure desktop, tablet, and mobile (iPhone SE, iPhone 14) viewports
  - files: `playwright.config.ts`
  - status: [x]
- [x] P9.2 Implement `tests/e2e/smoke.spec.ts`
  - status: [x]
- [x] P9.3 Implement `tests/e2e/demo-flow.spec.ts`
  - status: [x]
- [x] P9.4 Implement `tests/e2e/amendment-invalidation.spec.ts`
  - status: [x]
- [x] P9.5 Implement `tests/e2e/submission-readiness.spec.ts`
  - status: [x]
- [x] P9.6 Implement `tests/e2e/responsive.spec.ts` and verify mobile/tablet/desktop layouts
  - status: [x]

---

## P10 VERIFICATION, DOCUMENTATION & RELEASE GATES

- [x] P10.1 Execute all scripts and verify clean outputs:
  - `npm run typecheck`
  - `npm test`
  - `npm run attack`
  - `npm run benchmark`
  - `npm run verify:proof`
  - `npm run check:wording`
  - `npm run evidence`
  - `npm run build`
  - status: [x]
- [x] P10.2 Update root `README.md` with honest verified counts, 2x2 screenshot layout, Mermaid architecture and flow diagrams
  - status: [x]
- [x] P10.3 Update `hackathon.md`
  - status: [x]
- [x] P10.4 Update `docs/PROGRESS.md`, `docs/MILESTONES.md`, `docs/EVIDENCE.md`, `docs/PROOF.md`
  - status: [x]
- [x] P10.5 Convex static hosting deployment preparation (`npm run deploy`)
  - status: [x]
