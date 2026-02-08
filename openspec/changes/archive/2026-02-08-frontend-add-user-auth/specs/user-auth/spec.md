## MODIFIED Requirements
### Requirement: Credential authentication
The system SHALL allow users to sign in and sign up with email and password credentials.

#### Scenario: Sign in success
- **WHEN** a user submits valid credentials
- **THEN** the system issues access and refresh tokens

#### Scenario: Management user login (frontend)
- **WHEN** a management user submits valid credentials via the frontend
- **THEN** the system signs the user in and routes them to the appropriate dashboard
