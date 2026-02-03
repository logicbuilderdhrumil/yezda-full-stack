---
name: app-conventions
description: Apply app track conventions for Expo + React Native + TypeScript. Trigger keywords: app, react-native, expo, nativewind, mobile.
---

## App Stack
- Expo + React Native + TypeScript 5.
- NativeWind for Tailwind-style utilities.
- Zustand state management.
- SWR or React Query for data fetching.
- Firebase SDK (auth/notifications) and Socket.IO client for realtime.

## App Structure
- Screens and navigation under app/ src or app/ screens directory, depending on current layout.
- Shared app types near app/@types if present.
- Services for API calls and business logic.

## Quality
- Prefer named exports unless a file has a single primary export.
- Keep network calls in services or hooks.
- Update tests when behavior changes.

## Related Skills
- app-workflow (delivery steps and worktree flow)
- app-review (review focus and output format)
- project-conventions (shared repo standards)
