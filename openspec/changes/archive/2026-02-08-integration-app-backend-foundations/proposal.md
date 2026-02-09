# Change: App-backend integration foundations

## Why
The customer-facing app and backend foundations were developed in parallel and need aligned auth, profile, and notification contracts.

## What Changes
- Define contract map for app auth session, profile, and localization endpoints.
- Align push notification token registration and topic mapping.
- Establish app-backend integration smoke tests for login and profile flows.

## Impact
- Affected specs: specs/app-backend-integration/spec.md
- Affected code: app/src/services, app/src/store, backend/src/routes, backend/src/controllers, shared/@types
