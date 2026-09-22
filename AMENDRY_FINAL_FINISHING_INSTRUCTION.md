# AMENDRY — FINAL FINISHING INSTRUCTION FOR ANTIGRAVITY

## 0. COMMANDER'S ORDER

You are NOT starting a new project.

You are finishing and upgrading the existing **AMENDRY** codebase contained in the current workspace. Treat the existing `NEW_INSTRUCTION.MD` as the primary operating system, `Enhanced_buildrules.md` as the secondary founder/product layer, and the existing `BUILD_INSTRUCTION.md` as the current execution contract.

**Do not restart architecture. Do not simplify. Do not stub. Do not replace real integrations with fake UI. Do not rebuild from scratch.**

Your job now is:

> **Turn the existing Amendry backend/proof scaffold into a fully real, judge-ready, human-usable product whose core technical mechanism is stronger and better demonstrated than the reference samples.**

The current strategic center remains:

> **AI can understand the tender; only a revision-aware, transactional integrity layer may certify that the bid is still valid.**

The product is not "another AI procurement assistant." It is a **live tender integrity desk** for a real bid team.

### Hard product thesis

> When a tender's source of truth changes after work has started, Amendry detects the new revision, computes the exact blast radius, invalidates derived work, and refuses to certify a response until every mandatory obligation is current and human-approved.

### Hard invariant

> A submission packet MUST NOT be READY unless every mandatory requirement, its supporting evidence, and the packet itself are valid against the current verified tender revision, with no unresolved conflict, unavailable source, missing evidence, or expired human approval.

Everything else exists to support this invariant.

---

# 1. RESEARCH FIRST — USE THE SAMPLES AS FORENSIC REFERENCES, NOT AS THE PRODUCT

Create a local reference directory and inspect these repositories before changing architecture:

```text
.references/
  parallel/
  bidzy/
  nestor/
  nimgavel/
```

Repositories:

```text
https://github.com/Enoch208/parallel
https://github.com/Kingnanaweb3/bidzy
https://github.com/mrnetwork0001/Nestor
https://github.com/mystiquemide/nimgavel
```

Also read the reference material already present in this project:

```text
NEW_INSTRUCTION.MD
Enhanced_buildrules.md
stocklana_instruction.md
External_samples.md
New_Samples.md
BUILD_INSTRUCTION.md
docs/DISCOVERY.md
docs/REFERENCE_DELTA.md
docs/ATTACK_CAMPAIGN.md
```

### Important reference rule

Do NOT fork the product identity, copy pages wholesale, copy sample data, copy branding, or turn Amendry into Nestor/Bidzy/Parallel/Nimgavel.

Study and re-derive their strongest engineering patterns:

### Parallel patterns to absorb

- AI parses/understands; deterministic code makes consequential decisions.
- Optimizer / decision engine is inside authoritative Convex mutations.
- Revision guards prevent writes against stale state.
- Email is a real user interface, not a decorative integration.
- Signed webhook verification + event-id deduplication.
- Durable workflows and workpool orchestration.
- Infeasible states are explicit instead of being silently "fixed".
- Real judge path and break path are visible in the product.
- Benchmark/proof is part of the product story.

### Bidzy patterns to absorb

- Domain logic can be separated behind a Convex component boundary.
- The application can remain a stateful domain facade while a component owns specialized truth.
- Scope changes should invalidate dependent work deterministically.
- Repricing / revalidation can be driven from the authoritative project revision.
- The component-wiring scripts are useful as a development-acceleration pattern, but DO NOT copy the product.

The current Bidzy GitHub repository has mixed/stale README material, so use the actual current source files as the authority, not its top-level marketing text.

### Nestor patterns to absorb

- Guest-first onboarding.
- One clear human outcome in the first seconds.
- Real Firecrawl + OpenAI + AgentMail behavior.
- Email-first workflow with a real counterpart.
- Persistent state machine.
- Safe fallback and explicit provider status.
- Complete end-to-end journey instead of a collection of disconnected demos.
- Premium editorial interface.

### Nimgavel patterns to absorb

