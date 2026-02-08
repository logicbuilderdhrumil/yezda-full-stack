# Change: Add screening pipeline workflows

## Why
Currently each screening application assigns a single form to a candidate. Real-world screening requires multi-step pipelines — e.g., "Right to Work → SIA Badge Verification → Employment History → References" — where completion of one step unlocks the next. Without a pipeline entity, admins must manually create and assign individual forms, losing sequencing, progress tracking, and enforcement.

## What Changes
- Add a `ScreeningPipeline` entity grouping ordered `PipelineStage` entries, each referencing a form definition.
- Add backend CRUD for pipelines scoped to tenants.
- Add pipeline assignment to candidates, creating all stage applications automatically.
- Add progression logic: stage completion triggers next stage unlock.
- Add pipeline-level progress tracking (percentage across all stages).
- Update the app to display pipeline context (stage X of Y) within the application list and detail screens.
- Add admin UI for creating and managing pipelines in the web frontend.

## Impact
- Affected specs: (new) `screening-pipelines`
- Affected code: backend models, services, routes, controllers; frontend pipeline views; app application list/detail screens; shared types
