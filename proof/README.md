# AMENDRY — Proof Artifacts

This directory contains machine-readable evidence and human-readable proof documents for the attack campaign and benchmark.

## Structure

```
proof/
  README.md                    — this file
  race.md                      — Attack 1: READY vs AMENDMENT race
  duplicate-webhook.md         — Attacks 2, 3, 4: idempotency
  workflow-recovery.md         — Attack 5: workflow interruption
  stale-evidence.md            — Attack 9: stale evidence
  source-conflict.md           — Attack 8: conflicting amendments
  screenshots/                 — Playwright screenshots
  manifests/                   — Run manifests
```

## Evidence Records

Machine-readable evidence lives in `evidence/`:

```
evidence/
  discovery.json               — discovery gate evidence
  revision-race.json           — Attack 1 race condition
  webhook-idempotency.json     — Attacks 2, 3, 4 idempotency
  workflow-recovery.json       — Attack 5 recovery
  readiness-kernel.json        — kernel test results
  benchmark.json               — benchmark results
  run-manifest.json            — full run manifest
```

## Verification

Run the offline proof verifier:

```bash
npm run verify:proof
```

This recomputes all readiness digests and verifies that no false READY state was ever exposed.
