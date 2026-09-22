# AMENDRY — Hackathon Submission Log

## Project
**AMENDRY** — Live Tender Integrity Desk  
*Keep every tender response synchronized with the source that can invalidate it.*

## Hackathon
Convex × OpenAI All Gas Hackathon (2026)

## Public URLs
- **Production Site**: [https://hushed-curlew-671.convex.site](https://hushed-curlew-671.convex.site)
- **Judge Evaluation Sandbox**: [https://hushed-curlew-671.convex.site/judges](https://hushed-curlew-671.convex.site/judges)
- **Proof Room**: [https://hushed-curlew-671.convex.site/proof](https://hushed-curlew-671.convex.site/proof)
- **Convex Backend**: [https://hushed-curlew-671.convex.cloud](https://hushed-curlew-671.convex.cloud)
- **GitHub Repository**: [https://github.com/0xkinno/amendry](https://github.com/0xkinno/amendry)

## One-Line Thesis
> Amendry prevents a tender submission packet from becoming invalid or disqualified when the external source of truth issues an addendum or changes criteria.

## Technical Thesis
> Convex gives us transactional state and reactive updates, but external side effects such as Firecrawl fetches, OpenAI extractions, and AgentMail sends are not themselves the source of truth. Amendry therefore makes source revision, readiness, and side-effect receipts explicit, auditable state. A tender packet cannot become READY unless every mandatory obligation and its supporting evidence are provably valid against the current verified tender revision.

## Sponsor Integrations Deep-Dive

1. **Convex**:
   - Primary transactional backend with zero external database dependencies.
   - Real-time reactive subscriptions (`useQuery`, `useMutation`) driving the entire frontend desk.
   - Pure deterministic readiness evaluation kernel (`readinessKernel.ts`).
   - Append-only cryptographic proof event ledger (`proof.ts`).
   - Server-authoritative demo seeder (`convex/demo/seed.ts`) and amendment simulator (`convex/demo/simulateAmendment.ts`).
2. **OpenAI**:
   - Structured JSON schema extraction for tender obligations, criteria, and deadlines.
   - Clause diff impact reasoning to identify the blast radius of revisions.
   - Drafts buyer clarifications with strict idempotency receipts.
3. **Firecrawl**:
   - Live tender page fetching and document crawling with markdown extraction.
   - SHA-256 raw and normalized content hashing to detect true semantic revisions vs noise.
4. **AgentMail**:
   - Outbound clarification email dispatch with durable idempotency keys (`outboundActions`).
   - Inbound webhook handler for buyer reply threads, signature verification, and deduplication.

---

## Core Capabilities & Product Completeness

AMENDRY provides a complete, human-usable tender lifecycle backed by a mathematical integrity kernel:

1. **Real Tender Ingestion**: Live URL scraping and crawling via Firecrawl API with dual SHA-256 fingerprinting.
2. **Tender & Addendum PDF Upload**: Real PDF ingestion backed by native Convex File Storage (`api.files.saveSourceDocumentFile`).
3. **Evidence Artifact Upload**: Direct compliance PDF/document upload and SHA-256 fingerprinting via `api.files.saveEvidenceFile`.
4. **Structured Requirement Extraction**: OpenAI `gpt-4o` extraction constrained by strict TypeScript/Zod schemas with quote spans and confidence metrics.
5. **Evidence Mapping**: Revision-aware `requirementEvidence` join table pinned to revision content hashes.
6. **Revision Impact Graph (Blast Radius)**: Interactive visualizer detailing source clause diffs, obligation impacts, and disqualified evidence.
7. **Stale Evidence Invalidation**: Fail-closed invalidation of evidence whenever an amendment alters requirements.
8. **AgentMail Clarification Loop**: AI draft → human review → approve → dispatch → inbound webhook reply reconciliation.
9. **Commit-Time Certification Gate**: Authoritative mutation (`finalizeSubmission`) re-verifying all requirements and evidence at the transaction boundary before issuing immutable `revisionCertificates`.
10. **Immutable Proof Ledger**: Append-only `proofEvents` ledger recording every state change and cryptographic parent hash pointer.
11. **Adversarial Attack Campaign**: 12 automated attack vectors (A01–A12) with 100% mitigation rate.
12. **Empirical Integrity Benchmark**: 12 high-stakes procurement scenarios evaluated with 0.0% false-ready escapes (vs 91.7% baseline).
13. **Standalone Offline Proof Verifier**: Math script (`scripts/verify-proof.mjs`) validating 15/15 invariants independently.

---

### Why the final submission cannot trust stale browser state

A reactive interface may have observed READY earlier.
AMENDRY does not treat that observation as authority.
The final certification mutation re-reads the current tender revision,
requirements, evidence, conflicts, and approval state, recomputes readiness,
and creates a revision-pinned certificate only when the current snapshot passes.
The browser expresses intent.
The transaction decides whether that intent is still valid.

---

## Primary Invariant
> A submission packet MUST NOT be marked READY when any mandatory requirement is UNKNOWN, CONTESTED, STALE, SUPERSEDED, SOURCE_UNAVAILABLE, or derived from a revision other than the current verified tender revision.

---

## Verified Audit & Benchmark Summary

- **Unit Test Suite**: 83 passing tests across 4 test files (`readinessKernel.test.ts`, `revisionDiff.test.ts`, `idempotency.test.ts`, `hashes.test.ts`).
- **Playwright E2E Suite**: 36/36 passing end-to-end tests across Desktop, Tablet, and Mobile viewports.
- **TypeScript Strictness**: 0 compiler errors across frontend and Convex backend; 0 instances of `as any` in `convex/`.
- **Adversarial Attack Campaign**: 12/12 executable attacks mitigated (`scripts/attack-campaign.mjs`).
- **Integrity Benchmark Corpus**: 12 high-stakes procurement scenarios evaluated.
  - Naive Baseline LLM False-Ready Escapes: 11 / 12 (91.7% failure rate).
  - AMENDRY False-Ready Escapes: **0 / 12 (0.0% escape rate / 100.0% accuracy)**.
- **Offline Proof Verifier**: 15 / 15 mathematical invariants verified without server dependencies (`scripts/verify-proof.mjs`).
- **Secret & Copy Scanner**: 0 forbidden marketing buzzwords, 0 plaintext secrets exposed in repository files.
- **Production Bundle**: Clean Vite production build.
