# Change: Add backend candidate management

## Why
Support candidate workflows from creation through certification with backend APIs while enforcing tenant isolation, auditability, and compliance for candidate PII.

## What Changes
- Add candidate CRUD endpoints with validation.
- Add bulk-create and submission form endpoints.
- Add certified and archived candidate filters.
- Enforce tenant-scoped access and role-based controls for candidate data.
- Add audit logging for candidate access and mutations.
- Apply rate limiting, caching, and SLO targets for candidate list and search endpoints.

## Impact
- Affected specs: candidate-management
- Affected code: backend candidate services, models
- Operational impact: audit logging, rate limiting, caching, and SLO monitoring for candidate endpoints
