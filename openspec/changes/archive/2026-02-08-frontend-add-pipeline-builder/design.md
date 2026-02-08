## Context

The Yezda platform currently supports linear pipelines of form-only stages. Admins create pipelines by adding ordered stages, each pointing to a form definition. This model cannot represent:

- External service integrations (e.g., TrustPilot identity checks, CreditSafe credit reports, DBS checks)
- Internal data processing steps (OCR, risk scoring, deduplication)
- Human-in-the-loop review checkpoints
- Notification triggers at specific points in the workflow
- Conditional branching or parallel execution paths

The platform needs a modular pipeline system where each stage is a typed "module" that can collect data, call external APIs, process data internally, require human assessment, or send notifications — composed visually via a node-graph editor.

### Constraints
- React 19 + Vite 6 + Tailwind 4 frontend stack
- Node.js + Express + PostgreSQL backend
- Multi-tenant with RBAC and audit logging
- Must migrate existing form-only pipelines without data loss
- Must remain simple enough for a small team to maintain
- Existing form builder already has field palette, canvas, and config panel

### Stakeholders
- HR admins designing screening workflows
- Candidates completing screening forms
- Staff reviewers performing human-in-the-loop assessments
- External service providers (API integrations)

## Goals / Non-Goals

### Goals
- Enable admins to visually compose pipelines from typed modules using a node-graph editor
- Support 5 module types: Form, External Service, Internal Processing, Human Review, Notification
- Provide a drag-and-drop form builder integrated into the pipeline builder workflow
- Support pipeline versioning so active pipelines are immutable snapshots
- Enable external service integration via a configurable adapter pattern
- Provide human-in-the-loop review with decision tracking
- Serialize pipeline graphs to a portable JSON format
- Migrate existing form-only pipelines to the new module-based schema

### Non-Goals
- Visual conditional branching (if/else nodes) — deferred to a future iteration
- Real-time collaborative editing of pipelines (multi-user)
- Custom module development SDK for third parties
- Mobile pipeline builder (admin-only, desktop web)
- Full workflow orchestration engine (e.g., BPMN) — keep it simple

## Decisions

### 1. React Flow for Pipeline Builder (Node Graph)

**Decision**: Use `@xyflow/react` (React Flow v12+) for the visual pipeline editor.

**Rationale**: React Flow is the de-facto standard for React node-graph UIs. It provides:
- Built-in drag-and-drop, zoom, pan, minimap, and controls
- Custom node and edge types via React components
- Serializable node/edge state (positions, data, connections)
- TypeScript support and active maintenance
- Fits the "pipeline builder/form builder vibe — possibly node-like for pipelines" requirement

**Alternatives considered**:
- **Custom canvas with drag-and-drop**: Too much effort to build zoom/pan/minimap from scratch.
- **BPMN.js**: Over-engineered for this use case; BPMN semantics add complexity we don't need.
- **Mermaid/D3**: Read-only visualization, not an interactive editor.

**Implementation pattern**:
```
ReactFlowProvider
├── PipelineBuilderCanvas (ReactFlow component)
│   ├── Custom nodes: FormModuleNode, ExternalServiceNode, InternalProcessingNode, HumanReviewNode, NotificationNode
│   ├── Custom edges: PipelineEdge (with status indicators)
│   └── Controls, MiniMap, Background
├── ModuleSidebar (draggable module types)
├── ModuleConfigPanel (selected node configuration)
└── PipelineSettingsPanel (name, description, version)
```

### 2. Module Type System (Plugin/Registry Pattern)

**Decision**: Use a discriminated union on `moduleType` with a `moduleConfig` JSON column, validated by a server-side module registry.

**Rationale**: Each module type has different configuration shapes. A discriminated union provides type safety at the TypeScript level while allowing flexible storage in a single JSON column. The registry pattern enables future extensibility without schema migrations.

**Module types**:

