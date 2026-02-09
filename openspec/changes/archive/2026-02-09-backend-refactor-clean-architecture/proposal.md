# Change: Refactor entire project to Clean Architecture

## Why

The current codebase uses a flat, layer-based MVC architecture where all controllers live in one `controllers/` folder, all services in one `services/` folder, all models in one `models/` folder, etc. With 35+ domain modules, this has resulted in:

- **Poor cohesion**: A single domain concern (e.g., "candidate-management") is spread across 5–7 directories (`routes/`, `controllers/`, `services/`, `models/`, `repositories/`, `middleware/`). Understanding or modifying a feature requires navigating all of them.
- **Implicit coupling**: Services import other services freely; controllers sometimes bypass services to reach repositories directly. There are no explicit dependency boundaries.
- **Scaling friction**: Adding a new feature means touching 5+ flat directories and updating barrel re-exports. The flat structure makes it difficult to assign ownership or extract modules.
- **Testing difficulty**: No use-case isolation means unit tests must mock broad service graphs. Integration boundaries are unclear.

Clean Architecture (Robert C. Martin) solves this by organizing code around **business domains** with explicit **dependency inversion** between layers. Each bounded context owns its entities, use cases, and interface adapters — making the codebase navigable, testable, and independently deployable.

## What Changes

### Backend (`backend/src/`)

- **BREAKING**: Restructure from flat layer folders to domain-driven modules
  - Current: `controllers/auth.controller.ts`, `services/auth.service.ts`, `models/auth.model.ts`, `repositories/user.repository.ts`
  - Target: `modules/auth/domain/entities/`, `modules/auth/application/use-cases/`, `modules/auth/infrastructure/repositories/`, `modules/auth/interface/controllers/`
- **BREAKING**: Introduce explicit layer boundaries:
  - **Domain layer** (innermost): Entities, value objects, domain events, repository interfaces (ports)
  - **Application layer**: Use cases / interactors, DTOs, application services, port interfaces for external services
  - **Infrastructure layer**: Repository implementations, external API adapters, database clients, message queues
  - **Interface layer** (outermost): HTTP controllers, route definitions, request/response mappers, middleware
- **BREAKING**: Add dependency injection container (e.g., `tsyringe` or manual factory pattern) to enforce the dependency rule (inner layers never import from outer layers)
- Shared cross-cutting concerns (`middleware/error.middleware.ts`, `config/`, `db/`) move to `shared/infrastructure/`
- Barrel re-exports per module for clean public APIs

### Frontend (`frontend/src/`)

- **BREAKING**: Restructure from flat folders to feature-based modules
  - Current: `views/auth/`, `services/AuthService.ts`, `store/authStore.ts`
  - Target: `features/auth/pages/`, `features/auth/services/`, `features/auth/store/`, `features/auth/components/`
- Shared UI components remain in `components/ui/` and `components/layouts/`
- Cross-cutting services (API client, socket) remain in `services/` as infrastructure adapters
- Each feature module owns its routes, pages, services, store slices, and domain types

### App (`app/src/`)

- **BREAKING**: Restructure from flat folders to feature-based modules
  - Current: `screens/`, `services/`, `store/`, `components/`
  - Target: `features/auth/screens/`, `features/auth/services/`, `features/auth/store/`, `features/auth/components/`
- Shared components remain in `components/shared/`
- Navigation setup remains in `app/` (Expo Router)

### Shared (`shared/`)

- Domain types shared across frontend/backend/app move to `shared/domain/`
- Utility functions remain in `shared/utils/`
- API contract types move to `shared/contracts/`

### OpenSpec & Instructions

- Update `openspec/project.md` to reflect Clean Architecture conventions
- Update `.github/instructions/` files for new patterns
- All existing specs remain valid (behavioral, not structural)

## Impact

- **Affected specs**: All 43 specifications (structurally, not behaviorally — requirements and scenarios stay the same)
- **Affected code**: Every file in `backend/src/`, `frontend/src/`, `app/src/`, and `shared/`
- **Risk**: High — this is a full-codebase restructuring. Must be done in waves per domain module.
- **Migration strategy**: Incremental, module-by-module migration starting with a single bounded context (e.g., `auth`) as a reference implementation, then applying the pattern to remaining modules.
- **Testing**: All existing tests must continue to pass after each wave. No behavioral changes.
- **Breaking changes**: Import paths change throughout. Internal APIs remain the same.
