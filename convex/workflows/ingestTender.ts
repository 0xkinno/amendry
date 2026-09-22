import { v } from "convex/values";
import { action, type ActionCtx } from "../_generated/server";
import { api } from "../_generated/api";
import { idempotencyKey, stageKey } from "../lib/idempotency";
import { hashSource } from "../lib/hashes";
import { diffRequirements } from "../lib/revisionDiff";
import type { RequirementStateKind } from "../lib/readinessKernel";
import type { Doc } from "../_generated/dataModel";
import {
  getOpenAI,
  requireParsed,
  SYSTEM_GUARDRAILS,
  wrapUntrusted,
  MODELS,
  withModelFallback,
  describeOpenAIError,
} from "../lib/openai";
import { tenderRequirementExtraction, validateModelOutput, extractJson } from "../lib/modelSchemas";
import { limitOrThrow } from "../lib/rateLimit";
import { components } from "../_generated/api";

/**
 * P5.1 — Ingest workflow.
 *
 *   FETCH -> NORMALIZE -> EXTRACT -> DIFF -> IMPACT -> INVALIDATE -> REVIEW -> PACKAGE
 *
 * Each external step is idempotent. A replayed workflow step that finds a
 * COMPLETED receipt returns the previous result. A WORKING receipt triggers
 * reconciliation rather than a duplicate call.
 */

