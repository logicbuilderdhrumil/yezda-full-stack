## MODIFIED Requirements
### Requirement: Form management
The system SHALL allow admins to create, edit, and list form definitions via API and UI.

#### Scenario: Create form
- **WHEN** an admin submits a valid form definition
- **THEN** the system stores the definition and returns it

#### Scenario: Create a form via UI
- **WHEN** an admin submits a valid form definition
- **THEN** the form is saved and appears in the form list

## ADDED Requirements
### Requirement: Form builder fields
The system SHALL provide a form builder for configuring fields and validations.

#### Scenario: Configure fields
- **WHEN** an admin adds fields and validations in the builder
- **THEN** the form definition reflects those field settings
