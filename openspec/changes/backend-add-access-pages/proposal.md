# Change: Add backend access page responses

## Why
Provide consistent API responses for access denied and unknown routes with secure, non-leaky error handling and operational visibility.

## What Changes
- Define standardized error responses for access denied and not-found cases.
- Add middleware to emit access and route errors consistently.
- Document response shapes for client handling.
- Add audit logging and correlation identifiers for access and route errors.
- Apply rate limiting for repeated access failures and define SLO targets for error handling.

## Impact
- Affected specs: access-pages
- Affected code: backend middleware, error handlers, routes
- Operational impact: audit logging, rate limiting, and SLO monitoring for error responses
