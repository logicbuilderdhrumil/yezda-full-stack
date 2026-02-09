## ADDED Requirements
### Requirement: App sign-in session issuance
The system SHALL provide app sign-in endpoints that issue access and refresh tokens for candidates.

#### Scenario: App sign-in success
- **WHEN** a candidate submits valid credentials from the app
- **THEN** the system issues an app session with access and refresh tokens

### Requirement: App session refresh
The system SHALL allow app clients to refresh sessions and rotate refresh tokens.

#### Scenario: Refresh token exchange
- **WHEN** a valid refresh token is submitted by the app
- **THEN** the system issues new tokens and invalidates the prior refresh token

### Requirement: App sign-out and revocation
The system SHALL provide an app sign-out endpoint that revokes the active session.

#### Scenario: App sign-out
- **WHEN** a candidate signs out from the app
- **THEN** the system revokes the session tokens

### Requirement: Session metadata tracking
The system SHALL store app session metadata including device and client details.

#### Scenario: Session metadata recorded
- **WHEN** a new app session is created
- **THEN** the system records device identifiers and client version information

### Requirement: App auth audit logging
The system SHALL record audit events for app sign-in, refresh, and sign-out actions.

#### Scenario: App auth event recorded
- **WHEN** an app authentication event occurs
- **THEN** the system records the actor, action, and timestamp
