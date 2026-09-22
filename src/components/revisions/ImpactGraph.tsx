import { useState } from "react";
import { StatusBadge } from "../ui/StatusBadge";

export interface ImpactNode {
  sourceClause: string;
  sourceOldText: string;
  sourceNewText: string;
  requirementKey: string;
  requirementTitle: string;
  category: string;
  evidenceTitle: string;
  evidenceType: string;
  evidenceStatus: "CURRENT" | "STALE" | "MISSING" | "CONTESTED";
  invalidationReason: string;
  severity: "CRITICAL" | "MODERATE" | "INFORMATIONAL";
}

interface ImpactGraphProps {
  nodes?: ImpactNode[];
  revisionNumber?: number;
  supersededRevisionNumber?: number;
}

const DEFAULT_NODES: ImpactNode[] = [
  {
    sourceClause: "Section 4.1 — Insurance Threshold",
    sourceOldText: "Contractor must maintain minimum public liability coverage of $2,000,000 per occurrence.",
    sourceNewText: "Contractor must carry public liability insurance with a minimum coverage of $5,000,000 per occurrence (Addendum 8).",
    requirementKey: "insurance:public-liability",
    requirementTitle: "Minimum $5,000,000 public liability insurance",
    category: "INSURANCE",
    evidenceTitle: "Travelers Insurance Certificate #TRAV-2026-8812 ($2M coverage)",
    evidenceType: "INSURANCE",
    evidenceStatus: "STALE",
    invalidationReason: "Coverage threshold increased from $2,000,000 to $5,000,000. Verified $2M certificate is now insufficient.",
    severity: "CRITICAL",
  },
  {
    sourceClause: "Section 1.2 — Schedule & Submission Deadline",
    sourceOldText: "All proposal packages must be submitted via portal before October 1, 2026, 2:00 PM EST.",
    sourceNewText: "The proposal submission deadline is extended to October 15, 2026, 2:00 PM EST.",
    requirementKey: "schedule:deadline",
    requirementTitle: "Submission deadline: October 15, 2026, 2:00 PM EST",
    category: "SCHEDULE",
    evidenceTitle: "Primavera P6 Critical Path Schedule Baseline Rev 8 (Target Oct 1)",
    evidenceType: "DOCUMENT",
    evidenceStatus: "STALE",
    invalidationReason: "Target completion date and resource mobilization schedule does not reflect extended Oct 15 deadline.",
    severity: "CRITICAL",
  },
];

