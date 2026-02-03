# Change: Add backend user management

## Why
Enable system and org admins to manage platform users through APIs with tenant-scoped access, auditability, and compliance controls.

## What Changes
- Add user list and search endpoints.
- Add user create, edit, and detail endpoints.
- Add user role and status management.
- Enforce role-based access control and tenant isolation for user operations.
- Add audit logging for user access and role changes.
- Apply rate limits and SLO targets to user management endpoints.

## Impact
- Affected specs: user-management
- Affected code: backend user services, models
- Operational impact: audit logging, rate limiting, and SLO monitoring for user endpoints
