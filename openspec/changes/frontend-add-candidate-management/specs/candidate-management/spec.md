## ADDED Requirements
### Requirement: Candidate lifecycle management
The system SHALL allow authorized users to create, update, and view candidates.

#### Scenario: Create candidate
- **WHEN** an authorized user submits a valid candidate form
- **THEN** the candidate is created and shown in the list

### Requirement: Bulk candidate creation
The system SHALL provide a bulk-create workflow for candidates.

#### Scenario: Bulk create upload
- **WHEN** a user submits a valid bulk-create payload
- **THEN** the system creates multiple candidate records and reports the result

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
