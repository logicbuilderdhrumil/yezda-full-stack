## ADDED Requirements
### Requirement: Theme tokens
The system SHALL provide theme token data for supported presets.

#### Scenario: Fetch theme tokens
- **WHEN** a client requests a theme preset
- **THEN** the system returns the token values for that preset

### Requirement: Theme switching
The system SHALL store user theme preferences.

#### Scenario: Update theme preference
- **WHEN** a user selects a new theme
- **THEN** the system stores the preference and returns the updated value

### Requirement: Theme access control and tenant isolation
The system SHALL enforce role-based access and tenant isolation for theme endpoints.

#### Scenario: Unauthorized theme update blocked
- **WHEN** a user attempts to update another user's theme preference
- **THEN** the system denies access and records an audit event

### Requirement: Theme audit logging
The system SHALL record audit events for theme preference changes.

#### Scenario: Theme update audit trail
- **WHEN** a user updates their theme preference
- **THEN** the system records the actor, preference, and timestamp

### Requirement: Operational safeguards for theme endpoints
The system SHALL apply caching and rate limits for theme endpoints and publish availability and error SLO targets.

#### Scenario: Theme request throttled
- **WHEN** a client exceeds configured request limits for theme endpoints
- **THEN** the system returns a throttled response and preserves service availability
