# Change: Add backend account settings and integrations

## Why
Allow users to manage profile settings and verify external integrations through APIs with auditability and compliance safeguards.

## What Changes
- Add profile read/update endpoints with validation.
- Add integration verification callback handling and status storage.
- Provide integration status retrieval for account settings.
- Enforce tenant-scoped access and role-based controls for profile updates.
- Add audit logging for profile and integration status changes.
- Apply rate limits and SLO targets for profile and integration endpoints.

## Impact
- Affected specs: account-settings
- Affected code: backend controllers, services, models
- Operational impact: audit logging, rate limiting, and SLO monitoring for account settings endpoints
