import { describe, expect, it } from "vitest";
import {
  evaluateReadiness,
  isReady,
  readinessDigest,
  effectiveApprovalState,
  type ReadinessInput,
  type RequirementState,
} from "../../convex/lib/readinessKernel";

const REV = "rev_8";
const OLD_REV = "rev_7";

function req(over: Partial<RequirementState> = {}): RequirementState {
  return {
    id: "r1",
    lineageKey: "insurance/public-liability",
    title: "Public liability insurance",
    mandatory: true,
    status: "VERIFIED",
    revisionId: REV,
    evidence: [{ id: "e1", title: "Insurance certificate", status: "CURRENT", revisionId: REV }],
    ...over,
  };
}

function base(over: Partial<ReadinessInput> = {}): ReadinessInput {
  return {
    currentRevisionId: REV,
    requirements: [req()],
    evidence: [],
    conflicts: [],
    packageRevisionId: REV,
    approvalState: "approved",
    ...over,
  };
}

describe("readinessKernel — the happy path", () => {
  it("returns READY when every condition holds", () => {
    const r = evaluateReadiness(base());
    expect(r.status).toBe("READY");
    expect(r.blockingRequirementIds).toEqual([]);
    expect(r.revisionId).toBe(REV);
    expect(r.digest).toMatch(/^[0-9a-f]{24}$/);
    expect(r.coverage).toEqual({ mandatory: 1, verified: 1, evidenceCurrent: 1 });
  });

  it("isReady is exactly status === READY", () => {
    expect(isReady(base())).toBe(true);
    expect(isReady(base({ approvalState: "pending" }))).toBe(false);
  });

  it("gives an empty-requirements tender READY when approval + package are current", () => {
    const r = evaluateReadiness(base({ requirements: [] }));
    expect(r.status).toBe("READY");
    expect(r.coverage).toEqual({ mandatory: 0, verified: 0, evidenceCurrent: 0 });
  });
});

describe("readinessKernel — the primary invariant (7.1)", () => {
  it("BLOCKS when packageRevisionId !== currentRevisionId", () => {
    const r = evaluateReadiness(base({ packageRevisionId: OLD_REV }));
    expect(r.status).toBe("BLOCKED");
    expect(r.blocking.some((b) => b.code === "PACKAGE_REVISION_MISMATCH")).toBe(true);
    expect(r.reasons.join(" ")).toMatch(/superseded revision/i);
  });

  it("BLOCKS when there is no package at all", () => {
    const r = evaluateReadiness(base({ packageRevisionId: null }));
    expect(r.status).toBe("BLOCKED");
    expect(r.blocking.some((b) => b.code === "PACKAGE_MISSING")).toBe(true);
  });

  it("BLOCKS when a mandatory requirement is not VERIFIED", () => {
    for (const status of ["UNKNOWN", "STALE", "CONTESTED", "SUPERSEDED", "SOURCE_UNAVAILABLE"] as const) {
      const r = evaluateReadiness(base({ requirements: [req({ status })] }));
      expect(r.status, `status=${status} must block`).toBe("BLOCKED");
      expect(r.blockingRequirementIds).toContain("r1");
      expect(r.reasons.length).toBeGreaterThan(0);
    }
  });

  it("BLOCKS when a mandatory requirement came from a non-current revision", () => {
    const r = evaluateReadiness(base({ requirements: [req({ revisionId: OLD_REV })] }));
    expect(r.status).toBe("BLOCKED");
    expect(r.blocking.some((b) => b.code === "EVIDENCE_REVISION_MISMATCH")).toBe(true);
  });

  it("BLOCKS when mandatory evidence is pinned to an older revision", () => {
    const r = evaluateReadiness(
      base({
        requirements: [
          req({ evidence: [{ id: "e1", title: "Certificate", status: "CURRENT", revisionId: OLD_REV }] }),
        ],
      }),
    );
    expect(r.status).toBe("BLOCKED");
    expect(r.blocking.some((b) => b.code === "EVIDENCE_REVISION_MISMATCH")).toBe(true);
  });

  it("BLOCKS when mandatory evidence is not CURRENT", () => {
    for (const status of ["STALE", "MISSING", "CONTESTED"] as const) {
      const r = evaluateReadiness(
        base({
          requirements: [
            req({ evidence: [{ id: "e1", title: "Certificate", status, revisionId: REV }] }),
          ],
        }),
      );
      expect(r.status, `evidence status=${status} must block`).toBe("BLOCKED");
      expect(r.blockingRequirementIds).toContain("r1");
    }
  });

  it("BLOCKS when a mandatory requirement has no evidence at all", () => {
    const r = evaluateReadiness(base({ requirements: [req({ evidence: [] })] }));
    expect(r.status).toBe("BLOCKED");
    expect(r.blocking.some((b) => b.code === "MANDATORY_EVIDENCE_MISSING")).toBe(true);
  });

  it("BLOCKS on any open conflict, even with everything else verified", () => {
    const r = evaluateReadiness(
      base({ conflicts: [{ id: "c1", label: "Deadline disagrees across two official pages", state: "OPEN" }] }),
    );
    expect(r.status).toBe("BLOCKED");
    expect(r.blocking.some((b) => b.code === "OPEN_CONFLICT")).toBe(true);
    expect(r.reasons.join(" ")).toMatch(/Deadline disagrees/);
  });

  it("BLOCKS when approval is pending or expired", () => {
    expect(evaluateReadiness(base({ approvalState: "pending" })).status).toBe("BLOCKED");
    expect(evaluateReadiness(base({ approvalState: "expired" })).status).toBe("BLOCKED");
    const exp = evaluateReadiness(base({ approvalState: "expired" }));
    expect(exp.blocking.some((b) => b.code === "APPROVAL_EXPIRED")).toBe(true);
  });

  it("BLOCKS when the source is unavailable — never guesses", () => {
    const r = evaluateReadiness(base({ sourceUnavailable: true }));
    expect(r.status).toBe("BLOCKED");
    expect(r.blocking.some((b) => b.code === "SOURCE_UNAVAILABLE")).toBe(true);
    expect(r.reasons.join(" ")).toMatch(/could not read/i);
  });

  it("an optional (non-mandatory) requirement in any state does not block", () => {
    const r = evaluateReadiness(
      base({
        requirements: [
          req({ id: "opt", mandatory: false, status: "UNKNOWN" }),
          req(),
        ],
      }),
    );
    expect(r.status).toBe("READY");
  });

  it("a REMOVED mandatory requirement does not block and is not counted as coverage", () => {
    const r = evaluateReadiness(
      base({
        requirements: [req({ id: "gone", status: "REMOVED", evidence: [] }), req()],
      }),
    );
    expect(r.status).toBe("READY");
    expect(r.coverage.mandatory).toBe(2);
    expect(r.coverage.verified).toBe(1);
  });
});

