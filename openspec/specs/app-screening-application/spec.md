# app-screening-application Specification

## Purpose
TBD - created by archiving change app-add-screening-application-forms. Update Purpose after archive.
## Requirements
### Requirement: Assigned application access
The app SHALL list assigned screening applications for the signed-in candidate.

#### Scenario: View assigned applications
- **WHEN** a candidate opens the applications screen
- **THEN** the app displays assigned applications with status

### Requirement: Form completion
The app SHALL present application forms and capture candidate responses.

#### Scenario: Complete form section
- **WHEN** a candidate enters responses in a form section
- **THEN** the app stores the responses for that section

### Requirement: Draft save and resume
The app SHALL allow candidates to save drafts and resume incomplete applications.

#### Scenario: Resume draft
- **WHEN** a candidate returns to an incomplete application
- **THEN** the app restores previously saved responses

### Requirement: Submission validation
The app SHALL validate required fields before allowing final submission.

#### Scenario: Missing required response
- **WHEN** a candidate attempts to submit with missing required fields
- **THEN** the app blocks submission and highlights errors

### Requirement: Submission confirmation
The app SHALL confirm successful submission and present next-step guidance.

#### Scenario: Submission success
- **WHEN** the app receives a successful submission response
- **THEN** the app shows a confirmation message and status update

