# Change: App-backend integration app flows

## Why
App flows for consent reuse and screening application intake must align with backend workflow states and validation rules.

## What Changes
- Define contract map for consent reuse and application intake endpoints.
- Align form schema, validation errors, and submission lifecycle states.
- Establish integration smoke tests for the critical app flow paths.

## Impact
- Affected specs: specs/app-backend-integration/spec.md
- Affected code: app/src/screens, app/src/services, backend/src/routes, backend/src/controllers, shared/@types
