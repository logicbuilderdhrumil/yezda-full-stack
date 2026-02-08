# Change: Add backend app shell configuration

## Why
Provide server-driven shell configuration so the client can render navigation and preferences consistently with secure, tenant-aware policies.

## What Changes
- Add endpoints for shell configuration and navigation metadata.
- Provide role-based navigation rules and route policy metadata.
- Add theme and locale preference defaults and storage.
- Enforce tenant-aware access controls for navigation and preference data.
- Add audit logging for preference changes and navigation policy updates.
- Apply caching and SLO targets for shell configuration endpoints.

## Impact
- Affected specs: app-shell
- Affected code: backend controllers, services, preference storage
- Operational impact: audit logging, caching, and SLO monitoring for shell configuration
