# Change: Add backend app application intake integration

## Why
The app needs authenticated endpoints to retrieve, save, and submit screening application forms.

## What Changes
- Add app endpoints to list assigned applications and load form definitions with prior responses.
- Add draft save and final submission endpoints for app form completion.
- Add server-side validation, status updates, and audit logging for app submissions.

## Impact
- Affected specs: app-application-intake
- Affected code: backend application intake services, form response handlers
- App capability integrated: app screening application form completion
