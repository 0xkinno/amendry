import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { hashSource } from "../lib/hashes";
import { readinessDigest } from "../lib/readinessKernel";
import type { Id } from "../_generated/dataModel";

const SEED_REQUIREMENTS_RAW = [
  {
    lineageKey: "insurance:public-liability",
    title: "Minimum $2,000,000 public liability insurance",
    body: "Contractor must carry public liability insurance with a minimum coverage of $2,000,000 per occurrence.",
    category: "INSURANCE" as const,
    mandatory: true,
    structuredValue: "$2,000,000",
    sourceReference: "Section 4.1 — Insurance",
  },
  {
    lineageKey: "schedule:deadline",
    title: "Submission deadline: October 1, 2026, 2:00 PM EST",
    body: "All proposal packages must be submitted via the procurement portal before October 1, 2026, 2:00 PM EST.",
    category: "SCHEDULE" as const,
    mandatory: true,
    structuredValue: "2026-10-01T14:00:00-05:00",
    sourceReference: "Section 1.2 — Schedule",
  },
  {
    lineageKey: "insurance:workers-comp",
    title: "Workers' compensation as required by state law",
    body: "Contractor must carry statutory workers' compensation insurance.",
    category: "INSURANCE" as const,
    mandatory: true,
    structuredValue: "Statutory",
    sourceReference: "Section 4.2",
  },
  {
    lineageKey: "insurance:auto-liability",
    title: "Automobile liability insurance: $2,000,000 combined single limit",
    body: "Comprehensive automobile liability covering all owned, hired, and non-owned vehicles.",
    category: "INSURANCE" as const,
    mandatory: true,
    structuredValue: "$2,000,000",
    sourceReference: "Section 4.3",
  },
  {
    lineageKey: "financial:revenue-minimum",
    title: "Annual revenue minimum: $10,000,000",
    body: "Contractor must demonstrate annual audited revenue of at least $10,000,000 over past 3 fiscal years.",
    category: "FINANCIAL" as const,
    mandatory: true,
    structuredValue: "$10,000,000",
    sourceReference: "Section 5.1",
  },
  {
    lineageKey: "financial:bonding-capacity",
    title: "Bonding capacity: $25,000,000 aggregate",
    body: "Letter of surety commitment confirming aggregate bonding capacity of $25,000,000.",
    category: "FINANCIAL" as const,
    mandatory: true,
    structuredValue: "$25,000,000",
    sourceReference: "Section 5.2",
  },
  {
    lineageKey: "technical:rail-safety-cert",
    title: "FTA Track Safety & FRA Part 213 Certification",
    body: "Key personnel and supervisory crew must possess active FRA Track Safety certification.",
    category: "TECHNICAL" as const,
    mandatory: true,
    structuredValue: "FRA Part 213",
    sourceReference: "Section 6.1",
  },
  {
    lineageKey: "legal:debarment-clearance",
    title: "Non-debarment and SAM.gov Active Registration",
    body: "Vendor must not appear on federal, state, or municipal excluded parties list.",
    category: "LEGAL" as const,
    mandatory: true,
    structuredValue: "SAM.gov Active / Good Standing",
    sourceReference: "Section 2.4",
  },
];

/**
 * P5.6 — Server-authoritative demo seeder.
 *
 * Seeds realistic tender, Revisions 1 through 8, requirements,
 * verified evidence, and an approved submission package certified READY
 * for Revision 8 in a single atomic transaction.
 */
