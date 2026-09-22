import React from "react";

export function SectionLabel({
  children,
  className = "",
  number,
}: {
  children: React.ReactNode;
  className?: string;
  number?: string;
}) {
  return (
    <div
      className={`section-label ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--forest)",
        marginBottom: "12px",
      }}
    >
      {number && (
        <span
          style={{
            display: "inline-block",
            padding: "2px 6px",
            background: "var(--paper-2)",
            border: "1px solid var(--line)",
            borderRadius: "4px",
            color: "var(--ink)",
          }}
        >
          {number}
        </span>
      )}
      <span>{children}</span>
    </div>
  );
}

export default SectionLabel;