- Single authoritative state.
- Visible commitment / verification gates.
- Clear status vocabulary.
- Server-authoritative timing/state.
- Dense but readable ledger-style information architecture.
- Excellent first-glance framing.
- Warm paper/cream aesthetic, rules, restrained motion, visual hierarchy.

### External winning-build mentality

Use the methodology from Canon / Night Shift:

```text
ONE DISCOVERY
→ ONE TECHNICAL MECHANISM
→ ONE HARD INVARIANT
→ ATTACK IT
→ MEASURE IT
→ SHOW THE EVIDENCE
```

Do NOT attempt to beat samples by adding random features.

---

# 2. IMPORTANT CURRENT AUDIT — THE EXISTING ARCHIVE IS NOT FINISHED YET

The existing Amendry archive contains a strong backend foundation, but several areas are not yet final-production ready.

## A. Frontend is currently too static

The current `src/pages/*` surfaces contain hardcoded demo arrays and presentation values.

Examples include:

- hardcoded tenders
- hardcoded requirements
- hardcoded change feed
- hardcoded evidence rows
- hardcoded proof metrics
- hardcoded attack results

There is no real Convex `useQuery` / `useMutation` / `useAction` wiring in the current frontend archive.

### THIS MUST CHANGE

The production UI must be driven by real Convex state.

Use:

```text
React UI
   ↓
Convex reactive queries
   ↓
authoritative database state
```

User actions must call real mutations/actions.

A "demo" must create or load real backend state, not swap in static arrays.

The only permitted fixtures are:

- deterministic test fixtures
- benchmark corpus
- explicit demo-seed data created by Convex mutations
- provider fallback fixtures when the provider is unavailable, clearly labeled

Never use frontend hardcoded state to fake integration completion.

---

## B. Proof / benchmark scripts are referenced but absent from the archive

`package.json` references scripts such as:

```text
benchmark
verify:proof
check:wording
evidence
env:push
```

but the archive currently does not contain the corresponding `scripts/*.mjs` implementations.

Build them.

The following must physically exist and run:

```text
scripts/benchmark.mjs
scripts/verify-proof.mjs
scripts/check-wording.mjs
scripts/generate-evidence.mjs
scripts/attack-campaign.mjs
```

Use additional scripts where genuinely necessary.

No package script may point to a missing file.

---

## C. E2E test folder is empty

The current archive has:

```text
tests/e2e/
```

but no actual E2E tests.

Build real Playwright coverage.

At minimum:

```text
tests/e2e/smoke.spec.ts
tests/e2e/demo-flow.spec.ts
tests/e2e/amendment-invalidation.spec.ts
tests/e2e/submission-readiness.spec.ts
tests/e2e/responsive.spec.ts
```

Do not stop at screenshots.

---

## D. There are TypeScript `as any` escapes

The current archive contains `as any` in backend files.

Examples:

```text
convex/ingest.ts
convex/workflows/ingestTender.ts
convex/readiness.ts
```

Remove these.

Do not weaken types to make compilation easy.

Use explicit unions / typed helpers / generated Convex types.

Final gate:

```text
no @ts-ignore
no @ts-nocheck
no `as any`
no unsafe JSON casts without schema validation
no silent catches
```

---

## E. The current proof UI itself contains hardcoded claims

The Proof page currently presents values such as:

```text
2 active tenders
11 revisions
47 proof events
12 outbound actions
```

and attack results as literal `PASS`.

This is unacceptable for final judging.

Replace all such values with live queries over:

```text
tenders
tenderRevisions
proofEvents
outboundActions
workflowRuns
amendments
submissionPackages
sourceEvents
```

The UI should show:

```text
LIVE
COMPUTED
VERIFIED
```

only when those values actually came from executed logic.

---

# 3. SECURITY: STOP AND CLEAN SECRETS BEFORE PUBLIC GITHUB

The uploaded archive contains plaintext provider secrets in environment example material.

Treat them as compromised.

### Immediately do this

1. Rotate the exposed OpenAI / Firecrawl / AgentMail credentials.
2. Generate fresh values.
3. Never commit real credentials again.
4. Keep `.env.local` and all secret-bearing files gitignored.
5. Replace example files with placeholders only.

Do NOT put backend provider secrets in browser-exposed Vite variables.

Browser-safe:

