## MODIFIED Requirements
### Requirement: Authenticated route guard
The system SHALL prevent unauthenticated users from accessing protected endpoints and routes.

#### Scenario: Protected API access
- **WHEN** a request lacks valid authentication
- **THEN** the system returns an access denied response

#### Scenario: Protected route access
- **WHEN** an unauthenticated user navigates to a protected route
- **THEN** the system redirects to sign-in

### Requirement: Authority guard
The system SHALL restrict endpoints and routes based on role authority.

#### Scenario: Role mismatch
- **WHEN** a user lacks required authority for an endpoint
- **THEN** the system rejects the request with a 403 response

#### Scenario: Role mismatch on route
- **WHEN** a user lacks the required authority for a route
- **THEN** the system shows an access denied page
