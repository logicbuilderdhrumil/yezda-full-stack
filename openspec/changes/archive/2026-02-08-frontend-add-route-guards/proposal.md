# Change: Add route guard components

## Why
Enforce authentication and authority checks consistently across routes.

## What Changes
- Build AppRoute, PublicRoute, and ProtectedRoute components.
- Add authority guard for role-based access.
- Centralize route rendering in AllRoutes.

## Impact
- Affected specs: route-guards
- Affected code: src/components/route
