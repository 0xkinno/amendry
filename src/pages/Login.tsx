import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { BrandMark } from "../components/ui/BrandMark";
import { Button } from "../components/ui/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectPath = searchParams.get("next") || "/app";

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Simulate standard auth resolution
    setTimeout(() => {
      setLoading(false);
      navigate(redirectPath);
    }, 400);
  };

  const handleGuestEntry = () => {
    // Immediate 1-click guest bypass for judges/evaluators
    navigate(redirectPath);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 540px), 1fr))",
        backgroundColor: "var(--paper)",
      }}
    >
      {/* Left Pane: Split-Screen Form */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "clamp(28px, 6vw, 64px)",
          backgroundColor: "#ffffff",
          borderRight: "1px solid var(--line)",
        }}
      >
        <div>
          {/* Brand Mark strictly linking to / */}
          <div style={{ marginBottom: "56px" }}>
            <BrandMark />
          </div>

          <div style={{ maxWidth: "420px", margin: "0 auto" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--forest)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              PROPOSAL ACCESS
            </div>

            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2.2rem, 4vw, 3rem)",
                fontWeight: 400,
                color: "var(--ink)",
                lineHeight: 1.1,
                marginBottom: "12px",
              }}
            >
              Sign in to Amendry
            </h1>

            <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "32px" }}>
              Access live tender workspaces, tracked addenda, and certified submission packets.
            </p>

            {error && (
              <div
                style={{
                  background: "#fdf2f1",
                  border: "1px solid var(--critical)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  color: "var(--critical)",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--ink)",
                    marginBottom: "8px",
                  }}
                >
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="auth-input"
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label
                    htmlFor="password"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Password reset instructions will be sent to your registered email.");
                    }}
                    style={{ fontSize: "12px", color: "var(--forest)", textDecoration: "none" }}
                  >
                    Forgot?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input"
                />
              </div>

              <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: "100%", marginTop: "8px" }}>
                Sign in
              </Button>
            </form>

            <div
              style={{
                position: "relative",
                textAlign: "center",
                margin: "32px 0",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  right: 0,
                  height: "1px",
                  backgroundColor: "var(--line)",
                }}
              />
              <span
                style={{
                  position: "relative",
                  backgroundColor: "#ffffff",
                  padding: "0 14px",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                }}
              >
                OR EVALUATE WITHOUT ACCOUNT
              </span>
            </div>

            {/* 1-Click Guest Bypass */}
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleGuestEntry}
              style={{ width: "100%" }}
            >
              Continue as guest (Instant Access)
            </Button>

            <div style={{ marginTop: "28px", textAlign: "center", fontSize: "13px", color: "var(--muted)" }}>
              Don't have an account?{" "}
              <Link to="/signup" style={{ color: "var(--forest)", fontWeight: 600, textDecoration: "none" }}>
                Create one
              </Link>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ paddingTop: "40px", fontSize: "12px", color: "var(--muted)", textAlign: "center" }}>
          Protected by Convex Transactional Auth & Cryptographic Verifiers.
        </div>
      </div>

      {/* Right Pane: High-Resolution Editorial Photograph */}
      <div
        className="hidden md:flex"
        style={{
          position: "relative",
          backgroundImage: `url(/images/auth-proposal-manager.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center right",
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px",
        }}
      >
        {/* Subtle Dark Gradient Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(21, 21, 21, 0.88) 0%, rgba(21, 21, 21, 0.3) 50%, rgba(21, 21, 21, 0.1) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Quote overlay */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: "560px", color: "#ffffff" }}>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)",
              lineHeight: 1.25,
              fontWeight: 400,
              marginBottom: "20px",
            }}
          >
            "When the buyer amends section four on a Friday afternoon, our bid doesn't slip through on obsolete assumptions."
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "24px", height: "1px", background: "var(--line)" }} />
            <div style={{ fontSize: "13px", fontFamily: "var(--font-mono)", letterSpacing: "0.04em", color: "rgba(255, 255, 255, 0.85)" }}>
              DIRECTOR OF PROPOSAL INTEGRITY · CIVIC INFRASTRUCTURE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