export const ingestTender = action({
  args: {
    tenderId: v.id("tenders"),
  },
  handler: async (ctx, args) => {
    const tender = await ctx.runQuery(api.tenders.get, { tenderId: args.tenderId });
    if (!tender) throw new Error("Tender not found.");

    const now = Date.now();
    const workflowKey = stageKey(args.tenderId, tender.currentRevisionId ?? "none", "INGEST");

    // Record workflow start.
    const workflowId = await ctx.runMutation(api.ingest.recordWorkflowStart, {
      tenderId: args.tenderId,
      kind: "INGEST",
    });

    try {
      // ── STAGE 1: FETCH ──────────────────────────────────────────────
      const fetchResult = await ctx.runAction(api.sources.fetchSource, {
        tenderId: args.tenderId,
        sourceUrl: tender.sourceUrl,
      });

      if (!fetchResult.markdown) {
        await ctx.runMutation(api.ingest.recordWorkflowFailed, {
          workflowId,
          error: "Fetch returned no content.",
        });
        return { outcome: "FAILED" as const, error: "Fetch returned no content." };
      }

      // ── STAGE 2: NORMALIZE + HASH ─────────────────────────────────
      const hashes = hashSource(fetchResult.markdown);

      // ── STAGE 3: CHECK FOR UNCHANGED ─────────────────────────────
      const processResult = await ctx.runMutation(api.sources.processSource, {
        tenderId: args.tenderId,
        markdown: fetchResult.markdown,
        title: fetchResult.title,
        links: fetchResult.links,
        canonicalUrl: fetchResult.canonicalUrl,
        isFixture: fetchResult.isFixture,
        firecrawlRunId: fetchResult.firecrawlRunId,
      });

      if (processResult.outcome === "UNCHANGED") {
        await ctx.runMutation(api.ingest.recordWorkflowCompleted, {
          workflowId,
          stage: "DONE",
        });
        return { outcome: "UNCHANGED" as const };
      }

      if (processResult.outcome === "DUPLICATE") {
        await ctx.runMutation(api.ingest.recordWorkflowCompleted, {
          workflowId,
          stage: "DONE",
        });
        return { outcome: "DUPLICATE" as const };
      }

      if (processResult.outcome === "SOURCE_UNAVAILABLE") {
        await ctx.runMutation(api.revisions.markSourceUnavailable, {
          tenderId: args.tenderId,
          error: processResult.error ?? "Source unavailable.",
        });
        await ctx.runMutation(api.ingest.recordWorkflowFailed, {
          workflowId,
          error: processResult.error ?? "Source unavailable.",
        });
        return { outcome: "SOURCE_UNAVAILABLE" as const };
      }

      // ── STAGE 4: EXTRACT REQUIREMENTS ───────────────────────────
      const extracted = await extractRequirements(
        ctx,
        fetchResult.markdown,
        fetchResult.isFixture,
      );

      // ── STAGE 5: CREATE NEW REVISION ────────────────────────────
      const currentRev = tender.currentRevisionId
        ? await ctx.runQuery(api.revisions.get, { revisionId: tender.currentRevisionId })
        : null;
      const nextRevisionNumber = (currentRev?.revisionNumber ?? 0) + 1;

      const newRevisionId = await ctx.runMutation(api.revisions.create, {
        tenderId: args.tenderId,
        revisionNumber: nextRevisionNumber,
        kind: currentRev ? "AMENDMENT" : "INITIAL",
        contentHash: hashes.contentHash,
        normalizedSourceHash: hashes.normalizedSourceHash,
        sourceUrl: tender.sourceUrl,
        canonicalUrl: fetchResult.canonicalUrl,
        documentTitle: fetchResult.title,
        firecrawlRunId: fetchResult.firecrawlRunId,
        links: fetchResult.links,
        supersedesRevisionId: currentRev?._id,
        isFixture: fetchResult.isFixture,
      });

      // ── STAGE 6: UPSERT REQUIREMENTS ───────────────────────────
      if (extracted.length > 0) {
        await ctx.runMutation(api.requirements.upsertBatch, {
          tenderId: args.tenderId,
          revisionId: newRevisionId,
          requirements: extracted,
        });
      }

      // ── STAGE 7: DIFF (if there was a previous revision) ────────
      let changeCount = 0;
      if (currentRev) {
        const oldReqs: Array<Doc<"requirements">> = await ctx.runQuery(api.requirements.listByRevision, {
          revisionId: currentRev._id,
        });
        const newReqs = extracted.map((r) => ({
          lineageKey: r.lineageKey,
          title: r.title,
          body: r.body,
          structuredValue: r.structuredValue,
          mandatory: r.mandatory,
          status: "UNKNOWN" as const,
        }));

        const diff = diffRequirements(
          oldReqs.map((r) => ({
            lineageKey: r.lineageKey,
            title: r.title,
            body: r.body ?? undefined,
            structuredValue: r.structuredValue ?? undefined,
            mandatory: r.mandatory,
            status: r.status as RequirementStateKind,
          })),
          newReqs,
        );

        changeCount = diff.changes.length;

        // ── STAGE 8: IMPACT + INVALIDATE ─────────────────────────
        if (diff.changes.length > 0) {
          // Create amendment record.
          await ctx.runMutation(api.amendments.create, {
            tenderId: args.tenderId,
            revisionId: newRevisionId,
            supersedesRevisionId: currentRev._id,
            summary: `Amendment: ${diff.changedCount} changed, ${diff.addedCount} added, ${diff.removedCount} removed.`,
            impact: diff.changes.map((c) => ({
              kind: c.outcome,
              lineageKey: c.lineageKey,
              label: `${c.outcome}: ${c.after?.title ?? c.before?.title ?? c.lineageKey}`,
              detail: c.fields.map((f) => `${f.field}: ${f.before ?? "?"} -> ${f.after ?? "?"}`).join("; "),
            })),
            invalidationCount: diff.changes.filter(
              (c) => c.outcome !== "UNCHANGED",
            ).length,
          });

          // Invalidate affected requirements on the old revision.
          const affectedReqs = oldReqs.filter((r) =>
            diff.changes.some(
              (c) =>
                c.lineageKey === r.lineageKey &&
                c.outcome !== "UNCHANGED" &&
                c.outcome !== "REMOVED",
            ),
          );
          if (affectedReqs.length > 0) {
            await ctx.runMutation(api.requirements.invalidate, {
              tenderId: args.tenderId,
              requirementIds: affectedReqs.map((r) => r._id),
              reason: "Requirement changed in new revision.",
            });
          }

          // Supersede old requirements.
          await ctx.runMutation(api.requirements.supersedeRevision, {
            tenderId: args.tenderId,
            revisionId: currentRev._id,
          });
        }
      }

      // ── STAGE 9: ADVANCE REVISION ─────────────────────────────
      await ctx.runMutation(api.revisions.advance, {
        tenderId: args.tenderId,
        newRevisionId,
        changeSummary: currentRev
          ? `Amendment detected: revision ${nextRevisionNumber}`
          : `Initial revision: revision ${nextRevisionNumber}`,
      });

      // ── STAGE 10: TRANSITION TENDER STATUS ────────────────────
      await ctx.runMutation(api.ingest.completeIngest, {
        tenderId: args.tenderId,
      });

      await ctx.runMutation(api.ingest.recordWorkflowCompleted, {
        workflowId,
        stage: "DONE",
      });

      return {
        outcome: "PROCESSED" as const,
        revisionNumber: nextRevisionNumber,
        requirementCount: extracted.length,
        changeCount,
      };
    } catch (e) {
      const error = describeOpenAIError(e);
      await ctx.runMutation(api.ingest.recordWorkflowFailed, {
        workflowId,
        error,
      });
      return { outcome: "FAILED" as const, error };
    }
  },
});

