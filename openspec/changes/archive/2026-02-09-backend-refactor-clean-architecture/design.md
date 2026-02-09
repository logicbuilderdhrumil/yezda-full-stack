# Design: Clean Architecture Migration

## Context

The yezda-full-stack monorepo is an Employment Screening SaaS with 3 deployment surfaces (admin frontend, customer app, backend API) and 35+ domain modules. The current architecture follows a flat MVC/layered pattern:

```
backend/src/
├── controllers/     ← 38 files, all domains mixed
├── services/        ← 67 files, all domains mixed
├── models/          ← 35 files, all domains mixed
├── repositories/    ← 26 files, all domains mixed
├── routes/          ← 38 files, all domains mixed
├── middleware/       ← 33 files, all domains mixed
├── config/
├── db/
├── fixtures/
└── utils/
```

This flat structure means a single feature (e.g., "screening-pipeline") touches files in 6 directories with no explicit boundaries. Clean Architecture introduces concentric dependency boundaries and groups code by domain, not by technical layer.

**Stakeholders**: Engineering team, CI/CD pipeline, future module extraction
**Constraints**: Must be done incrementally with zero behavioral changes; all tests must pass after each wave.

## Goals / Non-Goals

### Goals
- **Domain cohesion**: All code for a bounded context lives together
- **Dependency inversion**: Inner layers (domain, application) never import outer layers (infrastructure, interface)
- **Testability**: Use cases can be tested with mock ports; no framework dependency in domain/application layers
- **Navigability**: Any engineer can find all code for a feature in one directory
- **Extractability**: Modules can be pulled into separate packages/services in the future
- **Consistent pattern**: Frontend and app follow the same feature-module pattern for parity

### Non-Goals
- Microservices extraction (this is structural preparation, not runtime splitting)
- Event sourcing or CQRS (use simple command/query use cases)
- Changing the data model, API contracts, or external behavior
- Rewriting business logic (move only, refactor interfaces)

## Decisions

### D1: Backend Layer Model

```
┌─────────────────────────────────────────────────┐
│                  Interface Layer                │
│   Controllers, Routes, Middleware, Validators   │
│   (Express/HTTP concerns)                       │
├─────────────────────────────────────────────────┤
│                Application Layer                │
│   Use Cases, DTOs, Application Services         │
│   (Orchestration, no framework deps)            │
├─────────────────────────────────────────────────┤
│                  Domain Layer                   │
│   Entities, Value Objects, Ports, Events        │
│   (Pure business logic, zero deps)              │
├─────────────────────────────────────────────────┤
│              Infrastructure Layer               │
│   Repository Impls, DB Clients, Adapters        │
│   (Framework and library dependencies)          │
└─────────────────────────────────────────────────┘

Dependency Rule: arrows point INWARD only
Interface → Application → Domain ← Infrastructure
```

**Rationale**: Standard Clean Architecture concentric layers. Infrastructure implements domain ports (dependency inversion), so domain never depends on Postgres, Redis, or Express.

### D2: Module Directory Convention (Backend)

```
backend/src/
├── modules/
│   ├── auth/
│   │   ├── domain/
│   │   │   ├── entities/        User.ts, Session.ts
│   │   │   ├── value-objects/   Email.ts, Password.ts
│   │   │   ├── ports/           IUserRepository.ts, ITokenService.ts
│   │   │   └── events/          UserRegistered.ts
│   │   ├── application/
│   │   │   ├── use-cases/       SignUpUseCase.ts, SignInUseCase.ts
│   │   │   ├── dtos/            SignUpInput.ts, AuthResult.ts
│   │   │   └── services/        (optional app-level orchestration)
│   │   ├── infrastructure/
│   │   │   ├── repositories/    PostgresUserRepository.ts
│   │   │   ├── adapters/        RedisSessionAdapter.ts
│   │   │   └── mappers/         UserMapper.ts
│   │   └── interface/
│   │       ├── controllers/     auth.controller.ts
│   │       ├── routes/          auth.routes.ts
│   │       ├── middleware/      auth-rate-limit.middleware.ts
│   │       └── validators/      auth.validators.ts
│   ├── candidates/
│   │   └── ... (same structure)
│   └── ...
├── shared/
│   └── infrastructure/
│       ├── database/            postgres.ts, redis.ts
│       ├── middleware/          error.middleware.ts, cors, helmet
│       ├── config/              env config
│       └── http/                app.ts, server bootstrap
└── index.ts
```

**Alternatives considered**:
- **Vertical slices** (no inner/outer layering): Simpler but loses explicit dependency boundaries.
- **Hexagonal with flat ports/adapters**: Equivalent but the concentric naming is more intuitive for onboarding.

**Decision**: Use concentric Clean Architecture with domain/application/infrastructure/interface sub-folders per module.

### D3: Dependency Injection Strategy

**Decision**: Manual constructor injection with a module-level composition root (factory).

Each module exposes a `createModule()` or `register()` function that wires dependencies:

```typescript
// modules/auth/index.ts
export function createAuthModule(deps: { db: Pool; redis: RedisClient }) {
  const userRepo = new PostgresUserRepository(deps.db);
  const sessionRepo = new PostgresSessionRepository(deps.db);
  const tokenService = new JwtTokenService();

  const signUpUseCase = new SignUpUseCase(userRepo, tokenService);
  const signInUseCase = new SignInUseCase(userRepo, sessionRepo, tokenService);

  const controller = new AuthController(signUpUseCase, signInUseCase);
  const routes = createAuthRoutes(controller);

  return { routes };
}
```

