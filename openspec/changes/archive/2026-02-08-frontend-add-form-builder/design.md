## Context
Forms are used to collect candidate information and must be configurable by admins without code changes.

## Goals / Non-Goals
- Goals: Provide form list, create, edit, and preview.
- Goals: Provide a form builder for field configuration and validation.
- Non-Goals: Advanced workflow automation or conditional logic beyond basic validation.

## Decisions
- Decision: Store forms as JSON schemas with ordered fields.
- Decision: Use a builder canvas with a field palette and config panel.
- Decision: Keep field types minimal (text, number, date, select, file) and expand later.

## Risks / Trade-offs
- Schema design impacts future extensibility.
- Validation rules must be consistent across builder and runtime.

## Migration Plan
- Implement list and create first, then builder UI and preview.

## Open Questions
- Which field types are required in MVP?
- Do forms require versioning or draft states?
