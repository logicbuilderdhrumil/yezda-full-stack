# Change: Add backend billing ledger

## Why
Provide system admins API access to billed and unbilled activity data with auditability and compliance safeguards.

## What Changes
- Add billed and unbilled ledger list endpoints.
- Add filtering and totals for ledger entries.
- Add ledger data models and queries.
- Enforce role-based access and tenant scoping for ledger data.
- Add audit logging and immutability safeguards for ledger access.
- Apply rate limits, caching for reporting endpoints, and SLO targets.

## Impact
- Affected specs: billing-ledger
- Affected code: backend ledger services, data models
- Operational impact: audit logging, rate limiting, caching, and SLO monitoring for ledger endpoints
