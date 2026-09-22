import React from "react";

export type PillVariant = "default" | "forest" | "accent" | "warning" | "critical" | "success" | "neutral";

export interface PillProps {
  children: React.ReactNode;
  variant?: PillVariant;
  size?: "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
}

export function Pill({
  children,
  variant = "default",
  size = "sm",
  className = "",
  icon,
}: PillProps) {
  const variantStyles: Record<PillVariant, React.CSSProperties> = {
    default: {
      backgroundColor: "var(--paper-2)",
      color: "var(--ink)",
      borderColor: "var(--line)",
    },
    forest: {
      backgroundColor: "var(--forest-light)",
      color: "var(--forest)",
      borderColor: "rgba(35, 74, 57, 0.2)",
    },
    accent: {
      backgroundColor: "#e2f3f1",
      color: "var(--accent)",
      borderColor: "rgba(31, 111, 104, 0.25)",
    },
    warning: {
      backgroundColor: "#faeedb",
      color: "var(--warning)",
      borderColor: "rgba(139, 90, 39, 0.25)",
    },
    critical: {
      backgroundColor: "#fce9e7",
      color: "var(--critical)",
      borderColor: "rgba(138, 62, 52, 0.25)",
    },
    success: {
      backgroundColor: "#e8f2ec",
      color: "var(--success)",
      borderColor: "rgba(62, 107, 80, 0.25)",
    },
    neutral: {
      backgroundColor: "#ffffff",
      color: "var(--muted)",
      borderColor: "var(--line)",
    },
  };

  const sizeStyles = size === "sm" ? {
    padding: "3px 10px",
    fontSize: "11px",
    letterSpacing: "0.03em",
  } : {
    padding: "5px 14px",
    fontSize: "12px",
    letterSpacing: "0.02em",
  };

  return (
    <span
      className={`pill pill--${variant} ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        borderRadius: "var(--pill)",
        borderWidth: "1px",
        borderStyle: "solid",
        fontWeight: 600,
        textTransform: "uppercase",
        fontFamily: "var(--font-mono)",
        lineHeight: 1.2,
        ...variantStyles[variant],
        ...sizeStyles,
      }}
    >
      {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>}
      {children}
    </span>
  );
}

export default Pill;
