## 1. Backend — Models & Types
- [ ] 1.1 Define `ScreeningPipeline`, `PipelineStage`, `PipelineAssignment` models with Zod schemas
- [ ] 1.2 Add shared types for pipeline DTOs in `shared/@types/pipeline.types.ts`
- [ ] 1.3 Extend `Application` model with optional `pipelineAssignmentId` and `stageOrder`

## 2. Backend — Repository & Service
- [ ] 2.1 Create `screening-pipeline.repository.ts` with in-memory store
- [ ] 2.2 Create `screening-pipeline.service.ts` with CRUD, assignment, and progression logic
- [ ] 2.3 Add pipeline assignment logic: generate per-stage Applications on assign
- [ ] 2.4 Add stage progression: unlock next stage when current is submitted
- [ ] 2.5 Add pipeline progress computation (derived from stage statuses)

## 3. Backend — Routes & Controllers
- [ ] 3.1 Create `screening-pipeline.routes.ts` with CRUD endpoints
- [ ] 3.2 Create `screening-pipeline.controller.ts`
- [ ] 3.3 Add pipeline assignment endpoint (POST /pipelines/:id/assign)
- [ ] 3.4 Add pipeline progress endpoint (GET /pipelines/assignments/:id/progress)

## 4. Backend — Tests
- [ ] 4.1 Write unit tests for pipeline service (CRUD, assignment, progression)
- [ ] 4.2 Write integration tests for pipeline API endpoints

## 5. Frontend — Pipeline Management Views
- [ ] 5.1 Create `PipelinesListView` with list/filter/search
- [ ] 5.2 Create `PipelineCreateView` with stage ordering UI
- [ ] 5.3 Create `PipelineDetailsView` showing stages and assignments
- [ ] 5.4 Create `PipelineEditView` for modifying draft pipelines
- [ ] 5.5 Add pipeline routes to frontend router (admin only)

## 6. Frontend — Candidate Pipeline Assignment
- [ ] 6.1 Add "Assign Pipeline" action to candidate detail view
- [ ] 6.2 Show pipeline progress on candidate detail view

## 7. App — Pipeline Context
- [ ] 7.1 Update application list screen to show pipeline context (stage X of Y)
- [ ] 7.2 Update application detail screen to show pipeline progress indicator
