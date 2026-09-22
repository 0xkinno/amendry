import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { requireTender } from "./lib/auth";
import { hashSource } from "./lib/hashes";
import { inspectSource } from "./lib/sourceSafety";
import { idempotencyKey, decide } from "./lib/idempotency";
import { firecrawlLive, sourceMode } from "./lib/integrations";
import { components } from "./_generated/api";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";

/**
 * P4.1 — Firecrawl ingestion (fetch, normalize, hash, links, amendment
 * discovery) + FIXTURE mode.
 *
 * Every source fetch is idempotent: the same URL + content hash always
 * produces the same key, so a replayed workflow step is a no-op.
 *
 * FIXTURE mode provides deterministic demo data clearly labelled as such.
 */

/** Fixture data for demo mode. */
const FIXTURE_TENDER = {
  title: "City Bridge Rehabilitation — Phase 2",
  buyerName: "Metropolitan Public Works",
  markdown: `# Request for Proposal: Bridge Rehabilitation Phase 2

## Project Overview
The City of Metropolitan invites qualified contractors to submit proposals for the rehabilitation of the River Street Bridge (Structure #RB-2024-07).

## Mandatory Requirements

### Insurance
- Minimum $5,000,000 public liability insurance
- Workers' compensation as required by state law
- Automobile liability insurance: $2,000,000

### Financial
- Annual revenue minimum: $10,000,000
- Bonding capacity: $25,000,000

### Technical
- Minimum 10 years bridge construction experience
- OSHA 10-hour certification for all site personnel
- Current MBE/WBE certification (if applicable)

### Submission
- Technical proposal: 3 copies, spiral-bound
- Price proposal: separate sealed envelope
- Deadline: October 15, 2026, 2:00 PM local time

### Attachments
- Form A: Bidder Qualification Statement
- Form B: Price Schedule
- Form C: Insurance Certificate (current, < 90 days old)

## Evaluation Criteria
- Technical approach (40%)
- Price (35%)
- Experience & references (15%)
- MBE/WBE participation (10%)

## Contact
Procurement Office: procurement@metro.gov
Phone: (555) 123-4567
`,
  links: [
    { url: "https://metro.gov/procurement/bridge-phase2/addendum-1", label: "Addendum 1: Revised Insurance Requirements" },
    { url: "https://metro.gov/procurement/bridge-phase2/addendum-2", label: "Addendum 2: Deadline Extension" },
  ],
  amendmentLinks: [
    { url: "https://metro.gov/procurement/bridge-phase2/addendum-1", label: "Addendum 1" },
  ],
};

/**
 * Fetch a source via Firecrawl or return fixture data.
 *
 * This is an action because it performs external I/O.
 */
export const fetchSource = action({
  args: {
    tenderId: v.id("tenders"),
    sourceUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const mode = sourceMode();

    if (mode === "FIXTURE" || !firecrawlLive()) {
      // Return fixture data.
      return {
        markdown: FIXTURE_TENDER.markdown,
        title: "Bridge Rehabilitation Phase 2 — RFP",
        links: FIXTURE_TENDER.links.map((l) => l.url),
        canonicalUrl: args.sourceUrl,
        isFixture: true,
        firecrawlRunId: undefined,
      };
    }

    // Live Firecrawl fetch.
    const firecrawl = new FirecrawlClient(components.firecrawl);
    const result = await firecrawl.scrape(ctx, args.sourceUrl, {
      formats: ["markdown"],
    });

    return {
      markdown: result.markdown ?? "",
      title: result.metadata?.title ?? undefined,
      links: result.links ?? [],
      canonicalUrl: (result.metadata?.sourceURL as string) ?? args.sourceUrl,
      isFixture: false,
      firecrawlRunId: undefined,
    };
  },
});

/**
 * Process a fetched source: hash, inspect safety, persist source document,
 * and decide whether to create a new revision.
 *
 * This is a mutation because it writes to the database.
 */
