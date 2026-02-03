# Change: Add user authentication flows

## Why
Provide secure access control and account onboarding for the admin dashboard.

## What Changes
- Build sign-in and sign-up screens with validation.
- Add password reset flows for users and candidates.
- Add TOTP verification for multi-factor authentication.

## Impact
- Affected specs: user-auth
- Affected code: src/views/auth, src/auth, src/services/AuthService.ts