```text
VITE_CONVEX_URL
```

Backend secrets belong in the Convex deployment environment:

```text
OPENAI_API_KEY
FIRECRAWL_API_KEY
AGENTMAIL_API_KEY
AGENTMAIL_WEBHOOK_SECRET
FIRECRAWL_WEBHOOK_SECRET   # if using Firecrawl webhook validation
```

Use Convex environment configuration rather than exposing secret values through `VITE_*`.

---

# 4. CURRENT CONVEX SPONSOR STRATEGY — MAKE THE PRIMITIVE MORE VISIBLE

The build already has the correct kernel.

Do NOT replace it.

Strengthen it.

The deep Convex discovery is:

> **Convex transactions and reactive state allow the application to make the current revision a first-class authority and perform a final commit-time certification against that state.**

The product should visibly demonstrate this.

## Required state graph

```text
SOURCE
  ↓
REVISION
  ↓
REQUIREMENTS
  ↓
EVIDENCE
  ↓
DEPENDENCY / IMPACT GRAPH
  ↓
DRAFT / CLARIFICATION / RESPONSE WORK
  ↓
READINESS
  ↓
HUMAN APPROVAL
  ↓
SUBMISSION PACKAGE
```

Every derived object must record what revision it depends on.

At minimum:

```text
revisionId
```

must be available wherever correctness depends on source state.

For important derived artifacts also preserve a deterministic digest / lineage reference.

---

# 5. THE UPGRADE THAT GIVES AMENDRY ITS REAL DIFFERENTIATION

Do not merely detect "an amendment".

Build a visible **Revision Impact Graph**.

Example:

```text
REVISION 8
   │
   ├── R-03 Auto liability
   │      └── Evidence E-07
   │             └── stale
   │
   ├── R-13 Insurance certificate
   │      └── Evidence E-12
   │             └── stale
   │
   └── R-10 Deadline
          └── submission schedule
                 └── revalidation required
```

When revision 9 arrives:

```text
SOURCE CHANGES
     ↓
NEW REVISION CREATED
     ↓
CONTENT HASH VERIFIED
     ↓
DIFF COMPUTED
     ↓
IMPACT CLASSIFIED
     ↓
DEPENDENCIES INVALIDATED
     ↓
READINESS RE-EVALUATES
     ↓
PACKET BECOMES BLOCKED / STALE
```

The user should be able to click an affected requirement and see:

```text
Why am I blocked?

Changed source
→ exact revised sentence / section
→ old value
→ new value
→ affected requirement
→ dependent evidence
→ stale reason
→ current revision
→ action required
```

This is the product's "wow" interaction.

---

# 6. AI / DETERMINISTIC BOUNDARY

Use AI only where interpretation is required.

OpenAI may:

```text
extract requirements
normalize source content
classify change meaning
summarize impact
draft clarification
parse buyer replies
draft response prose
```

OpenAI MUST NOT directly decide:

```text
READY
BLOCKED
revision identity
stale validity
evidence currentness
transaction success
side-effect receipt state
human approval
```

Those must be deterministic Convex/application logic.

Every AI output must be schema-validated with Zod or an equivalent strict validator before it affects persisted state.

Model output must be treated as untrusted input.

---

# 7. FIRECRAWL — USE THE CURRENT CONVEX COMPONENT PROPERLY

Re-check the currently installed `@firecrawl/firecrawl-convex` API and types against the current official docs before changing implementation.

Official reference:

```text
https://www.convex.dev/components/firecrawl/firecrawl-convex
```

Current component capabilities include:

- scrape
- map
- search
- durable crawls
- reactive crawl progress
- webhook completion
- polling fallback
- retries for transient failures
- page persistence

Use the current component as the canonical Firecrawl integration where practical.

### Required behavior

Initial source:

```text
user gives URL
→ Convex action/component
→ Firecrawl
→ capture source metadata
→ content hash
→ normalized hash
→ revision
```

Monitoring:

```text
scheduled/workflow trigger
→ Firecrawl re-check
→ hash comparison
→ no change OR new revision
```

A no-change heartbeat must NOT create a fake revision.

A new revision must be deterministic from normalized source content.

A source outage must be explicit:

