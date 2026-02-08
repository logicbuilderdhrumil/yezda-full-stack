## MODIFIED Requirements
### Requirement: Notifications list
The system SHALL provide an API and UI to list notifications with status and timestamps.

#### Scenario: View notifications
- **WHEN** a user requests notifications
- **THEN** the system returns notifications in reverse chronological order

#### Scenario: View notifications in UI
- **WHEN** a user opens the notifications view
- **THEN** the system displays notifications in reverse chronological order

### Requirement: Read/unread state
The system SHALL support read and unread notification states via API and UI.

#### Scenario: Mark notification as read
- **WHEN** a user marks a notification as read
- **THEN** the system updates the notification status to read

#### Scenario: Mark notification as read via UI
- **WHEN** a user opens or marks a notification as read
- **THEN** the notification status updates to read
