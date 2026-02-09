# Tasks: Refactor to Clean Architecture

## 0. Preparation

- [x] 0.1 Agree on dependency injection strategy (DECISION = constructor injection)
- [x] 0.2 Agree on module boundary conventions (DECISION = inter-module imports)
- [x] 0.3 Define the reference module (auth) directory skeleton and validate it with team
- [x] 0.4 Create shared ESLint rules to enforce the dependency rule (no inward-to-outward imports)

## 1. Shared Layer Restructuring

- [x] 1.1 Create `shared/domain/` for cross-bounded-context domain types (User, Candidate, Tenant, etc.)
- [x] 1.2 Create `shared/contracts/` for API request/response DTOs shared between frontend and backend
- [x] 1.3 Migrate existing `shared/@types/` into `shared/domain/` and `shared/contracts/` as appropriate
- [x] 1.4 Retain `shared/utils/` for pure utility functions
- [x] 1.5 Update `shared/tsconfig.json` path aliases

## 2. Backend — Reference Module (Auth)

- [x] 2.1 Create `backend/src/modules/auth/` directory skeleton:
- [x] 2.2 Extract domain entities from `models/auth.model.ts` → `modules/auth/domain/entities/`
- [x] 2.3 Define repository port interfaces in `modules/auth/domain/ports/`
- [x] 2.4 Create use cases from existing `services/auth.service.ts` methods → `modules/auth/application/use-cases/`
- [x] 2.5 Move `repositories/user.repository.ts` → `modules/auth/infrastructure/repositories/` implementing ports
- [x] 2.6 Move `controllers/auth.controller.ts` → `modules/auth/interface/controllers/`
- [x] 2.7 Move `routes/auth.routes.ts` → `modules/auth/interface/routes/`
- [x] 2.8 Wire dependency injection (repositories → use cases → controllers)
- [x] 2.9 Update `routes/index.ts` to import auth routes from new module location
- [x] 2.10 Verify all auth-related tests pass without behavioral changes
- [x] 2.11 Document the reference pattern in a CONVENTIONS.md for other modules to follow

## 3. Backend — Cross-Cutting Infrastructure

- [x] 3.0 Update `.github\skills\project-conventions\SKILL.md`, and the `.github\instructions\backend.instructions.md` and `.github\instructions\frontend.instructions.md` to reflect the new Clean Architecture conventions for repo code organization and layering rules.

- [x] 3.1 Create `backend/src/shared/infrastructure/` for shared concerns:
- [x] 3.2 Move `db/postgres.ts`, `db/redis.ts` → `shared/infrastructure/database/`
- [x] 3.3 Move `config/` → `shared/infrastructure/config/`
- [x] 3.4 Move global middleware (error, CORS, helmet) → `shared/infrastructure/middleware/`
- [x] 3.5 Update `app.ts` and `index.ts` imports to point at new locations
- [x] 3.6 Verify application boots and all tests pass

## 4. Backend — Remaining Module Migration (Wave-by-Wave)

Each module follows the same pattern established in Task 2 (auth reference). Migrate in priority order:

### Wave A — Core Business
- [x] 4.1 Migrate `candidate-management` module
- [x] 4.2 Migrate `screening-pipeline` module
- [x] 4.3 Migrate `form-builder` module
- [x] 4.4 Migrate `user-management` module
- [x] 4.5 Migrate `org-management` module

### Wave B — Communication & Collaboration
- [x] 4.6 Migrate `chat` module
- [x] 4.7 Migrate `notification` module
- [x] 4.8 Migrate `socket` (realtime) module
- [x] 4.9 Migrate `file-management` module

### Wave C — Supporting Features
- [x] 4.10 Migrate `billing-ledger` module
- [x] 4.11 Migrate `asset-management` module
- [x] 4.12 Migrate `template-layouts` module
- [x] 4.13 Migrate `home-dashboard` module
- [x] 4.14 Migrate `charting` module

### Wave D — Platform & Integration
- [x] 4.15 Migrate `oauth` module
- [x] 4.16 Migrate `firebase` module
- [x] 4.17 Migrate `state-store` module
- [x] 4.18 Migrate `theme` module
- [x] 4.19 Migrate `localization` module

### Wave E — UI Support & Admin
- [x] 4.20 Migrate `view-components` module
- [x] 4.21 Migrate `shared-widgets` module
- [x] 4.22 Migrate `ui-kit` module
- [x] 4.23 Migrate `custom-components` module
- [x] 4.24 Migrate `shell` module

