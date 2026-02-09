## MODIFIED Requirements
### Requirement: Application shell layout
The system SHALL render a responsive application shell with header, sidebar navigation, and a content area. On web export, the shell SHALL render correctly with proper NativeWind/Tailwind CSS styles.

#### Scenario: Protected page render
- **WHEN** an authenticated user navigates to a protected route
- **THEN** the shell renders the navigation and the route content in the content area

#### Scenario: Web export render
- **WHEN** the app is exported as a web build and served statically
- **THEN** all screens render with correct layout and styling
- **AND** no console errors appear in the browser
