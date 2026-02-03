## ADDED Requirements
### Requirement: Consent prompt for data reuse
The app SHALL present a consent prompt before reusing data from a prior application.

#### Scenario: Consent prompt displayed
- **WHEN** the app identifies reusable data for a new application
- **THEN** the app presents a consent prompt describing the reuse scope

### Requirement: Consent decision capture
The app SHALL capture the candidate's consent decision with scope and timestamp.

#### Scenario: Consent accepted
- **WHEN** a candidate accepts data reuse
- **THEN** the app records the acceptance with the requested scope

### Requirement: Consent review and update
The app SHALL allow candidates to review and update their consent decision.

#### Scenario: Consent withdrawn
- **WHEN** a candidate withdraws consent
- **THEN** the app updates the consent status and confirms the change

### Requirement: Prefill disclosure
The app SHALL indicate which fields are prefilled from prior data when consent is granted.

#### Scenario: Prefilled field disclosure
- **WHEN** the app prepopulates a field with reused data
- **THEN** the app marks the field as prefilled and references the data source