describe("readinessKernel — determinism", () => {
  it("same input always yields the same digest", () => {
    const a = evaluateReadiness(base());
    const b = evaluateReadiness(base());
    expect(a.digest).toBe(b.digest);
  });

  it("digest changes when any material input changes", () => {
    const digests = new Set<string>();
    digests.add(evaluateReadiness(base()).digest);
    digests.add(evaluateReadiness(base({ packageRevisionId: OLD_REV })).digest);
    digests.add(evaluateReadiness(base({ approvalState: "pending" })).digest);
    digests.add(evaluateReadiness(base({ requirements: [] })).digest);
    digests.add(evaluateReadiness(base({ sourceUnavailable: true })).digest);
    expect(digests.size).toBe(5);
  });

  it("digest is insensitive to requirement array ordering", () => {
    const r1 = evaluateReadiness(
      base({ requirements: [req({ id: "a" }), req({ id: "b" })] }),
    );
    const r2 = evaluateReadiness(
      base({ requirements: [req({ id: "b" }), req({ id: "a" })] }),
    );
    expect(r1.digest).toBe(r2.digest);
  });

  it("readinessDigest is a stable pure function", () => {
    expect(readinessDigest(["a", "b"])).toBe(readinessDigest(["a", "b"]));
    expect(readinessDigest(["a", "b"])).not.toBe(readinessDigest(["b", "a"]));
  });

  it("never throws on degenerate input", () => {
    expect(() =>
      evaluateReadiness({
        currentRevisionId: "",
        requirements: [],
        evidence: [],
        conflicts: [],
        packageRevisionId: null,
        approvalState: "pending",
      }),
    ).not.toThrow();
  });
});

describe("readinessKernel — approval expiry", () => {
  const now = 1_700_000_000_000;
  const day = 24 * 60 * 60 * 1000;

  it("passes a fresh approval through unchanged", () => {
    expect(effectiveApprovalState("approved", now - 1000, now)).toBe("approved");
  });
  it("expires an approval older than the TTL", () => {
    expect(effectiveApprovalState("approved", now - day - 1, now)).toBe("expired");
  });
  it("an approved flag with no timestamp is treated as pending", () => {
    expect(effectiveApprovalState("approved", null, now)).toBe("pending");
    expect(effectiveApprovalState("approved", undefined, now)).toBe("pending");
  });
  it("does not resurrect pending or expired states", () => {
    expect(effectiveApprovalState("pending", now, now)).toBe("pending");
    expect(effectiveApprovalState("expired", now, now)).toBe("expired");
  });
});

describe("readinessKernel — the primary failure experiment", () => {
  /**
   * Attack 1 in miniature: the user clicks "Mark Ready" against revision 7
   * while an amendment creates revision 8. Convex OCC serializes the two
   * mutations; whichever order they land in, the kernel sees consistent
   * input. This test asserts the post-race state is never false-ready.
   */
  it("never reports READY after the package falls behind the current revision", () => {
    // Snapshot as read by the markReady mutation at T0: everything derived
    // from OLD_REV, package pinned to OLD_REV — legitimately READY.
    const atT0 = base({
      currentRevisionId: OLD_REV,
      packageRevisionId: OLD_REV,
      requirements: [
        req({
          revisionId: OLD_REV,
          evidence: [{ id: "e1", title: "Insurance certificate", status: "CURRENT", revisionId: OLD_REV }],
        }),
      ],
    });
    expect(evaluateReadiness(atT0).status).toBe("READY");

    // Amendment commits first: current revision advances, requirement goes stale.
    const afterAmendment: ReadinessInput = {
      ...atT0,
      currentRevisionId: REV,
      requirements: [req({ revisionId: OLD_REV, status: "STALE" })],
    };
    const r = evaluateReadiness(afterAmendment);
    expect(r.status).toBe("BLOCKED");
    expect(r.blockingRequirementIds).toContain("r1");

    // Even if the package is somehow re-pinned, the stale requirement still blocks.
    const repinned = evaluateReadiness({
      ...afterAmendment,
      packageRevisionId: REV,
    });
    expect(repinned.status).toBe("BLOCKED");

    // And with amendment committed *after* the ready commit, the package is
    // immediately STALE because its revision id no longer matches.
    const readyThenAmend = evaluateReadiness({
      ...atT0,
      currentRevisionId: REV,
    });
    expect(readyThenAmend.status).toBe("BLOCKED");
  });
});
