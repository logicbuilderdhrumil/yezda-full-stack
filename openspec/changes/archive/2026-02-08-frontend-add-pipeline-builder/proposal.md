# Change: Add Pipeline Builder and Form Builder

## Why
The current screening pipeline system is limited to ordered stages that each reference a single form definition. Real-world screening workflows require a richer, modular composition model where pipeline stages can be forms, external service integrations (identity verification, credit checks, DBS), internal processing steps (OCR, risk scoring), human-in-the-loop reviews, or notification triggers. The current linear create/edit UI (simple list of stages) does not express conditional branching, parallel modules, or non-form steps. A visual pipeline builder using React Flow, combined with an enhanced form builder, will enable admins to design sophisticated screening workflows without developer intervention.

## What Changes

### Frontend — Pipeline Builder
- **BREAKING**: Replace the existing `PipelineCreateView` and `PipelineEditView` with a React Flow-based visual pipeline builder canvas.
- Add a module sidebar for dragging module nodes onto the canvas (Form, External Service, Internal Processing, Human Review, Notification).
- Add custom React Flow node components for each module type with inline configuration panels.
- Add pipeline-level settings panel (name, description, version, tags).
- Add pipeline serialization to/from a JSON schema that captures nodes, edges, positions, and module configs.
- Add a pipeline preview/simulation mode for dry-run validation.
- Add pipeline template gallery for common screening patterns (e.g., "Standard DBS", "Right to Work", "Full Background Check").

### Frontend — Form Builder Enhancement
- Enhance the existing form builder (`FormBuilderCanvas`, `FieldPalette`, `FieldConfigPanel`) with improved drag-and-drop, real-time preview, and additional field types.
- Add integration with the pipeline builder — "New Node → Form Module → Pick a form or create a new one" workflow.
- Add form versioning indicator and diff view.

### Backend — Module Type System
- Extend `PipelineStage` model to support a discriminated `moduleType` field (`form`, `external_service`, `internal_processing`, `human_review`, `notification`) with a `moduleConfig` JSON blob.
- Add a module registry for registering and validating module configurations.
- Add external service adapter pattern (webhook, polling, field mapping config).
- Add human review assignment and decision endpoints.
- Add notification module dispatch (email/SMS templates tied to pipeline events).

### Backend — Pipeline Execution Engine
- Add a pipeline runner service that processes stage transitions based on module type.
- Add webhook handler for external service callbacks.
- Add human review queue with assignment, timeout, and escalation.
- Add pipeline versioning: active pipelines are snapshot-versioned; edits create new draft versions.

### Shared Types
- Add `PipelineModule`, `ModuleType`, `ModuleConfig` discriminated union types to `shared/@types/`.
- Add `PipelineGraph` type representing the React Flow serialization format (nodes + edges).

## Impact
- Affected specs: `screening-pipelines` (MODIFIED), `form-builder` (MODIFIED), `pipeline-builder` (new capability)
- Affected code:
  - `frontend/src/views/pipelines/` — replace create/edit views with builder
  - `frontend/src/views/forms/` — enhance form builder integration
  - `frontend/src/services/PipelineService.ts` — extend for module types
  - `frontend/src/@types/pipeline.ts` — extend types
  - `backend/src/models/screening-pipeline.model.ts` — extend stage model
  - `backend/src/services/screening-pipeline.service.ts` — add execution engine
  - `backend/src/controllers/screening-pipeline.controller.ts` — new endpoints
  - `backend/src/routes/screening-pipeline.routes.ts` — new routes
  - `shared/@types/` — new shared module types
- New dependencies: `@xyflow/react` (React Flow v12+)