export const seedDemoWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    let userId = await getAuthUserId(ctx);
    if (!userId) {
      const existingUser = await ctx.db.query("users").first();
      if (existingUser) {
        userId = existingUser._id;
      } else {
        userId = await ctx.db.insert("users", {
          name: "Judge / Evaluator",
          isAnonymous: true,
        });
      }
    }

    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", userId!))
      .first();

    if (!workspace) {
      const wsId = await ctx.db.insert("workspaces", {
        userId,
        name: "Metropolitan Transit Integrity Desk",
        role: "Lead Bid Director",
      });
      workspace = (await ctx.db.get(wsId))!;
    }

    // Clean up existing demo tenders for this workspace if any exist to allow clean replay
    const existingTenders = await ctx.db
      .query("tenders")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .collect();

    for (const t of existingTenders) {
      if (t.sourceUrl.includes("mta-station-upgrade")) {
        const reqs = await ctx.db.query("requirements").withIndex("by_tender_current", (q) => q.eq("tenderId", t._id)).collect();
        for (const r of reqs) await ctx.db.delete(r._id);
        const evs = await ctx.db.query("evidenceItems").withIndex("by_tender", (q) => q.eq("tenderId", t._id)).collect();
        for (const e of evs) await ctx.db.delete(e._id);
        const edges = await ctx.db.query("requirementEvidence").withIndex("by_tender", (q) => q.eq("tenderId", t._id)).collect();
        for (const ed of edges) await ctx.db.delete(ed._id);
        const pkgs = await ctx.db.query("submissionPackages").withIndex("by_tender", (q) => q.eq("tenderId", t._id)).collect();
        for (const p of pkgs) await ctx.db.delete(p._id);
        const revs = await ctx.db.query("tenderRevisions").withIndex("by_tender", (q) => q.eq("tenderId", t._id)).collect();
        for (const rv of revs) await ctx.db.delete(rv._id);
        const events = await ctx.db.query("proofEvents").withIndex("by_tender", (q) => q.eq("tenderId", t._id)).collect();
        for (const ev of events) await ctx.db.delete(ev._id);
        const ams = await ctx.db.query("amendments").withIndex("by_tender", (q) => q.eq("tenderId", t._id)).collect();
        for (const am of ams) await ctx.db.delete(am._id);
        await ctx.db.delete(t._id);
      }
    }

    const now = Date.now();
    const day = 86400000;

    // 1. Create Demo Tender
    const tenderId = await ctx.db.insert("tenders", {
      workspaceId: workspace._id,
      title: "Metropolitan Transit Authority — Station Upgrade & Signaling",
      buyerName: "Metropolitan Public Works Authority",
      sourceUrl: "https://tenders.example.gov/mta-station-upgrade",
      jurisdiction: "New York, NY",
      deadline: "October 1, 2026, 2:00 PM EST",
      status: "MONITORING",
      sourceMode: "FIXTURE",
      sourceState: "CURRENT",
      monitorIntervalMs: 15 * 60 * 1000,
      createdBy: userId,
      createdAt: now - 14 * day,
      updatedAt: now,
      lastCheckedAt: now - 300000,
      lastVerifiedAt: now - 300000,
    });

    // 2. Create Revisions 1 through 8
    const revisionIds: Array<Id<"tenderRevisions">> = [];
    let prevRevId: Id<"tenderRevisions"> | undefined = undefined;

    for (let r = 1; r <= 8; r++) {
      const hashes = hashSource(
        `# MTA Tender Document Revision ${r}\nScope: Station upgrades, platform screen doors, CBTC signaling.\nRevision ${r} certified.`,
      );
      const revTime = now - (14 - r) * day;
      const isCurrentRev = r === 8;
      const createdRevId: Id<"tenderRevisions"> = await ctx.db.insert("tenderRevisions", {
        tenderId,
        revisionNumber: r,
        kind: r === 1 ? "INITIAL" : "AMENDMENT",
        status: isCurrentRev ? "CURRENT" : "SUPERSEDED",
        contentHash: hashes.contentHash,
        normalizedSourceHash: hashes.normalizedSourceHash,
        sourceUrl: "https://tenders.example.gov/mta-station-upgrade",
        canonicalUrl: "https://tenders.example.gov/mta-station-upgrade",
        documentTitle: `MTA Station Upgrade & Signaling — Rev ${r}`,
        supersedesRevisionId: prevRevId,
        changeSummary: r === 1 ? "Initial tender release" : `Addendum ${r - 1} verified`,
        isFixture: true,
        links: [
          "https://tenders.example.gov/mta/specs.pdf",
          "https://tenders.example.gov/mta/addendum-7.pdf",
        ],
        discoveredAt: revTime,
        publishedAt: revTime,
      });

      revisionIds.push(createdRevId);
      prevRevId = createdRevId;

      await ctx.db.insert("proofEvents", {
        tenderId,
        revisionId: createdRevId,
        kind: "REVISION_CREATED",
        summary: `Tender Revision ${r} published and hashed.`,
        detail: {
          revisionNumber: r,
          hash: hashes.contentHash,
          source: "https://tenders.example.gov/mta-station-upgrade",
        },
        seq: revTime,
        at: revTime,
      });
    }

    const currentRevId = revisionIds[revisionIds.length - 1]!;
    await ctx.db.patch(tenderId, { currentRevisionId: currentRevId });

    // 3. Create Requirements for Revision 8
    const requirementIds: Array<Id<"requirements">> = [];
    for (const raw of SEED_REQUIREMENTS_RAW) {
      const reqId = await ctx.db.insert("requirements", {
        tenderId,
        revisionId: currentRevId,
        lineageKey: raw.lineageKey,
        key: raw.lineageKey,
        title: raw.title,
        body: raw.body,
        category: raw.category,
        mandatory: raw.mandatory,
        structuredValue: raw.structuredValue,
        sourceReference: raw.sourceReference,
        confidence: 0.98,
        status: "VERIFIED",
        currentEvidenceCount: 1,
        createdAt: now - 3 * day,
        updatedAt: now - 3 * day,
      });
      requirementIds.push(reqId);
    }

    // 4. Create Evidence Items for Revision 8
    const evidenceList = [
      {
        lineageKey: "insurance:public-liability",
        title: "Public Liability Policy Certificate — Travelers ($2,000,000 per occ)",
        type: "INSURANCE" as const,
        source: "Travelers Insurance Certificate #TRAV-2026-8812",
      },
      {
        lineageKey: "schedule:deadline",
        title: "Critical Path Work Breakdown Schedule (Target completion Oct 1)",
        type: "DOCUMENT" as const,
        source: "Primavera P6 Baseline Schedule Rev 8",
      },
      {
        lineageKey: "insurance:workers-comp",
        title: "Statutory Workers' Compensation Certificate — NYSIF",
        type: "INSURANCE" as const,
        source: "New York State Insurance Fund Policy #W-81920",
      },
      {
        lineageKey: "insurance:auto-liability",
        title: "Commercial Automobile Liability Policy ($2,000,000 CSL)",
        type: "INSURANCE" as const,
        source: "Liberty Mutual Commercial Auto Policy #CA-19283",
      },
      {
        lineageKey: "financial:revenue-minimum",
        title: "Audited Financial Statements FY23-FY25 (PwC)",
        type: "DOCUMENT" as const,
        source: "Independent Auditor's Report — PwC LLP",
      },
      {
        lineageKey: "financial:bonding-capacity",
        title: "Surety Letter of Capacity ($25M Aggregate) — Zurich",
        type: "CERTIFICATE" as const,
        source: "Zurich American Insurance Company Surety Division",
      },
      {
        lineageKey: "technical:rail-safety-cert",
        title: "FRA Part 213 Track Safety Certifications (Lead Track Foreman)",
        type: "CERTIFICATE" as const,
        source: "Federal Railroad Administration Registry #FRA-NYC-7718",
      },
      {
        lineageKey: "legal:debarment-clearance",
        title: "SAM.gov Active Entity Status & Non-Debarment Affirmation",
        type: "DOCUMENT" as const,
        source: "System for Award Management (SAM.gov) CAGE: 4K912",
      },
    ];

    for (let i = 0; i < evidenceList.length; i++) {
      const e = evidenceList[i]!;
      const reqId = requirementIds[i]!;
      const evId = await ctx.db.insert("evidenceItems", {
        tenderId,
        workspaceId: workspace._id,
        type: e.type,
        title: e.title,
        source: e.source,
        revisionId: currentRevId,
        verificationStatus: "VERIFIED",
        verifiedBy: userId,
        verifiedAt: now - 2 * day,
        owner: "Sarah Chen, Chief Estimator",
        isFixture: true,
        createdAt: now - 2 * day,
        updatedAt: now - 2 * day,
      });

      await ctx.db.insert("requirementEvidence", {
        tenderId,
        requirementId: reqId,
        evidenceId: evId,
        revisionId: currentRevId,
        status: "CURRENT",
        createdAt: now - 2 * day,
      });
    }

    // 5. Create Approved Submission Package
    const digest = readinessDigest([
      tenderId,
      "rev8",
      "READY",
      String(requirementIds.length),
      String(requirementIds.length),
    ]);

    const packageId = await ctx.db.insert("submissionPackages", {
      tenderId,
      workspaceId: workspace._id,
      revisionId: currentRevId,
      status: "DRAFT",
      blockingRequirementIds: [],
      reasons: [],
      readinessDigest: digest,
      approvalState: "approved",
      approvedBy: userId,
      approvedAt: now - 3600000,
      approvalExpiresAt: now + 23 * 3600000,
      createdAt: now - 3600000,
      updatedAt: now - 3600000,
    });

    // 6. Record Proof Milestones
    await ctx.db.insert("proofEvents", {
      tenderId,
      revisionId: currentRevId,
      kind: "READINESS_CHECKED",
      summary: "Kernel verified: 8/8 mandatory requirements satisfied with current evidence.",
      detail: {
        revisionNumber: 8,
        blocking: [],
        digest,
      },
      seq: now - 3600000,
      at: now - 3600000,
    });

    await ctx.db.insert("proofEvents", {
      tenderId,
      revisionId: currentRevId,
      kind: "READY_GRANTED",
      summary: "Submission package certified READY FOR REVISION 8 by human director.",
      detail: {
        revisionNumber: 8,
        digest,
      },
      seq: now - 3500000,
      at: now - 3500000,
    });

    return {
      workspaceId: workspace._id,
      tenderId,
      currentRevisionNumber: 8,
      currentRevisionId: currentRevId,
      packageId,
      status: "READY",
      requirementsCount: requirementIds.length,
    };
  },
});
