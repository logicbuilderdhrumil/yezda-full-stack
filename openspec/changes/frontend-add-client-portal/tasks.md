## 1. Backend — RBAC Extension
- [ ] 1.1 Add `client` and `client_admin` to `UserRole` type
- [ ] 1.2 Update route-guards middleware to recognize client roles
- [ ] 1.3 Add client-specific route guards (tenant-scoped, read-focused)

## 2. Backend — Client API Endpoints
- [ ] 2.1 Add `GET /api/v1/client/dashboard` — org-scoped screening summary metrics
- [ ] 2.2 Add `GET /api/v1/client/candidates` — org-scoped candidate list with screening status
- [ ] 2.3 Add `GET /api/v1/client/candidates/:id` — org-scoped candidate detail with pipeline progress
- [ ] 2.4 Add `GET /api/v1/client/org/settings` — org settings read
- [ ] 2.5 Add `PUT /api/v1/client/org/settings` — org settings update (client_admin only)

## 3. Backend — Tests
- [ ] 3.1 Unit tests for client role authorization
- [ ] 3.2 Integration tests for client API endpoints (scoping, permissions)

## 4. Frontend — Layout & Routing
- [ ] 4.1 Create `ClientShell` layout component with client-specific navigation
- [ ] 4.2 Add `/client` route namespace with role guard (`client`, `client_admin`)
- [ ] 4.3 Add role-based redirect: client users landing on `/` redirect to `/client`
- [ ] 4.4 Update `AppShell` navigation to hide admin-only links for client users

## 5. Frontend — Client Views
- [ ] 5.1 Create `ClientDashboardView` with screening summary metrics (cards, charts)
- [ ] 5.2 Create `ClientCandidatesListView` showing org-scoped candidates with screening status
- [ ] 5.3 Create `ClientCandidateDetailView` showing pipeline progress and screening results
- [ ] 5.4 Create `ClientOrgSettingsView` for managing org logo, contact info, notification prefs
- [ ] 5.5 Create `ClientProfileView` for client user's own profile

## 6. Frontend — Tests
- [ ] 6.1 Test role-based routing (client users can't access admin routes)
- [ ] 6.2 Test client views render with scoped data
