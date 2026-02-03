## ADDED Requirements
### Requirement: Billed ledger list
The system SHALL provide an API to list billed ledger entries.

#### Scenario: Retrieve billed entries
- **WHEN** a system admin requests billed ledger entries
- **THEN** the system returns entries with totals and filters applied

### Requirement: Unbilled ledger list
The system SHALL provide an API to list unbilled ledger entries.

#### Scenario: Retrieve unbilled entries
- **WHEN** a system admin requests unbilled ledger entries
- **THEN** the system returns entries with totals and filters applied

### Requirement: Ledger access control and tenant isolation
The system SHALL enforce role-based access and tenant isolation for all ledger endpoints.

#### Scenario: Unauthorized ledger access blocked
- **WHEN** a non-authorized user requests ledger data
- **THEN** the system denies access and records an audit event

### Requirement: Ledger auditability and immutability
The system SHALL record audit events for ledger access and prevent mutation of finalized entries.

#### Scenario: Finalized entry update rejected
- **WHEN** a user attempts to modify a billed ledger entry
- **THEN** the system rejects the request and records an audit event

### Requirement: Operational safeguards for ledger reporting
The system SHALL apply rate limits and caching for ledger reporting endpoints and publish availability and error SLO targets.

#### Scenario: Ledger report throttled
- **WHEN** a client exceeds configured request limits for ledger reporting
- **THEN** the system returns a throttled response and preserves service availability
