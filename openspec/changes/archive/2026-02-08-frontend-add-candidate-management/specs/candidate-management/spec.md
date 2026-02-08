## MODIFIED Requirements
### Requirement: Candidate lifecycle management
The system SHALL provide APIs and UI to create, update, and view candidates.

#### Scenario: Create candidate
- **WHEN** an authorized user submits a valid candidate payload
- **THEN** the system creates the candidate and returns the record

#### Scenario: Create candidate via form
- **WHEN** an authorized user submits a valid candidate form
- **THEN** the candidate is created and shown in the list

### Requirement: Bulk candidate creation
The system SHALL support bulk creation of candidates via API and UI workflow.

#### Scenario: Bulk create upload
- **WHEN** a user submits a valid bulk-create request
- **THEN** the system creates multiple candidates and returns a summary

#### Scenario: Bulk create upload via UI
- **WHEN** a user submits a valid bulk-create payload
- **THEN** the system creates multiple candidate records and reports the result

## ADDED Requirements
### Requirement: Candidate submission form
The system SHALL provide a submission form route for collecting candidate data.

#### Scenario: Submission form access
- **WHEN** a user opens a candidate submission form link
- **THEN** the system renders the configured form for the candidate

### Requirement: Certified and archived views
The system SHALL provide dedicated views for certified and archived candidates.

#### Scenario: View certified candidates
- **WHEN** a user navigates to the certified candidates list
- **THEN** the system displays only certified candidates
