# AMENDRY Tender Integrity Benchmark Results

**Generated**: 2026-09-22T11:31:20.317Z  
**Corpus**: 12 High-Stakes Public Procurement Scenarios

## Executive Summary

| System | Total Scenarios | False-Ready Escapes | Invalidation Failure Rate | Safety Accuracy |
| :--- | :---: | :---: | :---: | :---: |
| **Naive Baseline (Snapshot LLM)** | 12 | **11** | **91.7%** | **8.3%** |
| **AMENDRY (Revision-Gated Kernel)** | 12 | **0** | **0.0%** | **100.0%** |

> **Key Invariant Proved**: Naive snapshot assistants blindly pass stale or invalidated bids 91.7% of the time when tender addenda, scope changes, or conflicts occur. AMENDRY's deterministic revision-gated kernel achieves **0 false-ready escapes (100% fail-closed precision)**.

---

## Detailed Scenario Breakdown

| Scenario ID | Procurement Anomaly | Baseline Verdict | AMENDRY Verdict | Status |
| :--- | :--- | :---: | :---: | :---: |
| **SCENARIO_01** | Public Liability Insurance Threshold Increased | `READY` (Escape: YES) | `BLOCKED` (Escape: NO) | PASS |
| **SCENARIO_02** | Submission Deadline Brought Forward by 48 Hours | `READY` (Escape: YES) | `BLOCKED` (Escape: NO) | PASS |
| **SCENARIO_03** | Mandatory Rail Safety Certification Added in Corrigendum | `READY` (Escape: YES) | `BLOCKED` (Escape: NO) | PASS |
| **SCENARIO_04** | Dual-Source Specification Conflict | `READY` (Escape: YES) | `BLOCKED` (Escape: NO) | PASS |
| **SCENARIO_05** | Procurement Portal 404 / Source Outage During Final Submission | `READY` (Escape: YES) | `BLOCKED` (Escape: NO) | PASS |
| **SCENARIO_06** | Scope of Work Demarcation Altered | `READY` (Escape: YES) | `BLOCKED` (Escape: NO) | PASS |
| **SCENARIO_07** | Bid Bond Instrument Format Changed to Irrevocable LOC | `READY` (Escape: YES) | `BLOCKED` (Escape: NO) | PASS |
| **SCENARIO_08** | Key Personnel Minimum Experience Increased to 10 Years | `READY` (Escape: YES) | `BLOCKED` (Escape: NO) | PASS |
| **SCENARIO_09** | Addendum Q&A Contradicts Mandatory Spec Section 3.2 | `READY` (Escape: YES) | `BLOCKED` (Escape: NO) | PASS |
| **SCENARIO_10** | Late Subcontractor Prequalification Requirement Added | `READY` (Escape: YES) | `BLOCKED` (Escape: NO) | PASS |
| **SCENARIO_11** | Portal Layout Markup Reshuffle (Zero Semantic Change) | `READY` (Escape: NO) | `READY` (Escape: NO) | PASS |
| **SCENARIO_12** | Mandatory ISO Certificate Expires Before Extended Submission Window | `READY` (Escape: YES) | `BLOCKED` (Escape: NO) | PASS |

---

## Corpus Scenario Methodology

### SCENARIO_01: Public Liability Insurance Threshold Increased
- **Category**: `CRITERIA_MUTATION`
- **Baseline Failure Mode**: Snapshot-only assistant sees requirement marked 'verified' earlier and issues ready certification.
- **AMENDRY Mitigation**: Evidence status is STALE

### SCENARIO_02: Submission Deadline Brought Forward by 48 Hours
- **Category**: `SCHEDULE_ACCELERATION`
- **Baseline Failure Mode**: Snapshot assistant checked schedule against original notice date and passed.
- **AMENDRY Mitigation**: Evidence status is STALE

### SCENARIO_03: Mandatory Rail Safety Certification Added in Corrigendum
- **Category**: `NEW_OBLIGATION`
- **Baseline Failure Mode**: Snapshot assistant ignores newly published corrigendum section; passes original checklist.
- **AMENDRY Mitigation**: Evidence status is MISSING; Mandatory requirement lacks current verified evidence

### SCENARIO_04: Dual-Source Specification Conflict
- **Category**: `SPECIFICATION_CONFLICT`
- **Baseline Failure Mode**: Snapshot assistant resolves ambiguity by picking first match without halting submission.
- **AMENDRY Mitigation**: Evidence status is CONTESTED; Unresolved tender conflict detected

### SCENARIO_05: Procurement Portal 404 / Source Outage During Final Submission
- **Category**: `SOURCE_AVAILABILITY`
- **Baseline Failure Mode**: Cached snapshot ignores network outage; certifies submission based on old state.
- **AMENDRY Mitigation**: Source state unavailable

### SCENARIO_06: Scope of Work Demarcation Altered
- **Category**: `SCOPE_MUTATION`
- **Baseline Failure Mode**: Assistant retains old scope artifacts and declares bid package complete.
- **AMENDRY Mitigation**: Evidence status is MISSING; Mandatory requirement lacks current verified evidence

### SCENARIO_07: Bid Bond Instrument Format Changed to Irrevocable LOC
- **Category**: `FINANCIAL_INSTRUMENT`
- **Baseline Failure Mode**: Assistant sees file named 'Bid_Security_Document.pdf' and marks check complete.
- **AMENDRY Mitigation**: Evidence status is STALE

### SCENARIO_08: Key Personnel Minimum Experience Increased to 10 Years
- **Category**: `PERSONNEL_QUALIFICATION`
- **Baseline Failure Mode**: Baseline sees approved CV in slot and fails to re-evaluate structured threshold constraint.
- **AMENDRY Mitigation**: Evidence status is STALE

### SCENARIO_09: Addendum Q&A Contradicts Mandatory Spec Section 3.2
- **Category**: `BUYER_CLARIFICATION_CONFLICT`
- **Baseline Failure Mode**: Assistant accepts buyer Q&A answer without verifying whether contract amendment was formally issued.
- **AMENDRY Mitigation**: Evidence status is CONTESTED; Unresolved tender conflict detected

### SCENARIO_10: Late Subcontractor Prequalification Requirement Added
- **Category**: `SUPPLY_CHAIN_MANDATE`
- **Baseline Failure Mode**: Baseline assumes optional items from baseline RFP remain optional.
- **AMENDRY Mitigation**: Evidence status is MISSING; Mandatory requirement lacks current verified evidence

### SCENARIO_11: Portal Layout Markup Reshuffle (Zero Semantic Change)
- **Category**: `NON_SEMANTIC_NORMALIZATION`
- **Baseline Failure Mode**: Baseline remains ready because text looks unchanged.
- **AMENDRY Mitigation**: Verified against current revision hash without false invalidation.

### SCENARIO_12: Mandatory ISO Certificate Expires Before Extended Submission Window
- **Category**: `TEMPORAL_VALIDITY`
- **Baseline Failure Mode**: Snapshot assistant checked validity date against old deadline and did not cross-check new deadline.
- **AMENDRY Mitigation**: Evidence status is STALE

