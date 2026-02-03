## ADDED Requirements
### Requirement: Account settings
The system SHALL allow users to view and update their profile settings.

#### Scenario: Update profile
- **WHEN** a user submits valid profile changes
- **THEN** the system saves the changes and shows a success message

### Requirement: Integration verification
The system SHALL support external integration verification flows.

#### Scenario: Verify integration
- **WHEN** a user completes an OAuth verification flow
- **THEN** the system records the integration as connected
