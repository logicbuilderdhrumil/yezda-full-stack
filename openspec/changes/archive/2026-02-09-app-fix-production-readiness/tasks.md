## 1. Playwright MCP Discovery
- [x] 1.1 Navigate to app root (http://localhost:6314) and take snapshot
- [x] 1.2 Test login screen rendering and form interactions
- [x] 1.3 Test auth flow (login → tabs redirect)
- [x] 1.4 Test Applications tab (list, empty state, card rendering)
- [x] 1.5 Test Profile tab (overview, edit, password change)
- [x] 1.6 Test Settings tab (links, sign out)
- [x] 1.7 Test tab navigation between all tabs
- [x] 1.8 Check console for JS errors across all screens
- [x] 1.9 Document all discovered issues

### Discovered Issues (Round 1)
1. **Applications 401**: `/api/v1/applications` route has no JWT auth middleware → `req.user` is null → 401
2. **Profile 404**: No `/api/v1/profile` route exists in backend
3. **App routes not registered**: `app-application-intake.routes.ts` and `app-consent.routes.ts` not imported in routes/index.ts
4. **Platform type mismatch**: `generateAppTokenPair` uses `'ios' | 'android'` but should include `'web'`
5. **App service paths**: Application service calls `/v1/applications` but app-specific auth routes expect `/v1/app/applications`

### Discovered Issues (Round 2)
6. **Consent page crash**: Backend returned `{ status: "none" }` but app expected `{ consents: [] }` → `.filter()` on `undefined` crashed
7. **Profile empty data**: Backend returned flat user object, app expected `{ profile: { ... } }` → `response.profile` was `undefined`
8. **Sign-out broken on web**: `Alert.alert` doesn't work on web; no redirect to login after sign-out

## 2. Fix Backend Route Registration & Auth
- [x] 2.1 Register `app-application-intake.routes.ts` in routes/index.ts at `/app/applications`
- [x] 2.2 Register `app-consent.routes.ts` in routes/index.ts at `/app/consent`
- [x] 2.3 Create `app-profile.routes.ts` + controller for candidate profile (GET/PUT /v1/app/profile)
- [x] 2.4 Fix `generateAppTokenPair` platform type to include `'web'`
- [x] 2.5 Fix consent endpoint to return `{ consents: [] }` instead of `{ status: "none" }`
- [x] 2.6 Fix profile endpoint to return `{ profile: { ... } }` wrapper
- [x] 2.7 Rebuild backend Docker container and verify health

## 3. Fix App Service Paths & UI
- [x] 3.1 Update `applicationService.ts` to use `/v1/app/applications` paths
- [x] 3.2 Update `profileService.ts` to use `/v1/app/profile` path
- [x] 3.3 Update `consentService.ts` to use `/v1/app/consent` path
- [x] 3.4 Add defensive `?? []` guard in consentStore loadConsentHistory
- [x] 3.5 Add defensive `?? []` guard in ConsentReviewScreen filter calls
- [x] 3.6 Fix sign-out to use `window.confirm` on web + redirect to `/login`
- [x] 3.7 Rebuild app-render Docker container with fixes

## 4. Validation
- [x] 4.1 Re-run Playwright MCP tests to confirm fixes
- [x] 4.2 Verify zero console errors
- [x] 4.3 Final visual validation across all tabs
- [x] 4.4 Verify login → applications → profile → edit/save → settings → consent → sign-out flow
- [x] 4.5 Verify profile data persists after save (firstName, lastName, phone)
