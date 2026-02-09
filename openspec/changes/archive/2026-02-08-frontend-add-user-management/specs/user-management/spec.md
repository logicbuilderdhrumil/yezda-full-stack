## MODIFIED Requirements
### Requirement: User list
The system SHALL provide a list of users with basic search and filter controls via API and UI.

#### Scenario: List users
- **WHEN** an admin requests the user list
- **THEN** the system returns paginated users with filters applied

#### Scenario: List users in UI
- **WHEN** an admin opens the users list
- **THEN** the system displays users with paging or virtualization

### Requirement: User create and edit
The system SHALL allow admins to create and update user accounts via API and UI.

#### Scenario: Create user
- **WHEN** an admin submits a valid user payload
- **THEN** the system creates the user and returns the record

#### Scenario: Create user via UI
- **WHEN** an admin submits a valid user form
- **THEN** the system creates the user and shows it in the list

### Requirement: User details
The system SHALL provide a details endpoint and view for user accounts.

#### Scenario: View user details
- **WHEN** an admin requests a user record
- **THEN** the system returns the user's profile and status

#### Scenario: View user details in UI
- **WHEN** an admin opens a user details page
- **THEN** the system displays the user's profile and status
