# user-auth Specification

## Purpose
TBD - created by archiving change backend-add-user-auth. Update Purpose after archive.
## Requirements
### Requirement: Credential authentication
The system SHALL allow users to sign in and sign up with email and password credentials.

#### Scenario: Sign in success
- **WHEN** a user submits valid credentials
- **THEN** the system issues access and refresh tokens

#### Scenario: Management user login (frontend)
- **WHEN** a management user submits valid credentials via the frontend
- **THEN** the system signs the user in and routes them to the appropriate dashboard

### Requirement: Password reset
The system SHALL support password reset flows for users and candidates.

#### Scenario: Password reset request
- **WHEN** a user requests a password reset with a registered email
- **THEN** the system issues a reset token and delivers reset instructions

### Requirement: TOTP verification
The system SHALL support TOTP enrollment and verification for multi-factor authentication.

#### Scenario: MFA challenge
- **WHEN** a user with MFA enabled signs in
- **THEN** the system requires a valid TOTP code before issuing tokens

### Requirement: Authentication abuse protection
The system SHALL apply rate limits, lockout thresholds, and anomaly detection for authentication endpoints.

#### Scenario: Excessive sign-in attempts
- **WHEN** a client exceeds configured failed sign-in thresholds
- **THEN** the system throttles requests and records a security event

### Requirement: Authentication audit logging
The system SHALL record audit events for authentication, recovery, and MFA activities.

#### Scenario: Password reset audit event
- **WHEN** a user requests a password reset
- **THEN** the system records the actor, channel, and timestamp

### Requirement: Token security and compliance
The system SHALL issue tokens with configurable TTLs, rotation, and revocation support and minimize sensitive claims.

#### Scenario: Refresh token rotation
- **WHEN** a valid refresh token is exchanged
- **THEN** the system rotates the token and revokes the prior token

