import { Link } from "react-router";
import { BrandMark } from "../ui/BrandMark";

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--ink)",
        color: "#ffffff",
        padding: "80px 0 48px",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "48px",
            marginBottom: "64px",
          }}
        >
          {/* Brand & Mission Column */}
          <div style={{ maxWidth: "340px" }}>
            <div style={{ marginBottom: "16px", filter: "invert(1) hue-rotate(180deg)" }}>
              <BrandMark />
            </div>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "24px",
              }}
            >
              Keep every tender response current when the source changes. Continuous amendment tracking, blast-radius invalidation, and commit-time submission certification.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontFamily: "var(--font-mono)", color: "#80eec0" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#80eec0", display: "inline-block" }} />
              Convex Cloud Verified · SHA-256 Engine Active
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.5)",
                letterSpacing: "0.1em",
                marginBottom: "16px",
              }}
            >
              PRODUCT
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              <li>
                <Link to="/app" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px" }}>
                  Operations Desk
                </Link>
              </li>
              <li>
                <Link to="/judges" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px" }}>
                  Live Evaluation Mode
                </Link>
              </li>
              <li>
                <Link to="/proof" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px" }}>
                  Proof Room & Certificates
                </Link>
              </li>
              <li>
                <Link to="/login" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px" }}>
                  Proposal Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Verification Column */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.5)",
                letterSpacing: "0.1em",
                marginBottom: "16px",
              }}
            >
              EVIDENCE & PROOF
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              <li>
                <Link to="/proof" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px" }}>
                  12-Vector Attack Campaign
                </Link>
              </li>
              <li>
                <Link to="/proof" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px" }}>
                  Commit-Time TOCTOU Gate
                </Link>
              </li>
              <li>
                <Link to="/proof" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px" }}>
                  Deterministic Readiness Kernel
                </Link>
              </li>
              <li>
                <Link to="/proof" style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px" }}>
                  Offline Hash Verifier
                </Link>
              </li>
            </ul>
          </div>

          {/* Sponsors & Stack */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.5)",
                letterSpacing: "0.1em",
                marginBottom: "16px",
              }}
            >
              INTEGRATIONS
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              <li>
                <span style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px" }}>
                  Convex · Full Reactive Backend
                </span>
              </li>
              <li>
                <span style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px" }}>
                  Firecrawl · Automated Portal Sync
                </span>
              </li>
              <li>
                <span style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px" }}>
                  AgentMail · Signed Inbound Addenda
                </span>
              </li>
              <li>
                <span style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "14px" }}>
                  OpenAI · Clause Diff & Extraction
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: "32px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            fontSize: "13px",
            color: "rgba(255, 255, 255, 0.5)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div>© {new Date().getFullYear()} AMENDRY. All rights reserved. Built for tender integrity.</div>
          <div>All mutations enforced with server-side revision matching.</div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
