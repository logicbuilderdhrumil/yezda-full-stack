# Clean Architecture Module Conventions

This document describes the directory layout, layer responsibilities, dependency
rules, and module-interaction patterns for the backend's modular Clean
Architecture.

---

## Directory Structure

Every domain module lives under `backend/src/modules/<module-name>/` and follows
this four-layer structure:

```
modules/<module-name>/
├── domain/               # Enterprise business rules
│   ├── entities/          # Core domain entities (aggregates, root entities)
│   ├── value-objects/     # Immutable value types (e.g., Email, Money)
│   ├── ports/             # Interfaces / abstract contracts (repository ports, service ports)
│   └── events/            # Domain event definitions
│
├── application/           # Application-specific business rules
│   ├── use-cases/         # Individual use-case handlers (one class per use case)
│   ├── dtos/              # Data Transfer Objects for input / output shaping
│   └── services/          # Application services that orchestrate use cases
│
├── infrastructure/        # Frameworks, drivers, external concerns
│   ├── repositories/      # Concrete repository implementations (Postgres, Redis, etc.)
│   ├── adapters/          # External-service adapters (email, payment, storage, etc.)
│   └── mappers/           # Data mappers between persistence / external models and domain entities
│
└── interface/             # Delivery mechanism (HTTP)
    ├── controllers/       # Express request handlers
    ├── routes/            # Express Router definitions (maps paths → controllers)
    ├── middleware/         # Route-scoped middleware (auth guards, tenant resolution, etc.)
    └── validators/        # Zod schemas and validation middleware for request payloads
```

### What Goes Where

| Layer            | Contains                                                       | Key Rule                                |
| ---------------- | -------------------------------------------------------------- | --------------------------------------- |
| **domain**       | Entities, value objects, ports (interfaces), domain events      | No framework dependencies at all        |
| **application**  | Use-case classes, DTOs, application services                   | May depend on domain only               |
| **infrastructure** | Repository implementations, external adapters, data mappers  | Implements domain ports                 |
| **interface**    | Controllers, routes, middleware, validators                    | Calls application layer use cases only  |

---

## Dependency Rule

The **Dependency Rule** is the most important invariant:

> Inner layers must NEVER import from outer layers.

Concretely:

- `domain/` → imports **nothing** from `application/`, `infrastructure/`, or `interface/`.
- `application/` → imports from `domain/` only. Never from `infrastructure/` or `interface/`.
- `infrastructure/` → imports from `domain/` and `application/`.
- `interface/` → imports from `domain/` and `application/`.

These rules are enforced automatically by ESLint (`no-restricted-imports` in
`backend/eslint.config.js`).

### Import Style

The project uses **ES modules** with `.js` extensions in import paths
(TypeScript compiled output). Use the `@/` path alias for imports from the
project root (`src/`).

```ts
// ✅ Correct — use-case imports a domain port
import type { AuthRepository } from '../../domain/ports/auth-repository.js';

// ✅ Correct — cross-module domain import
import type { UserId } from '@/modules/user/domain/value-objects/user-id.js';

// ❌ WRONG — application imports infrastructure
import { PgAuthRepository } from '../../infrastructure/repositories/pg-auth-repository.js';
```

---

## Dependency Injection

We use **manual constructor injection** with a module-level factory function.

### Pattern

Each module exposes a factory that wires up its dependencies:

```ts
// modules/auth/index.ts
import type { Database } from '@/db/types.js';
import type { EmailService } from '@/modules/notification/domain/ports/email-service.js';

import { LoginUseCase } from './application/use-cases/login.js';
import { PgAuthRepository } from './infrastructure/repositories/pg-auth-repository.js';
import { AuthController } from './interface/controllers/auth-controller.js';
import { createAuthRouter } from './interface/routes/auth-routes.js';

export interface AuthModuleDeps {
  db: Database;
  emailService: EmailService;
}

export function createAuthModule(deps: AuthModuleDeps) {
  const authRepo = new PgAuthRepository(deps.db);
  const loginUseCase = new LoginUseCase(authRepo);
  const controller = new AuthController(loginUseCase);
  const router = createAuthRouter(controller);

  return { router };
}
```

### Why Manual DI?

- No magic — easy to trace dependencies.
- No container library — smaller bundle, fewer abstractions.
- Constructor injection makes testing trivial (swap implementations).

---

## Inter-Module Rules

Modules **may** import from another module's `domain/` layer to reference shared
types (entities, value objects, ports, events).

Modules **must NOT** import from another module's `application/`,
`infrastructure/`, or `interface/` layers.

```ts
// ✅ Allowed — importing another module's domain type
import type { OrgId } from '@/modules/org/domain/value-objects/org-id.js';

// ❌ Prohibited — importing another module's use case
import { CreateOrgUseCase } from '@/modules/org/application/use-cases/create-org.js';
```

If module A needs functionality from module B, it should depend on module B's
**domain port** and have the implementation injected via the factory.

---

## File Naming Conventions

| Kind               | Pattern                           | Example                              |
| ------------------ | --------------------------------- | ------------------------------------ |
| Entity             | `<name>.entity.ts`               | `user.entity.ts`                     |
| Value Object       | `<name>.vo.ts`                   | `email.vo.ts`                        |
| Port (interface)   | `<name>.port.ts`                 | `auth-repository.port.ts`            |
| Domain Event       | `<name>.event.ts`                | `user-registered.event.ts`           |
| Use Case           | `<name>.use-case.ts`             | `login.use-case.ts`                  |
| DTO                | `<name>.dto.ts`                  | `login-request.dto.ts`               |
| Application Service| `<name>.service.ts`              | `token.service.ts`                   |
| Repository Impl    | `<name>.repository.ts`          | `pg-auth.repository.ts`             |
| Adapter            | `<name>.adapter.ts`             | `sendgrid-email.adapter.ts`          |
| Mapper             | `<name>.mapper.ts`              | `user-persistence.mapper.ts`         |
| Controller         | `<name>.controller.ts`          | `auth.controller.ts`                 |
| Router             | `<name>.routes.ts`              | `auth.routes.ts`                     |
| Middleware          | `<name>.middleware.ts`          | `require-auth.middleware.ts`         |
| Validator          | `<name>.validator.ts`           | `login-request.validator.ts`         |

---

## Testing Strategy

- **Domain** — pure unit tests, no mocks needed.
- **Application** — unit tests with mocked ports (repository / adapter stubs).
- **Infrastructure** — integration tests against real DB / services (or
  test-containers).
- **Interface** — integration tests via `supertest` against the Express router.

Test files live next to the code they test or in a module-level `__tests__/`
directory.

---

## Migration Path

Existing code in `controllers/`, `services/`, `routes/`, etc. will be migrated
module-by-module. During migration, both the legacy flat structure and the new
modular structure will coexist. The `auth` module is the reference
implementation — migrate it first, then use it as a template for the rest.