```text
SOURCE_UNAVAILABLE
```

Never silently treat an outage as "unchanged."

---

# 8. AGENTMAIL — USE THE CURRENT COMPONENT IF COMPATIBLE

Official current reference:

```text
https://www.convex.dev/components/agentmail/convex
```

The current Convex component provides persistent inbox state, reactive threads/messages, durable sending, delivery state, webhook ingestion and deduplication.

The older Parallel repo documents a historical issue where its version of the component was rejected. DO NOT automatically reproduce that older decision.

### Required procedure

First inspect:

```text
node_modules/@agentmail/convex
```

and the installed package types / docs.

Then choose the cleanest current architecture.

Preferred architecture:

```text
AgentMail Component
      ↓
provider email truth
      ↓
Amendry domain projection
      ↓
mailMessages / clarification state
      ↓
reactive UI
```

The app may maintain a domain-specific projection of messages, but do not create two competing sources of truth for the same provider event.

### Human approval boundary

Keep:

```text
AI drafts
      ↓
HUMAN APPROVES
      ↓
SEND
```

Do NOT auto-send consequential correspondence.

### Inbound path

```text
AgentMail
→ verified webhook
→ event-id dedupe
→ provider message persisted/projected
→ thread match
→ OpenAI structured parse
→ deterministic validation
→ mutation
→ real-time UI
```

---

# 9. SIDE-EFFECT SAFETY MUST BE STRONGER THAN "TRY/CATCH"

Convex actions are external side effects.

Do NOT assume a provider call is exactly-once merely because the enclosing workflow is durable.

Maintain a real receipt ledger.

Required lifecycle:

```text
INTENT_RECORDED
   ↓
CLAIMED
   ↓
PROVIDER_EFFECT
   ↓
RECEIPT_RECORDED
   ↓
COMPLETED
```

On replay:

```text
existing COMPLETED receipt
→ return cached result
```

On uncertain state:

```text
WORKING / UNKNOWN
→ reconcile provider state
→ do not blindly send again
```

Each external action must carry:

```text
idempotencyKey
requestDigest
providerRef
resultDigest
attemptCount
```

Prove at least one actual replay returns the existing receipt instead of creating a duplicate effect.

---

# 10. REVISION-SAFE SUBMISSION PACKAGE

A submission package must include at minimum:

```text
tenderId
revisionId
readinessDigest
blockingRequirementIds
reasons
approvalState
approvedBy
approvedAt
approvalExpiresAt
generatedAt
```

Never create a bare `ready: true` fact.

The package must become invalid when the current revision moves.

Demonstrate:

```text
Rev 8
→ Packet generated
→ Human approves
→ READY

Rev 9 arrives
→ same packet is no longer current
→ STALE / BLOCKED
→ user sees exact impact
```

The UI must visibly show:

```text
READY FOR REVISION 8
```

not simply:

```text
READY
```

---

# 11. FIX THE READINESS INPUT ASSEMBLY

The kernel correctly distinguishes evidence states.

Do not accidentally flatten stored evidence into `"CURRENT"`.

Review all current readiness input construction.

The persisted status in:

```text
requirementEvidence
evidenceItems
```

must be reflected into the kernel truthfully.

Add tests for:

```text
CURRENT
STALE
MISSING
CONTESTED
revision mismatch
```

A false CURRENT mapping is a fail-closed integrity bug.

---

# 12. MAKE THE HUMAN PRODUCT COMPLETE

The product must support one complete real workflow:

## User story

A small construction / services bid team receives a public tender.

They:

```text
1. Add tender URL
2. See live ingestion
3. Requirements are extracted
4. Evidence is attached / mapped
5. Readiness is evaluated
6. User sees BLOCKED / READY state
7. Amendry keeps watching source
8. Source changes
9. Exact impact appears
10. Affected evidence becomes stale
11. Packet becomes blocked
12. AI drafts clarification
13. Human approves
14. AgentMail sends
15. Buyer replies
16. Reply is ingested
17. Requirement/evidence state updates
18. User revalidates
19. New revision is certified
20. Submission packet is produced
```

This must work using real backend state.

---

# 13. BUILD A REAL JUDGE MODE

