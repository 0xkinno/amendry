# AMENDRY — QA Checklist

## Product

- [x] One human problem immediately understandable
- [x] One surprising Convex-native mechanism (revision-gated readiness)
- [x] One strong invariant (primary invariant enforced)
- [x] Real external data (Firecrawl)
- [x] Real outbound email (AgentMail)
- [x] Real model extraction and reasoning (OpenAI)
- [x] Real reactive state (Convex queries)
- [x] Durable recovery (workflow checkpoints)
- [x] Reproducible failure experiments (attack campaign)
- [x] Evidence that survives scrutiny (proof events + offline verifier)

## Convex

- [x] TypeScript strict mode
- [x] No `any`
- [x] No secrets in frontend code
- [x] No secrets in Git
- [x] No direct browser calls to OpenAI, Firecrawl, or AgentMail
- [x] External calls in Convex actions or workflow steps
- [x] All external inputs treated as untrusted
- [x] All model output schema validated before persistence
- [x] All state transitions explicit mutations
- [x] Current revision persisted
- [x] Historical revision inspectable
- [x] Every outbound side effect has idempotency key
- [x] Duplicate webhook events harmless
- [x] Duplicate scrape results harmless
- [x] Replay does not create duplicates
- [x] Failure produces durable state
- [x] Timeout does not leave permanent working state
- [x] Source outage is explicit state
- [x] Conflicting amendments block readiness

## UI

- [x] Paper-white / warm cream background
- [x] Ink-black typography
- [x] Forest green primary accent
- [x] Vermilion / orange for risk and change
- [x] Pale yellow secondary highlight
- [x] No dark dashboard by default
- [x] No neon cyberpunk styling
- [x] No generic gradient blobs
- [x] No default Tailwind-looking cards
- [x] Premium serif headline + clean sans body
- [x] Monospace for IDs, timestamps, hashes
- [x] Motion clarifies state transitions
- [x] prefers-reduced-motion respected
- [x] Usable on iPhone SE, Android, tablet, laptop, large desktop

## Evidence

- [x] 83 unit tests pass
- [x] 10 attacks documented
- [x] Machine-readable evidence records
- [x] Offline proof verifier available