/**
 * Extract requirements from source markdown using OpenAI.
 * Returns validated structured requirements, or an empty array on failure.
 */
async function extractRequirements(
  _ctx: ActionCtx,
  markdown: string,
  isFixture: boolean,
): Promise<
  Array<{
    lineageKey: string;
    title: string;
    body?: string;
    category: string;
    mandatory: boolean;
    structuredValue?: string;
    sourceReference?: string;
    confidence?: number;
  }>
> {
  const openai = getOpenAI();
  if (!openai || isFixture) {
    // FIXTURE mode: return deterministic demo requirements.
    return FIXTURE_REQUIREMENTS;
  }

  try {
    const { result: rawText } = await withModelFallback(
      MODELS.extract,
      MODELS.fallback,
      async (model) => {
        const res = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content:
                SYSTEM_GUARDRAILS +
                "\nExtract all requirements from the tender. You must respond with a valid JSON object matching the schema: { requirements: Array<{ lineageKey, title, body?, category, mandatory, structuredValue?, sourceReference: { quote, section? }, confidence }>, amendmentLinks: Array<{ url, label }>, ambiguous: Array<string> }",
            },
            {
              role: "user",
              content: `Extract all requirements from this tender document:\n\n${wrapUntrusted(markdown)}`,
            },
          ],
          response_format: { type: "json_object" },
        });
        return res.choices[0]?.message?.content ?? "{}";
      },
    );

    const parsedJson = extractJson(rawText);
    const validated = validateModelOutput(tenderRequirementExtraction, parsedJson);
    if (!validated.ok) {
      console.error("Extraction validation failed:", validated.issues);
      return [];
    }

    return validated.value.requirements.map((r) => ({
      lineageKey: r.lineageKey,
      title: r.title,
      body: r.body,
      category: r.category,
      mandatory: r.mandatory,
      structuredValue: r.structuredValue,
      sourceReference: r.sourceReference.quote,
      confidence: r.confidence,
    }));
  } catch (e) {
    console.error("Extraction failed:", describeOpenAIError(e));
    return [];
  }
}

