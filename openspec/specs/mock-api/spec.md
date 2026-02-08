# mock-api Specification

## Purpose
TBD - created by archiving change backend-add-mock-api. Update Purpose after archive.
## Requirements
### Requirement: Mock API mode
The system SHALL support a mock API mode for local development.

#### Scenario: Enable mock mode
- **WHEN** mock mode is enabled
- **THEN** the system returns fixture responses for supported endpoints

### Requirement: Fixture data
The system SHALL provide fixture data for core modules.

#### Scenario: Retrieve fixture data
- **WHEN** a mock endpoint is requested
- **THEN** the system returns the associated fixture payload

### Requirement: Mock mode environment safeguards
The system SHALL restrict mock mode to approved environments and authorized operators.

#### Scenario: Mock mode blocked in production
- **WHEN** a user attempts to enable mock mode in a production environment
- **THEN** the system rejects the request and records a security event

### Requirement: Mock mode audit logging
The system SHALL record audit events for mock mode changes and fixture access.

#### Scenario: Mock mode toggle audit trail
- **WHEN** an authorized operator enables mock mode
- **THEN** the system records the actor, environment, and timestamp

### Requirement: Mock API support
The system SHALL provide a mock API mode for local development.

#### Scenario: Enable mock mode
- **WHEN** mock mode is enabled
- **THEN** API requests return fixture data

### Requirement: Fake data fixtures
The system SHALL include fake data fixtures for core modules.

#### Scenario: Load fixture data
- **WHEN** a mock endpoint is called
- **THEN** it returns the associated fixture

