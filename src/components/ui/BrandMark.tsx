import { Link } from "react-router";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="AMENDRY home"
      className={`brand-mark ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <span
        className="brand-mark__dot"
        aria-hidden="true"
        style={{
          width: "9px",
          height: "9px",
          borderRadius: "50%",
          backgroundColor: "var(--forest)",
          display: "inline-block",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "1.45rem",
          fontWeight: 400,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
          lineHeight: 1,
        }}
      >
        AMENDRY
      </span>
    </Link>
  );
}

export default BrandMark;
