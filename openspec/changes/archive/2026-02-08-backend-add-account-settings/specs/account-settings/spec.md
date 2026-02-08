## ADDED Requirements
### Requirement: Account settings API
The system SHALL provide endpoints to read and update user profile settings.

#### Scenario: Update profile
- **WHEN** a user submits valid profile changes
- **THEN** the system updates the profile and returns the new profile data

### Requirement: Integration verification
The system SHALL record external integration verification results.

#### Scenario: Verify integration
- **WHEN** a user completes an OAuth verification callback
- **THEN** the system stores the integration as connected and returns status

### Requirement: Account access control and tenant isolation
The system SHALL enforce role-based access and tenant isolation for profile and integration settings.

#### Scenario: Unauthorized profile change blocked
- **WHEN** a user attempts to update another user's profile
- **THEN** the system denies access and records an audit event

### Requirement: Account settings audit logging
The system SHALL record audit events for profile updates and integration status changes.

#### Scenario: Profile update audit trail
- **WHEN** a user updates their profile settings
- **THEN** the system records the actor, action, and timestamp

### Requirement: Operational safeguards for account settings
The system SHALL apply rate limits for profile updates and integration callbacks and publish availability and error SLO targets.

#### Scenario: Profile update throttled
- **WHEN** a client exceeds configured request limits for profile updates
- **THEN** the system returns a throttled response and preserves service availability
