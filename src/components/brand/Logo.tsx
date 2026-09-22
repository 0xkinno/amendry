export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={className} style={{ fontFamily: "var(--font-serif)", fontWeight: 400, letterSpacing: "-0.02em" }}>
      Amendry
    </span>
  );
}
