## ADDED Requirements
### Requirement: Credential sign-in
The app SHALL allow candidates to sign in with email and password credentials.

#### Scenario: Sign-in success
- **WHEN** a candidate submits valid credentials
- **THEN** the app transitions to an authenticated session

### Requirement: Session persistence
The app SHALL persist session tokens securely and restore the session on app launch.

#### Scenario: Restore session
- **WHEN** the app launches with a valid stored session
- **THEN** the app restores authenticated access without prompting for credentials

### Requirement: MFA challenge handling
The app SHALL prompt for a secondary factor when the backend indicates a multi-factor challenge.

#### Scenario: MFA required
- **WHEN** the backend responds with a multi-factor challenge
- **THEN** the app collects the required factor and completes sign-in

### Requirement: Sign-out and expiry handling
The app SHALL allow candidates to sign out and MUST clear session data when tokens expire.

#### Scenario: Token expired
- **WHEN** the app detects an expired session token
- **THEN** the app clears stored tokens and returns to the login screen

### Requirement: Authentication error feedback
The app SHALL present actionable error feedback for failed sign-in attempts.

#### Scenario: Invalid credentials
- **WHEN** a candidate submits invalid credentials
- **THEN** the app displays an error message and keeps the login form available