export function ImpactGraph({
  nodes = DEFAULT_NODES,
  revisionNumber = 9,
  supersededRevisionNumber = 8,
}: ImpactGraphProps) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const activeNode = nodes[selectedIdx] ?? nodes[0];

  return (
    <div className="card card--ruled mb-6" style={{ padding: "var(--sp-6)" }}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="mono text-xs uppercase tracking-wider text-muted">Blast Radius Visualizer</span>
            <StatusBadge variant="error">FAIL-CLOSED INVALIDATION</StatusBadge>
          </div>
          <h3 style={{ fontSize: "1.125rem", margin: 0 }}>
            Revision {supersededRevisionNumber} → Revision {revisionNumber} Invalidation Graph
          </h3>
          <p className="text-xs text-muted mt-1">
            Deterministic causal chain from source text mutation to derived evidence disqualification.
          </p>
        </div>
        <div className="text-right">
          <span className="mono text-xs text-muted">Invalidated Edges</span>
          <div className="mono font-bold" style={{ fontSize: "1.25rem", color: "var(--crimson)" }}>
            {nodes.length}
          </div>
        </div>
      </div>

      {/* Node selector tabs */}
      <div className="flex gap-2 mb-6" style={{ borderBottom: "1px solid var(--line)", paddingBottom: "var(--sp-2)" }}>
        {nodes.map((node, i) => (
          <button
            key={node.requirementKey}
            onClick={() => setSelectedIdx(i)}
            style={{
              padding: "var(--sp-2) var(--sp-3)",
              background: selectedIdx === i ? "var(--ink)" : "var(--paper)",
              color: selectedIdx === i ? "var(--paper)" : "var(--ink)",
              border: "1px solid var(--line)",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
            }}
          >
            {node.requirementKey}
          </button>
        ))}
      </div>

      {activeNode && (
        <div className="grid grid-3 gap-4" style={{ position: "relative" }}>
          {/* Step 1: Source Change */}
          <div className="card" style={{ background: "var(--paper-accent)", border: "1px solid var(--line)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="mono text-xs text-muted">1. SOURCE CLAUSE</span>
              <StatusBadge variant="draft">SOURCE MUTATION</StatusBadge>
            </div>
            <p className="font-medium text-sm mb-2">{activeNode.sourceClause}</p>
            <div style={{ fontSize: "0.75rem", marginBottom: "var(--sp-2)" }}>
              <span className="mono text-xs text-muted block mb-1">Prior Clause (Rev {supersededRevisionNumber}):</span>
              <div style={{ background: "#fee2e2", padding: "var(--sp-2)", textDecoration: "line-through", color: "#991b1b" }}>
                {activeNode.sourceOldText}
              </div>
            </div>
            <div style={{ fontSize: "0.75rem" }}>
              <span className="mono text-xs text-muted block mb-1">Amended Clause (Rev {revisionNumber}):</span>
              <div style={{ background: "#dcfce7", padding: "var(--sp-2)", color: "#166534", fontWeight: 500 }}>
                {activeNode.sourceNewText}
              </div>
            </div>
          </div>

          {/* Step 2: Obligation Impact */}
          <div className="card" style={{ background: "var(--paper-accent)", border: "1px solid var(--line)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="mono text-xs text-muted">2. REQUIREMENT</span>
              <StatusBadge variant="error">UNKNOWN / BLOCKED</StatusBadge>
            </div>
            <span className="mono text-xs text-muted">{activeNode.requirementKey}</span>
            <p className="font-medium text-sm mt-1 mb-3">{activeNode.requirementTitle}</p>
            <div className="ruled pb-2 mb-2" style={{ fontSize: "0.75rem" }}>
              <span className="text-muted">Category: </span>
              <span className="mono">{activeNode.category}</span>
            </div>
            <div className="ruled pb-2 mb-2" style={{ fontSize: "0.75rem" }}>
              <span className="text-muted">Mandatory: </span>
              <span className="mono" style={{ color: "var(--crimson)", fontWeight: 600 }}>YES (Strict Gate)</span>
            </div>
            <div style={{ fontSize: "0.75rem", background: "var(--paper)", padding: "var(--sp-2)", borderLeft: "3px solid var(--crimson)" }}>
              <p className="text-xs font-medium" style={{ margin: 0 }}>Impact Reason:</p>
              <p className="text-xs text-muted" style={{ margin: 0 }}>{activeNode.invalidationReason}</p>
            </div>
          </div>

          {/* Step 3: Dependent Evidence Disqualification */}
          <div className="card" style={{ background: "var(--paper-accent)", border: "1px solid var(--crimson)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="mono text-xs text-muted">3. DEPENDENT EVIDENCE</span>
              <StatusBadge variant="error">INVALIDATED (STALE)</StatusBadge>
            </div>
            <p className="font-medium text-sm mb-1">{activeNode.evidenceTitle}</p>
            <span className="mono text-xs text-muted block mb-3">Type: {activeNode.evidenceType}</span>
            <div style={{ background: "#fef2f2", border: "1px solid #f87171", padding: "var(--sp-3)", borderRadius: 2 }}>
              <p className="text-xs font-semibold text-crimson mb-1" style={{ color: "var(--crimson)" }}>
                Kernel Fail-Closed Verdict:
              </p>
              <p className="text-xs" style={{ margin: 0, color: "#991b1b" }}>
                Evidence cannot satisfy Revision {revisionNumber}. Marked <code>STALE</code>. Submission package disqualified from <code>READY</code>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
