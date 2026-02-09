## ADDED Requirements

### Requirement: Pipeline Visual Editor
The system SHALL provide a visual node-graph editor for composing screening pipelines, using React Flow as the rendering engine. Admins MUST be able to drag module nodes from a sidebar onto the canvas, connect them with edges to define execution order, and configure each module inline.

#### Scenario: Admin opens pipeline builder
- **WHEN** an admin navigates to the pipeline builder view
- **THEN** the system displays a React Flow canvas with Start and End nodes, a module sidebar, and pipeline settings panel

#### Scenario: Admin drags a module onto the canvas
- **WHEN** an admin drags a module type (e.g., Form, External Service) from the sidebar and drops it onto the canvas
- **THEN** a new node of that module type is created at the drop position with default configuration

#### Scenario: Admin connects two modules
- **WHEN** an admin draws an edge from one module node's output handle to another module node's input handle
- **THEN** the system creates a directed edge representing execution order between the two stages

#### Scenario: Admin removes a module node
- **WHEN** an admin selects a node and presses Delete or clicks the remove button
- **THEN** the node and all connected edges are removed from the canvas

#### Scenario: Admin saves pipeline graph
- **WHEN** an admin clicks Save
- **THEN** the system serializes the canvas state (nodes, edges, positions, module configs) into a PipelineGraph JSON and persists it alongside relational stage records

#### Scenario: Admin loads existing pipeline for editing
- **WHEN** an admin opens a draft pipeline in the builder
- **THEN** the system deserializes the stored PipelineGraph JSON and renders all nodes, edges, and configurations on the canvas

#### Scenario: Pipeline builder validates graph completeness
- **WHEN** an admin attempts to activate a pipeline
- **THEN** the system validates that all nodes are connected in a path from Start to End, all required module configurations are complete, and highlights any validation errors on the offending nodes

### Requirement: Module Type System
The system SHALL support a discriminated module type system where each pipeline stage has a `moduleType` field and a type-specific `moduleConfig` JSON object. The supported module types MUST be: `form`, `external_service`, `internal_processing`, `human_review`, and `notification`.

#### Scenario: Stage with form module type
- **WHEN** an admin configures a stage with moduleType `form`
- **THEN** the system requires a valid `formDefinitionId` in the moduleConfig and displays the referenced form name in the node

#### Scenario: Stage with external service module type
- **WHEN** an admin configures a stage with moduleType `external_service`
- **THEN** the system requires `provider`, `apiKeyRef`, and `fieldMapping` in the moduleConfig

#### Scenario: Stage with internal processing module type
- **WHEN** an admin configures a stage with moduleType `internal_processing`
- **THEN** the system requires `processor` and `inputMapping` in the moduleConfig

#### Scenario: Stage with human review module type
- **WHEN** an admin configures a stage with moduleType `human_review`
- **THEN** the system requires `assigneeRole` and `decisionOptions` in the moduleConfig

#### Scenario: Stage with notification module type
- **WHEN** an admin configures a stage with moduleType `notification`
- **THEN** the system requires `channel`, `templateId`, and `recipientType` in the moduleConfig

#### Scenario: Invalid module config rejected
- **WHEN** an admin saves a stage with a moduleConfig that does not match the schema for the specified moduleType
- **THEN** the system rejects the save with a validation error describing the invalid fields

### Requirement: Module Configuration Panel
The system SHALL provide an inline configuration panel that appears when a module node is selected on the pipeline builder canvas. The panel content MUST be specific to the selected module's type.

#### Scenario: Admin selects a form module node
- **WHEN** an admin clicks on a form module node
- **THEN** the system opens a configuration panel showing a form picker (select existing or create new), the selected form name, field count, and version

#### Scenario: Admin selects an external service module node
- **WHEN** an admin clicks on an external service module node
- **THEN** the system opens a configuration panel showing provider selection, API key reference, endpoint URL, field mapping editor, webhook URL, and timeout settings

#### Scenario: Admin selects a human review module node
- **WHEN** an admin clicks on a human review module node
- **THEN** the system opens a configuration panel showing assignee role selector, decision options (approve/reject/more info), review form selector (optional), timeout hours, and escalation policy

### Requirement: Form Builder Integration
The system SHALL integrate the form builder within the pipeline builder workflow so that admins can create or select forms without leaving the pipeline builder context.

