## ADDED Requirements

### Requirement: Pipeline Definition Management
The system SHALL allow admins to create, update, list, and archive screening pipelines composed of ordered stages, each referencing a form definition.

#### Scenario: Admin creates a pipeline
- **WHEN** an admin creates a pipeline with a name and at least one stage referencing a published form
- **THEN** the system persists the pipeline with status 'draft' and tenant scoping

#### Scenario: Admin publishes a pipeline
- **WHEN** an admin updates a draft pipeline status to 'active'
- **THEN** the pipeline becomes available for candidate assignment

#### Scenario: Admin archives a pipeline
- **WHEN** an admin archives a pipeline
- **THEN** the pipeline is soft-deleted and no longer assignable, but existing assignments are unaffected

### Requirement: Pipeline Stage Ordering
The system SHALL enforce sequential ordering of pipeline stages and prevent duplicate form references within the same pipeline.

#### Scenario: Stages are ordered
- **WHEN** a pipeline is created or updated with multiple stages
- **THEN** the system assigns and validates sequential order numbers starting from 1

#### Scenario: Duplicate form rejected
- **WHEN** an admin adds the same form definition to two stages in one pipeline
- **THEN** the system rejects the request with a validation error

### Requirement: Pipeline Assignment
The system SHALL allow authorized users to assign an active pipeline to a candidate, automatically creating per-stage application records.

#### Scenario: Pipeline assigned to candidate
- **WHEN** a manager assigns an active pipeline to a candidate
- **THEN** the system creates one Application per stage with status 'pending', setting the first stage to 'in_progress'

#### Scenario: Duplicate assignment prevented
- **WHEN** a user attempts to assign the same pipeline to a candidate who already has an active assignment
- **THEN** the system rejects the request with a conflict error

### Requirement: Pipeline Stage Progression
The system SHALL enforce sequential stage progression: the next stage unlocks only when the current stage application is submitted.

#### Scenario: Stage completion unlocks next
- **WHEN** a candidate submits the application for stage N
- **THEN** the system updates stage N+1 application from 'pending' to 'in_progress'

#### Scenario: Skipping stages prevented
- **WHEN** a candidate attempts to load a stage whose predecessor is not yet submitted
- **THEN** the system returns an error indicating the prerequisite stage is incomplete

### Requirement: Pipeline Progress Tracking
The system SHALL provide pipeline-level progress computed from the statuses of all stage applications.

#### Scenario: Progress computed
- **WHEN** a user or candidate requests pipeline assignment progress
- **THEN** the system returns the current stage, total stages, and overall completion percentage

#### Scenario: Pipeline completed
- **WHEN** all required stages are submitted
- **THEN** the pipeline assignment status is updated to 'completed'

### Requirement: Pipeline Tenant Isolation
The system SHALL scope all pipeline operations to the authenticated user's tenant.

#### Scenario: Cross-tenant pipeline access denied
- **WHEN** a user attempts to access a pipeline belonging to a different tenant
- **THEN** the system returns a not-found response and logs the access attempt
