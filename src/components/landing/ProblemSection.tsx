import { SectionLabel } from "../ui/SectionLabel";

export function ProblemSection() {
  return (
    <section style={{ padding: "96px 0", background: "var(--paper-2)", borderTop: "1px solid var(--line)" }}>
      <div className="container">
        {/* Human Problem Statement */}
        <div style={{ maxWidth: "800px", margin: "0 auto 80px", textAlign: "center" }}>
          <SectionLabel>The Problem</SectionLabel>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2.5rem, 5.5vw, 4rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              color: "var(--ink)",
              marginTop: "8px",
              marginBottom: "32px",
              fontWeight: 400,
            }}
          >
            A tender can change after you've already answered it.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "24px",
              textAlign: "left",
              marginTop: "48px",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                padding: "24px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--line)",
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--critical)", fontWeight: 700, marginBottom: "8px" }}>
                TRUTH 01
              </div>
              <h4 style={{ fontSize: "18px", fontFamily: "var(--font-serif)", marginBottom: "8px", color: "var(--ink)" }}>
                The source changes.
              </h4>
              <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
                Buyers release addenda, Q&A clarifications, and revised scopes quietly via portal uploads or email attachments.
              </p>
            </div>

            <div
              style={{
                background: "#ffffff",
                padding: "24px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--line)",
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--warning)", fontWeight: 700, marginBottom: "8px" }}>
                TRUTH 02
              </div>
              <h4 style={{ fontSize: "18px", fontFamily: "var(--font-serif)", marginBottom: "8px", color: "var(--ink)" }}>
                The team keeps working.
              </h4>
              <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
                Specialists draft sections in parallel. Without real-time propagation, they polish content based on obsolete clauses.
              </p>
            </div>

            <div
              style={{
                background: "#ffffff",
                padding: "24px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--line)",
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--forest)", fontWeight: 700, marginBottom: "8px" }}>
                TRUTH 03
              </div>
              <h4 style={{ fontSize: "18px", fontFamily: "var(--font-serif)", marginBottom: "8px", color: "var(--ink)" }}>
                The stale work still looks finished.
              </h4>
              <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.5 }}>
                In a static checklist or spreadsheet, every box stays green. Nobody notices the mismatch until the submission is rejected.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Mechanism Split Section */}
        <div
          style={{
            background: "var(--ink)",
            color: "#ffffff",
            borderRadius: "var(--radius-lg)",
            padding: "56px 48px",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
              gap: "48px",
              alignItems: "center",
            }}
          >
            {/* Left: Mechanism Framing */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#80eec0",
                  letterSpacing: "0.12em",
                  marginBottom: "16px",
                }}
              >
                THE ARCHITECTURAL SOLUTION
              </div>

              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(2rem, 3.8vw, 2.8rem)",
                  lineHeight: 1.15,
                  fontWeight: 400,
                  color: "#ffffff",
                  marginBottom: "20px",
                }}
              >
                Why Convex matters: commit-time transactional gates
              </h3>

              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.65,
                  color: "rgba(255, 255, 255, 0.75)",
                  marginBottom: "24px",
                }}
              >
                Most systems treat readiness as a cosmetic boolean on a client screen. Amendry evaluates readiness inside an ACID Convex mutation boundary at the exact millisecond of package certification.
              </p>

              <div
                style={{
                  padding: "16px 20px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "#99dfbb",
                }}
              >
                UI observation !== Certification authority.
                <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "11px", marginTop: "4px" }}>
                  A browser race condition cannot bypass server-side revision matching.
                </div>
              </div>
            </div>

            {/* Right: Cascade Diagram */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "var(--radius-md)",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>01 · CURRENT REVISION (PORTAL / AGENTMAIL)</span>
                <span style={{ color: "#80eec0" }}>SOURCE OF TRUTH</span>
              </div>

              <div style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.3)", fontSize: "12px" }}>↓</div>

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>02 · DETERMINISTIC IMPACT GRAPH</span>
                <span style={{ color: "var(--signal)" }}>BLAST RADIUS</span>
              </div>

              <div style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.3)", fontSize: "12px" }}>↓</div>

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>03 · TRANSACTIONAL READINESS GATE</span>
                <span style={{ color: "#ffffff" }}>CONVEX MUTATION</span>
              </div>

              <div style={{ textAlign: "center", color: "rgba(255, 255, 255, 0.3)", fontSize: "12px" }}>↓</div>

              <div
                style={{
                  background: "var(--forest)",
                  padding: "14px 18px",
                  borderRadius: "8px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "#ffffff",
                }}
              >
                <span>04 · REVISION-PINNED CERTIFICATE</span>
                <span style={{ color: "#80eec0" }}>IMMUTABLE RECEIPT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProblemSection;