**Alternatives considered**:
- **tsyringe / inversify**: Adds decorator overhead and magic; team unfamiliar.
- **Singleton modules (current)**: No injection, hard to test, tight coupling.

**Decision**: Manual factory functions. Simple, explicit, no decorator overhead, easy to understand. Can upgrade to a DI container later if complexity justifies it.

### D4: Frontend Feature Module Convention

```
frontend/src/
├── features/
│   ├── auth/
│   │   ├── pages/          LoginPage.tsx, SignUpPage.tsx
│   │   ├── components/     LoginForm.tsx
│   │   ├── services/       AuthService.ts
│   │   ├── store/          authStore.ts
│   │   ├── hooks/          useAuth.ts
│   │   ├── types/          auth.types.ts
│   │   └── index.ts        (barrel export)
│   ├── candidates/
│   │   └── ...
│   └── ...
├── components/              (global shared UI)
│   ├── ui/
│   ├── layouts/
│   └── shared/
├── services/                (infrastructure: API client, socket)
├── store/                   (global stores: theme, locale)
├── context/                 (global React contexts)
├── hooks/                   (global hooks)
├── routes/                  (route definitions, import from features)
└── ...
```

**Rule**: Feature modules are self-contained. A feature may import from `components/ui/` or global `services/` but never from another feature directly. Cross-feature communication goes through global stores or events.

### D5: App Feature Module Convention

Same pattern as frontend adapted for React Native / Expo Router:

```
app/src/
├── features/
│   ├── auth/
│   │   ├── screens/        LoginScreen.tsx
│   │   ├── components/     LoginForm.tsx
│   │   ├── services/       authService.ts
│   │   ├── store/          authStore.ts
│   │   └── hooks/          useAuth.ts
│   └── ...
├── components/              (shared RN components)
├── services/                (infrastructure: API, socket)
├── store/                   (global stores)
└── hooks/                   (global hooks)
```

### D6: Shared Package Structure

```
shared/
├── domain/                  (cross-context domain types: User, Tenant, etc.)
├── contracts/               (API DTOs: request/response shapes)
├── utils/                   (pure utility functions)
└── @types/                  (legacy alias, re-exports from domain/)
```

### D7: Migration Strategy

**Incremental, module-by-module** migration in 6 waves:

1. **Preparation**: Agree on conventions, create ESLint dependency-rule plugin
2. **Reference module**: Migrate `auth` as the template; document the pattern
3. **Cross-cutting infra**: Move shared infrastructure (db, config, middleware)
4. **Domain waves** (A–F): Migrate remaining 32+ modules following the reference
5. **Frontend & App restructure**: Feature-module migration (can run in parallel with backend waves)
6. **Cleanup**: Remove legacy directories, update docs, full validation

Each wave is a separate PR (or set of PRs) that must pass all tests before merging.

**Rollback**: Each wave is independently revertable since it only moves files and updates imports within a bounded context.

### D8: Enforcing the Dependency Rule

- **ESLint plugin** (`eslint-plugin-import` with `no-restricted-imports`): Prevent domain/application from importing infrastructure/interface modules
- **TypeScript project references**: Each module can have its own `tsconfig.json` with restricted `paths`
- **CI check**: Add a lint step that verifies no dependency rule violations

Example ESLint rule:
```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        { "group": ["**/infrastructure/**", "**/interface/**"], "message": "Domain/Application layers must not import from Infrastructure/Interface" }
      ]
    }]
  }
}
```

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Import path breakage across 300+ files | High | Automated codemods + IDE refactoring; wave-by-wave |
| Merge conflicts with in-flight feature PRs | Medium | Coordinate timing; do waves during low–activity periods |
| Over-engineering for current team size (1 dev) | Medium | Keep it simple — manual DI, no decorators, minimal abstractions |
| Performance regression from extra indirection | Low | No runtime impact — it's structural only |
| Learning curve for contributors | Low | Reference module + ARCHITECTURE.md + updated instructions |

## Migration Plan

### Phase 1: Preparation (1–2 days)
- Finalize conventions (this design doc)
- Set up ESLint dependency rules
- Create reference module skeleton

### Phase 2: Reference Implementation (2–3 days)
- Migrate `auth` module as reference
- Document patterns in CONVENTIONS.md
- Verify all auth tests pass

### Phase 3: Infrastructure Extraction (1 day)
- Move shared infrastructure
- Update app bootstrap
- Verify boot + tests

### Phase 4: Backend Module Migration (1–2 weeks)
- 6 waves × ~5 modules each
- Each wave is a PR with passing tests

### Phase 5: Frontend + App Migration (3–5 days)
- Feature module restructuring
- Route updates
- Parallel with later backend waves

### Phase 6: Cleanup + Docs (1–2 days)
- Remove legacy directories
- Update all instruction files
- Create ARCHITECTURE.md
- Final full-suite test pass

**Total estimated effort**: 3–4 weeks for complete migration.

## Open Questions

1. Should we use TypeScript project references per module, or a single tsconfig? (Recommendation: single tsconfig initially, project references later if build times become an issue)
2. Should domain events be implemented now, or left as a future enhancement? (Recommendation: create the `events/` folder structure but only implement events when a concrete use case requires them)
3. Should the `mock-api` module follow Clean Architecture or remain as a test utility? (Recommendation: keep it as infrastructure utility outside the modules structure)
