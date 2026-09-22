# AMENDRY — Project Milestones & Delivery Record

## Milestone Summary

| Milestone | Target Date | Status | Verification Reference |
| :--- | :---: | :---: | :--- |
| **M1: Core Kernel & Domain Model** | 2026-09-21 | Completed | `tests/unit/readinessKernel.test.ts` (25/25 pass) |
| **M2: Revision & Hashing Engine** | 2026-09-21 | Completed | `tests/unit/hashes.test.ts` & `revisionDiff.test.ts` |
| **M3: External Side-Effect Ingestion** | 2026-09-22 | Completed | `convex/sources.ts`, `convex/mail.ts`, `convex/webhooks.ts` |
| **M4: Server Demo Engine & Simulation** | 2026-09-22 | Completed | `convex/demo/seed.ts` & `convex/demo/simulateAmendment.ts` |
| **M5: Reactive Frontend Operations Desk** | 2026-09-22 | Completed | `src/pages/Workspace.tsx` & `src/pages/Tender.tsx` |
| **M6: Revision Blast Radius & Impact UI** | 2026-09-22 | Completed | `src/components/revisions/ImpactGraph.tsx` |
| **M7: Judge Mode & Evaluator Experience** | 2026-09-22 | Completed | `src/pages/Judges.tsx` (`/judges`) |
| **M8: Adversarial Attack Campaign** | 2026-09-22 | Completed | `scripts/attack-campaign.mjs` (12/12 pass) |
| **M9: Tender Integrity Benchmark** | 2026-09-22 | Completed | `benchmark/results.json` (0 escapes / 100% accuracy) |
| **M10: Standalone Offline Proof Verifier** | 2026-09-22 | Completed | `scripts/verify-proof.mjs` (15/15 checks pass) |
| **M11: E2E Playwright Suite & Responsive** | 2026-09-22 | Completed | `playwright.config.ts` & `tests/e2e/*.spec.ts` (36/36 pass) |
| **M12: Production Build & Release Gate** | 2026-09-22 | Completed | `npm run build` (Clean Vite bundle) |
| **M13: Product Completeness & Bid Room** | 2026-09-22 | Completed | Real PDF storage, 5-part Bid Room, commit-time certification (`finalizeSubmission`) |

---

## Detailed Milestone Achievements

### M1–M3: Domain Integrity & External Receipts
- Pure readiness evaluation kernel with zero external I/O or stochastic model dependencies.
- Strict Convex table schema storing immutable revisions, requirements, evidence, and idempotency receipts.
- Fail-closed transitions: Any modification to a verified requirement invalidates linked evidence to `STALE` and blocks submission packages.

### M4–M7: Full Human Workflow & Reactive Client
- Operations Desk with real-time Convex subscriptions.
- Interactive Revision Impact Graph rendering source clause diffs, obligation alterations, and evidence invalidation reasons.
- Dedicated Judge Mode allowing one-click evaluation in under 2 minutes.

### M8–M12: Verification & Mathematical Proof
- 12 automated adversarial attacks executing across race conditions, duplicate webhooks, action replays, outages, schema corruption, and digest forgeries.
- 12 benchmark procurement scenarios demonstrating that naive snapshot LLMs have a 91.7% failure rate while AMENDRY maintains a 0.0% failure rate.
- Offline proof script recalculating SHA-256 parent-pointer lineage and FNV-1a digests independently.

### M13: Bid Room & Authoritative Commit-Time Certification
- Dedicated 5-part Bid Room: (1) Current Status, (2) What Changed, (3) What Broke, (4) Evidence State, (5) Next Human Action.
- Real PDF/Document ingestion with Convex File Storage (`api.files.generateUploadUrl`, `api.files.saveEvidenceFile`, `api.files.saveSourceDocumentFile`).
- Authoritative commit-time certification mutation (`api.submissions.finalizeSubmission`) closing the browser TOCTOU loophole by re-verifying all requirements and evidence inside the atomic commit transaction before stamping `revisionCertificates`.
- Real-time OpenAI structured evidence fact extraction and reactive invalidation/replacement loop.

