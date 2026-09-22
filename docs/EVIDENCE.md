# AMENDRY — Evidence Ledger

This document indexes all verifiable artifacts produced by automated test runners, attack scripts, benchmarks, and proof verifiers.

## Evidence Artifact Index

| Artifact | Location | Description | Verdict |
| :--- | :--- | :--- | :---: |
| **Run Manifest** | [`evidence/run-manifest.json`](file:///evidence/run-manifest.json) | Complete execution ledger covering unit tests, typechecks, attacks, and benchmarks | `PASS` |
| **Attack Campaign** | [`evidence/attack-campaign.json`](file:///evidence/attack-campaign.json) | Results of all 12 adversarial attack vectors executed against the system | `12/12 PASS` |
| **Benchmark Results (JSON)** | [`benchmark/results.json`](file:///benchmark/results.json) | Raw output of 12-scenario benchmark corpus comparing naive LLM vs Amendry | `0 ESCAPES` |
| **Benchmark Summary (MD)** | [`benchmark/results.md`](file:///benchmark/results.md) | Narrative report and matrix of benchmark scenarios | `100.0% ACC` |
| **Readiness Kernel Unit Test** | [`evidence/readiness-kernel.json`](file:///evidence/readiness-kernel.json) | Unit test verification output for deterministic readiness evaluation | `PASS` |
| **Revision Race Invariant** | [`evidence/revision-race.json`](file:///evidence/revision-race.json) | Proof that revision race prevents package mismatch escapes | `PASS` |
| **Webhook Idempotency** | [`evidence/webhook-idempotency.json`](file:///evidence/webhook-idempotency.json) | Proof of deduplicated inbound webhook processing | `PASS` |
| **Workflow Recovery** | [`evidence/workflow-recovery.json`](file:///evidence/workflow-recovery.json) | Proof of durable stage resumption without duplicate side-effects | `PASS` |

---

## Reproducing Evidence

To regenerate all evidence artifacts from scratch:

```bash
# 1. Run unit tests
npm test

# 2. Run attack campaign
npm run attack

# 3. Run integrity benchmark
npm run benchmark

# 4. Verify offline proofs
npm run verify:proof

# 5. Compile aggregate evidence manifest
npm run evidence
```
