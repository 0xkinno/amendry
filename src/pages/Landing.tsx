import { Logo } from "../components/brand/Logo";
import { StatusBadge } from "../components/ui/StatusBadge";

/**
 * P6.2 — Landing page `/`
 *
 * Sections:
 *   1. Hero
 *   2. Problem
 *   3. Live amendment demonstration
 *   4. How Amendry works
 *   5. Revision graph visualization
 *   6. Proof / trust section
 *   7. Sponsor mechanism explanation
 *   8. Product CTA
 *   9. Footer
 */
export default function Landing() {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* ── Ambient Warm Glow ──────────────────────────────────── */}
      <div className="ambient-glow" />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="py-24" style={{ borderBottom: "1px solid var(--line)", position: "relative", zIndex: 1 }}>
        <div className="container">
          <div className="grid grid-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="editorial-stamp">
                  Verified Tender Desk
                </span>
                <p className="text-xs uppercase tracking-wide text-muted" style={{ letterSpacing: "0.14em" }}>
                  Live Tender Integrity
                </p>
              </div>
              <h1 className="mb-6 font-display" style={{ fontSize: "clamp(2.5rem, 5vw, 3.75rem)", lineHeight: 1.08 }}>
                Keep every response current when the source changes.
              </h1>
              <p className="text-lg text-muted mb-8" style={{ maxWidth: "48ch" }}>
                Amendry monitors the live source, detects amendments, maps them
                to the exact requirements they affect, invalidates stale work,
                and keeps your response packet locked to the current verified revision.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <a href="/judges" className="btn btn--primary btn--lg">
                  Evaluate Live (Judge Mode) →
                </a>
                <a href="/app" className="btn btn--secondary btn--lg">
                  Open Operations Desk
                </a>
              </div>
              <p className="editorial-note mt-6">
                "When the buyer issues Addendum 8, dependent work is invalidated instantly — not on submission day."
              </p>
            </div>

            {/* ── Right: Cinematic Tender Desk Composition (Section 24 & 25) ── */}
            <div style={{ position: "relative" }}>
              {/* Primary Bound Document Card */}
              <div
                className="paper-card"
                style={{
                  padding: "var(--sp-8)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--line)",
                  background: "var(--white)",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <div className="flex items-center justify-between mb-6 ruled pb-4">
                  <div className="flex items-center gap-3">
                    <StatusBadge variant="live">LIVE SOURCE</StatusBadge>
                    <span className="mono text-xs text-muted">MTA Station Upgrade & Signaling</span>
                  </div>
                  <span className="mono text-xs" style={{ color: "var(--forest)", fontWeight: 600 }}>
                    Rev 08 Verified
                  </span>
                </div>

                {/* The Invariant Pipeline Strip */}
                <div
                  className="mb-6 p-3"
                  style={{
                    background: "var(--paper)",
                    border: "1.5px dashed var(--line)",
                    borderRadius: "4px",
                  }}
                >
                  <p className="text-xs uppercase tracking-wide text-muted mb-2 font-mono">
                    Integrity Lifecycle
                  </p>
                  <div className="flex items-center justify-between text-xs font-mono font-medium">
                    <span style={{ color: "var(--forest)" }}>SOURCE</span>
                    <span className="text-muted">→</span>
                    <span style={{ color: "var(--forest)" }}>REVISION</span>
                    <span className="text-muted">→</span>
                    <span style={{ color: "var(--signal)" }}>IMPACT</span>
                    <span className="text-muted">→</span>
                    <span style={{ color: "var(--forest)" }}>READY</span>
                  </div>
                </div>

                <div className="grid grid-2 gap-4 mb-4">
                  <div className="p-3" style={{ background: "var(--paper)", borderRadius: "4px" }}>
                    <p className="text-xs text-muted uppercase font-mono">Verified Requirements</p>
                    <p className="numeral--sm mt-1" style={{ color: "var(--forest)" }}>8 / 8</p>
                  </div>
                  <div className="p-3" style={{ background: "var(--paper)", borderRadius: "4px" }}>
                    <p className="text-xs text-muted uppercase font-mono">Evidence Currency</p>
                    <p className="numeral--sm mt-1" style={{ color: "var(--forest)" }}>100%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="mono text-xs text-muted">Digest: 3b5c0ab456df...</span>
                  <StatusBadge variant="ready">CERTIFIED READY</StatusBadge>
                </div>
              </div>

              {/* Smaller Red Amendment Sheet entering from side (Section 24 Metaphor) */}
              <div
                style={{
                  position: "absolute",
                  bottom: "-24px",
                  right: "-16px",
                  width: "72%",
                  background: "#FFF8F5",
                  border: "1.5px solid var(--signal)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--sp-4)",
                  boxShadow: "0 8px 24px rgba(216, 109, 58, 0.15)",
                  zIndex: 3,
                  transform: "rotate(1.5deg)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="editorial-stamp editorial-stamp--stale" style={{ fontSize: "9px" }}>
                    Addendum 8 Injected
                  </span>
                  <span className="mono text-xs" style={{ color: "var(--signal)", fontWeight: 700 }}>
                    → BLOCKED
                  </span>
                </div>
                <p className="text-xs font-mono text-muted mb-1">
                  Public liability raised $2M → $5M
                </p>
                <p className="text-xs" style={{ color: "var(--signal)", fontWeight: 500 }}>
                  Evidence marked STALE. Package fail-closed blocked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem ───────────────────────────────────────────── */}
      <section className="py-20" style={{ background: "var(--white)" }}>
        <div className="container">
          <p className="text-xs uppercase tracking-wide text-muted mb-4" style={{ letterSpacing: "0.12em" }}>
            The Problem
          </p>
          <h2 className="mb-8" style={{ maxWidth: "50ch" }}>
            A tender response is rarely one static document.
          </h2>
          <div className="grid grid-3 gap-8">
            {[
              { title: "Amendments", desc: "The buyer publishes a revised quantity, deadline, or requirement after you have already started working." },
              { title: "Clarifications", desc: "New mandatory attachments, changed evaluation criteria, or updated insurance requirements arrive mid-flight." },
              { title: "Stale Work", desc: "Your team's answers, certificates, and pricing become invalid without anyone noticing." },
            ].map((item) => (
              <div key={item.title} className="card card--ruled">
                <h3 className="mb-4">{item.title}</h3>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-20">
        <div className="container">
          <p className="text-xs uppercase tracking-wide text-muted mb-4" style={{ letterSpacing: "0.12em" }}>
            How Amendry Works
          </p>
          <h2 className="mb-12">Source → Revision → Impact → Ready</h2>
          <div className="grid grid-4 gap-8">
            {[
              { step: "01", title: "Ingest", desc: "Paste the tender URL. Firecrawl fetches the live source and computes a content hash." },
              { step: "02", title: "Extract", desc: "OpenAI extracts structured requirements, each pinned to the source revision." },
              { step: "03", title: "Monitor", desc: "Scheduled checks detect amendments. The diff maps exactly what changed." },
              { step: "04", title: "Gate", desc: "The readiness kernel refuses to declare READY unless every condition holds against the current revision." },
            ].map((item) => (
              <div key={item.step}>
                <span className="numeral--lg text-muted">{item.step}</span>
                <h3 className="mt-4 mb-3">{item.title}</h3>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Revision Graph ────────────────────────────────────── */}
      <section className="py-20" style={{ background: "var(--white)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="container">
          <p className="text-xs uppercase tracking-wide text-muted mb-4" style={{ letterSpacing: "0.12em" }}>
            Revision Graph
          </p>
          <h2 className="mb-8">Every change is tracked. Every revision is immutable.</h2>
          <div className="flex gap-4 items-center" style={{ overflowX: "auto", padding: "var(--sp-4) 0" }}>
            {[
              { rev: "Rev 1", label: "Initial", color: "var(--forest)" },
              { rev: "Rev 2", label: "Amendment", color: "var(--signal)" },
              { rev: "Rev 3", label: "Amendment", color: "var(--signal)" },
              { rev: "Rev 4", label: "Current", color: "var(--forest)" },
            ].map((r, i) => (
              <div key={r.rev} className="flex items-center gap-4">
                <div className="card" style={{ minWidth: 160, borderTop: `3px solid ${r.color}` }}>
                  <p className="mono text-xs text-muted">{r.rev}</p>
                  <p className="text-sm font-medium mt-1">{r.label}</p>
                </div>
                {i < 3 && (
                  <span style={{ color: "var(--line)", fontSize: "1.5rem" }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / Proof ─────────────────────────────────────── */}
      <section className="py-20">
        <div className="container">
          <p className="text-xs uppercase tracking-wide text-muted mb-4" style={{ letterSpacing: "0.12em" }}>
            Proof
          </p>
          <h2 className="mb-8">Every decision is auditable.</h2>
          <div className="grid grid-3 gap-8">
            {[
              { title: "Deterministic Kernel", desc: "The readiness gate is a pure function. Same input, same output. No network, no model, no clock." },
              { title: "Append-Only Receipts", desc: "Every state change produces a proof event. The offline verifier can recompute any decision." },
              { title: "Idempotent Side Effects", desc: "Firecrawl fetches, OpenAI calls, and AgentMail sends are deduplicated by deterministic keys." },
            ].map((item) => (
              <div key={item.title} className="card card--ruled">
                <h3 className="mb-4">{item.title}</h3>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <a href="/proof" className="btn btn--secondary">
              Open Proof Room →
            </a>
          </div>
        </div>
      </section>

      {/* ── Sponsor Mechanism ─────────────────────────────────── */}
      <section className="py-20" style={{ background: "var(--white)", borderTop: "1px solid var(--line)" }}>
        <div className="container">
          <p className="text-xs uppercase tracking-wide text-muted mb-4" style={{ letterSpacing: "0.12em" }}>
            Convex-Native Mechanism
          </p>
          <h2 className="mb-6" style={{ maxWidth: "50ch" }}>
            Revision-gated readiness: the system refuses to certify a work product it cannot verify against the current source.
          </h2>
          <p className="text-muted" style={{ maxWidth: "60ch" }}>
            Convex gives us transactional state and reactive updates. External side effects—Firecrawl fetches,
            OpenAI calls, AgentMail sends—are not themselves the source of truth. Amendry treats source revisions
            and side-effect receipts as first-class application state, then uses that state to gate a transactional
            human decision.
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container text-center">
          <h2 className="mb-6">Ready to keep your tenders current?</h2>
          <a href="/app" className="btn btn--primary btn--lg">
            Open workspace
          </a>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="py-8 ruled-top" style={{ background: "var(--white)" }}>
        <div className="container flex justify-between items-center">
          <Logo />
          <span className="text-xs text-muted">
            Built for the Convex × OpenAI Hackathon
          </span>
        </div>
      </footer>
    </div>
  );
}
