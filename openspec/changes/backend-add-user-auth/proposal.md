# Change: Add backend user authentication flows

## Why
Provide secure authentication and account recovery endpoints for users and candidates with abuse protection and compliance logging.

## What Changes
- Add credential-based authentication endpoints.
- Add password reset and recovery flows.
- Add TOTP enrollment and verification endpoints.
- Add rate limiting, lockout, and anomaly detection for authentication endpoints.
- Add audit logging for authentication and recovery events.
- Define token rotation, revocation, and SLO targets for auth services.

## Impact
- Affected specs: user-auth
- Affected code: backend auth services, token handling
- Operational impact: audit logging, rate limiting, and SLO monitoring for auth endpoints
