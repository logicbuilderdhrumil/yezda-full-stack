## ADDED Requirements
### Requirement: Chat view summaries
The system SHALL provide APIs for chat view summaries and metadata.

#### Scenario: Retrieve chat summary
- **WHEN** a client requests chat summary data
- **THEN** the system returns conversation metadata and unread counts

### Requirement: File type metadata
The system SHALL provide file type metadata mapping for view components.

#### Scenario: Retrieve file type metadata
- **WHEN** a client requests file type metadata
- **THEN** the system returns mappings for supported file types

### Requirement: View component access control
The system SHALL enforce role-based access and tenant isolation for view component data endpoints.

#### Scenario: Unauthorized view data access
- **WHEN** a user requests view component data outside their tenant scope
- **THEN** the system denies access and records an audit event

### Requirement: View component audit logging
The system SHALL record audit events for view component data access.

#### Scenario: View component access audit trail
- **WHEN** a user retrieves view component data
- **THEN** the system records the actor, component identifier, and timestamp

### Requirement: Operational safeguards for view components
The system SHALL apply caching and rate limits for view component endpoints and publish availability and error SLO targets.

#### Scenario: View component request throttled
- **WHEN** a client exceeds configured request limits for view component endpoints
- **THEN** the system returns a throttled response and preserves service availability
