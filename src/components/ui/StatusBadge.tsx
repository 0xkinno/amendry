import type { ReactNode } from "react";

type BadgeVariant = "ready" | "blocked" | "stale" | "unknown" | "live" | "fixture" | "demo" | "contested" | "verified" | "unavailable" | "error" | "draft";

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  ready: { bg: "var(--forest-light)", color: "var(--forest)" },
  blocked: { bg: "var(--signal-light)", color: "var(--signal)" },
  stale: { bg: "#FFF3CD", color: "#856404" },
  unknown: { bg: "var(--line)", color: "var(--muted)" },
  live: { bg: "var(--forest)", color: "var(--white)" },
  fixture: { bg: "var(--lemon)", color: "var(--ink)" },
  demo: { bg: "var(--signal)", color: "var(--white)" },
  contested: { bg: "#F8D7DA", color: "#721C24" },
  verified: { bg: "var(--forest-light)", color: "var(--forest)" },
  unavailable: { bg: "var(--line)", color: "var(--muted)" },
  error: { bg: "var(--signal-light)", color: "var(--signal)" },
  draft: { bg: "var(--line)", color: "var(--ink)" },
};

export function StatusBadge({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children: ReactNode;
}) {
  const style = variantStyles[variant];
  return (
    <span
      className="badge"
      style={{ background: style.bg, color: style.color }}
    >
      {children}
    </span>
  );
}
