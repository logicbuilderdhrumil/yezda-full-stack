## ADDED Requirements
### Requirement: Consent reuse contract alignment
The system SHALL publish aligned contracts for consent reuse endpoints and workflow states.

#### Scenario: Consent reuse request
- **WHEN** the app requests consent reuse details
- **THEN** the response includes the documented workflow state and schema

### Requirement: Application intake submission alignment
The system SHALL align application intake form schemas, validation errors, and submission lifecycle states.

#### Scenario: Application intake submission
- **WHEN** the app submits an application intake form
- **THEN** the backend returns a status that matches the documented lifecycle

### Requirement: App flow error detail
The system SHALL return consistent validation error details for app flow submissions.

#### Scenario: Invalid submission
- **WHEN** a submission fails validation
- **THEN** the response provides field-level error details per contract
