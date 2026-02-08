# Change: Add OAuth integration flows

## Why
Support external integrations that require OAuth verification.

## What Changes
- Implement OAuth service methods.
- Add verification routes and success states.
- Wire integration status to account settings.

## Impact
- Affected specs: oauth-integration
- Affected code: src/services/OAuthServices.ts, src/views/account
