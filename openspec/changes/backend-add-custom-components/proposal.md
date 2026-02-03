# Change: Add backend support for custom components

## Why
Provide API support for shared UI components like organization selection and theme toggles with secure access controls.

## What Changes
- Add endpoints for organization selection context.
- Add endpoints for user theme preference updates.
- Document response shapes for component consumers.
- Enforce tenant-scoped access and role-based controls for context changes.
- Add audit logging for organization context and preference updates.
- Apply rate limits and SLO targets for component support APIs.

## Impact
- Affected specs: custom-components
- Affected code: backend preference and organization services
- Operational impact: audit logging, rate limiting, and SLO monitoring for component endpoints
