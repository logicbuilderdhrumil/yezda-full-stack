## Context
A consistent UI kit reduces duplication and ensures coherent styling across features.

## Goals / Non-Goals
- Goals: Provide reusable primitives for forms, layout, and feedback.
- Goals: Ensure components are theme-aware and accessible.
- Non-Goals: Full design system documentation site.

## Decisions
- Decision: Use Tailwind-based styling with component variants.
- Decision: Centralize component exports in a single index.

## Risks / Trade-offs
- Large component surface area requires ongoing maintenance.

## Migration Plan
- Build core primitives first, then advanced components like tables and date pickers.

## Open Questions
- Which components need accessibility audits before release?
