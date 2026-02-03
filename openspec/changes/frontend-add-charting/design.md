## Context
Charts are used across dashboards and reports and should be consistent.

## Goals / Non-Goals
- Goals: Provide default chart config and theme integration.
- Non-Goals: Build a full analytics engine.

## Decisions
- Decision: Wrap chart library with a shared component.

## Risks / Trade-offs
- Chart library upgrades may require config updates.

## Migration Plan
- Add base config first, then chart helpers.

## Open Questions
- Which chart types are required for MVP?
