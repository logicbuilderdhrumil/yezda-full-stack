# app-consent-reuse-integration Specification

## Purpose
TBD - created by archiving change backend-add-app-consent-reuse. Update Purpose after archive.
## Requirements
### Requirement: Consent decision storage
The system SHALL store app consent decisions with scope, timestamp, and version.

#### Scenario: Consent recorded
- **WHEN** the app submits a consent decision
- **THEN** the system stores the decision with its scope and version

### Requirement: Consent retrieval for reuse
The system SHALL provide app endpoints to retrieve the current consent status.

#### Scenario: Consent status requested
- **WHEN** the app requests consent status
- **THEN** the system returns the latest consent decision and scope

### Requirement: Consent enforcement for reuse
The system SHALL enforce data reuse rules based on the stored consent scope.

#### Scenario: Reuse blocked without consent
- **WHEN** a data reuse request is made without valid consent
- **THEN** the system denies reuse and returns a consent-required response

### Requirement: Consent withdrawal handling
The system SHALL allow candidates to withdraw consent and prevent future reuse.

#### Scenario: Consent withdrawn
- **WHEN** a candidate withdraws consent in the app
- **THEN** the system records the withdrawal and blocks subsequent reuse

### Requirement: Consent audit logging
The system SHALL record audit events for consent creation, update, and withdrawal.

#### Scenario: Consent audit event
- **WHEN** a consent event occurs
- **THEN** the system records the actor, action, and timestamp

