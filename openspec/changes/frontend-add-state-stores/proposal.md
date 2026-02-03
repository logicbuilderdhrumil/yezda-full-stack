# Change: Add state stores

## Why
Provide centralized client state for auth, theme, locale, and presence.

## What Changes
- Implement Zustand stores for key app state.
- Add persistence for selected stores.
- Provide hooks for accessing and mutating state.

## Impact
- Affected specs: state-stores
- Affected code: src/store
