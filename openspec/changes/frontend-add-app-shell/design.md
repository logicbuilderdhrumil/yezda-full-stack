## Context
The app is a single-page admin dashboard with multiple modules. The shell defines global layout, navigation, routing, and shared providers for theme and locale.

## Goals / Non-Goals
- Goals: Consistent layout, role-aware navigation, and predictable route handling.
- Goals: Theming and localization at the shell level.
- Non-Goals: Backend auth implementation or API design.

## Decisions
- Decision: Use React Router with public/protected route arrays and lazy-loaded views.
- Decision: Render a collapsible sidebar and fixed header within a shared AppShell component.
- Decision: Navigation items are defined in config and filtered by authority.
- Decision: Theme and locale state are managed in client stores/providers.

## Risks / Trade-offs
- Route guard complexity vs. flexibility for public and protected flows.
- Navigation config drift if routes and nav items are not maintained together.

## Migration Plan
- Start with a minimal home route and expand routes as features are added.
- Add providers incrementally and keep fallback rendering stable during lazy loads.

## Open Questions
- Where should theme/locale preferences be persisted (local storage, cookies, or backend)?
- Should the shell support multiple layout variants beyond the default?
