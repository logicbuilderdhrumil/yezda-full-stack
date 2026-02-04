## ADDED Requirements
### Requirement: App auth contract map
The system SHALL publish aligned contracts for app auth session and profile endpoints.

#### Scenario: Auth contract published
- **WHEN** the app authenticates a user
- **THEN** the contract defines token exchange and profile payload schemas

### Requirement: Notification token registration
The system SHALL standardize push notification token registration and topic mapping.

#### Scenario: Token registration
- **WHEN** the app registers a device token
- **THEN** the backend stores the token using the documented payload format

### Requirement: App API error envelope
The system SHALL return a consistent error envelope for app-facing APIs.

#### Scenario: Auth failure
- **WHEN** an app authentication request fails
- **THEN** the response matches the error envelope contract
