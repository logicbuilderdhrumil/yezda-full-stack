# Change: Frontend-backend integration product features

## Why
Product feature work spans multiple domains and requires consistent contracts to avoid broken UI flows and inconsistent backend behavior.

## What Changes
- Define contract map for product feature endpoints (candidate management, form builder, file management, asset management, chat, charting, billing ledger, home dashboard, shared widgets, template layouts, view components).
- Align file upload, export, and long-running job status conventions across features.
- Establish integration smoke tests for critical cross-feature flows.

## Impact
- Affected specs: specs/frontend-backend-integration/spec.md
- Affected code: frontend/src/views, frontend/src/services, backend/src/routes, backend/src/controllers, shared/@types
