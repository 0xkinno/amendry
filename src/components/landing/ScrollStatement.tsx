import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Pill } from "../ui/Pill";

export function ScrollStatement() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const eased = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 22,
    mass: 0.35,
  });

  // Scale for central headline
  const centerScale = useTransform(eased, [0.15, 0.5, 0.85], [0.97, 1, 1]);

  // Keep cards constant (opacity 1) when on this section, and gradually fade out as the user scrolls down
  const cardOpacity = useTransform(eased, [0.45, 0.82], [1, 0]);
  const cardYDrift = useTransform(eased, [0.45, 0.82], [0, -30]);

  return (
    <section ref={containerRef} className="statement-section">
      <div className="statement-stage">
        {/* Card 5: Top Center Status - Elevated above headline */}
        <motion.div
          className="statement-card"
          style={{
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            opacity: cardOpacity,
            y: cardYDrift,
            padding: "10px 18px",
            textAlign: "center",
            width: "auto",
            maxWidth: "280px",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--critical)" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, color: "var(--critical)" }}>
              SUBMISSION BLOCKED
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>
            Source superseded at commit gate
          </div>
        </motion.div>

        {/* Card 1: Top Left */}
        <motion.div
          className="statement-card"
          style={{
            top: "70px",
            left: "20px",
            opacity: cardOpacity,
            y: cardYDrift,
            padding: "16px",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--forest)" }}>
              REV-000009
            </span>
            <Pill variant="forest" size="sm">ACTIVE</Pill>
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
            Addendum 04 Ingested
          </div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
            Via Firecrawl portal monitor
          </div>
        </motion.div>

        {/* Card 2: Top Right */}
        <motion.div
          className="statement-card"
          style={{
            top: "70px",
            right: "20px",
            opacity: cardOpacity,
            y: cardYDrift,
            padding: "16px",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--warning)", fontWeight: 700 }}>
              OBLIGATION DIFF
            </span>
            <Pill variant="warning" size="sm">MODIFIED</Pill>
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
            Sec 4.2 Liability Coverage
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--critical)", marginTop: "4px" }}>
            $2,000,000 → $5,000,000
          </div>
        </motion.div>

        {/* Central Statement - Pristine write-up */}
        <motion.div
          className="statement-core"
          style={{
            scale: centerScale,
            zIndex: 20,
            position: "relative",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--forest)",
              marginBottom: "16px",
            }}
          >
            THE INTEGRITY PRINCIPLE
          </p>

          <h2>
            A tender changes.
            <br />
            <span style={{ fontStyle: "italic", color: "var(--forest)" }}>
              The work must change with it.
            </span>
          </h2>

          <p
            style={{
              fontSize: "clamp(1rem, 1.6vw, 1.25rem)",
              color: "var(--muted)",
              marginTop: "24px",
              maxWidth: "600px",
              marginInline: "auto",
              lineHeight: 1.6,
            }}
          >
            When a buyer amends an obligation, dependent evidence is automatically invalidated.
            Amendry guarantees a bid cannot be submitted against superseded facts.
          </p>
        </motion.div>

        {/* Card 3: Bottom Left */}
        <motion.div
          className="statement-card"
          style={{
            bottom: "60px",
            left: "20px",
            opacity: cardOpacity,
            y: cardYDrift,
            padding: "16px",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--critical)", fontWeight: 700 }}>
              EVIDENCE #EV-48
            </span>
            <Pill variant="critical" size="sm">STALE</Pill>
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
            Certificate of Insurance
          </div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
            Limit $2M does not satisfy Rev 09
          </div>
        </motion.div>

        {/* Card 4: Bottom Right */}
        <motion.div
          className="statement-card"
          style={{
            bottom: "60px",
            right: "20px",
            opacity: cardOpacity,
            y: cardYDrift,
            padding: "16px",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--forest)", fontWeight: 700 }}>
              AGENTMAIL THREAD
            </span>
            <Pill variant="accent" size="sm">SIGNED</Pill>
          </div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
            Buyer Clarification #02
          </div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
            Deduplication & secret verified
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default ScrollStatement;
