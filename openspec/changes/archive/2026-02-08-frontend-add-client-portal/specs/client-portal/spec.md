## ADDED Requirements

### Requirement: Client Portal Access
The system SHALL provide a client portal at the root route (`/`) accessible to users with the 'client' or 'client_admin' role, scoped to their organisation's tenant.

#### Scenario: Client user accesses portal
- **WHEN** a user with the 'client' role navigates to `/`
- **THEN** the system displays the client portal dashboard with organisation-scoped data

#### Scenario: Admin user redirected to admin area
- **WHEN** a user with the 'admin' role navigates to `/`
- **THEN** the system redirects them to `/admin/`

#### Scenario: Client user denied admin routes
- **WHEN** a client user attempts to navigate to an admin route (e.g., `/admin/organizations`, `/admin/forms`)
- **THEN** the system redirects to `/` or the access-denied page

### Requirement: Admin Area at /admin Namespace
The system SHALL relocate all platform administration routes to the `/admin/` namespace.

#### Scenario: Admin routes accessible at /admin
- **WHEN** an admin user navigates to `/admin/dashboard`
- **THEN** the system displays the admin dashboard

#### Scenario: Backward compatibility redirects
- **WHEN** a user navigates to an old admin route (e.g., `/dashboard`, `/candidates`)
- **THEN** the system redirects to the new `/admin/*` equivalent path

### Requirement: Org Perspective Switcher
The system SHALL provide an Org Perspective Switcher for admin users visiting client routes, allowing them to view the portal as any organisation.

#### Scenario: Admin sees org switcher on client routes
- **WHEN** an admin user navigates to `/` (client portal)
- **THEN** the system displays an Org Perspective Switcher dropdown in the header bar

#### Scenario: Admin switches org perspective
- **WHEN** an admin user selects an organisation from the Org Perspective Switcher
- **THEN** the system stores the active org in session storage and displays "Viewing as: [Org Name]" indicator

#### Scenario: API calls include perspective header
- **WHEN** an admin user is viewing as a specific organisation and makes an API call
- **THEN** the system includes `X-Org-Perspective` header with the active org ID

#### Scenario: Admin clears perspective
- **WHEN** an admin user clears the org perspective
- **THEN** the system removes the session storage entry and hides the "Viewing as" indicator

### Requirement: Client Dashboard
The system SHALL display a client dashboard showing screening summary metrics for the user's organisation.

#### Scenario: Dashboard displays screening metrics
- **WHEN** a client user loads the client dashboard at `/`
- **THEN** the system displays counts for pending, in-progress, completed, and rejected screenings for their organisation

#### Scenario: Dashboard shows recent activity
- **WHEN** a client user loads the client dashboard
- **THEN** the system displays the most recent screening activity for their organisation

### Requirement: Client Candidate View
The system SHALL allow client users to view their organisation's candidates with screening status and pipeline progress.

#### Scenario: Client views candidate list
- **WHEN** a client user navigates to the candidates section at `/candidates`
- **THEN** the system displays only candidates assigned to their organisation with current screening status

#### Scenario: Client views candidate detail
- **WHEN** a client user selects a candidate at `/candidates/:id`
- **THEN** the system displays the candidate's screening pipeline progress, stage statuses, and completion history

### Requirement: Client Organisation Settings
The system SHALL allow client_admin users to update their organisation's settings including logo, contact information, and notification preferences.

#### Scenario: Client admin updates org settings
- **WHEN** a client_admin updates organisation contact information at `/settings`
- **THEN** the system persists the changes and displays a success confirmation

#### Scenario: Non-admin client cannot edit settings
- **WHEN** a client user (non-admin) attempts to edit organisation settings
- **THEN** the system denies the action and displays a read-only view

### Requirement: Client Portal Navigation
The system SHALL display a client-specific navigation menu via ClientShell and ClientSidebar that omits platform administration links.

#### Scenario: Client navigation menu
- **WHEN** a client user views the application at `/`
- **THEN** the navigation shows Dashboard, Candidates, Organisation Settings, and Profile — but not Forms, Users, Organisations, or Billing

#### Scenario: Admin navigation menu
- **WHEN** an admin user views the application at `/admin/`
- **THEN** the navigation via AdminShell shows all platform administration links

### Requirement: Client Role RBAC
The system SHALL support 'client' and 'client_admin' roles in the RBAC model with appropriate permission boundaries.

#### Scenario: Client role permissions
- **WHEN** a user is assigned the 'client' role
- **THEN** the user can view candidates, dashboard, and their own profile within their tenant — but cannot create, update, or delete candidates

#### Scenario: Client admin role permissions
- **WHEN** a user is assigned the 'client_admin' role
- **THEN** the user has all 'client' permissions plus the ability to update organisation settings
