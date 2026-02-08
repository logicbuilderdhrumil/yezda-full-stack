## Phase 1: Pipeline Builder UI (React Flow Canvas)

- [ ] 1.1 Install `@xyflow/react` dependency in `frontend/`
- [ ] 1.2 Create `PipelineBuilderView` route and lazy-loaded entry component at `frontend/src/views/pipelines/builder/PipelineBuilderView.tsx`
- [ ] 1.3 Create `PipelineBuilderCanvas` component wrapping `ReactFlow` with `useNodesState` and `useEdgesState`
- [ ] 1.4 Create `ModuleSidebar` component with draggable module type cards (Form, External Service, Internal Processing, Human Review, Notification)
- [ ] 1.5 Implement drag-and-drop from sidebar to canvas using HTML DnD API and `screenToFlowPosition`
- [ ] 1.6 Create custom node components:
  - [ ] 1.6.1 `FormModuleNode` — displays form name, field count, edit button
  - [ ] 1.6.2 `ExternalServiceNode` — displays provider name, status, config button
  - [ ] 1.6.3 `InternalProcessingNode` — displays processor type, config button
  - [ ] 1.6.4 `HumanReviewNode` — displays assignee role, decision options, config button
  - [ ] 1.6.5 `NotificationNode` — displays channel, template, config button
  - [ ] 1.6.6 `StartNode` — fixed source-only node marking pipeline entry
  - [ ] 1.6.7 `EndNode` — fixed target-only node marking pipeline completion
- [ ] 1.7 Create `PipelineEdge` custom edge component with directional arrows and status coloring
- [ ] 1.8 Create `ModuleConfigPanel` slide-over panel that appears when a node is selected, with per-type config forms
- [ ] 1.9 Create `PipelineSettingsPanel` for pipeline-level metadata (name, description, tags)
- [ ] 1.10 Implement pipeline graph serialization (nodes + edges → `PipelineGraph` JSON) and deserialization
- [ ] 1.11 Wire save/update/activate actions to `PipelineService` API calls
- [ ] 1.12 Add `MiniMap`, `Controls`, `Background` React Flow components
- [ ] 1.13 Add undo/redo support using a history stack on node/edge state
- [ ] 1.14 Add pipeline validation (e.g., all nodes connected, start→end reachable, required configs present) with error highlighting
- [ ] 1.15 Update route configuration to replace create/edit views with builder view
- [ ] 1.16 Add loading and error states for the builder

## Phase 2: Form Builder Enhancement

- [ ] 2.1 Create `FormPickerDialog` component — modal for selecting an existing form or creating a new one inline
- [ ] 2.2 Integrate `FormPickerDialog` into `FormModuleNode` config panel (click → pick/create form)
- [ ] 2.3 Add real-time form preview pane to the existing form builder
- [ ] 2.4 Add field drag handle indicators and improved drop zone highlighting in `FormBuilderCanvas`
- [ ] 2.5 Add form versioning display (version badge, "last edited" timestamp)
- [ ] 2.6 Add form search and filter to `FormPickerDialog` (by name, status, date)
- [ ] 2.7 Ensure form builder works embedded in a slide-over/modal context (responsive layout)

## Phase 3: Module Type System (Backend Schema & Registry)

- [ ] 3.1 Add `moduleType` enum column to `pipeline_stages` table (`form`, `external_service`, `internal_processing`, `human_review`, `notification`)
- [ ] 3.2 Add `moduleConfig` JSONB column to `pipeline_stages` table
- [ ] 3.3 Add `graph` JSONB column to `screening_pipelines` table for React Flow layout
- [ ] 3.4 Update `PipelineStageSchema` Zod model with `moduleType` and `moduleConfig` discriminated union
- [ ] 3.5 Create module registry (`ModuleRegistry` class) with `register()`, `validate()`, and `getSchema()` methods
- [ ] 3.6 Register built-in module type validators (form, external_service, internal_processing, human_review, notification)
- [ ] 3.7 Update `CreatePipelineDto` and `UpdatePipelineDto` to include `moduleType`, `moduleConfig`, and `graph`
- [ ] 3.8 Update pipeline CRUD service methods to validate module configs via registry
- [ ] 3.9 Add shared types to `shared/@types/pipeline-modules.ts`: `ModuleType`, `ModuleConfig`, `PipelineGraph`, `PipelineNode`, `PipelineEdge`
- [ ] 3.10 Update frontend `@types/pipeline.ts` to import shared module types
- [ ] 3.11 Write migration script to backfill existing stages with `moduleType: 'form'` and populate `moduleConfig`