Add a route:

```text
/judges
```

or equivalent.

It must be an actual backend demo route, not a slideshow.

The judge should be able to:

```text
LOAD LIVE DEMO
        ↓
see current tender
        ↓
see current revision
        ↓
see requirement ledger
        ↓
see readiness
        ↓
TRIGGER / OBSERVE AN AMENDMENT
        ↓
see exact impact
        ↓
see automatic invalidation
        ↓
open evidence
        ↓
send clarification
        ↓
receive reply
        ↓
revalidate
```

Have a dedicated "break it" control:

```text
RUN ATTACK
```

which triggers a deterministic test scenario.

The judge must not need to configure provider credentials manually.

The demo state must be seeded server-side through a controlled Convex mutation.

---

# 14. LIVE SOURCE + FIXTURE SOURCE

The fictional current source such as:

```text
metro.gov/procurement/bridge-phase2
```

must NOT be presented as a real external production source.

Find and configure at least one genuinely public, scrapeable procurement/tender source for the live demo.

Requirements:

```text
public
stable enough for demo
no login
accessible to Firecrawl
contains meaningful procurement requirements
```

Record the real URL in:

```text
docs/DEMO_SOURCE.md
```

Also retain deterministic local fixture scenarios for repeatable attack/benchmark runs.

The live demo proves:

```text
real Firecrawl
real source
real revision
```

The fixture harness proves:

```text
deterministic correctness
repeatability
fault injection
```

These two modes must never be confused.

---

# 15. ATTACK CAMPAIGN — THIS IS REQUIRED

Implement at least these 12 attacks:

```text
A01 ready-vs-revision race
A02 duplicate Firecrawl event
A03 duplicate AgentMail event
A04 external send replay
A05 workflow interruption / resume
A06 source outage
A07 malformed OpenAI output
A08 conflicting authoritative sources
A09 stale evidence reuse
A10 historical revision mutation attempt
A11 approval expiry
A12 duplicate revision with identical normalized hash
```

Add additional cases when they reveal meaningful failures.

For each attack record:

```text
attackId
precondition
fault injected
action
expected invariant
observed result
pass/fail
evidence artifact
timestamp
commit/revision identifier
```

The attack engine must execute real logic, not write `"PASS"` into a JSON file.

---

# 16. BENCHMARK — BASELINE VS INTERVENTION

Do not merely report unit-test counts.

Build a reproducible corpus.

Compare:

```text
BASELINE
snapshot-only readiness
```

against:

```text
AMENDRY
revision-gated readiness
```

Metrics:

```text
false-current-ready
false invalidation
duplicate external effects
duplicate revisions
stale evidence accepted
conflicts silently accepted
workflow recovery success
```

The benchmark runner must emit:

```text
benchmark/results.json
benchmark/results.md
```

and include the exact corpus + command.

Never invent results.

Never hardcode target numbers.

---

# 17. OFFLINE PROOF VERIFIER

Build:

```text
scripts/verify-proof.mjs
```

It must independently recompute at least:

```text
source hash
normalized hash
revision relationship
readiness digest
packet revision
blocking reasons
```

The verifier should not import application UI code.

It should use deterministic proof data.

Ideal model:

```text
DATABASE / EVIDENCE EXPORT
        ↓
OFFLINE VERIFIER
        ↓
RECOMPUTE
        ↓
MATCH / MISMATCH
```

Show a human-readable verification result in the Proof page.

---

# 18. PROOF ROOM MUST BECOME A REAL PRODUCT SURFACE

Do not make Proof a fake developer dashboard.

Make it understandable to a procurement lead and a judge.

Use sections:

```text
CURRENT CERTIFICATION
REVISION HISTORY
IMPACT GRAPH
INVARIANTS
RECENT ATTACKS
SIDE-EFFECT RECEIPTS
PROOF EVENTS
OFFLINE VERIFICATION
```

A human should understand:

> "Why is this bid blocked?"

before reading the technical details.

The deeper technical proof can then show:

> "The block is not a visual status. It is a transactionally enforced revision check."

---

# 19. UI DIRECTION — USE NIMGAVEL + NESTOR AS GRAMMAR, NOT AS A COPY

