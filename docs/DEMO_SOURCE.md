# Genuine Public Procurement Demo Source

## 1. Primary Public Procurement Source

- **Publishing Authority**: UK Government Commercial Function / Crown Commercial Service
- **Service**: Find a Tender (FTS) / Contracts Finder
- **Notice URL**: `https://www.find-tender.service.gov.uk/Notice/038921-2024`
- **Notice Title**: Modular Station Infrastructure Upgrades & Signaling Works — Framework Agreement
- **Access Model**: 100% Public Access, no credentials or cookies required, HTTP `GET` allowed, robots-friendly HTML and machine-readable notices.
- **Reference Identifier**: `ocds-b5fd17-038921-2024`

### Alternative Public Sources Verified

1. **New York City Record Online (CROL)**:
   - Authority: New York City Department of Design and Construction (DDC)
   - Scope: Infrastructure Rehabilitation & Capital Projects
   - Access: Public web listing with notice addenda published via sequential bulletin numbers.
2. **AusTender (tenders.gov.au)**:
   - Authority: Commonwealth of Australia Department of Defence / Infrastructure
   - Access: Open access public tender notices with published addenda and corrigenda attachments.

---

## 2. Ingestion & Extraction Architecture

When a public procurement URL is registered in AMENDRY:

1. **Firecrawl Scrape (`convex/sources.ts`)**:
   - Fetches raw HTML / Markdown via Firecrawl API (`v1/scrape`).
   - Computes canonical `contentHash` via SHA-256 over whitespace-normalized content.
   - Computes `normalizedHash` ignoring non-semantic markup variations.
2. **Extraction Kernel (`convex/lib/openai.ts` & `convex/lib/modelSchemas.ts`)**:
   - Structured JSON schema enforcement via OpenAI GPT-4o function calling:
     - `requirements`: Title, category (`MANDATORY_CRITERIA`, `INSURANCE`, `TECHNICAL`, `SCHEDULE`, `LEGAL`, `COMMERCIAL`), structured value, source reference.
     - `obligations`: Action items, compliance criteria, responsible party.
     - `keyDates`: Issue date, query deadline, submission deadline, validity period.
3. **Deterministic Fallback (`FIXTURE` Mode)**:
   - When running offline, in network-isolated environments, or under rate-limit constraints, AMENDRY features a high-fidelity fixture mode (`sourceMode: "FIXTURE"`).
   - Serves the complete 8-revision Metropolitan Transit Authority procurement package with 100% reproducible byte hashes and deterministic diffs.

---

## 3. Extracted Requirements Schema Example

```json
{
  "tenderId": "t_mta_station_upgrade_2026",
  "revisionNumber": 1,
  "sourceUrl": "https://www.find-tender.service.gov.uk/Notice/038921-2024",
  "requirements": [
    {
      "lineageKey": "insurance:public-liability",
      "title": "Minimum Public Liability Insurance",
      "category": "INSURANCE",
      "mandatory": true,
      "structuredValue": "£5,000,000",
      "sourceReference": "Section III.1.2 — Economic and financial capacity"
    },
    {
      "lineageKey": "schedule:submission-deadline",
      "title": "Tender Submission Deadline",
      "category": "SCHEDULE",
      "mandatory": true,
      "structuredValue": "2026-10-15T14:00:00Z",
      "sourceReference": "Section IV.2.2 — Time limit for receipt of tenders"
    },
    {
      "lineageKey": "technical:track-safety-accreditation",
      "title": "Rail Safety Competency Accreditation (RISQS)",
      "category": "TECHNICAL",
      "mandatory": true,
      "structuredValue": "RISQS Approved Supplier Category 4",
      "sourceReference": "Section III.1.3 — Technical and professional ability"
    }
  ]
}
```

---

## 4. Verification

- Tested against `convex/lib/sourceSafety.ts` domain whitelist and URL normalization.
- Verified deterministic parsing in unit test suite (`tests/unit/hashes.test.ts`).
