# Architecture Guide

This repository follows **Clean Architecture** principles across all three workspaces: backend, frontend, and app.

## Core Principles

1. **Dependency Rule** — Dependencies always point inward. Domain has no external dependencies. Application depends only on domain. Infrastructure and interface depend on application and domain.
2. **Separation of Concerns** — Each layer has a single responsibility.
3. **Feature Modules** — Code is organized by business capability, not by technical role.
4. **Manual Constructor Injection** — Dependencies are wired explicitly in composition roots.

---

## Backend — Clean Architecture Modules

Each business capability lives under `backend/src/modules/<name>/`:

```
modules/<name>/
├── domain/
│   ├── entities/       # Business entities and aggregates
│   └── ports/          # Repository and service interfaces
├── application/
│   └── use-cases/      # One class per business operation
├── infrastructure/
│   └── repositories/   # Concrete implementations of domain ports
└── interface/
    ├── controllers/    # HTTP request handlers
    └── routes/         # Express route definitions
```

### Composition Root

Each module exports a `create<Name>Module()` function from `index.ts`:

```typescript
export function createAuthModule() {
  // Wire dependencies (inward)
  const userRepo = new PostgresUserRepository();
  const signInUseCase = new SignInUseCase(userRepo);
  const controller = new AuthController(signInUseCase);
  const router = createAuthRoutes(controller);
  return { router };
}
```

### Shared Infrastructure

Cross-cutting concerns live in `backend/src/shared/infrastructure/`:

```
shared/infrastructure/
├── database/     # postgres.ts, redis.ts connection clients
├── config/       # Environment configuration
├── middleware/    # Error handling, CORS, rate limiting
└── http/         # Express app setup
```

### Module List

| Module | Domain | Path |
|--------|--------|------|
| auth | Authentication & sessions | modules/auth/ |
| candidate-management | Candidate CRUD | modules/candidate-management/ |
| screening-pipeline | Screening workflows | modules/screening-pipeline/ |
| form-builder | Dynamic forms | modules/form-builder/ |
| user-management | User CRUD & RBAC | modules/user-management/ |
| org-management | Organization CRUD | modules/org-management/ |
| chat | Messaging | modules/chat/ |
| notification | Push/email notifications | modules/notification/ |
| file-management | File uploads & storage | modules/file-management/ |
| billing-ledger | Billing & invoicing | modules/billing-ledger/ |
| ... | (40+ total modules) | modules/.../ |

---

## Frontend — Feature Module Architecture

Each feature lives under `frontend/src/features/<name>/`:

```
features/<name>/
├── pages/        # Route-level page components (lazy loaded)
├── services/     # Feature-specific API services
├── store/        # Feature-specific Zustand stores
├── hooks/        # Feature-specific hooks
├── components/   # Feature-specific UI components
└── index.ts      # Public barrel export
```

### Global Shared Code

- `src/components/ui/` — Reusable UI primitives (shadcn/ui)
- `src/components/layouts/` — Layout components
- `src/services/ApiService.ts` — Base HTTP client
- `src/store/` — Global stores (theme, locale)

### Feature Modules

auth, account, dashboard, candidates, organizations, users, forms, chat, files, billing, notifications, screening, pipelines, reports, reviews, settings, client-portal, shared

---

## App — Feature Module Architecture

Each feature lives under `app/src/features/<name>/`:

```
features/<name>/
├── screens/      # Screen components
├── services/     # Feature-specific API services
├── store/        # Feature-specific Zustand stores
├── hooks/        # Feature-specific hooks
├── types/        # Feature-specific types
├── utils/        # Feature-specific utilities
├── components/   # Feature-specific UI components
└── index.ts      # Public barrel export
```

### Feature Modules

auth, applications, profile, consent, notifications, shared

---

## Import Conventions

### Backend
```typescript
// Within a module: use relative imports
import { User } from '../domain/entities/user.entity';

// Cross-module: import from module composition root
import { createAuthModule } from '../auth';

// Shared infrastructure
import { pool } from '../../shared/infrastructure/database/postgres';
```

### Frontend & App
```typescript
// Import from feature barrel exports
import { LoginPage } from '@/features/auth';
import { CandidateListPage } from '@/features/candidates';

// Global shared
import { Button } from '@/components/ui/button';
import { ApiService } from '@/services/ApiService';
```

---

## Adding a New Module

1. Create the directory structure under `modules/<name>/` (backend) or `features/<name>/` (frontend/app).
2. Define domain entities and ports first (backend).
3. Implement use cases in the application layer.
4. Add repository implementations in infrastructure.
5. Create controllers and routes in the interface layer.
6. Wire everything in the composition root (`index.ts`).
7. Mount the router in `routes/index.ts`.
8. Export public API from the barrel `index.ts`.
