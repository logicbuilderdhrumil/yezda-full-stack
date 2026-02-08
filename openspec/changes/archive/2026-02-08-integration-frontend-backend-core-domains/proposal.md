# Change: Frontend-backend integration core domains

## Why
Core domain work (org, user, account settings, access pages) is developed in parallel and requires aligned contracts to avoid UI and API divergence.

## What Changes
- Define contract map and DTO alignment for org, user, account settings, and access pages endpoints.
- Align pagination, filtering, and sorting conventions across backend and frontend services.
- Validate authorization and route-guard expectations against backend access rules.

## Impact
- Affected specs: specs/frontend-backend-integration/spec.md
- Affected code: frontend/src/views, frontend/src/services, backend/src/routes, backend/src/controllers, shared/@types
