# Change: Add global candidate identity for cross-org reuse

## Why
Candidates are currently created per-tenant — a candidate screened by Company A is a separate record from the same person at Company B. This prevents data reuse across organisations. The consent model already supports scope-based reuse, but lacks a cross-tenant identity to connect consent decisions. A global candidate identity enables the "screen once, reuse for future companies" model that is core to the business.

## What Changes
- Add a `GlobalCandidate` entity keyed by verified email, decoupled from any single tenant.
- Add a `CandidateOrgAssignment` linking table: one global candidate → many tenant-scoped relationships.
- Refactor `ManagedCandidate` to reference `globalCandidateId` while preserving per-tenant status and metadata.
- Extend the consent model to support cross-tenant consent decisions (source org → target org).
- Update candidate creation flows to check for existing global identity and prompt for data reuse consent.
- Update the app sign-in to resolve the global identity and show all org assignments.

## Impact
- Affected specs: (new) `global-candidate-identity`, (modified) `app-consent-reuse`
- Affected code: backend candidate, consent, and auth models/services; app auth and application flows; frontend candidate management views
- **BREAKING**: `ManagedCandidate` gains a required `globalCandidateId` field (migration needed for existing records)
