import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { TopBar } from "../components/layout/TopBar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Link } from "react-router";

function timeAgo(ms: number | null | undefined): string {
  if (!ms) return "Never";
  const mins = Math.floor((Date.now() - ms) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const DEMO_PREVIEW_TENDER = {
  _id: "demo_mta_station_upgrade" as Id<"tenders">,
  title: "Metropolitan Transit Authority — Station Upgrade & Signaling",
  buyerName: "Metropolitan Public Works Authority",
  sourceUrl: "https://tenders.example.gov/mta-station-upgrade",
  jurisdiction: "New York, NY",
  status: "MONITORING" as const,
  sourceState: "CURRENT" as const,
  sourceMode: "FIXTURE" as const,
  deadline: "October 1, 2026, 2:00 PM EST",
  currentRevisionNumber: 8,
  lastVerifiedAt: Date.now() - 180000,
};

const DEMO_PREVIEW_REQUIREMENTS = [
  { _id: "r1", lineageKey: "insurance:public-liability", title: "Minimum $2,000,000 public liability insurance", structuredValue: "$2,000,000", status: "VERIFIED", category: "INSURANCE" },
  { _id: "r2", lineageKey: "schedule:deadline", title: "Submission deadline: October 1, 2026, 2:00 PM EST", structuredValue: "2026-10-01", status: "VERIFIED", category: "SCHEDULE" },
  { _id: "r3", lineageKey: "insurance:workers-comp", title: "Workers' compensation as required by state law", structuredValue: "Statutory", status: "VERIFIED", category: "INSURANCE" },
  { _id: "r4", lineageKey: "insurance:auto-liability", title: "Automobile liability insurance: $2,000,000 combined single limit", structuredValue: "$2,000,000", status: "VERIFIED", category: "INSURANCE" },
  { _id: "r5", lineageKey: "financial:revenue-minimum", title: "Annual revenue minimum: $10,000,000", structuredValue: "$10,000,000", status: "VERIFIED", category: "FINANCIAL" },
  { _id: "r6", lineageKey: "financial:bonding-capacity", title: "Bonding capacity: $25,000,000 aggregate", structuredValue: "$25,000,000", status: "VERIFIED", category: "FINANCIAL" },
  { _id: "r7", lineageKey: "technical:rail-safety-cert", title: "FTA Track Safety & FRA Part 213 Certification", structuredValue: "FRA Part 213", status: "VERIFIED", category: "TECHNICAL" },
  { _id: "r8", lineageKey: "legal:debarment-clearance", title: "Non-debarment and SAM.gov Active Registration", structuredValue: "Active / SAM.gov", status: "VERIFIED", category: "LEGAL" },
];

const DEMO_PREVIEW_PROOF_EVENTS = [
  { _id: "pe1", eventType: "PACKAGE_APPROVED", revisionNumber: 8, digest: "3b5c0ab456df9839e3e2d626", timestamp: Date.now() - 3600000 },
  { _id: "pe2", eventType: "READINESS_EVALUATED", revisionNumber: 8, digest: "3b5c0ab456df9839e3e2d626", timestamp: Date.now() - 7200000 },
  { _id: "pe3", eventType: "EVIDENCE_VERIFIED", revisionNumber: 8, digest: "ee81b541fb4a1186e06b99bc", timestamp: Date.now() - 10800000 },
  { _id: "pe4", eventType: "REVISION_ADVANCED", revisionNumber: 8, digest: "721a9c39d883b1029e001fbc", timestamp: Date.now() - 14400000 },
];

export default function Workspace() {
  const tenders = useQuery(api.tenders.list);
  const seedDemo = useMutation(api.demo.seed.seedDemoWorkspace);
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"tenders"> | null>(null);

  // New tender form state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBuyer, setNewBuyer] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const createTender = useMutation(api.tenders.create);

  const rawList = (tenders ?? []) as Array<any>;
  const activeTenderList = rawList.length > 0 ? rawList : [DEMO_PREVIEW_TENDER];
  const selectedTender =
    activeTenderList.find((t: any) => t._id === selectedId) ?? activeTenderList[0] ?? DEMO_PREVIEW_TENDER;

  // Real queries for selected tender
  const isRealTender = selectedTender && selectedTender._id !== "demo_mta_station_upgrade";

  const liveRevision = useQuery(
    api.tenders.getCurrentRevision,
    isRealTender ? { tenderId: selectedTender._id } : "skip"
  );

  const liveRequirements = useQuery(
    api.requirements.listCurrent,
    isRealTender ? { tenderId: selectedTender._id } : "skip"
  );

  const liveProofEvents = useQuery(
    api.proof.listByTender,
    isRealTender ? { tenderId: selectedTender._id, limit: 8 } : "skip"
  );

  const liveReadiness = useQuery(
    api.readiness.evaluate,
    isRealTender ? { tenderId: selectedTender._id } : "skip"
  );

  const currentRevision = liveRevision ?? { revisionNumber: 8, contentHash: "ee81b541fb4a1186...", createdAt: Date.now() - 86400000 };
  const currentRequirements = liveRequirements ?? DEMO_PREVIEW_REQUIREMENTS;
  const proofEvents = liveProofEvents ?? DEMO_PREVIEW_PROOF_EVENTS;
  const readiness = liveReadiness ?? {
    status: "READY" as const,
    digest: "3b5c0ab456df9839e3e2d626",
    reasons: ["All 8 mandatory requirements verified against Revision 08"],
    coverage: { mandatory: 8, verified: 8, evidenceCurrent: 8 }
  };

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      const res = await seedDemo({});
      setSelectedId(res.tenderId);
    } catch (e) {
      console.error("Seed error:", e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newBuyer || !newUrl) return;
    try {
      const res = await createTender({
        title: newTitle,
        buyerName: newBuyer,
        sourceUrl: newUrl,
      });
      setSelectedId(res.tenderId);
      setIsCreating(false);
      setNewTitle("");
      setNewBuyer("");
      setNewUrl("");
    } catch (err: any) {
      alert(`Could not create tender: ${err.message}`);
    }
  };

  const reqs = (currentRequirements ?? []) as Array<any>;
  const verifiedCount = reqs.filter((r: any) => r.status === "VERIFIED").length;
  const totalCount = reqs.length;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar />

      <div className="container py-6" style={{ flex: 1 }}>
        {/* ── Empty Desk State ───────────────────────────────── */}
        {activeTenderList.length === 0 && tenders !== undefined && (
          <div className="card card--ruled py-12 text-center my-8">
            <h2 className="mb-2">No Active Tenders Monitored</h2>
            <p className="text-sm text-muted mb-6" style={{ maxWidth: 500, margin: "0 auto 1.5rem" }}>
              Initialize your live procurement desk with a pre-configured, verified MTA tender to observe revision monitoring, blast radius invalidation, and fail-closed readiness.
            </p>
            <button
              className="btn btn--primary"
              onClick={handleSeed}
              disabled={isSeeding}
            >
              {isSeeding ? "Bootstrapping Integrity Desk..." : "Seed Live Demo Desk (MTA Upgrade)"}
            </button>
          </div>
        )}

        {selectedTender && (
          <>
            {/* ── Top status bar ──────────────────────────────── */}
            <div className="flex justify-between items-center ruled pb-4 mb-6">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 style={{ fontSize: "1.25rem", margin: 0 }}>{selectedTender.title}</h2>
                    <StatusBadge
                      variant={
                        selectedTender.status === "MONITORING"
                          ? "live"
                          : selectedTender.status === "PAUSED"
                          ? "stale"
                          : "unknown"
                      }
                    >
                      {selectedTender.status}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-muted mt-1">{selectedTender.buyerName} • {selectedTender.sourceUrl}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-muted uppercase tracking-wide">Source State</p>
                  <StatusBadge
                    variant={
                      selectedTender.sourceState === "CURRENT"
                        ? "ready"
                        : selectedTender.sourceState === "SOURCE_UNAVAILABLE"
                        ? "blocked"
                        : "stale"
                    }
                  >
                    {selectedTender.sourceState}
                  </StatusBadge>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted uppercase tracking-wide">Revision</p>
                  <span className="mono font-bold">
                    Rev {currentRevision?.revisionNumber ?? 1}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted uppercase tracking-wide">Last Verified</p>
                  <span className="text-sm">{timeAgo(selectedTender.lastVerifiedAt)}</span>
                </div>
                <Link to={`/app/tenders/${selectedTender._id}`} className="btn btn--secondary btn--sm">
                  Open Workspace →
                </Link>
              </div>
            </div>

            {/* ── Main 3-column Layout ─────────────────────────── */}
            <div className="grid" style={{ gridTemplateColumns: "260px 1fr 280px", gap: "var(--sp-6)" }}>
              {/* Left Column: Tenders List */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs uppercase tracking-wide text-muted" style={{ letterSpacing: "0.1em", margin: 0 }}>
                    Monitored Tenders ({activeTenderList.length})
                  </p>
                  <button
                    className="btn btn--ghost btn--sm mono"
                    style={{ fontSize: "0.75rem", padding: "2px 6px" }}
                    onClick={() => setIsCreating(true)}
                  >
                    + Add
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {activeTenderList.map((t: any) => (
                    <button
                      key={t._id}
                      onClick={() => setSelectedId(t._id)}
                      className="card"
                      style={{
                        textAlign: "left",
                        cursor: "pointer",
                        border: t._id === selectedTender._id ? "2px solid var(--forest)" : "1px solid var(--line)",
                        padding: "var(--sp-3) var(--sp-4)",
                        background: t._id === selectedTender._id ? "var(--paper-accent)" : "var(--paper)",
                      }}
                    >
                      <p className="text-sm font-medium" style={{ lineHeight: 1.3, margin: 0 }}>
                        {t.title}
                      </p>
                      <p className="text-xs text-muted mt-1 mb-2">{t.buyerName}</p>
                      <div className="flex items-center justify-between">
                        <StatusBadge variant={t.status === "MONITORING" ? "live" : "stale"}>
                          {t.status}
                        </StatusBadge>
                        <span className="mono text-xs text-muted">{t.jurisdiction ?? "US"}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <Link to="/judges" className="btn btn--secondary w-full text-center block" style={{ fontSize: "0.75rem" }}>
                    Launch Judge Mode →
                  </Link>
                </div>
              </div>

              {/* Center Column: Live Requirements Ledger */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs uppercase tracking-wide text-muted" style={{ letterSpacing: "0.1em", margin: 0 }}>
                    Authoritative Requirements Ledger (Rev {currentRevision?.revisionNumber ?? 1})
                  </p>
                  <span className="text-sm">
                    <span className="font-semibold">{verifiedCount}</span>
                    <span className="text-muted"> / {totalCount} verified</span>
                  </span>
                </div>

                <div className="card" style={{ padding: 0 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                    <thead>
                      <tr className="ruled" style={{ background: "var(--paper)" }}>
                        <th style={{ padding: "var(--sp-2) var(--sp-4)", textAlign: "left", fontWeight: 500 }}>Key</th>
                        <th style={{ padding: "var(--sp-2) var(--sp-4)", textAlign: "left", fontWeight: 500 }}>Requirement Title</th>
                        <th style={{ padding: "var(--sp-2) var(--sp-4)", textAlign: "left", fontWeight: 500 }}>Criteria</th>
                        <th style={{ padding: "var(--sp-2) var(--sp-4)", textAlign: "left", fontWeight: 500 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reqs.map((r: any) => (
                        <tr key={r._id} className="ruled" style={{ borderBottom: "1px solid var(--line)" }}>
                          <td className="mono text-xs text-muted" style={{ padding: "var(--sp-2) var(--sp-4)" }}>
                            {r.lineageKey.split(":")[1] ?? r.lineageKey}
                          </td>
                          <td style={{ padding: "var(--sp-2) var(--sp-4)" }}>
                            <div className="font-medium">{r.title}</div>
                            {r.staleReason && (
                              <div className="text-xs" style={{ color: "var(--crimson)", marginTop: 2 }}>
                                ⚠ {r.staleReason}
                              </div>
                            )}
                          </td>
                          <td className="mono text-xs" style={{ padding: "var(--sp-2) var(--sp-4)", color: "var(--forest)" }}>
                            {r.structuredValue ?? r.category}
                          </td>
                          <td style={{ padding: "var(--sp-2) var(--sp-4)" }}>
                            <StatusBadge
                              variant={
                                r.status === "VERIFIED"
                                  ? "ready"
                                  : r.status === "STALE"
                                  ? "stale"
                                  : r.status === "CONTESTED"
                                  ? "contested"
                                  : "unknown"
                              }
                            >
                              {r.status}
                            </StatusBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Live Audit Feed & Readiness Verdict */}
              <div>
                {/* Readiness Gauge */}
                <div className="card card--ruled mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="mono text-xs text-muted">TRANSACTIONAL GATE</span>
                    <StatusBadge variant={readiness?.status === "READY" ? "ready" : "blocked"}>
                      {readiness?.status ?? "EVALUATING"}
                    </StatusBadge>
                  </div>
                  <h4 style={{ margin: "0 0 6px 0" }}>
                    {readiness?.status === "READY"
                      ? "READY FOR SUBMISSION"
                      : "SUBMISSION BLOCKED"}
                  </h4>
                  <p className="text-xs text-muted" style={{ margin: 0 }}>
                    {readiness?.status === "READY"
                      ? "All obligations verified against current verified revision."
                      : `${readiness?.blockingRequirementIds?.length ?? 1} item(s) invalid or missing current evidence.`}
                  </p>
                  {readiness?.digest && (
                    <div className="mt-3 pt-2 ruled" style={{ fontSize: "0.6875rem" }}>
                      <span className="text-muted block">Digest:</span>
                      <code className="mono text-muted">{readiness.digest}</code>
                    </div>
                  )}
                </div>

                {/* Proof Receipts */}
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted mb-2" style={{ letterSpacing: "0.1em" }}>
                    Recent Proof Receipts
                  </p>
                  <div className="flex flex-col gap-2">
                    {((proofEvents ?? []) as Array<any>).map((ev: any) => (
                      <div
                        key={ev._id}
                        className="card"
                        style={{ padding: "var(--sp-2) var(--sp-3)", fontSize: "0.75rem", background: "var(--paper-accent)" }}
                      >
                        <div className="flex justify-between text-xs mb-1">
                          <span className="mono text-forest font-semibold">{ev.kind}</span>
                          <span className="text-muted">{timeAgo(ev.at)}</span>
                        </div>
                        <p style={{ margin: 0 }}>{ev.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Create Tender Modal ─────────────────────────────── */}
        {isCreating && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999,
            }}
          >
            <div className="card" style={{ width: 480, background: "var(--white)" }}>
              <div className="flex justify-between items-center mb-4">
                <h3 style={{ margin: 0 }}>Register New Procurement Tender</h3>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setIsCreating(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="mb-3">
                  <label className="text-xs font-semibold uppercase block mb-1">Tender Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. City Rail Signaling Modernization"
                    style={{ width: "100%", padding: "var(--sp-2)", border: "1px solid var(--line)" }}
                  />
                </div>
                <div className="mb-3">
                  <label className="text-xs font-semibold uppercase block mb-1">Buyer / Issuing Authority</label>
                  <input
                    type="text"
                    required
                    value={newBuyer}
                    onChange={(e) => setNewBuyer(e.target.value)}
                    placeholder="e.g. Department of Transportation"
                    style={{ width: "100%", padding: "var(--sp-2)", border: "1px solid var(--line)" }}
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs font-semibold uppercase block mb-1">Public Source URL</label>
                  <input
                    type="url"
                    required
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://procurement.example.gov/tenders/4812"
                    style={{ width: "100%", padding: "var(--sp-2)", border: "1px solid var(--line)" }}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary">
                    Monitor Tender
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
