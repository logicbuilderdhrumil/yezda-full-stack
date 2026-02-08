## ADDED Requirements

### Requirement: Global Candidate Identity
The system SHALL maintain a single global identity per candidate based on verified email, decoupled from any single organisation.

#### Scenario: New candidate with unique email
- **WHEN** a candidate is created with an email that does not exist globally
- **THEN** the system creates a GlobalCandidate record and links it to the tenant-specific ManagedCandidate

#### Scenario: Candidate with existing global email
- **WHEN** a candidate is created with an email that already exists as a GlobalCandidate
- **THEN** the system links the new ManagedCandidate to the existing GlobalCandidate and creates a CandidateOrgAssignment

### Requirement: Candidate Organisation Assignment
The system SHALL track the relationship between a global candidate and each organisation with per-org status and metadata.

#### Scenario: Candidate linked to multiple organisations
- **WHEN** a GlobalCandidate is assigned to a second organisation
- **THEN** the system creates a CandidateOrgAssignment with status 'pending' without affecting the first organisation's assignment

#### Scenario: Per-org status independence
- **WHEN** Organisation A certifies a candidate and Organisation B has the same candidate in 'pending'
- **THEN** each organisation's assignment status remains independent

### Requirement: Cross-Tenant Consent
The system SHALL support consent decisions that reference a source organisation and target organisation for data reuse.

#### Scenario: Cross-org consent granted
- **WHEN** a candidate grants consent for Organisation B to reuse data collected by Organisation A
- **THEN** the consent record stores sourceOrgId (A), targetOrgId (B), and the granted scopes

#### Scenario: Cross-org consent denied
- **WHEN** a candidate denies data reuse for a specific organisation
- **THEN** the system records the denial and the target organisation cannot access prior data

### Requirement: Privacy Isolation Between Organisations
The system SHALL ensure that no organisation can discover or access another organisation's candidate data without explicit consent from the candidate.

#### Scenario: Cross-tenant data access without consent
- **WHEN** Organisation B queries for a candidate's data collected by Organisation A without consent
- **THEN** the system returns no data and does not reveal the existence of the other organisation's records

#### Scenario: Cross-tenant data access with consent
- **WHEN** Organisation B requests data for a candidate who has granted cross-org consent from Organisation A
- **THEN** the system returns only the data within the consented scopes

### Requirement: Global Identity in App Authentication
The system SHALL resolve the global candidate identity during app sign-in and present the candidate's associated organisations.

#### Scenario: Candidate with multiple orgs signs in
- **WHEN** a candidate signs in to the app and has assignments to multiple organisations
- **THEN** the app presents an organisation selector before loading applications
