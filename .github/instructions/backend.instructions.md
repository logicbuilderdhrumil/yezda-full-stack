---
name: Backend Conventions
description: Backend implementation rules for Node.js services.
applyTo: "backend/**/*.{ts,js}"
---

## Backend Standards — Clean Architecture
- Use modular structure: `backend/src/modules/<module>/` with four layers:
  - **domain/** — entities, ports (repository interfaces), value objects
  - **application/** — use cases (one per business operation)
  - **infrastructure/** — repository implementations, adapters, mappers
  - **interface/** — controllers, routes, validators, middleware
- Each module has a composition root `index.ts` exporting `create<Module>Module()` → `{ router }`.
- Dependency flows inward: interface → application → domain. Never import outward.
- Manual constructor injection: repositories → use cases → controllers.
- Shared infrastructure lives in `backend/src/shared/infrastructure/` (database, config, middleware, http).
- Validate and sanitize inputs; keep error handling middleware centralized.
- Maintain API versioning under /api/v1/.
- Prefer explicit types for public interfaces; use Zod for validation schemas.

## Quality
- Add tests for new endpoints or behavior changes.
- Preserve backward compatibility unless the spec declares breaking changes.
- Follow the Dependency Rule: no domain imports from infrastructure or interface layers.
