## ADDED Requirements
### Requirement: Application shell layout
The system SHALL render a responsive application shell with header, sidebar navigation, and a content area.

#### Scenario: Protected page render
- **WHEN** an authenticated user navigates to a protected route
- **THEN** the shell renders the navigation and the route content in the content area

### Requirement: Route configuration
The system SHALL define public and protected routes and lazy-load route components.

#### Scenario: Route loading fallback
- **WHEN** a route component is loading
- **THEN** the UI displays a loading fallback until the view renders

### Requirement: Role-based navigation
The system SHALL render navigation items based on the current user's authority.

#### Scenario: Authority-filtered menu
- **WHEN** the user lacks authority for a navigation item
- **THEN** the item is not shown in the sidebar

### Requirement: Theme and locale settings
The system SHALL support configurable theme and locale settings at the shell level.

#### Scenario: Theme switch
- **WHEN** a user changes the active theme
- **THEN** the shell updates colors and typography to match the selected theme
