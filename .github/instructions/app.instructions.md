---
name: App Conventions
description: App implementation rules for Expo + React Native.
applyTo: "app/**/*.{ts,tsx,js,jsx}"
---

## App Standards
- Expo + React Native + TypeScript 5.
- NativeWind for Tailwind-style utilities.
- Zustand for state; SWR or React Query for data fetching.
- Keep API calls in app services or hooks, not components.

## Quality
- Avoid unused or duplicate imports.
- Align with ESLint and Prettier formatting.
- Add or update tests when behavior changes.
