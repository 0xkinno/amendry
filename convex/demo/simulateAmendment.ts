import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { hashSource } from "../lib/hashes";
import type { Doc, Id } from "../_generated/dataModel";

/**
 * P5.7 — Server-authoritative amendment simulator.
 *
 * Injects Revision 9:
 * - Public liability insurance threshold increased from $2,000,000 to $5,000,000
 * - Submission deadline extended to October 15, 2026
 *
 * Atomically computes blast radius, marks dependent evidence as STALE,
 * supersedes the previous revision, and disqualifies the submission package.
 */
export const simulateAmendment = mutation({
  args: {
    tenderId: v.optional(v.id("tenders")),
  },
  handler: async (ctx, args) => {
    // 1. Locate tender
    let tender: Doc<"tenders"> | null = null;
    if (args.tenderId) {
      tender = await ctx.db.get(args.tenderId);
    } else {
      const candidates = await ctx.db.query("tenders").order("desc").collect();
      tender = candidates.find((t) => t.sourceUrl.includes("mta-station-upgrade")) ?? candidates[0] ?? null;
    }

    if (!tender) {
      throw new Error("No tender found to simulate amendment on. Please run seedDemoWorkspace first.");
    }

    if (!tender.currentRevisionId) {
      throw new Error("Tender has no active revision.");
    }

    const currentRev = await ctx.db.get(tender.currentRevisionId);
    if (!currentRev) {
      throw new Error("Current revision document not found.");
    }

    // Check if already at Revision 9 or higher
    if (currentRev.revisionNumber >= 9) {
      return {
        alreadySimulated: true,
        currentRevisionNumber: currentRev.revisionNumber,
        tenderId: tender._id,
        message: "Amendment already simulated (Revision 9 active).",
      };
    }

    const now = Date.now();
    const nextRevisionNumber = currentRev.revisionNumber + 1;

    // 2. Hash new source content
    const amendmentMarkdown = `# Metropolitan Transit Authority — Station Upgrade & Signaling
Document: Contract Specification MTA-2026-8812
Status: ADDENDUM 8 ISSUED

CRITICAL AMENDMENT NOTICE:
1. Section 4.1 Insurance: Mandatory public liability insurance minimum coverage is hereby increased to $5,000,000 per occurrence (previously $2,000,000).
2. Section 1.2 Schedule: The bid submission deadline is extended from October 1, 2026 to October 15, 2026, 2:00 PM EST.
3. All other terms, conditions, bonding capacities, and technical specifications remain in full effect.`;

    const hashes = hashSource(amendmentMarkdown);

    // Mark previous revision as SUPERSEDED
    await ctx.db.patch(currentRev._id, { status: "SUPERSEDED" });

    // 3. Create Revision 9
    const rev9Id = await ctx.db.insert("tenderRevisions", {
      tenderId: tender._id,
      revisionNumber: nextRevisionNumber,
      kind: "AMENDMENT",
      status: "CURRENT",
      contentHash: hashes.contentHash,
      normalizedSourceHash: hashes.normalizedSourceHash,
      sourceUrl: tender.sourceUrl,
      canonicalUrl: tender.sourceUrl,
      documentTitle: `MTA Station Upgrade & Signaling — Addendum 8 (Rev ${nextRevisionNumber})`,
      supersedesRevisionId: currentRev._id,
      changeSummary: "Addendum 8: Public liability increased to $5M; deadline extended to Oct 15",
      isFixture: true,
      links: [
        "https://tenders.example.gov/mta/addendum-8.pdf",
        "https://tenders.example.gov/mta/revised-specs.pdf",
      ],
      discoveredAt: now,
      publishedAt: now,
    });

    // 4. Fetch old requirements from Revision 8
    const oldReqs = await ctx.db
      .query("requirements")
      .withIndex("by_revision", (q) => q.eq("revisionId", currentRev._id))
      .collect();

    let insuranceReqId: Id<"requirements"> | null = null;
    let deadlineReqId: Id<"requirements"> | null = null;

    // 5. Carry over requirements to Revision 9 with blast radius invalidations
    for (const r of oldReqs) {
      if (r.lineageKey === "insurance:public-liability") {
        insuranceReqId = await ctx.db.insert("requirements", {
          tenderId: tender._id,
          revisionId: rev9Id,
          lineageKey: r.lineageKey,
          key: r.key,
          title: "Minimum $5,000,000 public liability insurance",
          body: "Contractor must carry public liability insurance with a minimum coverage of $5,000,000 per occurrence (Addendum 8 revised from $2,000,000).",
          category: r.category,
          mandatory: true,
          structuredValue: "$5,000,000",
          sourceReference: "Addendum 8, Section 4.1",
          confidence: 1.0,
          status: "UNKNOWN", // Invalidated!
          staleReason: "Invalidated by Revision 9: Threshold increased from $2M to $5M.",
          currentEvidenceCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      } else if (r.lineageKey === "schedule:deadline") {
        deadlineReqId = await ctx.db.insert("requirements", {
          tenderId: tender._id,
          revisionId: rev9Id,
          lineageKey: r.lineageKey,
          key: r.key,
          title: "Submission deadline: October 15, 2026, 2:00 PM EST",
          body: "All proposal packages must be submitted via the procurement portal before October 15, 2026, 2:00 PM EST (Addendum 8 extension).",
          category: r.category,
          mandatory: true,
          structuredValue: "2026-10-15T14:00:00-05:00",
          sourceReference: "Addendum 8, Section 1.2",
          confidence: 1.0,
          status: "UNKNOWN", // Invalidated!
          staleReason: "Invalidated by Revision 9: Submission schedule extended to Oct 15.",
          currentEvidenceCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        // Carry over unchanged requirement
        await ctx.db.insert("requirements", {
          tenderId: tender._id,
          revisionId: rev9Id,
          lineageKey: r.lineageKey,
          key: r.key,
          title: r.title,
          body: r.body,
          category: r.category,
          mandatory: r.mandatory,
          structuredValue: r.structuredValue,
          sourceReference: r.sourceReference,
          confidence: r.confidence,
          status: r.status,
          currentEvidenceCount: r.currentEvidenceCount,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // 6. Invalidate old evidence items for the changed criteria
    const oldEvidence = await ctx.db
      .query("evidenceItems")
      .withIndex("by_tender", (q) => q.eq("tenderId", tender._id))
      .collect();

    for (const ev of oldEvidence) {
      if (ev.title.includes("Travelers") || ev.title.includes("Liability")) {
        await ctx.db.patch(ev._id, {
          verificationStatus: "STALE",
          staleReason: "Invalidated by Revision 9: Current certificate ($2,000,000) is below revised $5,000,000 requirement.",
          updatedAt: now,
        });
      } else if (ev.title.includes("Schedule") || ev.title.includes("Primavera")) {
        await ctx.db.patch(ev._id, {
          verificationStatus: "STALE",
          staleReason: "Invalidated by Revision 9: Schedule does not reflect October 15, 2026 deadline extension.",
          updatedAt: now,
        });
      }
    }

    // 7. Update requirement-evidence link status
    const reqEdges = await ctx.db
      .query("requirementEvidence")
      .withIndex("by_tender", (q) => q.eq("tenderId", tender._id))
      .collect();

    for (const edge of reqEdges) {
      await ctx.db.patch(edge._id, {
        status: "STALE",
        staleReason: "Invalidated by Revision 9 amendment",
      });
    }

    // 8. Disqualify submission packages
    const packages = await ctx.db
      .query("submissionPackages")
      .withIndex("by_tender", (q) => q.eq("tenderId", tender._id))
      .collect();

    for (const p of packages) {
      await ctx.db.patch(p._id, {
        status: "BLOCKED",
        approvalState: "expired",
        reasons: [
          `Submission package was compiled against superseded Revision ${currentRev.revisionNumber}.`,
          "Mandatory requirement 'insurance:public-liability' is UNKNOWN with STALE evidence.",
          "Mandatory requirement 'schedule:deadline' is UNKNOWN with STALE evidence.",
        ],
        updatedAt: now,
      });
    }

    // 9. Record Amendment in amendments table
    await ctx.db.insert("amendments", {
      tenderId: tender._id,
      revisionId: rev9Id,
      supersedesRevisionId: currentRev._id,
      status: "MAPPED",
      summary: "Addendum 8: Mandatory public liability increased to $5M; deadline extended to October 15, 2026.",
      impact: [
        {
          kind: "CHANGED",
          requirementId: insuranceReqId ?? undefined,
          lineageKey: "insurance:public-liability",
          label: "Liability Coverage Threshold Raised",
          detail: "Minimum coverage increased from $2,000,000 to $5,000,000. Existing evidence invalidated.",
        },
        {
          kind: "CHANGED",
          requirementId: deadlineReqId ?? undefined,
          lineageKey: "schedule:deadline",
          label: "Bid Submission Deadline Extended",
          detail: "Deadline moved from October 1 to October 15, 2026. Schedule narrative invalidated.",
        },
      ],
      invalidationCount: 2,
      detectedAt: now,
      reviewedAt: now,
    });

    // 10. Record Proof Events
    await ctx.db.insert("proofEvents", {
      tenderId: tender._id,
      revisionId: rev9Id,
      kind: "REVISION_CREATED",
      summary: "Tender advanced: Revision 9 created (Addendum 8 detected).",
      detail: {
        revisionNumber: 9,
        hash: hashes.contentHash,
        source: tender.sourceUrl,
      },
      seq: now,
      at: now,
    });

    await ctx.db.insert("proofEvents", {
      tenderId: tender._id,
      revisionId: rev9Id,
      kind: "WORK_INVALIDATED",
      summary: "Blast radius computed: 2 requirements invalidated, 2 evidence documents marked STALE, submission package disqualified.",
      detail: {
        revisionNumber: 9,
        blocking: ["insurance:public-liability", "schedule:deadline"],
      },
      seq: now + 1,
      at: now + 1,
    });

    await ctx.db.insert("proofEvents", {
      tenderId: tender._id,
      revisionId: rev9Id,
      kind: "READINESS_CHECKED",
      summary: "Kernel evaluated: BLOCKED (Fail-closed invariant triggered on Revision 9 mismatch & stale evidence).",
      detail: {
        revisionNumber: 9,
        blocking: ["PACKAGE_REVISION_MISMATCH", "insurance:public-liability", "schedule:deadline"],
      },
      seq: now + 2,
      at: now + 2,
    });

    // 11. Point tender to Revision 9
    await ctx.db.patch(tender._id, {
      currentRevisionId: rev9Id,
      deadline: "October 15, 2026, 2:00 PM EST",
      updatedAt: now,
    });

    // 12. Create draft clarification for human review
    const clarId = await ctx.db.insert("clarifications", {
      tenderId: tender._id,
      workspaceId: tender.workspaceId,
      requirementId: insuranceReqId ?? undefined,
      revisionId: rev9Id,
      subject: "Clarification Request: Insurance Threshold Confirmation (Addendum 8)",
      body: `Dear Metropolitan Public Works Authority,

Regarding Addendum 8 to Contract MTA-2026-8812, Section 4.1 specifies an increase in the public liability insurance requirement to $5,000,000 per occurrence.

Please confirm whether an excess/umbrella liability policy of $3,000,000 over our existing $2,000,000 primary commercial general liability policy satisfies this requirement.

Sincerely,
Bid Operations Desk`,
      toAddress: "procurement@mta.example.gov",
      status: "PENDING_APPROVAL",
      isDemoBuyer: true,
      idempotencyKey: `clarification:demo:${tender._id}:rev9:${now}`,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      tenderId: tender._id,
      previousRevisionNumber: currentRev.revisionNumber,
      newRevisionNumber: 9,
      invalidatedCount: 2,
      staleEvidenceCount: 2,
      clarificationId: clarId,
      status: "BLOCKED",
    };
  },
});
