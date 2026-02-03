## Context
Route guards centralize auth and authority logic for the router.

## Goals / Non-Goals
- Goals: Separate public and protected routing concerns.
- Goals: Enforce role-based access with a single guard.
- Non-Goals: Backend authorization logic.

## Decisions
- Decision: Wrap route elements with guard components.
- Decision: Use a single AllRoutes component to render the route map.

## Risks / Trade-offs
- Guard complexity can grow as meta requirements increase.

## Migration Plan
- Implement PublicRoute and ProtectedRoute first, then AuthorityGuard.

## Open Questions
- Should access control be declarative in route config meta?
