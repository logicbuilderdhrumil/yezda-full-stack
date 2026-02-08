## MODIFIED Requirements

### Requirement: Consent prompt for data reuse
The app SHALL present a consent prompt before reusing data from a prior application, including cross-organisation data reuse when the candidate has screening history with another organisation.

#### Scenario: Consent prompt displayed
- **WHEN** the app identifies reusable data for a new application
- **THEN** the app presents a consent prompt describing the reuse scope

#### Scenario: Cross-org consent prompt displayed
- **WHEN** a candidate has prior screening data from Organisation A and is now being screened by Organisation B
- **THEN** the app presents a consent prompt identifying the source organisation, describing what data is available for reuse, and the requested scopes

### Requirement: Consent decision capture
The app SHALL capture the candidate's consent decision with scope, timestamp, source organisation, and target organisation.

#### Scenario: Consent accepted
- **WHEN** a candidate accepts data reuse
- **THEN** the app records the acceptance with the requested scope

#### Scenario: Cross-org consent accepted
- **WHEN** a candidate accepts data reuse from a source organisation for a target organisation
- **THEN** the app records the acceptance with sourceOrgId, targetOrgId, and the granted scopes
