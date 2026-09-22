import { useState } from "react";
import { Link, useLocation } from "react-router";
import { BrandMark } from "../ui/BrandMark";
import { Button } from "../ui/Button";

export function TopNav() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Operations Desk", path: "/app" },
    { label: "Live Evaluation", path: "/judges" },
    { label: "Proof Room", path: "/proof" },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(247, 245, 239, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--line)",
        height: "var(--topbar-h)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
        }}
      >
        {/* Left: Brand Mark routing to / */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <BrandMark />
          <span
            className="hidden md:inline-block"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--muted)",
              letterSpacing: "0.04em",
              paddingLeft: "14px",
              borderLeft: "1px solid var(--line)",
            }}
          >
            LIVE TENDER INTEGRITY
          </span>
        </div>

        {/* Center: Clean Nav Links */}
        <nav
          className="hidden md:flex"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
          }}
        >
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "var(--ink)" : "var(--muted)",
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                  borderBottom: isActive ? "2px solid var(--forest)" : "2px solid transparent",
                  padding: "4px 0",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Auth / CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            to="/login"
            className="hidden sm:inline-block"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--ink)",
              textDecoration: "none",
              padding: "0 10px",
            }}
          >
            Sign in
          </Link>
          <Button to="/judges" variant="primary" size="sm">
            See a live tender
          </Button>

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              color: "var(--ink)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span style={{ width: "20px", height: "2px", background: "var(--ink)" }} />
            <span style={{ width: "20px", height: "2px", background: "var(--ink)" }} />
            <span style={{ width: "20px", height: "2px", background: "var(--ink)" }} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "var(--paper)",
            borderBottom: "1px solid var(--line)",
            padding: "20px",
            boxShadow: "var(--shadow-soft)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--ink)",
                textDecoration: "none",
                padding: "8px 0",
                borderBottom: "1px solid var(--paper-2)",
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            onClick={() => setMobileOpen(false)}
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--ink)",
              textDecoration: "none",
              padding: "8px 0",
            }}
          >
            Sign in / Guest Access
          </Link>
        </div>
      )}
    </header>
  );
}

export default TopNav;
