## ADDED Requirements
### Requirement: Asset organization
The system SHALL organize static assets by type and usage.

#### Scenario: Reference asset
- **WHEN** a UI component needs an asset
- **THEN** it uses the standardized asset path

### Requirement: Template assets
The system SHALL provide templates used by export or preview flows.

#### Scenario: Export template
- **WHEN** a document export is generated
- **THEN** the system uses a stored template asset
