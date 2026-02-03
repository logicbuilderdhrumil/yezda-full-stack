---
name: project-conventions
description: Apply repository conventions for frontend, backend, and shared code. Trigger keywords: conventions, patterns, architecture, frontend, backend, shared.
---

## Frontend
- React 19 + TypeScript 5 + Vite 6 + Tailwind 4.
- Feature views in src/views, reusable components in src/components.
- Services in src/services, stores in src/store, contexts in src/context.
- Use @/ path alias for frontend imports.

## Backend
- Node.js + Express-style layering (routes, controllers, services, models).
- Input validation and error handling middleware are required.
- Versioned APIs under /api/v1/.

## Shared
- Shared types in shared/@types and utilities in shared/utils.

## Cross-Cutting
- Prefer named exports unless a file has a single primary export.
- Use explicit types for public APIs and avoid unused imports.
- Follow ESLint/Prettier formatting rules.