### Wave F — Remaining Modules
- [x] 4.25 Migrate `account-settings` module
- [x] 4.26 Migrate `client-portal` module
- [x] 4.27 Migrate `global-candidate-identity` module
- [x] 4.28 Migrate `export` & `job` modules
- [x] 4.29 Migrate `consent` module
- [x] 4.30 Migrate `review-task` & `webhook` modules
- [x] 4.31 Migrate `application` module
- [x] 4.32 Migrate `mock-api` module
- [x] 4.33 Migrate `app-auth`, `app-application-intake`, `app-consent`, `app-profile` modules

### Wave Cleanup
- [x] 4.34 Remove legacy flat directories (`controllers/`, `services/`, `models/`, `repositories/`, `routes/`, `middleware/`) once empty
- [x] 4.35 Full backend test suite pass

## 5. Frontend — Feature Module Restructuring

- [x] 5.1 Create `frontend/src/features/` directory
- [x] 5.2 Establish reference feature module (auth):
  ```
  features/auth/
  ├── pages/           (LoginPage, SignUpPage, MfaPage)
  ├── components/      (LoginForm, MfaForm)
  ├── services/        (AuthService.ts)
  ├── store/           (authStore.ts)
  ├── hooks/           (useAuth, useSession)
  ├── types/           (auth types)
  └── index.ts         (public barrel export)
  ```
- [x] 5.3 Migrate `views/auth/`, `services/AuthService.ts`, `store/authStore.ts` into `features/auth/`
- [x] 5.4 Migrate remaining view directories into corresponding feature modules:
-  - `views/candidates/` → `features/candidates/`
-  - `views/home/` → `features/dashboard/`
-  - `views/chat/` → `features/chat/`
-  - `views/organizations/` → `features/organizations/`
-  - `views/users/` → `features/users/`
-  - `views/forms/` → `features/forms/`
-  - `views/files/` → `features/files/`
-  - `views/ledger/` → `features/billing/`
-  - `views/settings/` → `features/settings/`
-  - `views/pipelines/` → `features/pipelines/`
-  - `views/notifications/` → `features/notifications/`
-  - `views/screening/` → `features/screening/`
-  - `views/client/` → `features/client-portal/`
-  - `views/reports/` → `features/reports/`
-  - `views/reviews/` → `features/reviews/`
-  - `views/account/` → `features/account/`
- [x] 5.5 Keep `components/ui/`, `components/layouts/`, `components/shared/` as global shared components
- [x] 5.6 Keep `services/ApiService.ts`, `services/SocketService.ts` as infrastructure services
- [x] 5.7 Keep `store/` for global stores (theme, locale, route-key)
- [x] 5.8 Update route definitions to import from feature modules
- [x] 5.9 Update `@/` path alias if needed (or add `@features/` alias)
- [x] 5.10 Verify all frontend tests pass

## 6. App — Feature Module Restructuring

- [x] 6.1 Create `app/src/features/` directory
- [x] 6.2 Establish reference feature module (auth):
-  ```
  features/auth/
  ├── screens/         (LoginScreen, MfaScreen)
  ├── components/      (LoginForm)
  ├── services/        (authService.ts)
  ├── store/           (authStore.ts)
  ├── hooks/           (useAuth)
  └── index.ts
  ```
- [x] 6.3 Migrate existing `screens/`, `services/`, `store/` into feature modules
- [x] 6.4 Keep `components/` for shared UI components
- [x] 6.5 Update Expo Router layouts to import from feature modules
- [x] 6.6 Verify all app tests pass

- [x] 7.1 Update `openspec/project.md` to reflect Clean Architecture conventions
- [x] 7.2 Update `.github/instructions/backend.instructions.md` with new layering rules
- [x] 7.3 Update `.github/instructions/frontend.instructions.md` with feature-module rules
- [x] 7.4 Update `.github/instructions/app.instructions.md` with feature-module rules
- [x] 7.5 Update `.github/instructions/shared.instructions.md` with new shared structure
- [x] 7.6 Create `ARCHITECTURE.md` at repo root documenting the Clean Architecture approach
- [x] 7.7 Update `docker-compose.yml` if volume mounts or build contexts change
- [x] 7.8 Update `tsconfig.json` path aliases in all workspaces

- [x] 8.1 Full test suite pass across backend, frontend, and app
- [x] 8.2 Docker build succeeds for all services
- [x] 8.3 Smoke test login/auth flow end-to-end
- [x] 8.4 Code review by team (structural review, not behavioral)
- [x] 8.5 Update OpenSpec specs if any structural requirements existed (none expected)