Keep the existing Amendry paper/editorial direction.

Use:

```text
paper white / warm cream
deep ink
forest
restrained signal accent
thin rules
dotted/dashed dividers
serif display typography
clean sans body typography
monospace for system/revision/hash data
```

Target feeling:

```text
Apple
+
high-end editorial magazine
+
professional procurement instrument
+
Figma/Adobe level spacing and typography
```

Avoid:

```text
dark cyberpunk
generic SaaS cards
shadcn-looking admin dashboard
neon AI aesthetic
huge gradients
floating blobs
dashboard clutter
```

### Hero

Desktop:

```text
LEFT
eyebrow
strong human problem
one-line product promise
primary action

RIGHT
cinematic tender / paper / document artifact image
```

The image must sit behind / beside the visual story without fighting typography.

No text inside generated hero artwork.

### Core product visual

The central screen should make this instantly understandable:

```text
CURRENT REVISION 08
        ↓
3 obligations changed
        ↓
2 pieces of evidence stale
        ↓
SUBMISSION BLOCKED
```

Then:

```text
Review impact
```

opens the evidence lineage.

### Typography

Use premium fonts already compatible with the project or add licensed web fonts.

Recommended direction:

```text
Display serif
clean sans
technical mono
```

Do not use more than three type families.

### Motion

Framer Motion.

Micro:

```text
120–200ms
```

Major transitions:

```text
250–500ms
```

No constant floating animation.

Honor:

```text
prefers-reduced-motion
```

---

# 20. MOBILE IS A FIRST-CLASS PRODUCT

This is a mobile-friendly human product, not a desktop dashboard shrunk down.

Test all critical screens at:

```text
iPhone SE
iPhone 14/15 class
Android narrow
tablet
desktop
large desktop
```

Use Playwright Chromium screenshots and assertions.

Test for:

```text
no horizontal overflow
no overlapping controls
no clipped dialogs
no broken tables
no unreadable mono/hash data
no buttons behind sticky nav
no text collision
no image covering copy
```

Where a desktop table is too wide, switch to a mobile card/stacked structure.

Do not simply set:

```css
overflow-x: auto
```

and call it responsive.

---

# 21. AUTH — COPY THE BEHAVIORAL PATTERN, NOT THE PRODUCT

Use the existing Convex Auth implementation.

Preferred first-run behavior:

```text
LANDING
→ TRY LIVE DEMO
→ guest/session established
→ backend workspace created
→ user can explore
```

Keep account creation / upgrade available.

The first five seconds must not be blocked by a signup wall.

---

# 22. CONVEX ARCHITECTURE — FINAL SHAPE

Preferred structure:

```text
convex/
  auth.ts
  auth.config.ts

  tenders.ts
  revisions.ts
  requirements.ts
  evidence.ts
  amendments.ts
  clarifications.ts
  submissions.ts
  readiness.ts
  mail.ts
  webhooks.ts

  workflows/
    ingestTender.ts
    monitorTender.ts
    processAmendment.ts
    revalidateSubmission.ts

  lib/
    readinessKernel.ts
    revisionDiff.ts
    hashes.ts
    idempotency.ts
    validators.ts
    modelSchemas.ts
    sourceSafety.ts
    policy.ts
    rateLimit.ts
    integrations.ts

  proof.ts
  scheduler.ts
  monitorAll.ts
```

Preserve good existing separation.

Do not create an enormous monolith.

---

# 23. COMPONENT STRATEGY

Use real Convex components where they create meaningful architectural value.

At minimum verify:

```text
@convex-dev/auth
@convex-dev/static-hosting
@convex-dev/workflow
@convex-dev/workpool
@firecrawl/firecrawl-convex
@agentmail/convex
```

Do not install components only for a README list.

Each used component must have observable work in the product.

---

# 24. COMMANDS / TOOLING

Make these commands work:

```bash
npm run dev
npm run build
npm run typecheck
npm test
npm run test:e2e
npm run benchmark
npm run verify:proof
npm run check:wording
npm run evidence
npm run deploy
```

Also run:

```bash
npx convex dev
```

during integration development.

Use the official Convex static-hosting deployment path for the final public app.

---

# 25. DEPLOYMENT