| Module Type | `moduleType` | Config Shape | Candidate-Visible |
|---|---|---|---|
| Form | `form` | `{ formDefinitionId, formVersion? }` | Yes |
| External Service | `external_service` | `{ provider, apiKeyRef, endpoint, fieldMapping, webhookUrl, timeout }` | No (status shown) |
| Internal Processing | `internal_processing` | `{ processor, inputMapping, outputMapping, timeout }` | No |
| Human Review | `human_review` | `{ assigneeRole, reviewFormId?, decisionOptions, timeoutHours, escalationPolicy }` | No (status shown) |
| Notification | `notification` | `{ channel, templateId, recipientType, triggerOn }` | No |

**Alternatives considered**:
- **Separate tables per module type**: Normalized but requires complex joins and migrations for each new type.
- **EAV pattern**: Flexible but loses type safety and query performance.

### 3. Form Builder Approach (Field Palette + Canvas)

**Decision**: Enhance the existing form builder (`FieldPalette`, `FormBuilderCanvas`, `FieldConfigPanel`) rather than replacing it. Add integration hooks so the pipeline builder can open the form builder inline (modal/slide-over) when creating a form module node.

**Rationale**: The existing form builder already supports the required field types (text, select, file, date, checkbox, signature, etc.) and validation rules. Enhancing it avoids duplication while providing the "New Node → Form Module → Pick a form or create a new one" workflow.

**Enhancements**:
- Add `FormPickerDialog` for selecting existing forms or creating new ones inline
- Add real-time form preview pane
- Ensure form builder state can be embedded within the pipeline builder context

### 4. Pipeline Serialization Format (JSON Schema)

**Decision**: Serialize the pipeline graph as a `PipelineGraph` JSON object containing React Flow nodes, edges, and module configurations. Store this alongside the relational `PipelineStage[]` records.

**Format**:
```typescript
interface PipelineGraph {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  viewport?: { x: number; y: number; zoom: number };
}

interface PipelineNode {
  id: string;
  type: ModuleType;
  position: { x: number; y: number };
  data: {
    stageId: string;        // References PipelineStage.id
    label: string;
    moduleConfig: ModuleConfig;
  };
}

interface PipelineEdge {
  id: string;
  source: string;          // Node ID
  target: string;          // Node ID
  sourceHandle?: string;
  targetHandle?: string;
}
```

**Rationale**: Storing both the graph (for the UI) and the relational stages (for the execution engine) ensures the visual layout is preserved while the backend can process stages without needing to parse the graph. The graph JSON is stored on the `ScreeningPipeline` entity.

### 5. Module Execution Engine (Backend Pipeline Runner)

**Decision**: Add a `PipelineRunnerService` that processes stage transitions based on `moduleType`. Each module type has a handler that:
1. Receives the current assignment context
2. Executes module-specific logic (serve form, call API, assign reviewer, send notification)
3. Returns a completion status or waits for external callback

**Execution model**:
- **Form**: Synchronous — waits for candidate submission
- **External Service**: Asynchronous — sends request, waits for webhook callback or polls until timeout
- **Internal Processing**: Asynchronous — enqueues a background job, updates on completion
- **Human Review**: Asynchronous — assigns to reviewer, waits for decision
- **Notification**: Fire-and-forget — dispatches and auto-completes

**Rationale**: Keeping the runner simple with per-type handlers avoids the complexity of a full workflow engine while supporting the required async patterns.

### 6. Human-in-the-Loop Integration Design

**Decision**: When a `human_review` module stage is reached:
1. The system creates a `ReviewTask` assigned to users matching `assigneeRole`
2. The review dashboard shows all collected data from prior stages
3. The reviewer can approve, reject, or request more information
4. Decisions are recorded with timestamps, notes, and reviewer identity
5. If `timeoutHours` is exceeded, the `escalationPolicy` is triggered (reassign or notify manager)

