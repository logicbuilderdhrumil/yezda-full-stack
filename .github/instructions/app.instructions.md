---
name: App Conventions
description: App implementation rules for Expo + React Native.
applyTo: "app/**/*.{ts,tsx,js,jsx}"
---

## App Standards — Feature Module Architecture
- Expo + React Native + TypeScript 5.
- NativeWind for Tailwind-style utilities.
- Zustand for state; SWR or React Query for data fetching.
- **Feature modules** under `app/src/features/<feature>/`:
  - `screens/` — screen components
  - `services/` — feature-specific API services
  - `store/` — feature-specific Zustand stores
  - `hooks/` — feature-specific hooks
  - `types/` — feature-specific types
  - `utils/` — feature-specific utilities
  - `components/` — feature-specific UI components
  - `index.ts` — public barrel export
- Import from feature barrel exports: `import { LoginScreen } from '@/features/auth'`.
- Keep API calls in app services or hooks, not components.
- Use `@/` path alias for imports from `src/`.

## Quality
- Avoid unused or duplicate imports.
- Align with ESLint and Prettier formatting.
- Add or update tests when behavior changes.
