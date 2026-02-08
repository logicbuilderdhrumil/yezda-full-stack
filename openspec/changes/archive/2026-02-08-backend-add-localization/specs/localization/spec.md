## ADDED Requirements
### Requirement: Locale preferences
The system SHALL store and return user locale preferences.

#### Scenario: Change locale
- **WHEN** a user updates their locale preference
- **THEN** the system stores the preference and returns it

### Requirement: Translation resources
The system SHALL provide translation resources for supported locales.

#### Scenario: Fetch translations
- **WHEN** a client requests translation resources
- **THEN** the system returns resources for the requested locale

### Requirement: Localization access control and tenant isolation
The system SHALL enforce role-based access and tenant isolation for locale preference endpoints.

#### Scenario: Unauthorized locale update blocked
- **WHEN** a user attempts to update another user's locale preference
- **THEN** the system denies access and records an audit event

### Requirement: Localization audit logging
The system SHALL record audit events for locale preference changes and translation resource access.

#### Scenario: Locale update audit trail
- **WHEN** a user updates their locale preference
- **THEN** the system records the actor, locale, and timestamp

### Requirement: Operational safeguards for localization
The system SHALL apply caching and rate limits for translation endpoints and publish availability and error SLO targets.

#### Scenario: Translation request cached
- **WHEN** a client requests translations within cache freshness limits
- **THEN** the system serves the cached response and preserves service availability
