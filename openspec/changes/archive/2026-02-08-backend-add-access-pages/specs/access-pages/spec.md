## ADDED Requirements
### Requirement: Access denied response
The system SHALL return a standardized access denied response when a request lacks permission.

#### Scenario: Unauthorized API access
- **WHEN** an authenticated user calls a protected endpoint without required authority
- **THEN** the system returns a 403 response with a consistent error code and message

### Requirement: Not-found response
The system SHALL return a standardized not-found response for unknown routes.

#### Scenario: Unknown route
- **WHEN** a request targets a route that does not exist
- **THEN** the system returns a 404 response with a consistent error code and message

### Requirement: Error response privacy
The system SHALL avoid exposing sensitive details in access denied and not-found responses and include a correlation identifier.

#### Scenario: Sensitive error handling
- **WHEN** a protected endpoint returns an access denied response
- **THEN** the system returns a sanitized error payload with a correlation identifier

### Requirement: Access error audit logging
The system SHALL record audit events for access denied and not-found responses.

#### Scenario: Audit access denial
- **WHEN** an access denied response is emitted
- **THEN** the system records the actor, route, and timestamp

### Requirement: Operational safeguards for error handling
The system SHALL apply rate limits for repeated access errors and publish availability and error SLO targets for error responses.

#### Scenario: Error burst throttled
- **WHEN** a client triggers repeated access denied responses
- **THEN** the system throttles responses and preserves service availability
