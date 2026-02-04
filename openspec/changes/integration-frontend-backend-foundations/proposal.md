# Change: Frontend-backend integration foundations

## Why
Parallel foundation work risks mismatched contracts and runtime regressions across the admin dashboard and backend.

## What Changes
- Define a contract map for foundation APIs (auth, api client, route guards, state stores, sockets, notifications, oauth, firebase, localization, theme/ui).
- Align shared DTOs, error envelopes, and pagination primitives between frontend services and backend controllers.
- Establish integration smoke tests and mock parity gates.

## Impact
- Affected specs: specs/frontend-backend-integration/spec.md
- Affected code: frontend/src/services, frontend/src/store, backend/src/routes, backend/src/controllers, shared/@types, shared/utils
