## 1. Dependencies and Configuration
- [x] 1.1 Install `postmark` npm package in backend workspace
- [x] 1.2 Add email config to `backend/src/config/index.ts`
- [x] 1.3 Add `POSTMARK_SERVER_TOKEN` to `.env.example` with placeholder value
- [x] 1.4 Add Postmark config validation (fail fast in production if token missing)

## 2. Email Module — Domain Layer
- [x] 2.1 Create `backend/src/modules/email/domain/ports/EmailPort.ts`
- [x] 2.2 Create `backend/src/modules/email/domain/entities/InviteToken.ts`
- [x] 2.3 Create `backend/src/modules/email/domain/types/email-types.ts`

## 3. Email Module — Application Layer
- [x] 3.1 Create `SendOrgMemberInviteUseCase`
- [x] 3.2 Create `SendCandidateInviteUseCase`
- [x] 3.3 Create `VerifyInviteTokenUseCase`
- [x] 3.4 Create `AcceptInviteUseCase`

## 4. Email Module — Infrastructure Layer
- [x] 4.1 Create `PostmarkEmailAdapter` implementing `EmailPort`
- [x] 4.2 Create `InviteTokenRepository`
- [x] 4.3 Create `NoOpEmailAdapter`
- [x] 4.4 Create invite token database migration

## 5. Email Module — Interface Layer
- [x] 5.1 Create invite controller
- [x] 5.2 Create invite routes
- [x] 5.3 Create request validators

## 6. Email Module — Composition Root
- [x] 6.1 Create `backend/src/modules/email/index.ts` with `createEmailModule()`
- [x] 6.2 Register email module routes in `backend/src/routes/index.ts`

## 7. Integration with Existing Modules
- [x] 7.1 Wire `SendOrgMemberInviteUseCase` into org-management
- [x] 7.2 Wire `SendCandidateInviteUseCase` into candidate-management
- [x] 7.3 Add invite audit logging

## 8. Tests
- [x] 8.1 Unit tests for `InviteToken` entity
- [x] 8.2 Unit tests for all use cases
- [x] 8.3 Unit tests for `PostmarkEmailAdapter`
- [x] 8.4 Integration tests for invite flows
- [x] 8.5 Test expired and consumed token rejection
