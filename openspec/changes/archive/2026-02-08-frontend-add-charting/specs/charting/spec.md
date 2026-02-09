## ADDED Requirements
### Requirement: Chart configuration
The system SHALL provide default chart configuration for dashboards.

#### Scenario: Render chart
- **WHEN** a dashboard renders a chart
- **THEN** it uses the shared chart configuration

### Requirement: Theme-aware charts
The system SHALL apply theme colors to chart rendering.

#### Scenario: Theme update
- **WHEN** the active theme changes
- **THEN** charts update to the new theme colors
