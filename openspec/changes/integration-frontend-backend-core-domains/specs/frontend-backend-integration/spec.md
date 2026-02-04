## ADDED Requirements
### Requirement: Core domain contract alignment
The system SHALL publish aligned contracts for org, user, account settings, and access page endpoints.

#### Scenario: Core domain contract published
- **WHEN** a frontend service is implemented
- **THEN** the contract defines request and response DTOs for the domain

### Requirement: Consistent pagination and filtering
The system SHALL use consistent pagination, filtering, and sorting parameters across core domain endpoints.

#### Scenario: Paged query
- **WHEN** a frontend view requests a list
- **THEN** the backend returns a paged response following the standard format

### Requirement: Access rule parity
The system SHALL align route-guard expectations with backend access rule enforcement.

#### Scenario: Access denied
- **WHEN** a user lacks required permissions
- **THEN** the backend returns an authorization error that matches the frontend guard behavior
