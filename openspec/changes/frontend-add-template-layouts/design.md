## Context
Template layout components define the visual frame of the app and include navigation and global controls.

## Goals / Non-Goals
- Goals: Provide consistent header, navigation, and footer components.
- Goals: Provide theme and language selectors.
- Non-Goals: Branding guidelines or content strategy.

## Decisions
- Decision: Use a template component layer between layout shell and UI primitives.
- Decision: Keep navigation menus configuration-driven.

## Risks / Trade-offs
- Template components can become tightly coupled to route structure.

## Migration Plan
- Start with header and side nav, then add dropdowns and configurators.

## Open Questions
- Should header support global search in MVP?
