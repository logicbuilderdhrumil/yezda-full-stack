## ADDED Requirements
### Requirement: Access denied page
The system SHALL display an access denied page when a user lacks permission.

#### Scenario: Unauthorized access
- **WHEN** a user navigates to a restricted route
- **THEN** the system shows an access denied page with a return action

### Requirement: Not-found page
The system SHALL display a not-found page for unknown routes.

#### Scenario: Unknown route
- **WHEN** a user navigates to a non-existent route
- **THEN** the system shows a not-found page
