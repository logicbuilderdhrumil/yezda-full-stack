## ADDED Requirements
### Requirement: Credential authentication
The system SHALL allow users to sign in and sign up using email and password credentials.

#### Scenario: Sign in success
- **WHEN** a user submits valid credentials
- **THEN** the system signs the user in and routes them to the home page

### Requirement: Password reset
The system SHALL support password reset flows for users and candidates.

#### Scenario: Password reset link requested
- **WHEN** a user requests a password reset with a registered email
- **THEN** the system sends a reset link and shows a confirmation message

### Requirement: TOTP verification
The system SHALL support TOTP verification for multi-factor authentication.

#### Scenario: MFA challenge
- **WHEN** a user signs in and has MFA enabled
- **THEN** the system prompts for a TOTP code before granting access
