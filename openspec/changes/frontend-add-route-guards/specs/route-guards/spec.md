## ADDED Requirements
### Requirement: Authenticated route guard
The system SHALL prevent unauthenticated users from accessing protected routes.

#### Scenario: Protected route access
- **WHEN** an unauthenticated user navigates to a protected route
- **THEN** the system redirects to sign-in

### Requirement: Authority guard
The system SHALL restrict routes based on role authority.

#### Scenario: Role mismatch
- **WHEN** a user lacks the required authority for a route
- **THEN** the system shows an access denied page
