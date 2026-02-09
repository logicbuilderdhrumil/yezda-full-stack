---
name: project-conventions
description: Apply repository conventions for frontend, backend, and shared code. Trigger keywords: conventions, patterns, architecture, frontend, backend, shared.
---

## Backend — Clean Architecture
- Node.js + Express + TypeScript with Clean Architecture modules.
- Each module under `backend/src/modules/<name>/` has four layers:
  - `domain/` — entities, ports (interfaces)
  - `application/` — use cases (one per business operation)
  - `infrastructure/` — repository implementations
  - `interface/` — controllers, routes, validators
- Composition root: `index.ts` exports `create<Name>Module()` → `{ router }`.
- Dependencies flow inward only: interface → application → domain.
- Manual constructor injection for wiring.
- Shared infrastructure in `backend/src/shared/infrastructure/` (database, config, middleware, http).
- Input validation (Zod) and error handling middleware are required.
- Versioned APIs under /api/v1/.

## Frontend — Feature Modules
- React 19 + TypeScript 5 + Vite 6 + Tailwind 4.
- Feature modules in `src/features/<name>/` with pages, services, store, hooks, components.
- Import from barrel exports: `import { Page } from '@/features/<name>'`.
- Global shared: `components/ui/`, `components/layouts/`, `services/ApiService.ts`.
- Use `@/` path alias for frontend imports.

## App — Feature Modules
- Expo + React Native + TypeScript 5 + NativeWind.
- Feature modules in `app/src/features/<name>/` with screens, services, store, hooks, types, utils.
- Import from barrel exports: `import { Screen } from '@/features/<name>'`.
- Use `@/` path alias mapping to `src/*`.

## Shared
- Shared types in `shared/@types/` and utilities in `shared/utils/`.

## Cross-Cutting
- Prefer named exports unless a file has a single primary export.
- Use explicit types for public APIs and avoid unused imports.
- Follow ESLint/Prettier formatting rules.
- See `ARCHITECTURE.md` at repo root for full architectural documentation.
