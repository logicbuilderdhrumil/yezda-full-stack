## ADDED Requirements
### Requirement: Chart data endpoints
The system SHALL provide endpoints that return chart-ready data series.

#### Scenario: Retrieve chart data
- **WHEN** a client requests chart data for a metric
- **THEN** the system returns a normalized series with labels and values

### Requirement: Aggregated metrics
The system SHALL support aggregation over standard time ranges.

#### Scenario: Time range aggregation
- **WHEN** a client requests a metric with a time range
- **THEN** the system returns aggregated values for that range

### Requirement: Chart access control and tenant isolation
The system SHALL enforce role-based access and tenant isolation for chart data endpoints.

#### Scenario: Unauthorized chart access blocked
- **WHEN** a user requests chart data outside their tenant scope
- **THEN** the system denies access and records an audit event

### Requirement: Chart data audit logging
The system SHALL record audit events for chart data access.

#### Scenario: Chart access audit trail
- **WHEN** a user retrieves chart data
- **THEN** the system records the actor, metric, and timestamp

### Requirement: Operational safeguards for charting
The system SHALL apply caching and rate limits for chart endpoints and publish availability and error SLO targets.

#### Scenario: Chart request throttled
- **WHEN** a client exceeds configured request limits for chart endpoints
- **THEN** the system returns a throttled response and preserves service availability
