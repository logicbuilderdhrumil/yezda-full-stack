## 1. Foundation — Admin Shell Migration
- [ ] 1.1 Create `AdminShell.tsx` layout (based on current `AppShell.tsx`)
- [ ] 1.2 Create `AdminSidebar.tsx` navigation (based on current `Sidebar.tsx`)
- [ ] 1.3 Create `adminNav.config.ts` with all current nav items prefixed with `/admin/`
- [ ] 1.4 Update route definitions: move all current protected routes under `/admin/` prefix
- [ ] 1.5 Add route redirects from old paths to new `/admin/*` paths (backward compat)

## 2. Client Shell & Layout
- [ ] 2.1 Create `ClientShell.tsx` layout component
- [ ] 2.2 Create `ClientSidebar.tsx` with client-specific navigation
- [ ] 2.3 Create `clientNav.config.ts` with client navigation (Dashboard, Candidates, Screening, Reports, Settings)
- [ ] 2.4 Add client route definitions at `/` namespace

## 3. Role-Based Routing
- [ ] 3.1 Add role-based redirect: admin users at `/` → redirect to `/admin/`
- [ ] 3.2 Add role-based redirect: client users at `/admin/*` → redirect to `/` or access-denied
- [ ] 3.3 Create `ClientGuard` route guard for client routes
- [ ] 3.4 Update `ProtectedRoute` to handle admin vs client routing

## 4. Backend — RBAC Extension
- [ ] 4.1 Add `client` and `client_admin` to `UserRole` type in shared types
- [ ] 4.2 Update route-guards middleware to recognize client roles
- [ ] 4.3 Add client-specific route guards (tenant-scoped, read-focused)

## 5. Org Perspective Switcher
- [ ] 5.1 Create `OrgPerspectiveContext.tsx` with `activeOrgId`, `isPerspectiveMode`, `setActiveOrg`, `clearPerspective`
- [ ] 5.2 Create `OrgPerspectiveSwitcher.tsx` dropdown component (header bar placement)
- [ ] 5.3 Add switcher to `Header.tsx` — visible only for admin users when on client routes
- [ ] 5.4 Add API interceptor to include `X-Org-Perspective` header when admin is in client view
- [ ] 5.5 Add visual "Viewing as: [Org Name]" banner/indicator

## 6. Client Views
- [ ] 6.1 Create `ClientDashboardView` with org-scoped screening metrics
- [ ] 6.2 Create/adapt `ClientCandidatesListView` showing org-scoped candidates with screening status
- [ ] 6.3 Create `ClientCandidateDetailView` showing pipeline progress and results
- [ ] 6.4 Create `ClientOrgSettingsView` for org logo, contact info, notification prefs
- [ ] 6.5 Create `ClientProfileView` for client user's own profile

## 7. Backend — Client API Endpoints
- [ ] 7.1 Add `GET /api/v1/client/dashboard` — org-scoped screening summary metrics
- [ ] 7.2 Add `GET /api/v1/client/candidates` — org-scoped candidate list with screening status
- [ ] 7.3 Add `GET /api/v1/client/candidates/:id` — org-scoped candidate detail
- [ ] 7.4 Add `GET /api/v1/client/org/settings` — org settings read
- [ ] 7.5 Add `PUT /api/v1/client/org/settings` — org settings update (client_admin only)

## 8. Tests
- [ ] 8.1 Test admin routes work at `/admin/*` paths
- [ ] 8.2 Test client routes work at `/` paths
- [ ] 8.3 Test role-based redirects (admin → /admin, client → /)
- [ ] 8.4 Test org perspective switcher (admin viewing as org)
- [ ] 8.5 Test client views render with org-scoped data
- [ ] 8.6 Unit tests for client role authorization
