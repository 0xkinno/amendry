import React from "react";

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "paper" | "white" | "dark" | "muted";
  elevation?: "none" | "card" | "soft";
  radius?: "sm" | "md" | "lg" | "xl";
  bordered?: boolean;
}

export function Surface({
  children,
  variant = "white",
  elevation = "card",
  radius = "md",
  bordered = true,
  className = "",
  style,
  ...props
}: SurfaceProps) {
  const bgStyles: Record<string, string> = {
    paper: "var(--paper)",
    white: "#ffffff",
    dark: "var(--ink)",
    muted: "var(--paper-2)",
  };

  const shadowStyles: Record<string, string> = {
    none: "none",
    card: "var(--shadow-card)",
    soft: "var(--shadow-soft)",
  };

  const radiusStyles: Record<string, string> = {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
  };

  return (
    <div
      className={`surface surface--${variant} ${className}`}
      style={{
        backgroundColor: bgStyles[variant],
        color: variant === "dark" ? "var(--paper)" : "var(--ink)",
        boxShadow: shadowStyles[elevation],
        borderRadius: radiusStyles[radius],
        border: bordered
          ? variant === "dark"
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid var(--line)"
          : "none",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export default Surface;
