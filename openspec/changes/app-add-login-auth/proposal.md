# Change: Add app login and authentication

## Why
Candidates need a secure, reliable way to access their screening application from the app.

## What Changes
- Add app login screens with validation and error states.
- Add session bootstrapping, refresh handling, and sign-out flows.
- Add multi-factor challenge handling when required by the backend.
- Add secure local storage for session tokens.

## Impact
- Affected specs: app-auth
- Affected code: app auth screens, app API client, secure storage utilities
