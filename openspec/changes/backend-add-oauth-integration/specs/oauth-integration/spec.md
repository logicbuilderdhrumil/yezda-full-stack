## ADDED Requirements
### Requirement: OAuth verification callback
The system SHALL handle OAuth verification callbacks for integrations.

#### Scenario: OAuth callback
- **WHEN** an OAuth provider redirects back with an authorization code
- **THEN** the system exchanges the code for tokens and stores integration status

### Requirement: Integration status retrieval
The system SHALL provide integration status for account settings.

#### Scenario: View integration status
- **WHEN** a user requests integration status
- **THEN** the system returns whether the integration is connected and active

### Requirement: OAuth access control and CSRF protection
The system SHALL enforce tenant-scoped access and CSRF protection for OAuth authorization flows.

#### Scenario: Invalid OAuth state
- **WHEN** an OAuth callback is received with an invalid state value
- **THEN** the system rejects the callback and records a security event

### Requirement: OAuth audit logging
The system SHALL record audit events for OAuth callbacks and token refresh operations.

#### Scenario: OAuth callback audit trail
- **WHEN** an OAuth callback completes successfully
- **THEN** the system records the actor, provider, and timestamp

### Requirement: Operational safeguards for OAuth
The system SHALL apply rate limits for OAuth endpoints and publish availability and error SLO targets.

#### Scenario: OAuth callback throttled
- **WHEN** a client exceeds configured request limits for OAuth callbacks
- **THEN** the system returns a throttled response and preserves service availability
