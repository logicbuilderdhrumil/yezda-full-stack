## ADDED Requirements

### Requirement: Clean Architecture Module Structure
The backend codebase SHALL organize code into domain-driven modules under `modules/`, where each module contains four layers: `domain/`, `application/`, `infrastructure/`, and `interface/`.

#### Scenario: New backend feature module created
- **WHEN** a new backend feature module is created
- **THEN** it SHALL contain `domain/entities/`, `domain/ports/`, `application/use-cases/`, `infrastructure/repositories/`, and `interface/controllers/` sub-directories
- **AND** the module SHALL expose a public API through a barrel `index.ts`

#### Scenario: Existing module lookup
- **WHEN** a developer needs to find all code for a domain concern (e.g., auth, candidates)
- **THEN** all related entities, use cases, repositories, controllers, and routes SHALL be co-located under `modules/<domain>/`

### Requirement: Dependency Rule Enforcement
Inner layers (domain, application) SHALL NOT import from outer layers (infrastructure, interface). Infrastructure SHALL implement domain port interfaces via dependency inversion.

#### Scenario: Domain layer independence
- **WHEN** domain entity or port code is compiled
- **THEN** it SHALL have zero imports from `infrastructure/`, `interface/`, or any framework-specific package (Express, pg, ioredis)

#### Scenario: Application layer independence
- **WHEN** application use-case code is compiled
- **THEN** it SHALL only import from the domain layer and standard library
- **AND** it SHALL depend on port interfaces, not concrete implementations

#### Scenario: Infrastructure implements ports
- **WHEN** a repository or adapter is implemented in the infrastructure layer
- **THEN** it SHALL implement a corresponding port interface defined in the domain layer

### Requirement: Dependency Injection via Composition Root
Each module SHALL expose a factory function (composition root) that wires concrete implementations to use-case dependencies. The application bootstrap SHALL call these factories to assemble the dependency graph.

#### Scenario: Module wiring at startup
- **WHEN** the application starts
- **THEN** each module's factory function SHALL be called with shared infrastructure dependencies (database pool, cache client)
- **AND** the factory SHALL return the module's route handlers ready for mounting

#### Scenario: Use-case testability
- **WHEN** a use case is tested in isolation
- **THEN** mock implementations of port interfaces SHALL be injectable via constructor parameters
- **AND** no database or HTTP framework dependency SHALL be required

### Requirement: Shared Infrastructure Layer
Cross-cutting infrastructure (database clients, global middleware, configuration, logging) SHALL live in `backend/src/shared/infrastructure/` and be importable by any module's infrastructure or interface layer.

#### Scenario: Database access
- **WHEN** a module's infrastructure layer needs a database connection
- **THEN** it SHALL import the connection pool from `shared/infrastructure/database/`
- **AND** it SHALL NOT create its own database connections

#### Scenario: Global middleware applied
- **WHEN** the HTTP server bootstraps
- **THEN** global middleware (error handling, CORS, rate limiting, correlation ID) SHALL be imported from `shared/infrastructure/middleware/`

### Requirement: Frontend Feature Module Structure
The frontend codebase SHALL organize feature code into self-contained modules under `features/`, where each feature module contains its pages, components, services, store, hooks, and types.

#### Scenario: New frontend feature created
- **WHEN** a new frontend feature is added
- **THEN** it SHALL be created under `features/<name>/` with `pages/`, `components/`, `services/`, `store/`, and an `index.ts` barrel export
- **AND** global shared components SHALL remain in `components/ui/` and `components/layouts/`

#### Scenario: Feature isolation
- **WHEN** a feature module is developed
- **THEN** it SHALL NOT import directly from another feature module
- **AND** cross-feature communication SHALL use global stores or events

### Requirement: App Feature Module Structure
The customer-facing app codebase SHALL organize feature code into self-contained modules under `features/`, following the same pattern as the frontend but using React Native screens instead of pages.

#### Scenario: New app feature created
- **WHEN** a new app feature is added
- **THEN** it SHALL be created under `features/<name>/` with `screens/`, `components/`, `services/`, `store/`, and an `index.ts` barrel export

#### Scenario: Shared navigation preserved
- **WHEN** Expo Router layouts reference feature screens
- **THEN** they SHALL import from the feature module's public barrel export

### Requirement: Shared Package Domain Structure
The shared package SHALL organize cross-context types into `domain/` for business entities and `contracts/` for API request/response DTOs, replacing the flat `@types/` structure.

#### Scenario: Shared type consumption
- **WHEN** frontend, backend, or app code needs a shared domain type
- **THEN** it SHALL import from `shared/domain/` or `shared/contracts/`
- **AND** the shared package SHALL NOT contain framework-specific dependencies
