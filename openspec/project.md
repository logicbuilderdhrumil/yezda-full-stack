# Project Context

## Purpose
Full-stack Employment Screening Service monorepo with a React + Vite admin dashboard frontend, Node.js backend, and customer-facing screening application. Enables HR teams to manage candidate screening workflows, background checks, document verification, and compliance reporting. Provides a dedicated customer portal for candidates to complete screening forms, submit work history, and provide additional information as determined by dynamic form builder configurations. Focus on secure data handling, audit trails, multi-tenant support, and rapid feature delivery.

## Tech Stack

### Frontend (Admin Dashboard)
- React 19 + TypeScript 5
- Vite 6 (module-based, ESM)
- Tailwind CSS 4 + PostCSS
- React Router 7
- Zustand state management
- SWR for data fetching and caching
- Firebase SDK (auth/notifications)
- Socket.IO client (realtime screening updates)
- ESLint + Prettier

### App (Customer-Facing App)
- Expo + React Native + TypeScript 5
- NativeWind for Tailwind CSS styling
- Zustand state management
- SWR or React Query for data fetching
- Firebase SDK (auth/notifications)
- Socket.IO client (realtime screening updates)

### Backend
- Node.js + Express (or similar)
- TypeScript for type safety
- PostgreSQL/MongoDB for data persistence
- Redis for caching and queues
- JWT authentication
- Socket.IO server (realtime events)
- Background job processing (Bull, Celery, or similar)

### Monorepo Structure
- Workspaces at root level: `./frontend`, `./backend`, `./shared`
- Shared types and interfaces under `./shared/@types/`
- Shared utilities under `./shared/utils/`

## Project Conventions

### Code Style
- TypeScript strict mode enabled; prefer explicit types for public APIs.
- ESLint + Prettier are the source of truth for formatting.
- React hooks conventions; avoid unused imports and duplicate imports.
- Prefer named exports unless a file clearly has a single primary export.
- Use path alias `@/` for frontend imports from src.
- Consistent naming across frontend and backend for domain entities.

### Architecture Patterns
- Frontend: Vite SPA structure with `src/` as the root.
  - Feature folders under `src/views/` and reusable components under `src/components/`.
  - Shared types live under `src/@types/`.
  - Services under `src/services/` encapsulate API calls and business logic.
  - State stores under `src/store/`; contexts under `src/context/`.
- Backend: MVC/Layered architecture with controllers, services, models, and middleware.
  - Routes under `./routes/`, business logic under `./services/`, data models under `./models/`.
  - API versioning (e.g., `/api/v1/`).
  - Error handling and validation middleware globally applied.

### Testing Strategy
- Frontend: Jest + React Testing Library for unit and integration tests.
- Backend: Jest or Mocha/Chai for unit and integration tests; end-to-end tests for screening workflows.

### Git Workflow
- Feature branches named `feature/`, `bugfix/`, or `chore/`.
- Commit messages follow Conventional Commits format. Regularly commit small, focused changes.
- PR reviews required before merging to main.

## Domain Context
- HR admin dashboard for employment screening workflows.
- Candidate management: onboarding, document submission, background check coordination.
- Screening results aggregation and compliance reporting.
- Audit trails for all screening activities.
- Multi-tenant support with role-based access control (RBAC).
- Realtime notifications for screening status updates.

## Important Constraints
- Secure handling of PII and sensitive candidate data; comply with GDPR, CCPA, and local regulations.
- API calls between frontend and backend via `/api` in dev (Vite proxy to localhost:6312).
- Keep compatibility with React 19 and Tailwind 4.
- Backend services must validate and sanitize all inputs.
- Audit logging for sensitive operations (e.g., data access, report generation).

## External Dependencies
- Firebase (auth, notifications, optional for cloud services).
- Third-party screening providers (background check, identity verification APIs).
- Socket.IO server for realtime updates.
- REST APIs consumed via Axios (frontend) and native HTTP client (backend) with base path `/api`.
