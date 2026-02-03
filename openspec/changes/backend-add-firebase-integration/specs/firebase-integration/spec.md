## ADDED Requirements
### Requirement: Firebase token registration
The system SHALL register and store device tokens for push notifications.

#### Scenario: Register device token
- **WHEN** a client submits a valid device token
- **THEN** the system stores the token associated with the user

### Requirement: Firebase notification dispatch
The system SHALL send notifications using Firebase messaging.

#### Scenario: Dispatch notification
- **WHEN** a notification event is triggered
- **THEN** the system sends a Firebase message to registered devices

### Requirement: Token access control and privacy
The system SHALL enforce tenant-scoped access and privacy controls for device token registration.

#### Scenario: Cross-tenant token registration blocked
- **WHEN** a user attempts to register a device token for another tenant
- **THEN** the system denies the request and records an audit event

### Requirement: Firebase audit logging
The system SHALL record audit events for device token registration and notification dispatch.

#### Scenario: Token registration audit trail
- **WHEN** a user registers a device token
- **THEN** the system records the actor, device identifier, and timestamp

### Requirement: Operational safeguards for Firebase integration
The system SHALL apply rate limits for registration and dispatch endpoints and publish availability and error SLO targets.

#### Scenario: Dispatch throttled
- **WHEN** a client exceeds configured request limits for notification dispatch
- **THEN** the system returns a throttled response and preserves service availability
