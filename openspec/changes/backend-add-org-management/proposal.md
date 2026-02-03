# Change: Add backend organization management

## Why
Allow system admins to manage tenant organizations through APIs with tenant-level controls, auditability, and compliance safeguards.

## What Changes
- Add organization list and search endpoints.
- Add organization create, edit, and detail endpoints.
- Add organization data models and validation.
- Enforce role-based access control and tenant isolation for organization operations.
- Add audit logging for organization access and changes.
- Apply rate limits, caching for list endpoints, and SLO targets for organization APIs.

## Impact
- Affected specs: org-management
- Affected code: backend organization services, models
- Operational impact: audit logging, rate limiting, caching, and SLO monitoring for org endpoints
