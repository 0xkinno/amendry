import { Button } from "../ui/Button";
import { SectionLabel } from "../ui/SectionLabel";

export function Hero() {
  return (
    <header className="hero-section" style={{ position: "relative", overflow: "hidden", paddingTop: "48px", paddingBottom: "80px" }}>
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 520px), 1fr))",
            gap: "48px",
            alignItems: "center",
          }}
        >
          {/* Left: Editorial Copy */}
          <div style={{ maxWidth: "600px" }}>
            <SectionLabel>Live Tender Integrity</SectionLabel>

            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2.8rem, 6.2vw, 5.2rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.04em",
                color: "var(--ink)",
                margin: "12px 0 24px",
                fontWeight: 400,
              }}
            >
              When the tender changes,{" "}
              <span style={{ fontStyle: "italic", color: "var(--forest)" }}>your bid</span> should know.
            </h1>

            <p
              style={{
                fontSize: "clamp(1.05rem, 1.8vw, 1.25rem)",
                lineHeight: 1.55,
                color: "var(--muted)",
                marginBottom: "36px",
                maxWidth: "520px",
              }}
            >
              Amendry tracks the source of truth, maps every affected obligation, and blocks stale
              submission work before it becomes a costly mistake.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "14px",
                alignItems: "center",
              }}
            >
              <Button to="/judges" size="lg" variant="primary">
                See a live tender
              </Button>
              <Button to="/app" size="lg" variant="secondary">
                Explore the integrity desk
              </Button>
            </div>

            {/* Micro verification badges */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginTop: "40px",
                paddingTop: "24px",
                borderTop: "1px solid var(--line)",
                fontSize: "13px",
                fontFamily: "var(--font-mono)",
                color: "var(--muted)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--forest)" }} />
                <span>Deterministic Convex Gate</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--forest)" }} />
                <span>Zero Stale Submissions</span>
              </div>
            </div>
          </div>

          {/* Right: High-Resolution Cinematic Procurement Artifact */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "relative",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                boxShadow: "var(--shadow-soft)",
                border: "1px solid var(--line)",
                background: "#ffffff",
              }}
            >
              <img
                src="/images/hero-procurement-artifact.jpg"
                alt="Procurement contract packet with sliding amendment sheet and fountain pen"
                style={{
                  width: "100%",
                  height: "auto",
                  aspectRatio: "16/10",
                  objectFit: "cover",
                  display: "block",
                }}
              />

              {/* Floating physical badge overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: "20px",
                  left: "20px",
                  backgroundColor: "rgba(255, 255, 255, 0.94)",
                  backdropFilter: "blur(12px)",
                  padding: "12px 18px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--line)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: "var(--critical)",
                    animation: "pulse 2s infinite",
                  }}
                />
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--critical)", letterSpacing: "0.04em" }}>
                    AMENDMENT DETECTED · REV 09
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--ink)", fontWeight: 500 }}>
                    Section 4.2 Insurance: $2M → $5M
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Hero;
