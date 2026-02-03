## ADDED Requirements
### Requirement: Pagination and search parameters
The system SHALL accept standardized pagination and search parameters for list endpoints.

#### Scenario: Paginate results
- **WHEN** a client submits pagination parameters
- **THEN** the system returns the requested page and size

### Requirement: List response envelope
The system SHALL return a consistent response envelope for list results.

#### Scenario: List response formatting
- **WHEN** a list endpoint returns results
- **THEN** the response includes items and pagination metadata

### Requirement: Parameter limits and validation
The system SHALL enforce parameter limits and validate pagination and search inputs.

#### Scenario: Excessive page size blocked
- **WHEN** a client requests a page size above the configured maximum
- **THEN** the system rejects the request with a validation error

### Requirement: Error sanitization defaults
The system SHALL return sanitized error responses for list utility failures.

#### Scenario: Sanitized list error
- **WHEN** a list utility encounters an internal error
- **THEN** the system returns a standardized error envelope without sensitive data

### Requirement: Operational telemetry for list utilities
The system SHALL emit telemetry for list utility performance and publish availability and error SLO targets.

#### Scenario: List utility telemetry
- **WHEN** a list endpoint is executed
- **THEN** the system emits timing and result metrics for monitoring