#### Scenario: Admin creates new form from pipeline builder
- **WHEN** an admin clicks "Create New Form" in the form module configuration panel
- **THEN** the system opens the form builder in a modal or slide-over panel, pre-connected to the current pipeline stage

#### Scenario: Admin selects existing form from pipeline builder
- **WHEN** an admin clicks "Select Form" in the form module configuration panel
- **THEN** the system displays a searchable list of existing form definitions filtered by tenant, with name, status, field count, and last updated date

#### Scenario: Form saved from pipeline builder context
- **WHEN** an admin saves a form created within the pipeline builder modal
- **THEN** the form is persisted and automatically linked to the pipeline stage's moduleConfig as the formDefinitionId

### Requirement: Enhanced Form Builder
The system SHALL provide an enhanced drag-and-drop form builder with a field palette, canvas, configuration panel, and real-time preview. The form builder MUST support standard input components: text, email, phone, number, date, select, multiselect, checkbox, radio, textarea, file upload, signature, section headings.

#### Scenario: Admin drags a field onto the form canvas
- **WHEN** an admin drags a field type from the palette and drops it onto the form canvas
- **THEN** a new field of that type is added at the drop position with default configuration

#### Scenario: Admin configures field validation
- **WHEN** an admin selects a field on the canvas and modifies validation rules in the config panel
- **THEN** the field definition is updated with the new validation rules and the preview reflects the constraints

#### Scenario: Admin previews the form
- **WHEN** an admin clicks the preview button
- **THEN** the system displays a read-only rendering of the form as a candidate would see it, with all configured fields, labels, help text, and validation indicators

#### Scenario: Admin reorders fields via drag-and-drop
- **WHEN** an admin drags a field to a different position within the form canvas
- **THEN** the field order is updated and all fields are re-indexed accordingly

### Requirement: Pipeline Execution Engine
The system SHALL provide a backend pipeline execution engine that processes stage transitions based on the module type of each stage. The engine MUST support synchronous (form submission), asynchronous (external service callback, human review decision), and fire-and-forget (notification dispatch) execution models.

#### Scenario: Form stage reached in execution
- **WHEN** the pipeline runner reaches a stage with moduleType `form`
- **THEN** the system sets the stage status to `in_progress` and waits for the candidate to submit the referenced form

#### Scenario: External service stage reached in execution
- **WHEN** the pipeline runner reaches a stage with moduleType `external_service`
- **THEN** the system sends a request to the configured external API endpoint with mapped fields, sets stage status to `awaiting_callback`, and waits for a webhook response or polls until timeout

#### Scenario: Internal processing stage reached in execution
- **WHEN** the pipeline runner reaches a stage with moduleType `internal_processing`
- **THEN** the system enqueues a background job for the configured processor, sets stage status to `processing`, and updates to `completed` when the job finishes

#### Scenario: Human review stage reached in execution
- **WHEN** the pipeline runner reaches a stage with moduleType `human_review`
- **THEN** the system creates a review task assigned to users with the configured role, sets stage status to `awaiting_review`, and waits for a decision

#### Scenario: Notification stage reached in execution
- **WHEN** the pipeline runner reaches a stage with moduleType `notification`
- **THEN** the system dispatches the configured notification (email/SMS) using the referenced template and automatically marks the stage as `completed`

#### Scenario: Stage completion triggers next stage
- **WHEN** a stage is marked as `completed` by any execution handler
- **THEN** the pipeline runner identifies the next stage via the pipeline graph edges and initiates its execution

#### Scenario: External service webhook received
- **WHEN** the system receives a webhook callback for an external service stage
- **THEN** the system validates the webhook signature, updates the stage with the response data, marks it as `completed`, and triggers the next stage

### Requirement: Human Review Module
The system SHALL provide a human-in-the-loop review module that assigns a staff member to assess the screening application at a given pipeline stage. The review dashboard MUST display all data collected from prior stages, provide decision buttons, and support notes.

#### Scenario: Review task created at human review stage
- **WHEN** a pipeline assignment reaches a human review stage
- **THEN** the system creates a review task with status `pending`, assigned to users matching the configured `assigneeRole`

#### Scenario: Reviewer claims a review task
- **WHEN** a staff member with the matching role claims an unassigned review task
- **THEN** the task status changes to `in_progress` and the assigneeId is set to that staff member