**Data model**:
```typescript
interface ReviewTask {
  id: string;
  assignmentId: string;
  stageId: string;
  assigneeId?: string;
  assigneeRole: string;
  status: 'pending' | 'in_progress' | 'completed' | 'escalated';
  decision?: 'approved' | 'rejected' | 'more_info_required';
  notes?: string;
  decidedAt?: Date;
  escalatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 7. External Service Integration Pattern

**Decision**: Use an adapter pattern with:
- **Outbound**: Service adapter sends request to external API with mapped fields
- **Inbound**: Webhook endpoint receives callback; polling fallback for APIs without webhooks
- **Security**: API keys stored as encrypted references (not inline); field mapping configured per module

**Flow**:
```
Stage reached → Adapter sends request → Store pending status
                                      → External service processes
Webhook received → Validate signature → Update stage status → Trigger next stage
       OR
Polling interval → Check status → Update stage status → Trigger next stage
```

### 8. Pipeline Versioning

**Decision**: When a pipeline is activated, its current state is snapshot-versioned. Editing an active pipeline creates a new draft version. Existing assignments continue on their original version.

**Rationale**: Prevents in-flight assignments from being affected by pipeline edits. Simple integer versioning (v1, v2, v3) with the version stored on both the pipeline and the assignment.

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| React Flow bundle size (~150KB gzipped) | Increased frontend load time | Lazy-load the pipeline builder route; only loaded for admin users |
| Module config schema drift | Invalid configs stored in DB | Server-side validation via module registry on every save; JSON schema validation |
| External service timeouts | Stuck pipeline stages | Configurable timeout per module with auto-escalation; manual override available |
| Complex graph serialization bugs | Pipeline corruption | Store both graph JSON and relational stages; validate round-trip on save |
| Human review bottleneck | Delayed screenings | Timeout-based escalation; reassignment policies; dashboard visibility |
| Migration complexity | Existing pipelines break | Automated migration script converts form-only stages to `moduleType: 'form'` with backward-compatible config |

## Migration Plan

### Phase 1: Schema Migration (Non-Breaking)
1. Add `moduleType` column to `pipeline_stages` table with default `'form'`
2. Add `moduleConfig` JSONB column with default `{ formDefinitionId: <existing value> }`
3. Add `graph` JSONB column to `screening_pipelines` table (nullable)
4. Existing pipelines continue to work — `moduleType: 'form'` is backward-compatible

### Phase 2: Data Migration
1. Run migration script to populate `moduleConfig` for all existing stages:
   ```sql
   UPDATE pipeline_stages
   SET module_type = 'form',
       module_config = jsonb_build_object('formDefinitionId', form_definition_id)
   WHERE module_type IS NULL;
   ```
2. Generate `graph` JSON for existing pipelines based on stage order (auto-layout as vertical chain)

### Phase 3: UI Rollout
1. Deploy new pipeline builder UI behind a feature flag
2. Admins can opt-in to the new builder; legacy views remain available
3. After validation period, remove legacy views and feature flag

### Rollback
- `moduleType` and `moduleConfig` columns can be ignored by rolling back to the previous frontend/backend versions
- No data loss — `formDefinitionId` column remains as the source of truth until fully migrated

## Open Questions

1. **Conditional branching**: Should the initial release support if/else branching in the pipeline graph, or should all paths be linear/sequential? (Decision: Deferred to future iteration)
2. **Module marketplace**: Should there be a UI for admins to browse and install pre-built external service integrations? (Decision: Out of scope for v1)
3. **Pipeline cloning**: Should admins be able to clone an existing pipeline as a starting point? (Decision: Include in v1 as a template feature)
4. **Parallel stages**: Should the graph support parallel execution of independent modules? (Decision: Deferred; v1 enforces sequential execution based on edge order)
5. **Form builder embedding**: Should the form builder open as a modal within the pipeline builder, or navigate to a separate page? (Best guess: Modal/slide-over to maintain pipeline context)