export const processSource = mutation({
  args: {
    tenderId: v.id("tenders"),
    markdown: v.string(),
    title: v.optional(v.string()),
    links: v.array(v.string()),
    canonicalUrl: v.optional(v.string()),
    isFixture: v.boolean(),
    firecrawlRunId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tender, workspace } = await requireTender(ctx, args.tenderId);
    const now = Date.now();

    // 1. Safety check.
    const safety = inspectSource(args.canonicalUrl ?? tender.sourceUrl, args.markdown);
    if (!safety.safe) {
      return {
        outcome: "SOURCE_UNAVAILABLE" as const,
        error: safety.reasons.join("; "),
      };
    }

    // 2. Hash.
    const hashes = hashSource(args.markdown);

    // 3. Check idempotency.
    const idk = idempotencyKey({
      kind: "FIRECRAWL_FETCH",
      tenderId: args.tenderId,
      sourceUrl: tender.sourceUrl,
      contentHash: hashes.normalizedSourceHash,
    });

    const existing = await ctx.db
      .query("outboundActions")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", idk))
      .first();

    const decision = decide(existing ?? null);
    if (decision.action === "RETURN_CACHED") {
      return { outcome: "DUPLICATE" as const };
    }
    if (decision.action === "RECONCILE") {
      return { outcome: "RECONCILING" as const };
    }

    // 4. Record the outbound action.
    await ctx.db.insert("outboundActions", {
      workspaceId: workspace._id,
      kind: "FIRECRAWL_FETCH",
      idempotencyKey: idk,
      status: "WORKING",
      attemptCount: 1,
      requestDigest: hashes.contentHash,
      at: now,
    });

    // 5. Persist the source document.
    await ctx.db.insert("sourceDocuments", {
      tenderId: args.tenderId,
      revisionId: tender.currentRevisionId,
      url: tender.sourceUrl,
      canonicalUrl: args.canonicalUrl,
      contentHash: hashes.contentHash,
      normalizedContentHash: hashes.normalizedSourceHash,
      fetchedAt: now,
      sourceType: "web",
      documentTitle: args.title,
      firecrawlRunId: args.firecrawlRunId,
      rawReference: args.markdown.slice(0, 2000),
      markdownLength: args.markdown.length,
      isFixture: args.isFixture,
      mode: sourceMode(),
    });

    // 6. Check if the normalized hash matches the current revision.
    if (tender.currentRevisionId) {
      const currentRev = await ctx.db.get(tender.currentRevisionId);
      if (currentRev && currentRev.normalizedSourceHash === hashes.normalizedSourceHash) {
        // No change — record heartbeat.
        await ctx.db.insert("sourceEvents", {
          tenderId: args.tenderId,
          revisionId: tender.currentRevisionId,
          kind: "HEARTBEAT_UNCHANGED",
          detail: `Content hash unchanged: ${hashes.normalizedSourceHash}`,
          idempotencyKey: idk,
          at: now,
        });

        // Mark the outbound action as completed.
        if (existing) {
          await ctx.db.patch(existing._id, { status: "COMPLETED", completedAt: now });
        }

        await ctx.db.patch(args.tenderId, {
          sourceState: "UNCHANGED",
          lastCheckedAt: now,
          lastVerifiedAt: now,
          updatedAt: now,
        });

        return { outcome: "UNCHANGED" as const };
      }
    }

    // 7. New revision detected — return it for the workflow to process.
    // (The workflow will call revisions.create + revisions.advance.)
    return {
      outcome: "CHANGED" as const,
      contentHash: hashes.contentHash,
      normalizedSourceHash: hashes.normalizedSourceHash,
      markdown: args.markdown,
      title: args.title,
      links: args.links,
      canonicalUrl: args.canonicalUrl,
      isFixture: args.isFixture,
      firecrawlRunId: args.firecrawlRunId,
    };
  },
});

/** Get fixture data for the demo. */
export const getFixture = action({
  args: {},
  handler: async () => {
    return FIXTURE_TENDER;
  },
});

/** List all indexed source documents for a tender. */
export const listDocuments = query({
  args: { tenderId: v.id("tenders") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sourceDocuments")
      .withIndex("by_tender", (q) => q.eq("tenderId", args.tenderId))
      .order("desc")
      .collect();
  },
});

