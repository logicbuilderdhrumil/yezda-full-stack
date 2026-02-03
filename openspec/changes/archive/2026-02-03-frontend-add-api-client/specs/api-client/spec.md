## ADDED Requirements
### Requirement: API client wrapper
The system SHALL provide a shared API client wrapper for HTTP requests.

#### Scenario: Perform API request
- **WHEN** a service issues a request
- **THEN** it uses the shared API client with configured headers

### Requirement: Error handling
The system SHALL provide shared error handling for API failures.

#### Scenario: API error
- **WHEN** a request fails
- **THEN** the system surfaces a consistent error message
