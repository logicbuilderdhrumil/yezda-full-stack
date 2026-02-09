## Context
System admins need visibility into billed and unbilled ledger entries for operational review.

## Goals / Non-Goals
- Goals: Provide billed and unbilled ledger lists with filters and totals.
- Goals: Export ledger data for reporting.
- Non-Goals: In-app invoicing or payment processing.

## Decisions
- Decision: Separate billed and unbilled views for clarity.
- Decision: Use consistent table components with shared filters.
- Decision: Restrict access to system admin only.

## Risks / Trade-offs
- Large datasets require pagination or virtualization.
- Export formats must align with finance expectations.

## Migration Plan
- Start with billed list, then unbilled, then export.

## Open Questions
- What fields are required for ledger entries?
- Which export formats are mandatory?
