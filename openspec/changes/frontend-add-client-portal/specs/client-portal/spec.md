## ADDED Requirements

### Requirement: Client Portal Access
The system SHALL provide a client portal route namespace accessible to users with the 'client' or 'client_admin' role, scoped to their organisation's tenant.

#### Scenario: Client user accesses portal
- **WHEN** a user with the 'client' role navigates to the web application
- **THEN** the system redirects them to the client portal dashboard with organisation-scoped data

#### Scenario: Admin user access unaffected
- **WHEN** a user with the 'admin' role navigates to the web application
- **THEN** the system displays the full admin dashboard as before

#### Scenario: Client user denied admin routes
- **WHEN** a client user attempts to navigate to an admin-only route (e.g., /organizations, /forms)
- **THEN** the system redirects to the access-denied page

### Requirement: Client Dashboard
The system SHALL display a client dashboard showing screening summary metrics for the user's organisation.

#### Scenario: Dashboard displays screening metrics
- **WHEN** a client user loads the client dashboard
- **THEN** the system displays counts for pending, in-progress, completed, and rejected screenings for their organisation

#### Scenario: Dashboard shows recent activity
- **WHEN** a client user loads the client dashboard
- **THEN** the system displays the most recent screening activity for their organisation

### Requirement: Client Candidate View
The system SHALL allow client users to view their organisation's candidates with screening status and pipeline progress.

#### Scenario: Client views candidate list
- **WHEN** a client user navigates to the candidates section
- **THEN** the system displays only candidates assigned to their organisation with current screening status

#### Scenario: Client views candidate detail
- **WHEN** a client user selects a candidate
- **THEN** the system displays the candidate's screening pipeline progress, stage statuses, and completion history

### Requirement: Client Organisation Settings
The system SHALL allow client_admin users to update their organisation's settings including logo, contact information, and notification preferences.

#### Scenario: Client admin updates org settings
- **WHEN** a client_admin updates organisation contact information
- **THEN** the system persists the changes and displays a success confirmation

#### Scenario: Non-admin client cannot edit settings
- **WHEN** a client user (non-admin) attempts to edit organisation settings
- **THEN** the system denies the action and displays a read-only view

### Requirement: Client Portal Navigation
The system SHALL display a client-specific navigation menu that omits platform administration links.

#### Scenario: Client navigation menu
- **WHEN** a client user views the application shell
- **THEN** the navigation shows Dashboard, Candidates, Organisation Settings, and Profile — but not Forms, Users, Organisations, or Billing

### Requirement: Client Role RBAC
The system SHALL support 'client' and 'client_admin' roles in the RBAC model with appropriate permission boundaries.

#### Scenario: Client role permissions
- **WHEN** a user is assigned the 'client' role
- **THEN** the user can view candidates, dashboard, and their own profile within their tenant — but cannot create, update, or delete candidates

#### Scenario: Client admin role permissions
- **WHEN** a user is assigned the 'client_admin' role
- **THEN** the user has all 'client' permissions plus the ability to update organisation settings
