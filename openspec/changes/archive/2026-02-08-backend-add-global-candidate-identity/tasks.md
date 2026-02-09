## 1. Backend — Global Identity Models
- [x] 1.1 Define `GlobalCandidate` model and Zod schemas
- [x] 1.2 Define `CandidateOrgAssignment` model and Zod schemas
- [x] 1.3 Add shared types in `shared/@types/candidate-identity.types.ts`
- [x] 1.4 Extend `ManagedCandidate` with `globalCandidateId` field
- [x] 1.5 Extend `ConsentDecision` with `sourceOrgId` and `targetOrgId`

## 2. Backend — Repository & Service
- [x] 2.1 Create `global-candidate.repository.ts` with CRUD and email lookup
- [x] 2.2 Create `candidate-org-assignment.repository.ts` for linking
- [x] 2.3 Update `candidate-management.service.ts` to create/resolve global identity on candidate creation
- [x] 2.4 Update `app-consent.service.ts` to support cross-tenant consent decisions
- [x] 2.5 Add data reuse resolution: lookup prior data from source org when consent is granted

## 3. Backend — Routes & Controllers
- [x] 3.1 Add global candidate lookup endpoint (by email, for internal use)
- [x] 3.2 Add candidate org-assignment endpoints (list orgs for a candidate)
- [x] 3.3 Update consent endpoints to accept sourceOrgId/targetOrgId

## 4. Backend — Migration
- [x] 4.1 Write migration to create `GlobalCandidate` table
- [x] 4.2 Write migration to backfill `globalCandidateId` from existing candidates
- [x] 4.3 Write migration to create `CandidateOrgAssignment` table
- [x] 4.4 Write migration to add `sourceOrgId`/`targetOrgId` to consent

## 5. Backend — Tests
- [x] 5.1 Unit tests for global candidate resolution (new candidate, existing email)
- [x] 5.2 Unit tests for cross-tenant consent grant and data reuse check
- [x] 5.3 Integration tests for candidate creation with global identity

## 6. App — Multi-Org Support
- [ ] 6.1 Update app auth to resolve global identity and show org switcher
- [ ] 6.2 Update application list to filter by current org context
- [ ] 6.3 Update consent prompt to show cross-org reuse options

## 7. Frontend — Candidate Management Updates
- [ ] 7.1 Show global identity info on candidate detail view
- [ ] 7.2 Show cross-org screening history (with consent) on candidate detail view
- [ ] 7.3 Link candidate creation flow to global identity resolution
