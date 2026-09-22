export function RevisionBadge({
  revisionId,
  isCurrent = true,
  className = "",
}: {
  revisionId: string;
  isCurrent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`revision-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "var(--pill)",
        background: isCurrent ? "var(--forest)" : "var(--paper-2)",
        color: isCurrent ? "#ffffff" : "var(--muted)",
        border: `1px solid ${isCurrent ? "var(--forest)" : "var(--line)"}`,
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.04em",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: isCurrent ? "#80eec0" : "var(--muted)",
          display: "inline-block",
        }}
      />
      <span>{revisionId.startsWith("REV-") ? revisionId : `REV-${revisionId}`}</span>
      {isCurrent && (
        <span
          style={{
            fontSize: "10px",
            opacity: 0.85,
            paddingLeft: "2px",
            borderLeft: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          CURRENT
        </span>
      )}
    </div>
  );
}

export default RevisionBadge;
