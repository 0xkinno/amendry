import { SectionLabel } from "../ui/SectionLabel";

export function TallStoryCards() {
  return (
    <section style={{ padding: "96px 0", background: "var(--paper-2)" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 64px" }}>
          <SectionLabel>The Lifecycle of an Amendment</SectionLabel>
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
            How silent addenda destroy proposal integrity
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "16px", marginTop: "14px" }}>
            The breakdown rarely happens in the drafting. It happens when changes are published after the work was already done.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
            gap: "28px",
          }}
        >
          {/* Card 1: Forest Green - The Source Moves */}
          <div
            style={{
              background: "var(--forest)",
              color: "#ffffff",
              borderRadius: "var(--radius-lg)",
              padding: "40px 32px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--shadow-card)",
              minHeight: "460px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                fontWeight: 700,
                color: "#99dfbb",
                letterSpacing: "0.1em",
                marginBottom: "20px",
              }}
            >
              01 / SOURCE
            </div>

            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "2.2rem",
                lineHeight: 1.15,
                fontWeight: 400,
                marginBottom: "16px",
                color: "#ffffff",
              }}
            >
              The source moves.
            </h3>

            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.65,
                color: "rgba(255, 255, 255, 0.8)",
                marginBottom: "32px",
                flexGrow: 1,
              }}
            >
              A buyer portal publishes Addendum 04 at 4:30 PM. A critical liability clause jumps from $2M to $5M. No notification email was sent, and the submission deadline remains unchanged.
            </p>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
              }}
            >
              <div style={{ color: "#99dfbb", marginBottom: "4px" }}>FIRECRAWL EXTRACT</div>
              <div style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                Detected hash change on tender portal URL. Revision 09 created.
              </div>
            </div>
          </div>

          {/* Card 2: Dark Charcoal - The Work Becomes Stale */}
          <div
            style={{
              background: "var(--ink)",
              color: "#ffffff",
              borderRadius: "var(--radius-lg)",
              padding: "40px 32px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--shadow-card)",
              minHeight: "460px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--signal)",
                letterSpacing: "0.1em",
                marginBottom: "20px",
              }}
            >
              02 / IMPACT
            </div>

            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "2.2rem",
                lineHeight: 1.15,
                fontWeight: 400,
                marginBottom: "16px",
                color: "#ffffff",
              }}
            >
              The work becomes stale.
            </h3>

            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.65,
                color: "rgba(255, 255, 255, 0.75)",
                marginBottom: "32px",
                flexGrow: 1,
              }}
            >
              The bid team is asleep or working against the previous PDF. The existing certificate of insurance looks finished in the shared folder, but it is now non-compliant.
            </p>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid rgba(216, 109, 58, 0.3)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
              }}
            >
              <div style={{ color: "var(--signal)", marginBottom: "4px" }}>BLAST RADIUS CASCADE</div>
              <div style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                Evidence EV-48 marked STALE. Readiness degraded from READY to BLOCKED.
              </div>
            </div>
          </div>

          {/* Card 3: Crisp Paper White - The Packet Stops */}
          <div
            style={{
              background: "#ffffff",
              color: "var(--ink)",
              borderRadius: "var(--radius-lg)",
              padding: "40px 32px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--shadow-card)",
              border: "1px solid var(--line)",
              minHeight: "460px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--forest)",
                letterSpacing: "0.1em",
                marginBottom: "20px",
              }}
            >
              03 / CERTIFICATION
            </div>

            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "2.2rem",
                lineHeight: 1.15,
                fontWeight: 400,
                marginBottom: "16px",
                color: "var(--ink)",
              }}
            >
              The packet stops.
            </h3>

            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.65,
                color: "var(--muted)",
                marginBottom: "32px",
                flexGrow: 1,
              }}
            >
              Even if a user's browser cached an earlier "READY" verdict, the server-side commit gate refuses to certify until the revised endorsement is uploaded and approved.
            </p>

            <div
              style={{
                background: "var(--paper-2)",
                borderRadius: "12px",
                padding: "16px",
                border: "1px solid var(--line)",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
              }}
            >
              <div style={{ color: "var(--forest)", fontWeight: 700, marginBottom: "4px" }}>CONVEX TRANSACTION GATE</div>
              <div style={{ color: "var(--ink)" }}>
                Commit-time verification guarantees zero TOCTOU escapes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TallStoryCards;
