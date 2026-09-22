import { describe, expect, it } from "vitest";
import { decide, idempotencyKey, stageKey, type OutboundRecord } from "../../convex/lib/idempotency";

describe("idempotencyKey", () => {
  it("builds the contract's firecrawl key shape", () => {
    expect(
      idempotencyKey({
        kind: "FIRECRAWL_FETCH",
        tenderId: "t1",
        sourceUrl: "https://x.gov/t",
        contentHash: "abc",
      }),
    ).toBe("firecrawl:tender:t1:source:https://x.gov/t:hash:abc");
  });

  it("builds the contract's agentmail key shape", () => {
    expect(idempotencyKey({ kind: "AGENTMAIL_SEND", clarificationId: "c1", bodyHash: "bbb" })).toBe(
      "agentmail:clarification:c1:hash:bbb",
    );
  });

  it("builds the contract's workflow stage key shape", () => {
    expect(stageKey("t1", "r8", "IMPACT_MAP")).toBe(
      "workflow:tender:t1:revision:r8:stage:IMPACT_MAP",
    );
  });

  it("is deterministic for identical inputs", () => {
    const a = idempotencyKey({ kind: "OPENAI_PARSE", providerMessageId: "m1" });
    const b = idempotencyKey({ kind: "OPENAI_PARSE", providerMessageId: "m1" });
    expect(a).toBe(b);
  });

  it("differs when any material input differs", () => {
    const keys = new Set([
      idempotencyKey({ kind: "OPENAI_EXTRACTION", revisionId: "r1", contentHash: "h1" }),
      idempotencyKey({ kind: "OPENAI_EXTRACTION", revisionId: "r2", contentHash: "h1" }),
      idempotencyKey({ kind: "OPENAI_EXTRACTION", revisionId: "r1", contentHash: "h2" }),
      idempotencyKey({ kind: "OPENAI_IMPACT", fromRevisionId: "r1", toRevisionId: "r2" }),
      idempotencyKey({ kind: "OPENAI_DRAFT", clarificationId: "c1", bodyHash: "b" }),
      idempotencyKey({ kind: "AGENTMAIL_SEND", clarificationId: "c1", bodyHash: "b" }),
    ]);
    expect(keys.size).toBe(6);
  });

  it("contains no timestamp or random component (a replay must reuse the same key)", () => {
    const k = idempotencyKey({ kind: "AGENTMAIL_SEND", clarificationId: "c1", bodyHash: "b" });
    expect(k).not.toMatch(/\d{13}/);
    expect(k).toBe("agentmail:clarification:c1:hash:b");
  });
});

describe("decide — the pre-execution lookup policy", () => {
  it("EXECUTE when there is no prior attempt", () => {
    const d = decide(null);
    expect(d.action).toBe("EXECUTE");
    expect(decide(undefined).action).toBe("EXECUTE");
  });

  it("RETURN_CACHED when the prior attempt completed (duplicate is harmless)", () => {
    const rec: OutboundRecord = { idempotencyKey: "k", status: "COMPLETED", attemptCount: 1, resultDigest: "r1" };
    const d = decide(rec);
    expect(d.action).toBe("RETURN_CACHED");
    if (d.action === "RETURN_CACHED") expect(d.resultDigest).toBe("r1");
  });

  it("RECONCILE when an attempt is in flight — never double-fire", () => {
    expect(decide({ idempotencyKey: "k", status: "WORKING", attemptCount: 1 }).action).toBe("RECONCILE");
    expect(decide({ idempotencyKey: "k", status: "RECONCILING", attemptCount: 2 }).action).toBe("RECONCILE");
  });

  it("EXECUTE again when the prior attempt failed, with the count preserved", () => {
    const d = decide({ idempotencyKey: "k", status: "FAILED", attemptCount: 2 });
    expect(d.action).toBe("EXECUTE");
    expect(d.reason).toMatch(/attempt 2/);
  });

  it("covers every status", () => {
    const statuses = ["WORKING", "COMPLETED", "FAILED", "RECONCILING"] as const;
    for (const status of statuses) {
      expect(["EXECUTE", "RETURN_CACHED", "RECONCILE"]).toContain(
        decide({ idempotencyKey: "k", status, attemptCount: 1 }).action,
      );
    }
  });
});
