## ADDED Requirements
### Requirement: Socket provider
The system SHALL provide a socket provider and hook for realtime features.

#### Scenario: Use socket provider
- **WHEN** a feature subscribes to realtime updates
- **THEN** it uses the shared socket provider and hook

### Requirement: Presence tracking
The system SHALL track presence and connection status.

#### Scenario: Connection status
- **WHEN** the socket connects or disconnects
- **THEN** the system updates connection status for consumers