Official hackathon source:

```text
https://www.convex.dev/hackathons/all-gas
```

Official requirements currently include:

- Convex as backend
- Firecrawl real integration
- AgentMail real integration
- public repository
- root `hackathon.md`
- public live `convex.site` or `chatgpt.site` URL
- three-minute video
- `/hackathon` build log updates

Final public target:

```text
convex.site
```

Vercel may exist as a preview/development surface, but it is NOT a replacement for the required public Convex deployment.

Deploy using the existing static-hosting setup.

Before submission, verify the exact deployed URL in a clean browser session.

---

# 26. HUMAN / AGENT ENVIRONMENT

The human has already obtained provider credentials.

The human needs to provide / confirm:

```text
Convex project / deployment
OPENAI_API_KEY
FIRECRAWL_API_KEY
AGENTMAIL_API_KEY
AgentMail webhook secret
Firecrawl webhook secret if used
public tender demo URL OR permission for the agent to select one
GitHub repository
```

Backend secrets:

```bash
npx convex env set OPENAI_API_KEY=...
npx convex env set FIRECRAWL_API_KEY=...
npx convex env set AGENTMAIL_API_KEY=...
npx convex env set AGENTMAIL_WEBHOOK_SECRET=...
```

Use the installed component documentation/types to determine the exact webhook configuration and additional environment variables.

---

# 27. TASK / PROGRESS SYSTEM

Maintain:

```text
TASK.md
MILESTONES.md
PROGRESS.md
EVIDENCE.md
PROOF.md
```

Create when absent.

Each phase ends with:

```text
what changed
what was tested
evidence artifact
remaining risk
```

No "complete" marker without a command-backed verification.

---

# 28. PHASE EXECUTION ORDER

## PHASE 0 — FORENSIC AUDIT

Do not code.

Read:

```text
NEW_INSTRUCTION.MD
Enhanced_buildrules.md
BUILD_INSTRUCTION.md
docs/DISCOVERY.md
docs/REFERENCE_DELTA.md
```

Clone/read sample repos.

Produce:

```text
docs/COMPETITOR_DELTA.md
```

Answer:

```text
Parallel discovered:
Bidzy discovered:
Nestor discovered:
Nimgavel discovered:
Amendry's unique discovery:
Amendry's hard invariant:
Amendry's proof:
```

Then continue.

---

## PHASE 1 — SECURITY + BUILD HYGIENE

Fix:

```text
secret leakage
missing scripts
missing E2E
`as any`
broken package scripts
missing dependencies
```

Do not redesign UI yet.

Gate:

```text
npm run typecheck
npm test
```

---

## PHASE 2 — CORE INTEGRITY ENGINE

Finish and test:

```text
revision graph
hashing
diff
impact mapping
dependency invalidation
readiness
approval expiry
submission revision pinning
```

Add tests for every failure path.

---

## PHASE 3 — REAL PROVIDERS

Firecrawl:

```text
real source
real ingestion
real revision creation
real monitoring
```

AgentMail:

```text
real mailbox
real send
real inbound reply
real webhook
real dedupe
```

OpenAI:

```text
real structured extraction
real impact analysis
real reply parsing
real clarification drafting
```

---

## PHASE 4 — REAL FRONTEND

Remove static application state.

Wire:

```text
queries
mutations
actions
realtime updates
```

Create the full human workflow.

---

## PHASE 5 — JUDGE MODE

Build:

```text
/judges
```

It must provision / reuse a real demo workspace and exercise the actual backend.

---

## PHASE 6 — ATTACK + BENCHMARK + PROOF

Run all attacks.

Generate evidence.

Run benchmark.

Run offline verifier.

No invented values.

---

## PHASE 7 — PREMIUM UI

Only after the product is fully real.

Upgrade:

```text
landing
onboarding
workspace
tender
impact graph
evidence
inbox
submission
proof
judge mode
```

Use the current reference visual grammar but make Amendry clearly its own product.

---

## PHASE 8 — RESPONSIVE QA

Run Playwright across all viewport classes.

Fix every layout defect.

---

## PHASE 9 — DEPLOY + VERIFY

Run:

