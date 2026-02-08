## ADDED Requirements
### Requirement: Shell configuration API
The system SHALL provide an API that returns shell layout configuration and metadata.

#### Scenario: Fetch shell configuration
- **WHEN** a client requests shell configuration
- **THEN** the system returns header, sidebar, and content layout metadata

### Requirement: Route policy metadata
The system SHALL expose route access policies for public and protected routes.

#### Scenario: Fetch route policies
- **WHEN** a client requests route policies
- **THEN** the system returns route identifiers with required authorities

### Requirement: Role-based navigation
The system SHALL return navigation items filtered by user authority.

#### Scenario: Authority-filtered navigation
- **WHEN** a user requests navigation items
- **THEN** the system returns only items the user is authorized to access

### Requirement: Theme and locale defaults
The system SHALL provide theme and locale defaults for the shell.

#### Scenario: Fetch preference defaults
- **WHEN** a client requests preference defaults
- **THEN** the system returns the default theme and locale settings

### Requirement: Shell access control and tenant isolation
The system SHALL enforce role-based access and tenant isolation for shell configuration and navigation metadata.

#### Scenario: Unauthorized navigation metadata
- **WHEN** a user requests navigation metadata outside their authority
- **THEN** the system returns only authorized items and records an audit event

### Requirement: Shell audit logging
The system SHALL record audit events for preference changes and navigation policy updates.

#### Scenario: Preference update audit trail
- **WHEN** a user updates theme or locale preferences
- **THEN** the system records the actor, action, and timestamp

### Requirement: Operational safeguards for shell configuration
The system SHALL apply caching and rate limits for shell configuration endpoints and publish availability and error SLO targets.

#### Scenario: Shell config cached
- **WHEN** a client requests shell configuration within cache freshness limits
- **THEN** the system serves the cached response and preserves service availability
