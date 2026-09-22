import { SectionLabel } from "../ui/SectionLabel";
import { Button } from "../ui/Button";

const features = [
  {
    tag: "SOURCE MONITORING",
    title: "Monitor Sources",
    summary:
      "Track portal revisions continuously. Firecrawl extracts structured text while AgentMail verifies signed buyer addenda without polling delay.",
    preview: (
      <div
        style={{
          background: "var(--paper-2)",
          borderRadius: "14px",
          padding: "16px",
          border: "1px solid var(--line)",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--ink)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ color: "var(--forest)", fontWeight: 700 }}>● FIRECRAWL SYNC</span>
          <span style={{ color: "var(--muted)" }}>240ms</span>
        </div>
        <div style={{ color: "var(--muted)", marginBottom: "4px" }}>
          SHA-256: 7f3a9e...2b01
        </div>
        <div style={{ background: "#ffffff", padding: "8px", borderRadius: "6px", border: "1px solid var(--line)" }}>
          "Addendum 04: Revised Annex B Scope of Services"
        </div>
      </div>
    ),
    link: "/app",
    actionText: "Inspect sources",
  },
  {
    tag: "BLAST RADIUS ENGINE",
    title: "Map Impact",
    summary:
      "See immediately which obligations changed. Downstream evidence items are automatically marked stale so the team never relies on invalid facts.",
    preview: (
      <div
        style={{
          background: "var(--paper-2)",
          borderRadius: "14px",
          padding: "16px",
          border: "1px solid var(--line)",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--ink)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ color: "var(--warning)", fontWeight: 700 }}>● DEPENDENCY INVALIDATION</span>
          <span style={{ color: "var(--critical)" }}>3 STALE</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ background: "#ffffff", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
            <span>Req #14 · Insurance</span>
            <span style={{ color: "var(--critical)" }}>STALE</span>
          </div>
          <div style={{ background: "#ffffff", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
            <span>Req #22 · Timeline</span>
            <span style={{ color: "var(--critical)" }}>STALE</span>
          </div>
        </div>
      </div>
    ),
    link: "/app",
    actionText: "View impact graph",
  },
  {
    tag: "CONVEX COMMIT GATE",
    title: "Certify Readiness",
    summary:
      "Transactional commit-time verification. Only the exact current revision can be certified, closing browser TOCTOU loopholes before submission.",
    preview: (
      <div
        style={{
          background: "var(--paper-2)",
          borderRadius: "14px",
          padding: "16px",
          border: "1px solid var(--line)",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--ink)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ color: "var(--forest)", fontWeight: 700 }}>● CERTIFICATE RECEIPT</span>
          <span style={{ color: "var(--success)" }}>VERIFIED</span>
        </div>
        <div style={{ background: "var(--forest)", color: "#ffffff", padding: "8px", borderRadius: "6px", fontWeight: 600 }}>
          CERTIFIED FOR REVISION 09
        </div>
        <div style={{ color: "var(--muted)", fontSize: "10px", marginTop: "6px" }}>
          Immutable audit record: cert_89af...
        </div>
      </div>
    ),
    link: "/proof",
    actionText: "Explore certificates",
  },
];

export function FeatureRail() {
  return (
    <section style={{ padding: "80px 0", background: "var(--paper)" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 56px" }}>
          <SectionLabel>Core Capabilities</SectionLabel>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "var(--ink)",
              marginTop: "8px",
            }}
          >
            Built for the reality of procurement amendments
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "16px", marginTop: "14px" }}>
            Three interconnected layers that turn chaotic addenda into verified, audit-proof submission packets.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
            gap: "28px",
          }}
        >
          {features.map((feature, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-lg)",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "var(--shadow-card)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div style={{ marginBottom: "20px" }}>{feature.preview}</div>

              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--forest)",
                  letterSpacing: "0.08em",
                  marginBottom: "8px",
                }}
              >
                {feature.tag}
              </div>

              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.75rem",
                  color: "var(--ink)",
                  marginBottom: "12px",
                  fontWeight: 400,
                  lineHeight: 1.2,
                }}
              >
                {feature.title}
              </h3>

              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: "var(--muted)",
                  flexGrow: 1,
                  marginBottom: "24px",
                }}
              >
                {feature.summary}
              </p>

              <div>
                <Button to={feature.link} variant="secondary" size="sm">
                  {feature.actionText} →
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeatureRail;