/** Fixture requirements for the demo tender. */
const FIXTURE_REQUIREMENTS = [
  {
    lineageKey: "insurance:public-liability",
    title: "Minimum $5,000,000 public liability insurance",
    body: "Contractor must carry public liability insurance with a minimum coverage of $5,000,000 per occurrence.",
    category: "INSURANCE",
    mandatory: true,
    structuredValue: "$5,000,000",
    sourceReference: "Insurance section",
    confidence: 1.0,
  },
  {
    lineageKey: "insurance:workers-comp",
    title: "Workers' compensation as required by state law",
    body: "Contractor must carry workers' compensation insurance as required by state law.",
    category: "INSURANCE",
    mandatory: true,
    structuredValue: "As required by state law",
    sourceReference: "Insurance section",
    confidence: 1.0,
  },
  {
    lineageKey: "insurance:auto-liability",
    title: "Automobile liability insurance: $2,000,000",
    body: "Contractor must carry automobile liability insurance with a minimum coverage of $2,000,000.",
    category: "INSURANCE",
    mandatory: true,
    structuredValue: "$2,000,000",
    sourceReference: "Insurance section",
    confidence: 1.0,
  },
  {
    lineageKey: "financial:revenue-minimum",
    title: "Annual revenue minimum: $10,000,000",
    body: "Contractor must demonstrate annual revenue of at least $10,000,000.",
    category: "FINANCIAL",
    mandatory: true,
    structuredValue: "$10,000,000",
    sourceReference: "Financial section",
    confidence: 1.0,
  },
  {
    lineageKey: "financial:bonding-capacity",
    title: "Bonding capacity: $25,000,000",
    body: "Contractor must have bonding capacity of at least $25,000,000.",
    category: "FINANCIAL",
    mandatory: true,
    structuredValue: "$25,000,000",
    sourceReference: "Financial section",
    confidence: 1.0,
  },
  {
    lineageKey: "technical:bridge-experience",
    title: "Minimum 10 years bridge construction experience",
    body: "Contractor must have a minimum of 10 years of bridge construction experience.",
    category: "TECHNICAL",
    mandatory: true,
    structuredValue: "10 years",
    sourceReference: "Technical section",
    confidence: 1.0,
  },
  {
    lineageKey: "technical:osha-cert",
    title: "OSHA 10-hour certification for all site personnel",
    body: "All site personnel must have OSHA 10-hour certification.",
    category: "TECHNICAL",
    mandatory: true,
    structuredValue: "OSHA 10-hour",
    sourceReference: "Technical section",
    confidence: 1.0,
  },
  {
    lineageKey: "technical:mbe-wbe",
    title: "Current MBE/WBE certification (if applicable)",
    body: "Contractor must have current MBE/WBE certification if applicable.",
    category: "TECHNICAL",
    mandatory: false,
    sourceReference: "Technical section",
    confidence: 0.9,
  },
  {
    lineageKey: "submission:technical-proposal",
    title: "Technical proposal: 3 copies, spiral-bound",
    body: "Submit technical proposal in 3 copies, spiral-bound.",
    category: "SUBMISSION",
    mandatory: true,
    structuredValue: "3 copies, spiral-bound",
    sourceReference: "Submission section",
    confidence: 1.0,
  },
  {
    lineageKey: "submission:price-proposal",
    title: "Price proposal: separate sealed envelope",
    body: "Submit price proposal in a separate sealed envelope.",
    category: "SUBMISSION",
    mandatory: true,
    structuredValue: "Separate sealed envelope",
    sourceReference: "Submission section",
    confidence: 1.0,
  },
  {
    lineageKey: "schedule:deadline",
    title: "Deadline: October 15, 2026, 2:00 PM local time",
    body: "Proposals must be submitted by October 15, 2026, 2:00 PM local time.",
    category: "SCHEDULE",
    mandatory: true,
    structuredValue: "October 15, 2026, 2:00 PM",
    sourceReference: "Submission section",
    confidence: 1.0,
  },
  {
    lineageKey: "attachment:form-a",
    title: "Form A: Bidder Qualification Statement",
    body: "Include Form A: Bidder Qualification Statement.",
    category: "ATTACHMENT",
    mandatory: true,
    structuredValue: "Form A",
    sourceReference: "Attachments section",
    confidence: 1.0,
  },
  {
    lineageKey: "attachment:form-b",
    title: "Form B: Price Schedule",
    body: "Include Form B: Price Schedule.",
    category: "ATTACHMENT",
    mandatory: true,
    structuredValue: "Form B",
    sourceReference: "Attachments section",
    confidence: 1.0,
  },
  {
    lineageKey: "attachment:form-c",
    title: "Form C: Insurance Certificate (current, < 90 days old)",
    body: "Include Form C: Insurance Certificate, current and less than 90 days old.",
    category: "ATTACHMENT",
    mandatory: true,
    structuredValue: "Form C, < 90 days old",
    sourceReference: "Attachments section",
    confidence: 1.0,
  },
  {
    lineageKey: "evaluation:technical-approach",
    title: "Technical approach (40% evaluation weight)",
    body: "Technical approach will be evaluated at 40% weight.",
    category: "EVALUATION",
    mandatory: false,
    structuredValue: "40%",
    sourceReference: "Evaluation section",
    confidence: 1.0,
  },
  {
    lineageKey: "evaluation:price",
    title: "Price (35% evaluation weight)",
    body: "Price will be evaluated at 35% weight.",
    category: "EVALUATION",
    mandatory: false,
    structuredValue: "35%",
    sourceReference: "Evaluation section",
    confidence: 1.0,
  },
  {
    lineageKey: "evaluation:experience",
    title: "Experience & references (15% evaluation weight)",
    body: "Experience and references will be evaluated at 15% weight.",
    category: "EVALUATION",
    mandatory: false,
    structuredValue: "15%",
    sourceReference: "Evaluation section",
    confidence: 1.0,
  },
  {
    lineageKey: "evaluation:mbe-wbe-participation",
    title: "MBE/WBE participation (10% evaluation weight)",
    body: "MBE/WBE participation will be evaluated at 10% weight.",
    category: "EVALUATION",
    mandatory: false,
    structuredValue: "10%",
    sourceReference: "Evaluation section",
    confidence: 1.0,
  },
];