## Phase 4: Module Integrations

### External Service Adapter
- [ ] 4.1 Create `ExternalServiceAdapter` interface with `sendRequest()`, `parseResponse()`, `validateWebhook()` methods
- [ ] 4.2 Implement adapters for placeholder providers (generic REST, TrustPilot stub, CreditSafe stub)
- [ ] 4.3 Add encrypted API key storage and reference system (`apiKeyRef` pattern)
- [ ] 4.4 Add field mapping configuration UI in `ExternalServiceNode` config panel
- [ ] 4.5 Add webhook endpoint (`POST /api/v1/webhooks/pipeline/:stageId`) for external service callbacks

### Human Review Module
- [ ] 4.6 Create `ReviewTask` model with assignment, decision, notes, and escalation fields
- [ ] 4.7 Add `ReviewTaskService` for creating, assigning, and completing review tasks
- [ ] 4.8 Add review queue API endpoints (`GET /api/v1/reviews`, `POST /api/v1/reviews/:id/decide`)
- [ ] 4.9 Create `ReviewDashboard` frontend view showing all collected data and decision buttons
- [ ] 4.10 Add review task assignment (auto-assign by role, manual override)
- [ ] 4.11 Add timeout and escalation logic (configurable hours, reassignment or manager notification)

### Notification Module
- [ ] 4.12 Create `NotificationDispatcher` service for email and SMS dispatch
- [ ] 4.13 Add notification template system (stored templates with placeholder substitution)
- [ ] 4.14 Add notification module config UI for selecting channel, template, and recipient type
- [ ] 4.15 Integrate with existing notification infrastructure (`backend/src/services/`)

## Phase 5: Pipeline Execution Engine

- [ ] 5.1 Create `PipelineRunnerService` that orchestrates stage transitions based on `moduleType`
- [ ] 5.2 Implement per-module-type execution handlers:
  - [ ] 5.2.1 `FormHandler` — marks stage as waiting for candidate submission; completes on form submit
  - [ ] 5.2.2 `ExternalServiceHandler` — sends outbound request via adapter; waits for callback/poll
  - [ ] 5.2.3 `InternalProcessingHandler` — enqueues background job; updates on completion
  - [ ] 5.2.4 `HumanReviewHandler` — creates review task; waits for decision
  - [ ] 5.2.5 `NotificationHandler` — dispatches notification; auto-completes
- [ ] 5.3 Update `completeStage` to use the runner service for next-stage determination
- [ ] 5.4 Add webhook handler middleware for external service callbacks with signature validation
- [ ] 5.5 Add background job processing integration for internal processing modules
- [ ] 5.6 Add pipeline versioning: snapshot on activation, new draft version on edit
- [ ] 5.7 Update assignment logic to reference specific pipeline version
- [ ] 5.8 Add pipeline execution audit events for each stage transition
- [ ] 5.9 Add pipeline execution metrics (stage durations, bottleneck detection, completion rates)

## Phase 6: Templates and Polish

- [ ] 6.1 Create `PipelineTemplateGallery` component with pre-built pipeline templates
- [ ] 6.2 Add built-in templates: "Standard DBS Check", "Right to Work", "Full Background Check", "Simple Form Collection"
- [ ] 6.3 Add "Use Template" action that pre-populates the pipeline builder canvas
- [ ] 6.4 Add pipeline cloning ("Duplicate" action on existing pipelines)
- [ ] 6.5 Add keyboard shortcuts for the pipeline builder (Delete node, Ctrl+Z undo, Ctrl+S save)
- [ ] 6.6 Add pipeline builder empty state with onboarding guidance
- [ ] 6.7 Add pipeline builder tour/walkthrough for first-time users
- [ ] 6.8 Write unit tests for module config validation, pipeline serialization, and graph validation
- [ ] 6.9 Write integration tests for pipeline execution engine (form → external service → human review → notification flow)
- [ ] 6.10 Update i18n translation keys for all new pipeline builder strings
