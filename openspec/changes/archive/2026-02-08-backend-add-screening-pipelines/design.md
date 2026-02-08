## Context
Screening businesses run candidates through ordered sequences of checks. The existing form-builder produces individual forms, and the application-intake model assigns one form per application. A pipeline entity bridges the gap by grouping forms into an ordered workflow.

## Goals / Non-Goals
- **Goals:**
  - Allow admins to compose ordered screening pipelines from existing form definitions.
  - Automatically generate per-stage applications when a pipeline is assigned to a candidate.
  - Enforce progression: next stage unlocks only when the previous stage is submitted/approved.
  - Provide pipeline-level progress (e.g., "Stage 2 of 5, 40% overall").
  - Support pipeline templates (reusable across candidates and orgs).
- **Non-Goals:**
  - Parallel/branching pipelines (future enhancement).
  - Auto-grading or scoring of submissions (separate capability).
  - Modifying the existing form-builder — pipelines compose existing forms.

## Decisions
- **Decision:** Pipeline is a first-class entity with its own CRUD, separate from form definitions.
  - *Alternatives:* Embedding pipeline config in form metadata — rejected because it conflates concerns and prevents reuse.
- **Decision:** Pipeline assignment creates `Application` records for each stage upfront (status `pending`), unlocking them sequentially.
  - *Alternatives:* Lazy creation (create next stage on completion of previous) — rejected because it prevents showing candidates the full journey ahead.
- **Decision:** Pipeline progress is computed, not stored — derived from stage application statuses.
  - *Alternatives:* Stored progress field — rejected to avoid sync issues.

## Data Model
```
ScreeningPipeline {
  id: UUID
  tenantId: UUID
  name: string
  description?: string
  stages: PipelineStage[]
  status: 'draft' | 'active' | 'archived'
  createdAt, updatedAt, createdBy, updatedBy
}

PipelineStage {
  id: UUID
  pipelineId: UUID
  formDefinitionId: UUID
  order: number (1-based)
  title: string
  description?: string
  isRequired: boolean (default true)
  estimatedMinutes?: number
}

PipelineAssignment {
  id: UUID
  pipelineId: UUID
  candidateId: UUID
  tenantId: UUID
  status: 'in_progress' | 'completed' | 'cancelled'
  currentStageOrder: number
  assignedAt: Date
  completedAt?: Date
  assignedBy: string
}
```

Existing `Application` model gains an optional `pipelineAssignmentId` and `stageOrder` to link back.

## Risks / Trade-offs
- Adding `pipelineAssignmentId` to `Application` is a schema addition, not a breaking change.
- Pipeline deletion should soft-delete (archive) to preserve audit history of assignments.
- Stage reordering on an active pipeline should not affect in-progress assignments.

## Migration Plan
- Existing standalone applications continue to work (pipelineAssignmentId is optional).
- No data migration needed for existing records.

## Open Questions
- Should optional stages be skippable by the candidate or only by an admin?
- Should pipeline templates be shareable across tenants (platform-level templates)?
