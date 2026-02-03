## ADDED Requirements
### Requirement: Global state stores
The system SHALL provide centralized stores for auth, theme, locale, and presence.

#### Scenario: Read shared state
- **WHEN** a component needs global state
- **THEN** it reads the value from the appropriate store

### Requirement: Store persistence
The system SHALL persist selected store values across sessions.

#### Scenario: Persist theme
- **WHEN** a user updates their theme
- **THEN** the theme preference is retained on reload
