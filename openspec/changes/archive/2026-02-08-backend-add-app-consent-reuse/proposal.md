# Change: Add backend app consent reuse integration

## Why
The app requires server-side consent storage and retrieval to safely reuse candidate data across screenings.

## What Changes
- Add endpoints to record and retrieve consent decisions for data reuse.
- Add enforcement rules to control data reuse based on consent scope.
- Add audit logging for consent creation, update, and withdrawal.

## Impact
- Affected specs: app-consent-reuse-integration
- Affected code: backend consent services, audit logging pipeline
- App capability integrated: app consent-based data reuse
