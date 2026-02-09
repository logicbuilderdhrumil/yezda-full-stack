# Change: Add app shell and navigation

## Why
Establish the foundational UI shell and routing so all features can render within a consistent, branded layout.

## What Changes
- Create the SPA shell with header, sidebar, and content regions.
- Add public and protected route configuration with lazy-loaded views.
- Define role-based navigation items and active route state.
- Support theme and locale configuration for the UI shell.

## Impact
- Affected specs: app-shell
- Affected code: src/App.tsx, src/views, src/components/layouts, src/configs
