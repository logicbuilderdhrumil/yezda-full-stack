## ADDED Requirements
### Requirement: Locale switching
The system SHALL allow users to switch UI languages.

#### Scenario: Change language
- **WHEN** a user selects a new locale
- **THEN** the UI updates to the selected language

### Requirement: Translation resources
The system SHALL load translation resources for supported locales.

#### Scenario: Load translations
- **WHEN** the app initializes
- **THEN** translations for the active locale are loaded
