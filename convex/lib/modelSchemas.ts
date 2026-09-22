import { z } from "zod";

/**
 * Model output schemas.
 *
 * Every model result is schema-validated *before* persistence. Invalid
 * output becomes a controlled failure (a stored error + a manual-review
 * request), never a partial write and never a silent pass.
 *
 * Every schema carries source references and confidence, because a fact the
 * model cannot point at in the source is a fact we refuse to treat as
 * extracted.
 */

const sourceSpan = z.object({
  /** Exact quote (or heading) the fact came from. */
  quote: z.string().min(1),
  /** Section / heading if the model can identify one. */
  section: z.optional(z.string()),
});

export const requirementCategorySchema = z.enum([
  "ELIGIBILITY",
  "TECHNICAL",
  "FINANCIAL",
  "INSURANCE",
  "LEGAL",
  "SUBMISSION",
  "SCHEDULE",
  "EVALUATION",
  "ATTACHMENT",
  "CONTACT",
  "OTHER",
]);

export const extractedRequirement = z.object({
  /** Stable identity across revisions; lower-case category/slug. */
  lineageKey: z.string().min(1).max(200),
  title: z.string().min(1).max(400),
  body: z.optional(z.string().max(4000)),
  category: requirementCategorySchema,
  mandatory: z.boolean(),
  /** A concrete value when one exists: amount, date, count, format. */
  structuredValue: z.optional(z.string().max(400)),
  sourceReference: sourceSpan,
  confidence: z.number().min(0).max(1),
});

/** Role 1 — Extractor. */
export const tenderRequirementExtraction = z.object({
  requirements: z.array(extractedRequirement).max(200),
  buyerName: z.optional(z.string().max(300)),
  deadline: z.optional(z.string().max(100)),
  contactEmail: z.optional(z.string().max(200)),
  /** Links on the page that look like amendments / notices / addenda. */
  amendmentLinks: z.array(z.object({ url: z.string().url(), label: z.string().max(300) })).max(50),
  /** Anything the model could not classify confidently. */
  ambiguous: z.array(z.string().max(400)).max(50),
});
export type TenderRequirementExtraction = z.infer<typeof tenderRequirementExtraction>;

/** Role 2 — Impact analyst. */
export const amendmentImpactAnalysis = z.object({
  changes: z.array(
    z.object({
      lineageKey: z.string().min(1),
      kind: z.enum(["UNCHANGED", "CHANGED", "NEW", "REMOVED", "AMBIGUOUS"]),
      label: z.string().min(1).max(400),
      detail: z.optional(z.string().max(2000)),
      sourceReference: sourceSpan,
      confidence: z.number().min(0).max(1),
    }),
  ).max(200),
  summary: z.string().min(1).max(2000),
});
export type AmendmentImpactAnalysis = z.infer<typeof amendmentImpactAnalysis>;

/** Role 3 — Clarification writer. */
export const clarificationDraft = z.object({
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(8000),
  /** Which requirement this clarification is about, if any. */
  aboutLineageKey: z.optional(z.string().max(200)),
  rationale: z.string().min(1).max(1000),
});
export type ClarificationDraft = z.infer<typeof clarificationDraft>;

/** Role 4 — Reply parser. */
export const buyerReplyParse = z.object({
  facts: z
    .array(
      z.object({
        /** Empty when the fact does not map to one requirement. */
        requirementLineageKey: z.optional(z.string().max(200)),
        fact: z.string().min(1).max(2000),
        confidence: z.number().min(0).max(1),
        /** Did the buyer confirm, deny, or revise something we asked? */
        answersQuestion: z.boolean(),
      }),
    )
    .max(100),
  deadlineClarified: z.optional(z.string().max(100)),
  overallTone: z.enum(["ANSWERING", "PARTIAL", "OUT_OF_OFFICE", "UNRELATED", "REJECTING"]),
  summary: z.string().min(1).max(2000),
});
export type BuyerReplyParse = z.infer<typeof buyerReplyParse>;

/**
 * Validate untrusted model output. Returns a discriminated result so the
 * caller must handle failure explicitly — no throw-and-swallow.
 */
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; issues: string[] };

export function validateModelOutput<T>(
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { issues: Array<{ path: PropertyKey[]; message: string }> } } },
  data: unknown,
): ValidationResult<T> {
  const parsed = schema.safeParse(data);
  if (parsed.success) return { ok: true, value: parsed.data };
  const issues = parsed.error.issues.map(
    (i) => `${i.path.map(String).join(".") || "(root)"}: ${i.message}`,
  );
  return { ok: false, error: "model output failed schema validation", issues };
}

/** JSON extraction: models sometimes wrap JSON in prose or fences. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(trimmed);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("model response did not contain parseable JSON");
  }
}
