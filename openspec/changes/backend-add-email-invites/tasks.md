## 1. Dependencies and Configuration
- [ ] 1.1 Install `postmark` npm package in backend workspace
- [ ] 1.2 Add email config to `backend/src/config/index.ts`
- [ ] 1.3 Add `POSTMARK_SERVER_TOKEN` to `.env.example` with placeholder value
- [ ] 1.4 Add Postmark config validation (fail fast in production if token missing)

## 2. Email Module — Domain Layer
- [ ] 2.1 Create `backend/src/modules/email/domain/ports/EmailPort.ts`
- [ ] 2.2 Create `backend/src/modules/email/domain/entities/InviteToken.ts`
- [ ] 2.3 Create `backend/src/modules/email/domain/types/email-types.ts`

## 3. Email Module — Application Layer
- [ ] 3.1 Create `SendOrgMemberInviteUseCase`
- [ ] 3.2 Create `SendCandidateInviteUseCase`
- [ ] 3.3 Create `VerifyInviteTokenUseCase`
- [ ] 3.4 Create `AcceptInviteUseCase`

## 4. Email Module — Infrastructure Layer
- [ ] 4.1 Create `PostmarkEmailAdapter` implementing `EmailPort`
- [ ] 4.2 Create `InviteTokenRepository`
- [ ] 4.3 Create `NoOpEmailAdapter`
- [ ] 4.4 Create invite token database migration

## 5. Email Module — Interface Layer
- [ ] 5.1 Create invite controller
- [ ] 5.2 Create invite routes
- [ ] 5.3 Create request validators

## 6. Email Module — Composition Root
- [ ] 6.1 Create `backend/src/modules/email/index.ts` with `createEmailModule()`
- [ ] 6.2 Register email module routes in `backend/src/routes/index.ts`

## 7. Integration with Existing Modules
- [ ] 7.1 Wire `SendOrgMemberInviteUseCase` into org-management
- [ ] 7.2 Wire `SendCandidateInviteUseCase` into candidate-management
- [ ] 7.3 Add invite audit logging

## 8. Tests
- [ ] 8.1 Unit tests for `InviteToken` entity
- [ ] 8.2 Unit tests for all use cases
- [ ] 8.3 Unit tests for `PostmarkEmailAdapter`
- [ ] 8.4 Integration tests for invite flows
- [ ] 8.5 Test expired and consumed token rejection
