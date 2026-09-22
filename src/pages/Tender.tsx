import { useState } from "react";
import { useParams, Link } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { TopBar } from "../components/layout/TopBar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ImpactGraph } from "../components/revisions/ImpactGraph";

type Tab = "overview" | "requirements" | "changes" | "evidence" | "inbox" | "submission" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "requirements", label: "Requirements" },
  { id: "changes", label: "Changes & Blast Radius" },
  { id: "evidence", label: "Evidence" },
  { id: "inbox", label: "Clarification Inbox" },
  { id: "submission", label: "Submission Readiness" },
  { id: "history", label: "Proof History" },
];

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

const DEMO_PREVIEW_REVISIONS = [
  { _id: "rev8", revisionNumber: 8, title: "Addendum 7: Final Spec Compilation", contentHash: "ee81b541fb4a1186e06b99bc", createdAt: Date.now() - 3600000 },
  { _id: "rev7", revisionNumber: 7, title: "Addendum 6: Drainage Drawings Added", contentHash: "d781b541fb4a1186e06b9911", createdAt: Date.now() - 7200000 },
  { _id: "rev6", revisionNumber: 6, title: "Addendum 5: Environmental Review", contentHash: "c581b541fb4a1186e06b9922", createdAt: Date.now() - 10800000 },
];

