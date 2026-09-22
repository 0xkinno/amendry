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

## Primary Invariant
> A submission packet MUST NOT be marked READY when any mandatory requirement is UNKNOWN, CONTESTED, STALE, SUPERSEDED, SOURCE_UNAVAILABLE, or derived from a revision other than the current verified tender revision.

---

## Verified Audit & Benchmark Summary

- **Unit Test Suite**: 83 passing tests across 4 test files (`readinessKernel.test.ts`, `revisionDiff.test.ts`, `idempotency.test.ts`, `hashes.test.ts`).
- **TypeScript Strictness**: 0 compiler errors across frontend and Convex backend; 0 instances of `as any` in `convex/`.
- **Adversarial Attack Campaign**: 12/12 executable attacks mitigated (`scripts/attack-campaign.mjs`).
- **Integrity Benchmark Corpus**: 12 high-stakes procurement scenarios evaluated.
  - Naive Baseline LLM False-Ready Escapes: 11 / 12 (91.7% failure rate).
  - AMENDRY False-Ready Escapes: **0 / 12 (0.0% escape rate / 100.0% accuracy)**.
- **Offline Proof Verifier**: 15 / 15 mathematical invariants verified without server dependencies (`scripts/verify-proof.mjs`).
- **Secret & Copy Scanner**: 0 forbidden marketing buzzwords, 0 plaintext secrets exposed in repository files.
- **Production Bundle**: Clean Vite production build in 5.96s.
