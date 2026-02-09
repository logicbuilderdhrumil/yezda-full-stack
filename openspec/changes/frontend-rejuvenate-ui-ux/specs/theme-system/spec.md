## MODIFIED Requirements

### Requirement: Theme tokens
The system SHALL provide and apply Trust & Authority design tokens — Primary #0F172A, CTA #0369A1, Background #F8FAFC, Text #020617 — using Plus Jakarta Sans typography for all supported theme presets.

#### Scenario: Fetch theme tokens
- **WHEN** a client requests a theme preset
- **THEN** the system returns the Trust & Authority token values for that preset

#### Scenario: Apply theme tokens
- **WHEN** a component renders
- **THEN** it uses the active Trust & Authority theme tokens for styling, including Plus Jakarta Sans font-family

#### Scenario: Light mode tokens
- **WHEN** the light theme is active
- **THEN** the background is #F8FAFC, primary is #0F172A, CTA is #0369A1, text is #020617

#### Scenario: Dark mode tokens
- **WHEN** the dark theme is active
- **THEN** the token values complement the Trust & Authority palette with navy-derived dark tones

### Requirement: Theme switching
The system SHALL store user theme preferences and allow runtime switching between light, dark, and system modes.

#### Scenario: Update theme preference
- **WHEN** a user selects a new theme
- **THEN** the system stores the preference and returns the updated value

#### Scenario: Switch theme
- **WHEN** a user selects a new theme
- **THEN** the UI updates to the selected theme with correct Trust & Authority tokens applied

## ADDED Requirements

### Requirement: CSS design token variables
The system SHALL provide spacing scale (xs through 3xl), shadow depth (sm through xl), and border-radius tokens as CSS custom properties consistent with the persisted design system MASTER.md.

#### Scenario: Spacing tokens applied
- **WHEN** a component uses spacing utilities
- **THEN** it references the standardized spacing scale from CSS variables

#### Scenario: Shadow tokens applied
- **WHEN** a card or modal renders
- **THEN** it uses the shadow depth tokens defined in the design system
