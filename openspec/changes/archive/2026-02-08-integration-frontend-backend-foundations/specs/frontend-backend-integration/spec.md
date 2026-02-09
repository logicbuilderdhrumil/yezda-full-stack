## ADDED Requirements
### Requirement: Foundation contract map
The system SHALL publish a contract map for foundation capabilities used by the admin frontend.

#### Scenario: Contract map available
- **WHEN** a developer integrates a foundation service
- **THEN** the contract map lists route, method, request, response, and error schema

### Requirement: Consistent error envelope
The system SHALL return a consistent error envelope with code, message, details, and correlationId for foundation APIs.

#### Scenario: Validation error
- **WHEN** a request fails validation
- **THEN** the response matches the error envelope contract

### Requirement: Realtime event schema alignment
The system SHALL document and enforce socket event names and payload schemas for foundation notifications.

#### Scenario: Notification event emitted
- **WHEN** a notification is emitted
- **THEN** the payload matches the documented schema
