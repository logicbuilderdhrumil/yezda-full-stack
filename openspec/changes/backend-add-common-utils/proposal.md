# Change: Add backend common utilities

## Why
Standardize pagination, filtering, and response formatting across APIs with secure defaults and operational consistency.

## What Changes
- Define common pagination and search parameter handling.
- Add standardized response envelopes for list endpoints.
- Document shared utility behavior for services.
- Enforce parameter limits, validation, and error sanitization defaults.
- Add telemetry hooks for shared list utilities and SLO monitoring.

## Impact
- Affected specs: common-utils
- Affected code: backend controllers, shared utilities
- Operational impact: standardized telemetry and SLO monitoring for list utilities
