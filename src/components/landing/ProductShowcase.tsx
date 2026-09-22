import { SectionLabel } from "../ui/SectionLabel";
import { Button } from "../ui/Button";
import { Pill } from "../ui/Pill";
import { RevisionBadge } from "../ui/RevisionBadge";

export function ProductShowcase() {
  return (
    <section style={{ padding: "96px 0", background: "var(--paper)" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 56px" }}>
          <SectionLabel>Live Product Interface</SectionLabel>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "var(--ink)",
              marginTop: "8px",
            }}
          >
            The Operations Desk during an active amendment
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "16px", marginTop: "14px" }}>
            Every stakeholder sees the identical truth in real time: which clause changed, who is affected, and what remains to be done.
          </p>
        </div>

        {/* Centered Product UI Frame matching Probely Screenshot 5441 */}
        <div
          style={{
            maxWidth: "1060px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--line)",
            boxShadow: "var(--shadow-soft)",
            overflow: "hidden",
          }}
        >
          {/* Window Chrome Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              background: "var(--paper-2)",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#d9d5cb" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#d9d5cb" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#d9d5cb" }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--muted)",
                  marginLeft: "12px",
                }}
              >
                amendry.app / tenders / tender_nsw_bridge_p2
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <RevisionBadge revisionId="REV-000009" isCurrent />
              <Pill variant="critical">BLOCKED</Pill>
            </div>
          </div>

          {/* Product Canvas Content */}
          <div style={{ padding: "36px" }}>
            {/* Top Workspace Header */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                paddingBottom: "24px",
                borderBottom: "1px solid var(--line)",
                marginBottom: "28px",
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--forest)", fontWeight: 700 }}>
                  INFRASTRUCTURE · MAJOR PUBLIC TENDER
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.85rem",
                    color: "var(--ink)",
                    margin: "4px 0",
                  }}
                >
                  Regional Transit Link — Phase II Civil Works
                </h3>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                  Target submission: Oct 24, 2026 · Buyer: Transport Authority
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <Button to="/judges" variant="primary" size="md">
                  Review impact
                </Button>
                <Button to="/app" variant="secondary" size="md">
                  Open tender
                </Button>
              </div>
            </div>

            {/* Invalidation Alert Banner */}
            <div
              style={{
                background: "#fcf4f2",
                border: "1px solid rgba(138, 62, 52, 0.25)",
                borderRadius: "var(--radius-md)",
                padding: "18px 22px",
                marginBottom: "28px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "var(--critical)",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--critical)", fontFamily: "var(--font-mono)" }}>
                    REVISION 09 INVALIDATED PREVIOUS READINESS VERDICT
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--ink)", marginTop: "2px" }}>
                    2 obligations modified by Addendum 04. 3 attached evidence artifacts are now marked stale.
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  padding: "4px 10px",
                  background: "#ffffff",
                  borderRadius: "var(--pill)",
                  border: "1px solid rgba(138, 62, 52, 0.3)",
                  color: "var(--critical)",
                  fontWeight: 600,
                }}
              >
                TOCTOU GATE ENGAGED
              </span>
            </div>

            {/* Interactive Grid: Clause Diff & Impact Nodes */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))",
                gap: "24px",
              }}
            >
              {/* Diff Box */}
              <div
                style={{
                  background: "var(--paper-2)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--ink)" }}>
                    CLAUSE DIFF: SECTION 4.2 (INSURANCE)
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--warning)" }}>
                    MODIFIED IN REV 09
                  </span>
                </div>

                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    padding: "12px",
                    fontSize: "12px",
                    lineHeight: 1.6,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <div style={{ color: "var(--critical)", textDecoration: "line-through", marginBottom: "6px" }}>
                    - Contractor shall maintain Professional Indemnity insurance of not less than $2,000,000.
                  </div>
                  <div style={{ color: "var(--forest)", fontWeight: 600 }}>
                    + Contractor shall maintain Professional Indemnity insurance of not less than $5,000,000 with primary endorsement.
                  </div>
                </div>
              </div>

              {/* Blast Radius Box */}
              <div
                style={{
                  background: "var(--paper-2)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--ink)" }}>
                    AFFECTED DOWNSTREAM EVIDENCE
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--critical)" }}>
                    ACTION REQUIRED
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--ink)" }}>Policy Endorsement Schedule.pdf</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>Valid only up to $2M · Uploaded for Rev 08</div>
                    </div>
                    <Pill variant="critical">STALE</Pill>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--ink)" }}>Broker Compliance Undertaking.pdf</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>Pending signature for $5M amendment</div>
                    </div>
                    <Pill variant="warning">PENDING</Pill>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductShowcase;
