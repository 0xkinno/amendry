/**
 * P7.1 — Demo buyer mailbox (clearly labelled, scripted variants,
 * real AgentMail send + webhook).
 *
 * The demo buyer is a controlled counterparty that responds to
 * clarification emails with scripted answers. It is clearly
 * labelled as a demo in the UI.
 */

/** Scripted reply variants for the demo buyer. */
export const DEMO_REPLIES = {
  insuranceConfirmation: {
    subject: "Re: Insurance Threshold Confirmation",
    body: `Dear Contractor,

Thank you for your clarification request regarding the insurance threshold.

Yes, the revised tender requires $5,000,000 public liability cover. This is mandatory for all bidders.

The previous $2,000,000 threshold is no longer valid. Please ensure your insurance certificate reflects the new requirement.

Additionally, please note that the submission deadline has been extended to October 15, 2026.

Regards,
Procurement Office
Metropolitan Public Works`,
    facts: [
      { requirementLineageKey: "insurance:public-liability", fact: "Buyer confirms $5M public liability insurance is mandatory.", confidence: 1.0 },
      { requirementLineageKey: "schedule:deadline", fact: "Submission deadline extended to October 15, 2026.", confidence: 1.0 },
      { requirementLineageKey: "attachment:form-c", fact: "Insurance certificate must reflect new $5M requirement.", confidence: 0.95 },
    ],
  },
  deadlineExtension: {
    subject: "Re: Deadline Extension Request",
    body: `Dear Contractor,

We have received your request for a deadline extension.

The submission deadline has been extended from October 1 to October 15, 2026, 2:00 PM local time.

No other changes to the tender requirements at this time.

Regards,
Procurement Office`,
    facts: [
      { requirementLineageKey: "schedule:deadline", fact: "Deadline extended to October 15, 2026, 2:00 PM.", confidence: 1.0 },
    ],
  },
  outOfOffice: {
    subject: "Out of Office",
    body: `I am out of office until next Monday. I will respond to your email upon my return.

Procurement Office`,
    facts: [],
  },
} as const;

export type DemoReplyVariant = keyof typeof DEMO_REPLIES;

/**
 * Get a demo reply by variant name.
 * Clearly labelled as DEMO data.
 */
export function getDemoReply(variant: DemoReplyVariant) {
  return DEMO_REPLIES[variant];
}