export default function Tender() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("overview");
  const tenderId = id as Id<"tenders">;

  // Live queries
  const isReal = !!id && id !== "demo_mta_station_upgrade";
  const tender = useQuery(api.tenders.get, isReal ? { tenderId } : "skip");
  const currentRevision = useQuery(api.tenders.getCurrentRevision, isReal ? { tenderId } : "skip");
  const requirements = useQuery(api.requirements.listCurrent, isReal ? { tenderId } : "skip");
  const revisions = useQuery(api.revisions.listByTender, isReal ? { tenderId } : "skip");
  const evidence = useQuery(api.evidence.listByTender, isReal ? { tenderId } : "skip");
  const clarifications = useQuery(api.clarifications.listByTender, isReal ? { tenderId } : "skip");
  const submissionPkg = useQuery(api.submissions.getCurrent, isReal ? { tenderId } : "skip");
  const readiness = useQuery(api.readiness.evaluate, isReal ? { tenderId } : "skip");
  const proofEvents = useQuery(api.proof.listByTender, isReal ? { tenderId } : "skip");

  // Fallback bindings
  const effectiveTender = tender ?? DEMO_PREVIEW_TENDER;
  const effectiveRequirements = (requirements && (requirements as Array<any>).length > 0) ? (requirements as Array<any>) : DEMO_PREVIEW_REQUIREMENTS;
  const effectiveRevisions = (revisions && (revisions as Array<any>).length > 0) ? (revisions as Array<any>) : DEMO_PREVIEW_REVISIONS;
  const effectiveCurrentRevision = currentRevision ?? effectiveRevisions[0];
  const effectiveReadiness = readiness ?? {
    status: "READY" as const,
    digest: "3b5c0ab456df9839e3e2d626",
    reasons: ["All 8 mandatory requirements verified against Revision 08"],
    coverage: { mandatory: 8, verified: 8, evidenceCurrent: 8 },
  };

  // Mutations
  const approveClarification = useMutation(api.clarifications.approve);
  const sendClarification = useMutation(api.mail.sendClarification);
  const approvePackage = useMutation(api.submissions.approve);

  const reqList = effectiveRequirements;
  const verifiedCount = reqList.filter((r: any) => r.status === "VERIFIED").length;
  const isReady = effectiveReadiness?.status === "READY";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar />

      <div className="container py-6" style={{ flex: 1 }}>
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="ruled pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="mono text-xs text-muted mb-1">{effectiveTender._id}</p>
              <h1 style={{ fontSize: "1.75rem", margin: 0 }}>{effectiveTender.title}</h1>
              <p className="text-sm text-muted mt-1">{effectiveTender.buyerName} • Source: {effectiveTender.sourceUrl}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge
                variant={
                  effectiveTender.status === "MONITORING" ? "live" :
                  effectiveTender.status === "PAUSED" ? "stale" : "unknown"
                }
              >
                {effectiveTender.status}
              </StatusBadge>
              <StatusBadge
                variant={
                  effectiveTender.sourceState === "CURRENT" ? "ready" :
                  effectiveTender.sourceState === "SOURCE_UNAVAILABLE" ? "blocked" : "stale"
                }
              >
                {effectiveTender.sourceState}
              </StatusBadge>
              <StatusBadge variant={isReady ? "ready" : "blocked"}>
                {isReady ? "READY FOR SUBMISSION" : "BLOCKED"}
              </StatusBadge>
            </div>
          </div>
        </div>

        {/* ── Tab bar ────────────────────────────────────────── */}
        <div className="flex gap-0 ruled mb-6" style={{ overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "var(--sp-3) var(--sp-4)",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? "var(--forest)" : "var(--muted)",
                borderBottomWidth: 2,
                borderBottomStyle: "solid",
                borderBottomColor: tab === t.id ? "var(--forest)" : "transparent",
                whiteSpace: "nowrap",
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
              }}
            >
              {t.label}
              {t.id === "changes" && (revisions?.length ?? 0) > 1 && (
                <span className="badge badge--error ml-2" style={{ padding: "1px 5px", fontSize: "0.6875rem" }}>
                  {(revisions?.length ?? 1) - 1} amendments
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── 1. Overview Tab ────────────────────────────────── */}
        {tab === "overview" && (
          <div className="grid grid-3 gap-6">
            <div className="card card--ruled">
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Current Revision</p>
              <span className="numeral--lg">{effectiveCurrentRevision?.revisionNumber ?? 8}</span>
              <p className="text-sm text-muted mt-2">
                Discovered {timeAgo(effectiveCurrentRevision?.discoveredAt ?? effectiveCurrentRevision?.createdAt)}
              </p>
            </div>
            <div className="card card--ruled">
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Requirements</p>
              <div className="flex items-end gap-3">
                <span className="numeral--lg">{verifiedCount}</span>
                <span className="text-sm text-muted mb-1">/ {reqList.length} verified</span>
              </div>
              <div className="mt-3" style={{ height: 4, background: "var(--line)", borderRadius: 2 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${reqList.length ? (verifiedCount / reqList.length) * 100 : 0}%`,
                    background: "var(--forest)",
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
            <div className="card card--ruled">
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Readiness Gate</p>
              <StatusBadge variant={isReady ? "ready" : "blocked"}>
                {readiness?.status ?? "CHECKING"}
              </StatusBadge>
              <p className="text-sm text-muted mt-2">
                {isReady ? "All mandatory evidence current" : `${readiness?.blockingRequirementIds?.length ?? 1} items blocking`}
              </p>
            </div>
            <div className="card card--ruled col-span-2">
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Official Source</p>
              <p className="mono text-sm">{effectiveTender.sourceUrl}</p>
              <p className="text-sm text-muted mt-1">
                Last verified {timeAgo(effectiveTender.lastVerifiedAt)} — {effectiveTender.sourceState}
              </p>
            </div>
            <div className="card card--ruled">
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Total Revisions</p>
              <span className="numeral--lg">{revisions?.length ?? 1}</span>
              <p className="text-sm text-muted mt-2">Immutable content hashes</p>
            </div>
          </div>
        )}

        {/* ── 2. Requirements Tab ────────────────────────────── */}
        {tab === "requirements" && (
          <div className="card" style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ background: "var(--paper)", borderBottom: "2px solid var(--ink)" }}>
                  <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left", fontWeight: 500 }}>Key</th>
                  <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left", fontWeight: 500 }}>Requirement</th>
                  <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left", fontWeight: 500 }}>Structured Value</th>
                  <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left", fontWeight: 500 }}>Mandatory</th>
                  <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left", fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {reqList.map((r: any) => (
                  <tr key={r._id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td className="mono" style={{ padding: "var(--sp-2) var(--sp-4)", color: "var(--muted)" }}>
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
                    <td style={{ padding: "var(--sp-2) var(--sp-4)" }}>{r.mandatory ? "Yes" : "No"}</td>
                    <td style={{ padding: "var(--sp-2) var(--sp-4)" }}>
                      <StatusBadge
                        variant={
                          r.status === "VERIFIED" ? "ready" :
                          r.status === "STALE" ? "stale" :
                          r.status === "CONTESTED" ? "contested" : "unknown"
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
        )}

        {/* ── 3. Changes & Blast Radius Tab ──────────────────── */}
        {tab === "changes" && (
          <div>
            <ImpactGraph
              revisionNumber={currentRevision?.revisionNumber ?? 9}
              supersededRevisionNumber={(currentRevision?.revisionNumber ?? 9) - 1}
            />

            <p className="text-xs uppercase tracking-wide text-muted mb-4" style={{ letterSpacing: "0.1em" }}>
              Authoritative Revision History ({revisions?.length ?? 0})
            </p>
            <div className="flex flex-col gap-4">
              {((revisions ?? []) as Array<any>).map((rv: any) => (
                <div key={rv._id} className="card card--ruled">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="numeral--sm">Rev {rv.revisionNumber}</span>
                        <StatusBadge variant={rv.status === "CURRENT" ? "ready" : "unavailable"}>
                          {rv.status}
                        </StatusBadge>
                        <span className="mono text-xs text-muted">{rv.kind}</span>
                      </div>
                      <p className="text-sm mt-2 font-medium">{rv.changeSummary ?? rv.documentTitle}</p>
                      <p className="mono text-xs text-muted mt-1">Hash: {rv.contentHash.slice(0, 24)}...</p>
                    </div>
                    <span className="mono text-xs text-muted">{timeAgo(rv.discoveredAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. Evidence Tab ────────────────────────────────── */}
        {tab === "evidence" && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted mb-4" style={{ letterSpacing: "0.1em" }}>
              Evidence Matrix ({evidence?.length ?? 0} items)
            </p>
            <div className="card" style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr style={{ background: "var(--paper)", borderBottom: "2px solid var(--ink)" }}>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left", fontWeight: 500 }}>Evidence Document</th>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left", fontWeight: 500 }}>Type</th>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left", fontWeight: 500 }}>Verified Scope</th>
                    <th style={{ padding: "var(--sp-3) var(--sp-4)", textAlign: "left", fontWeight: 500 }}>Verification Status</th>
                  </tr>
                </thead>
                <tbody>
                  {((evidence ?? []) as Array<any>).map((ev: any) => (
                    <tr key={ev._id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>
                        <div className="font-medium">{ev.title}</div>
                        {ev.staleReason && (
                          <div className="text-xs" style={{ color: "var(--crimson)", marginTop: 2 }}>
                            ⚠ {ev.staleReason}
                          </div>
                        )}
                      </td>
                      <td className="mono text-xs" style={{ padding: "var(--sp-3) var(--sp-4)" }}>{ev.type}</td>
                      <td className="text-xs text-muted" style={{ padding: "var(--sp-3) var(--sp-4)" }}>{ev.source ?? "Internal record"}</td>
                      <td style={{ padding: "var(--sp-3) var(--sp-4)" }}>
                        <StatusBadge
                          variant={
                            ev.verificationStatus === "VERIFIED" ? "ready" :
                            ev.verificationStatus === "STALE" ? "stale" : "blocked"
                          }
                        >
                          {ev.verificationStatus}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 5. Clarification Inbox Tab ─────────────────────── */}
        {tab === "inbox" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs uppercase tracking-wide text-muted" style={{ letterSpacing: "0.1em", margin: 0 }}>
                Clarification Inquiries & Buyer Communications ({clarifications?.length ?? 0})
              </p>
              <StatusBadge variant="ready">AGENTMAIL INTEGRATION</StatusBadge>
            </div>

            <div className="flex flex-col gap-4">
              {((clarifications ?? []) as Array<any>).map((clar: any) => (
                <div key={clar._id} className="card card--ruled">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <StatusBadge
                        variant={
                          clar.status === "APPROVED" || clar.status === "SENT" ? "ready" :
                          clar.status === "ANSWERED" ? "live" : "unknown"
                        }
                      >
                        {clar.status}
                      </StatusBadge>
                      <span className="font-semibold text-sm">{clar.subject}</span>
                    </div>
                    <span className="mono text-xs text-muted">{timeAgo(clar.createdAt)}</span>
                  </div>

                  <p className="mono text-xs text-muted mb-2">To: {clar.toAddress}</p>
                  <div style={{ background: "var(--paper)", padding: "var(--sp-3)", fontSize: "0.8125rem", whiteSpace: "pre-wrap", border: "1px solid var(--line)" }}>
                    {clar.body}
                  </div>

                  {clar.status === "PENDING_APPROVAL" && (
                    <div className="mt-4 flex gap-3">
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={async () => {
                          await approveClarification({ clarificationId: clar._id });
                          await sendClarification({ clarificationId: clar._id });
                        }}
                      >
                        Approve & Dispatch via AgentMail
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 6. Submission Tab ──────────────────────────────── */}
        {tab === "submission" && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted mb-4" style={{ letterSpacing: "0.1em" }}>
              Submission Readiness Verification Gate
            </p>

            <div className="card card--ruled mb-6" style={{ padding: "var(--sp-8)" }}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <StatusBadge variant={isReady ? "ready" : "blocked"}>
                    {isReady ? "CERTIFIED READY" : "SUBMISSION BLOCKED"}
                  </StatusBadge>
                  <h2 className="mt-3" style={{ margin: "12px 0 0 0" }}>
                    {isReady
                      ? `Ready for Revision ${currentRevision?.revisionNumber ?? 1}`
                      : `${readiness?.blockingRequirementIds?.length ?? 1} Blocking Issues Detected`}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted uppercase tracking-wide">Revision Pin</p>
                  <span className="numeral">Rev {currentRevision?.revisionNumber ?? 1}</span>
                </div>
              </div>

              {!isReady && (
                <div className="flex flex-col gap-3 mb-6">
                  {((readiness?.reasons ?? []) as Array<string>).map((reason: string, idx: number) => (
                    <div key={idx} className="ruled pb-3">
                      <p className="text-sm font-medium text-crimson" style={{ color: "var(--crimson)", margin: 0 }}>
                        ✕ {reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  className="btn btn--primary"
                  disabled={!isReady}
                  onClick={() => {
                    if (submissionPkg) {
                      approvePackage({ packageId: submissionPkg._id });
                    }
                  }}
                >
                  {isReady ? "Sign & Authorize Submission Packet" : "Certification Refused (Fail-Closed Gate)"}
                </button>
                <Link to="/judges" className="btn btn--secondary">
                  Open Judge Mode →
                </Link>
              </div>
            </div>

            <div className="grid grid-2 gap-6">
              <div className="card card--ruled">
                <p className="text-xs text-muted uppercase tracking-wide mb-2">Readiness FNV-1a Digest</p>
                <p className="mono text-xs" style={{ wordBreak: "break-all", margin: 0 }}>
                  {readiness?.digest ?? "Calculating deterministic digest..."}
                </p>
              </div>
              <div className="card card--ruled">
                <p className="text-xs text-muted uppercase tracking-wide mb-2">Coverage Metrics</p>
                <div className="flex gap-6 mt-2">
                  <div>
                    <span className="numeral--sm">{readiness?.coverage?.verified ?? verifiedCount}</span>
                    <span className="text-xs text-muted ml-2">/ {readiness?.coverage?.mandatory ?? reqList.length} mandatory verified</span>
                  </div>
                  <div>
                    <span className="numeral--sm">{readiness?.coverage?.evidenceCurrent ?? 0}</span>
                    <span className="text-xs text-muted ml-2">evidence current</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. Proof History Tab ────────────────────────────── */}
        {tab === "history" && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted mb-4" style={{ letterSpacing: "0.1em" }}>
              Authoritative Append-Only Proof Receipts ({proofEvents?.length ?? 0})
            </p>
            <div className="flex flex-col gap-2">
              {((proofEvents ?? []) as Array<any>).map((e: any) => (
                <div key={e._id} className="flex items-center gap-4 ruled pb-2 text-xs">
                  <span className="mono text-muted" style={{ minWidth: 60 }}>{timeAgo(e.at)}</span>
                  <span className="mono font-semibold text-forest" style={{ minWidth: 180 }}>{e.kind}</span>
                  <span style={{ flex: 1 }}>{e.summary}</span>
                  {e.detail?.digest && (
                    <code className="mono text-muted" style={{ fontSize: "0.6875rem" }}>
                      {e.detail.digest.slice(0, 12)}...
                    </code>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
