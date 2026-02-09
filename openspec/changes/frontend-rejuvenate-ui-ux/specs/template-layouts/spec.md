## MODIFIED Requirements

### Requirement: Global navigation template
The system SHALL provide header and side navigation components for the shell, styled with Trust & Authority design tokens — navy sidebar background, CTA-blue active item highlight, Plus Jakarta Sans typography, and smooth collapse animations.

#### Scenario: Render template navigation
- **WHEN** the app shell renders
- **THEN** the header and side navigation are displayed with Trust & Authority styling

#### Scenario: Sidebar active item
- **WHEN** a user navigates to a section
- **THEN** the sidebar highlights the active item with CTA blue (#0369A1) and smooth transition

#### Scenario: Sidebar collapse animation
- **WHEN** a user toggles the sidebar
- **THEN** the sidebar collapses or expands with a smooth 200ms animation

### Requirement: Global controls
The system SHALL provide global controls for theme and language selection, styled consistently with the Trust & Authority design system.

#### Scenario: Change locale
- **WHEN** a user selects a different language
- **THEN** the UI updates to the selected locale

#### Scenario: Theme toggle styling
- **WHEN** the theme toggle renders
- **THEN** it uses the Trust & Authority palette and smooth 200ms transition

## ADDED Requirements

### Requirement: Responsive layout integrity
The system SHALL maintain layout integrity with no horizontal scroll at breakpoints 375px, 768px, 1024px, and 1440px.

#### Scenario: Mobile layout at 375px
- **WHEN** the viewport is 375px wide
- **THEN** the sidebar is hidden, content fills the viewport, and no horizontal scroll occurs

#### Scenario: Tablet layout at 768px
- **WHEN** the viewport is 768px wide
- **THEN** the sidebar is collapsible and content adjusts without horizontal scroll

#### Scenario: Desktop layout at 1440px
- **WHEN** the viewport is 1440px wide
- **THEN** content uses consistent max-w-7xl with proper padding

### Requirement: Header polish
The system SHALL provide a refined header with polished search input (navy focus ring), notification dropdown with updated token styles, and user profile dropdown styled per Trust & Authority.

#### Scenario: Header search focus
- **WHEN** a user focuses the global search input
- **THEN** the input displays a navy border with a 3px navy focus shadow

#### Scenario: Header notification dropdown
- **WHEN** a user opens the notification dropdown
- **THEN** it displays with professional shadow-lg and updated token styling
