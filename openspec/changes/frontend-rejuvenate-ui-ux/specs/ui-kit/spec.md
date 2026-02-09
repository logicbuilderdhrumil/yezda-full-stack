## MODIFIED Requirements

### Requirement: Core UI components
The system SHALL provide a reusable set of UI primitives for inputs, buttons, cards, tables, badges, toasts, and feedback elements styled with the Trust & Authority design system. All interactive UI primitives SHALL include `cursor-pointer`, smooth transitions (150–300ms), and visible focus-visible states.

#### Scenario: Use UI primitives
- **WHEN** a feature page renders a form
- **THEN** it uses shared UI input components with Plus Jakarta Sans typography, navy focus rings, and on-blur validation

#### Scenario: Interactive card hover
- **WHEN** a user hovers over a clickable card
- **THEN** the card displays a shadow-lift effect and cursor changes to pointer

#### Scenario: Button interaction feedback
- **WHEN** a user hovers or focuses a button
- **THEN** the button transitions smoothly (200ms) with visual feedback

### Requirement: Themed variants
The system SHALL support themed variants for UI components using the Trust & Authority palette (Primary #0F172A, CTA #0369A1, Background #F8FAFC).

#### Scenario: Theme-aware components
- **WHEN** the active theme changes between light and dark mode
- **THEN** UI components update their styles to the matching Trust & Authority palette tokens

#### Scenario: CVA variant consistency
- **WHEN** a button, badge, or input renders in any variant
- **THEN** it uses class-variance-authority definitions aligned with the Trust & Authority design tokens

## ADDED Requirements

### Requirement: Loading state patterns
The system SHALL provide skeleton-screen and spinner components that use muted theme tokens and pulse animations for async operations.

#### Scenario: Skeleton loading display
- **WHEN** a page is loading data
- **THEN** skeleton placeholders render with muted-color pulse animation

### Requirement: Status indicator variants
The system SHALL provide metric-pulse badge variants for live screening and invite statuses.

#### Scenario: Live status pulse
- **WHEN** a screening or invite status is active/pending
- **THEN** the status badge displays a subtle pulse animation to indicate live state

### Requirement: Invite status badges
The system SHALL display invite status badges (Pending, Accepted, Expired) on user and candidate list views.

#### Scenario: Invite status display on user list
- **WHEN** an org member has a pending invite
- **THEN** a Pending badge appears next to their name in the users list

#### Scenario: Invite status display on candidate list
- **WHEN** a candidate has a pending screening invite
- **THEN** a Pending badge appears next to their name in the candidates list
