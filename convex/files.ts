import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireTender } from "./lib/auth";
import { evidenceType } from "./lib/validators";

/**
 * Convex File Storage & Artifact Ingestion.
 *
 * Provides authoritative endpoints for uploading and persisting real PDF / document
 * artifacts (tender documents, certificates of insurance, SOC 2 reports, financial statements).
 */

/**
 * Generates an authorized one-time upload URL for the client.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Retrieves the downloadable / preview URL for any stored artifact.
 */
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Persists an uploaded evidence artifact and optionally maps it to a requirement.
 */
export const saveEvidenceFile = mutation({
  args: {
    tenderId: v.id("tenders"),
    storageId: v.id("_storage"),
    filename: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    sourceHash: v.string(),
    title: v.string(),
    type: evidenceType,
    requirementId: v.optional(v.id("requirements")),
  },
  handler: async (ctx, args) => {
    const { tender, workspace } = await requireTender(ctx, args.tenderId);
    if (!tender.currentRevisionId) {
      throw new Error("Tender has no active revision to attach evidence to.");
    }

    const now = Date.now();
    const evidenceId = await ctx.db.insert("evidenceItems", {
      tenderId: args.tenderId,
      workspaceId: workspace._id,
      revisionId: tender.currentRevisionId,
      type: args.type,
      title: args.title,
      storageId: args.storageId,
      filename: args.filename,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      sourceHash: args.sourceHash,
      processingStatus: "UPLOADED",
      verificationStatus: "UNVERIFIED",
      isFixture: false,
      createdAt: now,
      updatedAt: now,
    });

    // If a requirement was specified, map it immediately
    if (args.requirementId) {
      const req = await ctx.db.get(args.requirementId);
      if (req) {
        // Mark any prior mappings for this requirement as superseded/stale
        const existingMappings = await ctx.db
          .query("requirementEvidence")
          .withIndex("by_requirement", (q) => q.eq("requirementId", req._id))
          .collect();

        for (const m of existingMappings) {
          await ctx.db.patch(m._id, {
            status: "STALE",
            staleReason: `Superseded by newly uploaded evidence: ${args.title}`,
          });
        }

        // Insert new current mapping
        await ctx.db.insert("requirementEvidence", {
          tenderId: args.tenderId,
          requirementId: req._id,
          evidenceId,
          revisionId: req.revisionId,
          status: "CURRENT",
          createdAt: now,
        });

        await ctx.db.patch(req._id, {
          currentEvidenceCount: req.currentEvidenceCount + 1,
          updatedAt: now,
        });
      }
    }

    // Append to proof event audit stream
    await ctx.db.insert("proofEvents", {
      tenderId: args.tenderId,
      revisionId: tender.currentRevisionId,
      kind: "EVIDENCE_VERIFIED",
      summary: `Uploaded and attached evidence artifact: ${args.title} (${args.filename}).`,
      detail: {
        hash: args.sourceHash,
        source: args.filename,
      },
      seq: now,
      at: now,
    });

    return evidenceId;
  },
});

/**
 * Persists an uploaded tender source document (e.g. RFP PDF or Addendum PDF).
 */
export const saveSourceDocumentFile = mutation({
  args: {
    tenderId: v.id("tenders"),
    storageId: v.id("_storage"),
    filename: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    contentHash: v.string(),
    documentTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const { tender } = await requireTender(ctx, args.tenderId);
    const now = Date.now();

    const docId = await ctx.db.insert("sourceDocuments", {
      tenderId: args.tenderId,
      revisionId: tender.currentRevisionId,
      url: `storage://${args.storageId}`,
      canonicalUrl: `storage://${args.storageId}`,
      contentHash: args.contentHash,
      normalizedContentHash: args.contentHash,
      fetchedAt: now,
      sourceType: "UPLOAD_PDF",
      documentTitle: args.documentTitle,
      markdownLength: args.fileSize,
      isFixture: false,
      mode: "LIVE",
      storageId: args.storageId,
      filename: args.filename,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
    });

    return docId;
  },
});
