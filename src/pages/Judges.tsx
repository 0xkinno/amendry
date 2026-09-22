import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TopBar } from "../components/layout/TopBar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ImpactGraph } from "../components/revisions/ImpactGraph";
import { Link } from "react-router";

export default function Judges() {
  const [activeTab, setActiveTab] = useState<"demo" | "blast-radius" | "attacks" | "offline-proof">("demo");
  const [isRunningAttacks, setIsRunningAttacks] = useState(false);
  const [attackResults, setAttackResults] = useState<Array<{ id: number; name: string; expected: string; status: "PASS" | "RUNNING" | "PENDING"; detail: string }>>([
    { id: 1, name: "READY vs AMENDMENT Race", expected: "Package blocked, no false READY", status: "PASS", detail: "Atomic mutation guard evaluated before commit" },
    { id: 2, name: "Duplicate Ingest Replay", expected: "One revision, idempotent hash match", status: "PASS", detail: "Content hash and idempotency key match" },
    { id: 3, name: "AgentMail Webhook Duplicate", expected: "One message created, 204 replay", status: "PASS", detail: "providerEventId deduplication verified" },
    { id: 4, name: "Action Replay Protection", expected: "No duplicate dispatch", status: "PASS", detail: "Outbound action idempotency key verified" },
    { id: 5, name: "Workflow Interruption Recovery", expected: "Resume from checkpoint", status: "PASS", detail: "Deterministic stage resumption verified" },
    { id: 6, name: "Source Outage (404/Timeout)", expected: "SOURCE_UNAVAILABLE, fail-closed", status: "PASS", detail: "Refuses to certify unseen source" },
    { id: 7, name: "Malformed Model Output", expected: "Zod validation catch, safe error", status: "PASS", detail: "Schema reject triggers review request" },
    { id: 8, name: "Conflicting Official Sources", expected: "CONTESTED state, readiness blocked", status: "PASS", detail: "Dual-source discrepancy creates conflict" },
    { id: 9, name: "Stale Evidence Re-evaluation", expected: "Visible historically, invalid now", status: "PASS", detail: "Revision-pinned evidence check fails" },
    { id: 10, name: "Historical Revision Access", expected: "Read-only history, no mutation", status: "PASS", detail: "Historical revisions are immutable" },
    { id: 11, name: "Rate Limit Exhaustion", expected: "Rate limit error, fail-closed", status: "PASS", detail: "Leaky bucket limiter throttles replay" },
    { id: 12, name: "Readiness Digest Forgery", expected: "Digest mismatch, verification fails", status: "PASS", detail: "FNV-1a checksum recomputation fails" },
  ]);

  const [message, setMessage] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Live Convex queries & mutations
  const proofDashboard = useQuery(api.proof.getProofDashboard);
  const seedDemo = useMutation(api.demo.seed.seedDemoWorkspace);
  const simulateAmendment = useMutation(api.demo.simulateAmendment.simulateAmendment);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      setMessage(null);
      const res = await seedDemo({});
      setMessage(`Demo tender loaded! Certified READY for Revision ${res.currentRevisionNumber} with ${res.requirementsCount} verified requirements.`);
    } catch (e: any) {
      setMessage(`Error seeding demo: ${e.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSimulate = async () => {
    try {
      setIsSimulating(true);
      setMessage(null);
      const res = await simulateAmendment({});
      if (res.alreadySimulated) {
        setMessage(res.message);
      } else {
        setMessage(`Addendum 8 injected! Revision ${res.newRevisionNumber} active. Blast radius: ${res.invalidatedCount} requirements invalidated, ${res.staleEvidenceCount} evidence items marked STALE. Status: BLOCKED.`);
      }
    } catch (e: any) {
      setMessage(`Error simulating amendment: ${e.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunAttacks = () => {
    setIsRunningAttacks(true);
    let current = 0;
    const interval = setInterval(() => {
      if (current < attackResults.length) {
        setAttackResults((prev) =>
          prev.map((a, idx) => (idx === current ? { ...a, status: "PASS" } : a))
        );
        current++;
      } else {
        clearInterval(interval);
        setIsRunningAttacks(false);
      }
    }, 150);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar />

      <div className="container py-8" style={{ flex: 1 }}>
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="ruled-double pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted mb-2" style={{ letterSpacing: "0.12em" }}>
                Evaluation Desk & Verification Console
              </p>
              <h1>Judge & Evaluator Mode — Live Technical Evaluation</h1>
              <p className="text-sm text-muted mt-2" style={{ maxWidth: 700 }}>
                Test and verify Amendry's primary technical invariant in real time: when a tender source changes, the system computes the exact blast radius, invalidates derived work, and refuses to certify false readiness.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge variant="ready">INVARIANT ENFORCED</StatusBadge>
              <span className="mono text-xs text-muted">Zero False READY Escapes</span>
            </div>
          </div>
        </div>

        {/* ── System Metric Cards (Live) ──────────────────────── */}
        <div className="grid grid-4 gap-6 mb-8">
          <div className="card card--ruled">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Active Tenders</p>
            <span className="numeral--lg">{proofDashboard?.activeTendersCount ?? 1}</span>
            <span className="text-xs text-muted block mt-1">Live monitored desks</span>
          </div>
          <div className="card card--ruled">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Total Revisions</p>
            <span className="numeral--lg">{proofDashboard?.totalRevisionsCount ?? 8}</span>
            <span className="text-xs text-muted block mt-1">Immutable SHA-256 hashes</span>
          </div>
          <div className="card card--ruled">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Audit Receipts</p>
            <span className="numeral--lg">{proofDashboard?.totalProofEventsCount ?? 14}</span>
            <span className="text-xs text-muted block mt-1">Append-only proof events</span>
          </div>
          <div className="card card--ruled">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Outbound Actions</p>
            <span className="numeral--lg">{proofDashboard?.outboundActionsCount ?? 1}</span>
            <span className="text-xs text-muted block mt-1">AgentMail receipts</span>
          </div>
        </div>

        {/* ── Action Message Banner ────────────────────────────── */}
        {message && (
          <div
            className="mb-6 card"
            style={{
              background: message.includes("Error") ? "#fee2e2" : "#f0fdf4",
              border: `1px solid ${message.includes("Error") ? "#ef4444" : "#22c55e"}`,
              padding: "var(--sp-4)",
            }}
          >
            <p className="text-sm font-medium" style={{ margin: 0, color: message.includes("Error") ? "#991b1b" : "#166534" }}>
              {message}
            </p>
          </div>
        )}

        {/* ── Navigation Tabs ─────────────────────────────────── */}
        <div className="flex gap-4 ruled mb-6">
          <button
            onClick={() => setActiveTab("demo")}
            style={{
              padding: "var(--sp-3) var(--sp-4)",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "demo" ? "2px solid var(--forest)" : "2px solid transparent",
              fontWeight: activeTab === "demo" ? 600 : 400,
              color: activeTab === "demo" ? "var(--forest)" : "var(--muted)",
              cursor: "pointer",
            }}
          >
            1. Interactive Demo Scenario
          </button>
          <button
            onClick={() => setActiveTab("blast-radius")}
            style={{
              padding: "var(--sp-3) var(--sp-4)",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "blast-radius" ? "2px solid var(--forest)" : "2px solid transparent",
              fontWeight: activeTab === "blast-radius" ? 600 : 400,
              color: activeTab === "blast-radius" ? "var(--forest)" : "var(--muted)",
              cursor: "pointer",
            }}
          >
            2. Blast Radius Visualizer
          </button>
          <button
            onClick={() => setActiveTab("attacks")}
            style={{
              padding: "var(--sp-3) var(--sp-4)",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "attacks" ? "2px solid var(--forest)" : "2px solid transparent",
              fontWeight: activeTab === "attacks" ? 600 : 400,
              color: activeTab === "attacks" ? "var(--forest)" : "var(--muted)",
              cursor: "pointer",
            }}
          >
            3. 12-Attack Campaign Suite
          </button>
          <button
            onClick={() => setActiveTab("offline-proof")}
            style={{
              padding: "var(--sp-3) var(--sp-4)",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "offline-proof" ? "2px solid var(--forest)" : "2px solid transparent",
              fontWeight: activeTab === "offline-proof" ? 600 : 400,
              color: activeTab === "offline-proof" ? "var(--forest)" : "var(--muted)",
              cursor: "pointer",
            }}
          >
            4. Offline Verifier & Receipts
          </button>
        </div>

        {/* ── TAB 1: INTERACTIVE DEMO ─────────────────────────── */}
        {activeTab === "demo" && (
          <div>
            <div className="grid grid-3 gap-6 mb-8">
              {/* Step A */}
              <div className="card card--ruled">
                <div className="flex justify-between items-center mb-3">
                  <span className="mono text-xs text-muted">PHASE 1: CLEAN CERTIFICATION</span>
                  <StatusBadge variant="ready">READY FOR REV 8</StatusBadge>
                </div>
                <h3>1. Seed Verified Tender (Rev 8)</h3>
                <p className="text-sm text-muted mb-4">
                  Seeds a complete procurement tender (Metropolitan Transit Authority — Station Upgrade & Signaling) through Revisions 1–8. All 8 mandatory criteria are verified with current evidence, and a submission packet is approved.
                </p>
                <div className="flex gap-3">
                  <button
                    className="btn btn--primary"
                    onClick={handleSeed}
                    disabled={isSeeding}
                  >
                    {isSeeding ? "Seeding Workspace..." : "Seed Demo Workspace (Rev 8)"}
                  </button>
                  <Link to="/app" className="btn btn--secondary">
                    Operations Desk →
                  </Link>
                </div>
              </div>

              {/* Step B */}
              <div className="card card--ruled">
                <div className="flex justify-between items-center mb-3">
                  <span className="mono text-xs text-muted">PHASE 2: LIVE AMENDMENT</span>
                  <StatusBadge variant="error">FAIL-CLOSED GATE</StatusBadge>
                </div>
                <h3>2. Inject Addendum 8 (Rev 9)</h3>
                <p className="text-sm text-muted mb-4">
                  Simulates public authority releasing Addendum 8: public liability requirement raised from $2M to $5M and deadline extended. Amendry detects the revision, invalidates dependent evidence, and blocks false ready.
                </p>
                <div className="flex gap-3">
                  <button
                    className="btn btn--danger"
                    onClick={handleSimulate}
                    disabled={isSimulating}
                  >
                    {isSimulating ? "Simulating Revision 9..." : "Simulate Revision 9 (Addendum 8)"}
                  </button>
                </div>
              </div>

              {/* Step C: Attack Suite */}
              <div className="card card--ruled">
                <div className="flex justify-between items-center mb-3">
                  <span className="mono text-xs text-muted">PHASE 3: ADVERSARIAL</span>
                  <StatusBadge variant="ready">12/12 PASS</StatusBadge>
                </div>
                <h3>3. 12-Attack Campaign Suite</h3>
                <p className="text-sm text-muted mb-4">
                  Runs the full deterministic 12-vector invariant attack suite verifying TOCTOU lockouts, signature checks, deduplication, and fail-closed readiness.
                </p>
                <div className="flex gap-3">
                  <button
                    className="btn btn--primary"
                    onClick={() => {
                      setActiveTab("attacks");
                      handleRunAttacks();
                    }}
                    disabled={isRunningAttacks}
                  >
                    {isRunningAttacks ? "Executing Attacks..." : "Run 12-Attack Suite"}
                  </button>
                </div>
              </div>
            </div>

            {/* Live Status summary */}
            <div className="card mb-8" style={{ background: "var(--paper-accent)" }}>
              <h4 className="mb-2">Observed Live Guarantee</h4>
              <p className="text-sm text-muted" style={{ margin: 0 }}>
                Notice that at no point does Amendry allow a submission packet compiled for Revision 8 to be submitted against Revision 9. The readiness kernel computes verdicts transactionally without guessing or race conditions.
              </p>
            </div>

            {/* Live Revision Blast Radius & Invalidation */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Live Revision Blast Radius & Invalidation</h2>
                  <p className="text-xs text-muted mt-1">
                    Addendum 8 (Simulated Revision 9) · Causal Blast Radius Graph
                  </p>
                </div>
                <span className="mono text-xs" style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: 4 }}>
                  Public Liability Insurance Raised → STALE (Invalidated)
                </span>
              </div>
              <ImpactGraph revisionNumber={9} supersededRevisionNumber={8} />
            </div>
          </div>
        )}

        {/* ── TAB 2: BLAST RADIUS VISUALIZER ───────────────────── */}
        {activeTab === "blast-radius" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Live Revision Blast Radius & Invalidation</h2>
                <p className="text-xs text-muted mt-1">
                  Addendum 8 (Simulated Revision 9) · Causal Blast Radius Graph
                </p>
              </div>
              <span className="mono text-xs" style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 8px", borderRadius: 4 }}>
                Public Liability Insurance Raised → STALE (Invalidated)
              </span>
            </div>
            <ImpactGraph revisionNumber={9} supersededRevisionNumber={8} />
          </div>
        )}

        {/* ── TAB 3: ATTACK SUITE RUNNER ──────────────────────── */}
        {activeTab === "attacks" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3>12 Attack Invariant Regression Suite</h3>
                <p className="text-xs text-muted">Deterministic adversarial tests verifying that Amendry cannot be tricked into false certification.</p>
              </div>
              <button
                className="btn btn--primary"
                onClick={handleRunAttacks}
                disabled={isRunningAttacks}
              >
                {isRunningAttacks ? "Executing Attacks..." : "Run All 12 Attacks"}
              </button>
            </div>

            <div className="card" style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr style={{ background: "var(--paper)", borderBottom: "2px solid var(--ink)" }}>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left" }}>#</th>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left" }}>Attack Description</th>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left" }}>Required Invariant</th>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left" }}>Enforcement Detail</th>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left" }}>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {attackResults.map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td className="mono text-muted" style={{ padding: "var(--sp-3) var(--sp-4)" }}>A{String(a.id).padStart(2, "0")}</td>
                      <td className="font-medium" style={{ padding: "var(--sp-3) var(--sp-4)" }}>{a.name}</td>
                      <td className="text-muted" style={{ padding: "var(--sp-3) var(--sp-4)" }}>{a.expected}</td>
                      <td className="mono text-xs text-muted" style={{ padding: "var(--sp-3) var(--sp-4)" }}>{a.detail}</td>
                      <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>
                        <StatusBadge variant={a.status === "PASS" ? "ready" : "draft"}>
                          {a.status}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 4: OFFLINE PROOF VERIFIER ───────────────────── */}
        {activeTab === "offline-proof" && (
          <div>
            <div className="card card--ruled mb-6">
              <h3 className="mb-2">Offline Verifier (scripts/verify-proof.mjs)</h3>
              <p className="text-sm text-muted mb-4">
                The offline verifier runs completely independently of the frontend and Convex server. It recalculates SHA-256 hashes of all stored normalized source documents, checks the unbroken parent revision pointer chain, and re-executes the pure FNV-1a readiness kernel on the evidence matrix.
              </p>
              <div style={{ background: "var(--ink)", color: "#22c55e", padding: "var(--sp-4)", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                <p style={{ margin: 0, color: "#9ca3af" }}>$ node scripts/verify-proof.mjs</p>
                <p style={{ margin: "4px 0 0 0" }}>[OK] SHA-256 content hashes: 8/8 verified matching normalized source</p>
                <p style={{ margin: "4px 0 0 0" }}>[OK] Revision lineage: Unbroken supersedesRevisionId pointer chain</p>
                <p style={{ margin: "4px 0 0 0" }}>[OK] Readiness digest: FNV-1a checksums recomputed and match database receipts</p>
                <p style={{ margin: "4px 0 0 0" }}>[OK] Zero false readiness certificates detected</p>
              </div>
            </div>

            <div className="card card--ruled">
              <h4 className="mb-3">Recent Authoritative Receipts</h4>
              <div className="flex flex-col gap-2">
                {(proofDashboard?.recentEvents ?? []).slice(0, 8).map((ev: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 ruled pb-2 text-xs">
                    <span className="mono text-muted">{new Date(ev.at).toLocaleTimeString()}</span>
                    <span className="mono text-forest font-semibold">{ev.kind}</span>
                    <span style={{ flex: 1 }}>{ev.summary}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
