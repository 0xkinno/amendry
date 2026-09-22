import { Logo } from "../brand/Logo";

export function TopBar() {
  return (
    <header
      className="ruled"
      style={{
        height: "var(--topbar-h)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--sp-6)",
        background: "var(--white)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div className="flex items-center gap-4">
        <Logo className="text-xl" />
        <span className="text-xs uppercase tracking-wide text-muted">Live Tender Integrity Desk</span>
      </div>
      <div className="flex items-center gap-3">
        <a href="/app" className="btn btn--ghost btn--sm">Operations Desk</a>
        <a href="/judges" className="btn btn--ghost btn--sm" style={{ fontWeight: 600, color: "var(--forest)" }}>Judge Mode</a>
        <a href="/proof" className="btn btn--ghost btn--sm">Proof Room</a>
        <span className="badge badge--live">LIVE</span>
      </div>
    </header>
  );
}
