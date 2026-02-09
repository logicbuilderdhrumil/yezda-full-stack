## MODIFIED Requirements
### Requirement: Translation resources
The system SHALL provide and load translation resources for supported locales.

#### Scenario: Fetch translations
- **WHEN** a client requests translation resources
- **THEN** the system returns resources for the requested locale

#### Scenario: Load translations
- **WHEN** the app initializes
- **THEN** translations for the active locale are loaded

## ADDED Requirements
### Requirement: Locale switching
The system SHALL allow users to switch UI languages.

#### Scenario: Change language
- **WHEN** a user selects a new locale
- **THEN** the UI updates to the selected language
