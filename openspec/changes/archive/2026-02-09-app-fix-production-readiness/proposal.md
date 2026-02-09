# Change: Fix App Production Readiness Issues

## Why
The Expo/React Native candidate app compiles and passes all tests, but has not been validated
visually via Playwright MCP testing on the web export (Docker port 6314). Real-world rendering
issues — broken layouts, navigation failures, missing content, console errors — must be found
and fixed before production launch.

## What Changes
- Fix rendering issues discovered during Playwright MCP testing of the web-exported app
- Fix navigation flow issues (login → tabs, tab switching, deep links)
- Fix visual layout and styling problems (NativeWind/Tailwind CSS on web)
- Fix error states and loading states that don't render correctly on web
- Add missing UI polish (dark mode support, empty states, error handling)
- Ensure console-error-free experience across all screens

## Impact
- Affected specs: app-shell, app-auth, app-application-intake, app-account-profile, app-consent-reuse
- Affected code: app/app/ (routing), app/src/screens/, app/src/store/, app/src/services/
- This is a living proposal — tasks.md will be updated as Playwright testing discovers issues
