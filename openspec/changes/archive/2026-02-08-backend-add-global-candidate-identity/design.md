## Context
The business model requires candidates to be semi-individual: linked to organisations for specific screenings but maintaining a persistent identity so prior screening data can be reused across employers with consent. This is a cross-cutting change affecting candidate management, consent, auth, and both client surfaces.

## Goals / Non-Goals
- **Goals:**
  - Establish a single, email-verified global identity per candidate.
  - Allow one candidate to be linked to multiple organisations simultaneously.
  - Preserve per-org status tracking (pending/certified/archived per tenant).
  - Enable consent-based data reuse where Organisation B can request to reuse data originally collected by Organisation A, subject to the candidate's consent.
  - Maintain backward compatibility for existing single-tenant flows.
- **Non-Goals:**
  - Merging duplicate candidate records (deduplication tooling is a future enhancement).
  - Allowing organisations to see each other's existence — cross-tenant data is invisible without consent.
  - Changing the existing form-builder or pipeline models.

## Decisions
- **Decision:** Introduce `GlobalCandidate` as a first-class entity separate from `ManagedCandidate`.
  - *Alternatives:* Making `ManagedCandidate` the global record and using a join table for tenants — rejected because it conflates per-org state (certified/archived) with global identity.
- **Decision:** `CandidateOrgAssignment` tracks the relationship between a global candidate and each tenant, with per-org status and metadata.
  - *Alternatives:* Array of `tenantIds` on the global record — rejected because per-org state (status, certified dates) would be lost.
- **Decision:** Cross-tenant consent uses a `sourceOrgId` / `targetOrgId` pair on `ConsentDecision` to track which org's data is being reused for which target.
  - *Alternatives:* Global consent (one consent covers all orgs) — rejected because it doesn't give candidates granular control.

## Data Model
```
GlobalCandidate {
  id: UUID
  email: string (unique, verified)
  emailVerifiedAt?: Date
  firstName: string
  lastName: string
  phone?: string
  profileData?: Record<string, unknown>  // shared baseline data
  createdAt, updatedAt
}

CandidateOrgAssignment {
  id: UUID
  globalCandidateId: UUID → GlobalCandidate.id
  tenantId: UUID → Organization.id
  status: 'pending' | 'in_review' | 'certified' | 'rejected' | 'archived'
  role: 'candidate'  // future: could support 'alumni', 'contractor'
  assignedAt: Date
  certifiedAt?: Date
  archivedAt?: Date
  metadata?: Record<string, unknown>  // org-specific notes
}

// Existing ManagedCandidate gains:
ManagedCandidate.globalCandidateId: UUID → GlobalCandidate.id

// Existing ConsentDecision gains:
ConsentDecision.sourceOrgId: UUID   // org that originally collected the data
ConsentDecision.targetOrgId: UUID   // org requesting to reuse the data
```

## Risks / Trade-offs
- **Migration:** Existing `ManagedCandidate` records need a `globalCandidateId` backfill: create `GlobalCandidate` records from existing data, grouped by email.
- **Email uniqueness:** Global email uniqueness means candidates can't sign up with different emails for different employers — this is intentional for identity continuity.
- **Privacy:** Cross-tenant data sharing is strictly consent-gated. The system must never expose the existence of other org assignments without explicit consent.

## Migration Plan
1. Create `GlobalCandidate` table.
2. Run migration: for each unique email in `ManagedCandidate`, create a `GlobalCandidate`; backfill `globalCandidateId`.
3. Create `CandidateOrgAssignment` table; populate from existing `ManagedCandidate` records.
4. Add `sourceOrgId` / `targetOrgId` columns to `ConsentDecision` (nullable initially, then required for new records).

## Open Questions
- Should candidates manage their global profile from the app, or only from a web self-service portal?
- How should identity conflicts be handled if two orgs independently created a candidate with the same email but different names?
