## ADDED Requirements
### Requirement: Notifications list
The system SHALL present a list of notifications with status and timestamps.

#### Scenario: View notifications
- **WHEN** a user opens the notifications view
- **THEN** the system displays notifications in reverse chronological order

### Requirement: Read/unread state
The system SHALL support read and unread notification states.

#### Scenario: Mark notification as read
- **WHEN** a user opens or marks a notification as read
- **THEN** the notification status updates to read
