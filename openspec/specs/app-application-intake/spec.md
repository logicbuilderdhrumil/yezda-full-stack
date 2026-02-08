# app-application-intake Specification

## Purpose
TBD - created by archiving change backend-add-app-application-intake. Update Purpose after archive.
## Requirements
### Requirement: Assigned application retrieval
The system SHALL provide app endpoints to list assigned applications for the authenticated candidate.

#### Scenario: List assigned applications
- **WHEN** the app requests assigned applications
- **THEN** the system returns applications with status and due dates

### Requirement: Application form retrieval
The system SHALL provide app endpoints to load form definitions and existing responses.

#### Scenario: Load application form
- **WHEN** the app requests a specific application form
- **THEN** the system returns the form definition and any saved responses

### Requirement: Draft save for app responses
The system SHALL allow app clients to save draft responses for incomplete applications.

#### Scenario: Save draft
- **WHEN** the app submits a valid draft payload
- **THEN** the system stores the draft responses and returns the saved state

### Requirement: Final submission validation
The system SHALL validate required responses before accepting final submissions from the app.

#### Scenario: Submission validation failure
- **WHEN** the app submits a final application with missing required data
- **THEN** the system rejects the submission and returns validation errors

### Requirement: App submission audit trail
The system SHALL record audit events for app application submissions.

#### Scenario: App submission logged
- **WHEN** a candidate submits an application from the app
- **THEN** the system records the candidate, application, and timestamp