#### Scenario: Reviewer makes a decision
- **WHEN** a reviewer submits a decision (approve, reject, or request more info) with optional notes
- **THEN** the system records the decision, decision timestamp, and notes, marks the review task as `completed`, and triggers the pipeline runner to advance

#### Scenario: Review task escalated on timeout
- **WHEN** a review task exceeds the configured `timeoutHours` without a decision
- **THEN** the system applies the configured escalation policy (reassign to another reviewer or notify a manager) and sets the task status to `escalated`

#### Scenario: Reviewer views collected data
- **WHEN** a reviewer opens a review task
- **THEN** the system displays a read-only summary of all form submissions, external service results, and processing outputs from prior pipeline stages

### Requirement: External Service Integration
The system SHALL support integration with external screening service providers via a configurable adapter pattern. Each external service module MUST define a provider, API key reference, endpoint, field mapping, and response handling.

#### Scenario: External service request sent
- **WHEN** the pipeline runner executes an external service stage
- **THEN** the system maps candidate data to the provider's expected request format using the configured field mapping and sends the request to the configured endpoint

#### Scenario: External service response mapped
- **WHEN** the system receives a response from an external service (via webhook or poll)
- **THEN** the system maps the response fields back to the pipeline context using the configured response mapping and stores the result

#### Scenario: External service timeout handled
- **WHEN** an external service does not respond within the configured timeout period
- **THEN** the system marks the stage as `timed_out`, logs the event, and applies the configured failure policy (retry, skip, or fail pipeline)

#### Scenario: API key securely referenced
- **WHEN** an admin configures an external service module with an API key
- **THEN** the system stores the API key as an encrypted reference (`apiKeyRef`) and never exposes the raw key in API responses or pipeline graph exports

### Requirement: Pipeline Templates
The system SHALL provide a template gallery of pre-built pipeline configurations that admins can use as starting points for new pipelines.

#### Scenario: Admin browses template gallery
- **WHEN** an admin opens the pipeline template gallery
- **THEN** the system displays a list of available templates with name, description, module count, and a preview of the pipeline graph

#### Scenario: Admin creates pipeline from template
- **WHEN** an admin selects a template and clicks "Use Template"
- **THEN** the system creates a new draft pipeline pre-populated with the template's nodes, edges, and module configurations, which the admin can then customize

#### Scenario: Built-in templates available
- **WHEN** the system is initialized for a new tenant
- **THEN** at least the following built-in templates are available: "Standard DBS Check", "Right to Work", "Full Background Check", "Simple Form Collection"

### Requirement: Pipeline Versioning
The system SHALL support version control for pipelines. Active pipelines MUST be immutable snapshots; edits to an active pipeline MUST create a new draft version. Existing assignments MUST continue on their original pipeline version.

#### Scenario: Pipeline activated creates version snapshot
- **WHEN** an admin activates a draft pipeline
- **THEN** the system assigns a version number and creates an immutable snapshot of the pipeline configuration

#### Scenario: Editing active pipeline creates new draft
- **WHEN** an admin edits an active pipeline
- **THEN** the system creates a new draft version (incrementing the version number) with the current configuration as a starting point, leaving the active version unchanged

#### Scenario: Assignment references specific version
- **WHEN** a pipeline is assigned to a candidate
- **THEN** the assignment records the specific pipeline version, and future edits to the pipeline do not affect the assignment

#### Scenario: Admin views version history
- **WHEN** an admin opens the version history for a pipeline
- **THEN** the system displays a list of all versions with version number, status, creation date, and the user who created each version

### Requirement: Pipeline Module Sidebar
The system SHALL display a sidebar in the pipeline builder containing all available module types as draggable cards. Each card MUST show the module type name, icon, and a brief description.

#### Scenario: Sidebar displays all module types
- **WHEN** an admin opens the pipeline builder
- **THEN** the sidebar lists module types: Form, External Service, Internal Processing, Human Review, and Notification, each with an icon and description

#### Scenario: Sidebar module drag initiated
- **WHEN** an admin starts dragging a module card from the sidebar
- **THEN** the system sets the drag data to the module type and shows a drag preview on the cursor

#### Scenario: Sidebar filtered by search
- **WHEN** an admin types a search query in the sidebar search box
- **THEN** the sidebar filters the displayed module types to those matching the query