```text
npm run build
npm run typecheck
npm test
npm run test:e2e
npm run benchmark
npm run verify:proof
npm run evidence
npm run check:wording
npm run deploy
```

Then verify the public `convex.site` app in a clean browser session.

---

# 29. 20-SECOND JUDGE STORY

The final landing and demo must make this sequence obvious:

```text
A tender changes after the team has already worked on it.
                ↓
Amendry detects the new source revision.
                ↓
It shows exactly what became affected.
                ↓
The affected evidence is automatically stale.
                ↓
The submission packet is blocked.
                ↓
A human reviews / resolves / revalidates.
                ↓
Only the current revision can become READY.
```

Technical punchline:

```text
This is not an LLM status label.

It is a transactional, revision-aware certification gate
built on Convex state.
```

---

# 30. FINAL README

README must include:

```text
Title
Badges
One-line pitch
Hero screenshot/banner
Brief product explanation
Product links
4 screenshots in a 2×2 layout
Problem
Solution
Explore in 2 Minutes
Human workflow
Architecture
Mermaid architecture
Mermaid product flow
AI boundary
Convex depth
Firecrawl integration
AgentMail integration
Proof
Attack campaign
Benchmark
Security / reliability
Tech stack
Setup
Deployment
Demo
Limitations
Attribution / licenses
```

The first paragraph must name a real person and their problem.

Do not claim:

```text
83 tests
100% reliability
zero failures
production ready
verified
```

unless the command output actually proves it.

Use exact evidence artifacts.

---

# 31. LICENSE / ORIGINALITY RULE

You may clone reference repositories for analysis.

Use their engineering ideas as accelerators.

But before reusing actual code:

```text
inspect repository license
inspect file headers
preserve required attribution
do not copy product-specific branding/data/copy
do not make Amendry a disguised fork
```

When a pattern is better implemented natively in Amendry, reimplement it cleanly.

The final codebase must make sense as an independent product.

---

# 32. DEFINITION OF DONE

Do NOT declare the project complete until ALL are true:

```text
[ ] real Convex frontend state
[ ] real Firecrawl flow
[ ] real AgentMail send + inbound flow
[ ] real OpenAI structured workflows
[ ] immutable revision history
[ ] revision impact graph
[ ] deterministic readiness kernel
[ ] revision-pinned submission package
[ ] human approval gate
[ ] idempotent external effects with receipts
[ ] source outage state
[ ] conflict state
[ ] approval expiry
[ ] 12+ executable attacks
[ ] reproducible benchmark
[ ] offline proof verifier
[ ] real /judges flow
[ ] real demo source
[ ] no hardcoded production state
[ ] no `as any`
[ ] no missing package scripts
[ ] Playwright E2E
[ ] mobile/tablet/desktop QA
[ ] premium landing
[ ] premium product workspace
[ ] premium proof room
[ ] truthful README
[ ] truthful hackathon.md
[ ] public GitHub
[ ] public convex.site deployment
[ ] clean-browser verification
```

---

# 33. FINAL OPERATING RULE

When uncertain:

```text
DO NOT SIMPLIFY.
DO NOT STUB.
DO NOT FAKE.
DO NOT ADD RANDOM FEATURES.
DO NOT REWRITE GOOD EXISTING WORK.
DO NOT COPY A SAMPLE INTO AMENDRY.
DO NOT CALL A STATIC SCREEN A PRODUCT.
DO NOT CALL A TEST RESULT PROOF WITHOUT EXECUTING IT.
```

Instead:

```text
INSPECT
→ REUSE GOOD STRUCTURE
→ MAKE STATE REAL
→ STRENGTHEN THE INVARIANT
→ ATTACK THE INVARIANT
→ MEASURE THE RESULT
→ SHOW THE RESULT
→ SHIP
```

The build should end as:

```text
AMENDRY
LIVE TENDER INTEGRITY DESK

real human problem
        ↓
real source
        ↓
real revision
        ↓
real impact
        ↓
real invalidation
        ↓
real human decision
        ↓
real email loop
        ↓
real readiness gate
        ↓
real submission packet
        ↓
real proof
```

Do the work in this order. Preserve depth. Finish every phase. Do not stop at architecture or UI polish.
