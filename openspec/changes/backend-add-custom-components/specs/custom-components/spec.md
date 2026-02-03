## ADDED Requirements
### Requirement: Organization selector data
The system SHALL provide APIs to fetch and set the active organization context.

#### Scenario: Select organization
- **WHEN** a user selects an organization
- **THEN** the system stores the active organization and returns updated context

### Requirement: Theme preference updates
The system SHALL allow users to update their theme preference.

#### Scenario: Toggle theme
- **WHEN** a user sets a theme preference
- **THEN** the system stores the preference and returns the updated value

### Requirement: Context access control and tenant isolation
The system SHALL enforce role-based access and tenant isolation for organization context endpoints.

#### Scenario: Unauthorized organization switch blocked
- **WHEN** a user attempts to select an organization they cannot access
- **THEN** the system denies the request and records an audit event

### Requirement: Context audit logging
The system SHALL record audit events for organization context and preference changes.

#### Scenario: Organization context audit trail
- **WHEN** a user changes the active organization
- **THEN** the system records the actor, organization identifier, and timestamp

### Requirement: Operational safeguards for component endpoints
The system SHALL apply rate limits for component support endpoints and publish availability and error SLO targets.

#### Scenario: Component endpoint throttled
- **WHEN** a client exceeds configured request limits for component endpoints
- **THEN** the system returns a throttled response and preserves service availability
