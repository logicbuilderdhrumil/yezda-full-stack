## Context
The theme system ensures consistent styling across all UI components.

## Goals / Non-Goals
- Goals: Provide theme tokens and presets.
- Goals: Support runtime theme switching.
- Non-Goals: Full design editor.

## Decisions
- Decision: Use CSS variables for primary theme tokens.
- Decision: Store active theme in a global store.

## Risks / Trade-offs
- Theme changes can impact readability without contrast checks.

## Migration Plan
- Implement base theme first, then add presets.

## Open Questions
- Should custom theme editing be enabled for admins?
