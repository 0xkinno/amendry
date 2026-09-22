import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireTender } from "./lib/auth";

/**
 * P3.6 (continued) — Submission packages.
 *
 * A submission package is never a bare `ready` boolean. Its status is
 * always accompanied by the revision it was computed against and a digest
 * that the offline verifier can recompute.
 */

/** List submission packages for a tender. */
export const list = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    return await ctx.db
      .query("submissionPackages")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .collect();
  },
});

/** Get the current (most recent) submission package. */
export const getCurrent = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    await requireTender(ctx, args.tenderId);
    const rows = await ctx.db
      .query("submissionPackages")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .collect();
    return rows[0] ?? null;
  },
});

/** Create a new submission package. */
export const create = mutation({
  args: {
    tenderId: v.id("tenders"),
  },
  handler: async (ctx, args) => {
    const { tender, workspace } = await requireTender(ctx, args.tenderId);
    if (!tender.currentRevisionId) {
      throw new Error("Tender has no current revision.");
    }
    const now = Date.now();
    return await ctx.db.insert("submissionPackages", {
      tenderId: args.tenderId,
      workspaceId: workspace._id,
      revisionId: tender.currentRevisionId,
      status: "DRAFT",
      blockingRequirementIds: [],
      reasons: [],
      approvalState: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Approve a submission package (human approval). */
export const approve = mutation({
  args: {
    packageId: v.id("submissionPackages"),
  },
  handler: async (ctx, args) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) throw new Error("Package not found.");

    const now = Date.now();
    const APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;

    await ctx.db.patch(args.packageId, {
      approvalState: "approved",
      approvedAt: now,
      approvalExpiresAt: now + APPROVAL_TTL_MS,
      updatedAt: now,
    });

    await ctx.db.insert("proofEvents", {
      tenderId: pkg.tenderId,
      revisionId: pkg.revisionId,
      kind: "READY_GRANTED",
      summary: "Human approval granted for submission package.",
      detail: { digest: pkg.readinessDigest ?? undefined },
      seq: now,
      at: now,
    });
  },
});

/** Revoke approval on a submission package. */
export const revokeApproval = mutation({
  args: {
    packageId: v.id("submissionPackages"),
  },
  handler: async (ctx, args) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) throw new Error("Package not found.");

    await ctx.db.patch(args.packageId, {
      approvalState: "pending",
      approvedAt: undefined,
      approvedBy: undefined,
      approvalExpiresAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

/** Mark a package as sent. */
export const markSent = mutation({
  args: {
    packageId: v.id("submissionPackages"),
  },
  handler: async (ctx, args) => {
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) throw new Error("Package not found.");

    const now = Date.now();
    await ctx.db.patch(args.packageId, {
      status: "SENT",
      sentAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("proofEvents", {
      tenderId: pkg.tenderId,
      revisionId: pkg.revisionId,
      kind: "PACKAGE_GENERATED",
      summary: "Submission package marked as sent.",
      detail: { digest: pkg.readinessDigest ?? undefined },
      seq: now,
      at: now,
    });
  },
});

/**
 * Section 31 & 32: Commit-Time Certification Gate.
 * Authoritative mutation: Re-reads current tender revision, requirements, evidence,
 * conflicts, and approval state, re-evaluating readiness inside this single
 * transaction boundary before issuing an immutable revision-pinned certificate.
 */
export const finalizeSubmission = mutation({
  args: {
    packageId: v.id("submissionPackages"),
  },
  handler: async (ctx, args) => {
    // 1. Read package
    const pkg = await ctx.db.get(args.packageId);
    if (!pkg) throw new Error("Submission package not found.");

    // 2. Read authoritative tender
    const tender = await ctx.db.get(pkg.tenderId);
    if (!tender) throw new Error("Tender not found.");
    if (!tender.currentRevisionId) {
      throw new Error("Tender has no active revision to certify against.");
    }

    // 3. TOCTOU Check: Is the package still pinned to the current verified revision?
    if (pkg.revisionId !== tender.currentRevisionId) {
      const staleReason = "PACKAGE_REVISION_MISMATCH: Tender advanced since package preparation. Revalidation required.";
      await ctx.db.patch(args.packageId, {
        status: "BLOCKED",
        reasons: [staleReason],
        updatedAt: Date.now(),
      });
      throw new Error(`COMMIT_TIME_VALIDATION_FAILED: ${staleReason}`);
    }

    // 4. Read current revision record
    const currentRev = await ctx.db.get(tender.currentRevisionId);
    if (!currentRev) throw new Error("Current tender revision not found.");

    // 5. Authoritatively re-read all requirements for this revision
    const reqs = await ctx.db
      .query("requirements")
      .withIndex("by_revision", (q) => q.eq("revisionId", tender.currentRevisionId!))
      .collect();

    const mappings = await ctx.db
      .query("requirementEvidence")
      .withIndex("by_tender", (q) => q.eq("tenderId", pkg.tenderId))
      .collect();

    const evidenceItems = await ctx.db
      .query("evidenceItems")
      .withIndex("by_tender", (q) => q.eq("tenderId", pkg.tenderId))
      .collect();

    const conflicts = await ctx.db
      .query("conflicts")
      .withIndex("by_tender", (q) => q.eq("tenderId", pkg.tenderId))
      .collect();

    // 6. Assemble kernel input authoritatively
    const requirementStates = reqs.map((r) => {
      const reqMappings = mappings.filter((m) => m.requirementId === r._id);
      const reqEvidence = reqMappings.map((m) => {
        const ev = evidenceItems.find((e) => e._id === m.evidenceId);
        let status = m.status;
        const staleReason = m.staleReason ?? ev?.staleReason ?? undefined;
        if (ev) {
          if (ev.verificationStatus === "STALE") status = "STALE";
          else if (ev.verificationStatus === "REJECTED") status = "CONTESTED";
          else if (ev.verificationStatus === "UNVERIFIED" && status === "CURRENT") status = "MISSING";
        }
        return {
          id: m.evidenceId,
          title: ev?.title ?? "Evidence",
          status: status as any,
          revisionId: m.revisionId,
          staleReason,
        };
      });
      return {
        id: r._id,
        lineageKey: r.lineageKey,
        title: r.title,
        mandatory: r.mandatory,
        status: r.status as any,
        revisionId: r.revisionId,
        evidence: reqEvidence,
      };
    });

    const evidenceStates = evidenceItems.map((e) => {
      let status: "CURRENT" | "STALE" | "MISSING" | "CONTESTED" = "CURRENT";
      if (e.verificationStatus === "STALE") status = "STALE";
      else if (e.verificationStatus === "REJECTED") status = "CONTESTED";
      else if (e.verificationStatus === "UNVERIFIED") status = "MISSING";
      return {
        id: e._id,
        title: e.title,
        status,
        revisionId: e.revisionId,
        staleReason: e.staleReason ?? undefined,
      };
    });

    const conflictStates = conflicts.map((c) => ({
      id: c._id,
      label: c.label,
      state: c.state as any,
      revisionId: c.revisionId ?? undefined,
    }));

    // Import and execute pure kernel
    const { evaluateReadiness } = await import("./lib/readinessKernel");
    const verdict = evaluateReadiness({
      currentRevisionId: tender.currentRevisionId,
      requirements: requirementStates,
      evidence: evidenceStates,
      conflicts: conflictStates,
      packageRevisionId: pkg.revisionId,
      approvalState: pkg.approvalState,
      sourceUnavailable: tender.sourceState === "SOURCE_UNAVAILABLE",
    });

    if (verdict.status !== "READY") {
      const failureReason = verdict.reasons.join("; ");
      await ctx.db.patch(args.packageId, {
        status: "BLOCKED",
        reasons: verdict.reasons,
        blockingRequirementIds: verdict.blockingRequirementIds.map((id) => id as any),
        readinessDigest: verdict.digest,
        updatedAt: Date.now(),
      });
      throw new Error(`COMMIT_TIME_VALIDATION_FAILED: Invariant failed at commit: ${failureReason}`);
    }

    // 7. Write immutable revision-pinned certificate
    const now = Date.now();
    const certId = `CERT-REV${String(currentRev.revisionNumber).padStart(2, "0")}-${verdict.digest.slice(0, 8).toUpperCase()}`;

    // Mark any earlier certificates for this tender as superseded
    const existingCerts = await ctx.db
      .query("revisionCertificates")
      .withIndex("by_tender", (q) => q.eq("tenderId", pkg.tenderId))
      .collect();

    for (const cert of existingCerts) {
      if (cert.status === "CERTIFIED") {
        await ctx.db.patch(cert._id, { status: "SUPERSEDED" });
      }
    }

    const { sha256 } = await import("./lib/hashes");
    const certDbId = await ctx.db.insert("revisionCertificates", {
      certificateId: certId,
      tenderId: pkg.tenderId,
      workspaceId: pkg.workspaceId,
      revisionId: tender.currentRevisionId,
      revisionNumber: currentRev.revisionNumber,
      sourceHash: currentRev.contentHash,
      readinessDigest: verdict.digest,
      requirementSnapshotHash: sha256(JSON.stringify(reqs.map((r) => ({ id: r._id, s: r.status })))),
      evidenceSnapshotHash: sha256(JSON.stringify(evidenceStates.map((e) => ({ id: e.id, s: e.status })))),
      approvalId: pkg.approvedBy ? String(pkg.approvedBy) : "human-signoff",
      approvedAt: pkg.approvedAt ?? now,
      expiresAt: pkg.approvalExpiresAt ?? (now + 86400000),
      status: "CERTIFIED",
      createdAt: now,
    });

    // Update package to certified READY
    await ctx.db.patch(args.packageId, {
      status: "READY",
      readinessDigest: verdict.digest,
      reasons: [],
      blockingRequirementIds: [],
      generatedAt: now,
      updatedAt: now,
    });

    // Record immutable audit event in proof ledger
    await ctx.db.insert("proofEvents", {
      tenderId: pkg.tenderId,
      revisionId: tender.currentRevisionId,
      kind: "CERTIFICATE_ISSUED",
      summary: `Commit-time certification passed. Certificate ${certId} issued for Revision ${currentRev.revisionNumber}.`,
      detail: {
        revisionNumber: currentRev.revisionNumber,
        hash: currentRev.contentHash,
        digest: verdict.digest,
      },
      seq: now,
      at: now,
    });

    return {
      success: true,
      certificateId: certId,
      revisionNumber: currentRev.revisionNumber,
      readinessDigest: verdict.digest,
      dbId: certDbId,
    };
  },
});

/** Query latest certificate for a tender. */
export const getCertificate = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    const certs = await ctx.db
      .query("revisionCertificates")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .collect();
    return certs[0] ?? null;
  },
});

/** List all certificates issued for a tender. */
export const listCertificates = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("revisionCertificates")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .collect();
  },
});
