## ADDED Requirements
### Requirement: Mock API support
The system SHALL provide a mock API mode for local development.

#### Scenario: Enable mock mode
- **WHEN** mock mode is enabled
- **THEN** API requests return fixture data

### Requirement: Fake data fixtures
The system SHALL include fake data fixtures for core modules.

#### Scenario: Load fixture data
- **WHEN** a mock endpoint is called
- **THEN** it returns the associated fixture
