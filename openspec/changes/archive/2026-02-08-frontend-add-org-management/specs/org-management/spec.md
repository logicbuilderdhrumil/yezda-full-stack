## MODIFIED Requirements
### Requirement: Organization list
The system SHALL provide an API and UI to list organizations with search and filters.

#### Scenario: List organizations
- **WHEN** a system admin requests the organization list
- **THEN** the system returns paginated organizations with filters applied

#### Scenario: List organizations in UI
- **WHEN** a system admin opens the organizations list
- **THEN** the system displays organizations with paging or virtualization

### Requirement: Organization create and edit
The system SHALL allow system admins to create and update organizations via API and UI.

#### Scenario: Create organization
- **WHEN** a system admin submits a valid organization payload
- **THEN** the system creates the organization and returns the record

#### Scenario: Create organization via UI
- **WHEN** a system admin submits a valid organization form
- **THEN** the system creates the organization and shows it in the list

### Requirement: Organization details
The system SHALL provide organization detail data by identifier via API and UI.

#### Scenario: View organization details
- **WHEN** a system admin requests organization details
- **THEN** the system returns the organization metadata and status

#### Scenario: View organization details in UI
- **WHEN** a system admin opens an organization details page
- **THEN** the system displays organization metadata and status
