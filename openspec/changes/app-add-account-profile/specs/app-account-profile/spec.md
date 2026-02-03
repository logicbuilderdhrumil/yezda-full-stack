## ADDED Requirements
### Requirement: Profile overview
The app SHALL allow candidates to view their basic profile information.

#### Scenario: View profile
- **WHEN** a candidate opens the profile screen
- **THEN** the app displays current profile details

### Requirement: Profile update
The app SHALL allow candidates to update editable profile fields such as name, phone, and address.

#### Scenario: Update profile
- **WHEN** a candidate submits valid profile changes
- **THEN** the app saves updates and confirms success

### Requirement: Profile validation feedback
The app SHALL validate required profile fields and display errors before submission.

#### Scenario: Missing required field
- **WHEN** a candidate submits a profile form missing required data
- **THEN** the app highlights the missing fields and blocks submission

### Requirement: Account security entry point
The app SHALL provide a clear entry point for account security actions such as password changes.

#### Scenario: Open security settings
- **WHEN** a candidate selects the security option
- **THEN** the app presents available security actions and instructions
