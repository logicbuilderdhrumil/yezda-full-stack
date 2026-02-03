# Change: Add backend app auth session integration

## Why
The app requires dedicated authentication and session endpoints tailored to mobile flows.

## What Changes
- Add app sign-in, session refresh, and sign-out endpoints.
- Add app session metadata for device tracking and fraud controls.
- Add app-specific rate limits and audit logging for auth events.

## Impact
- Affected specs: app-auth-session
- Affected code: backend auth controllers, session services
- App capability integrated: app login and authentication
