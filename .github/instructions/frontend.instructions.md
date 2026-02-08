---
name: Frontend Conventions
description: Frontend implementation rules for React + Vite + Tailwind.
applyTo: "frontend/**/*.{ts,tsx,js,jsx}"
---

## Frontend Standards — Feature Module Architecture
- React 19 + TypeScript strict mode; prefer explicit types for public APIs.
- Vite SPA layout with src/ as root.
- **Feature modules** under `src/features/<feature>/`:
  - `pages/` — route-level page components (lazy loaded)
  - `services/` — feature-specific API services
  - `store/` — feature-specific Zustand stores
  - `hooks/` — feature-specific hooks
  - `components/` — feature-specific UI components
  - `index.ts` — public barrel export
- Global shared code:
  - `src/components/ui/` — reusable UI primitives (shadcn/ui)
  - `src/components/layouts/` — layout components
  - `src/services/ApiService.ts` — base HTTP client
  - `src/store/` — global stores (theme, locale)
- Use `@/` path alias for all imports from `src/`.
- Import from feature barrel exports: `import { LoginPage } from '@/features/auth'`.
- Prefer named exports unless a file has a single primary export.
- Keep API calls in services and avoid direct fetch calls in components.

## Quality
- Avoid unused or duplicate imports.
- Align with ESLint and Prettier formatting.
- Add or update tests when behavior changes.
