## Context
Candidate workflows are central to the platform, including creation, submission, certification, and archival.

## Goals / Non-Goals
- Goals: Provide list, create, edit, and details views.
- Goals: Support bulk creation and submission forms.
- Goals: Provide certified and archived views.
- Non-Goals: Full applicant tracking system beyond candidate data.

## Decisions
- Decision: Use status fields to drive certified and archived lists.
- Decision: Provide a dedicated submission form route for candidates.
- Decision: Use bulk upload workflow for large candidate imports.

## Risks / Trade-offs
- Bulk import validation and error reporting can be complex.
- Multiple list views can diverge if filters are inconsistent.

## Migration Plan
- Start with list and details, then create/edit, then bulk and submission flows.

## Open Questions
- What file format is required for bulk import (CSV, XLSX)?
- What validation rules are mandatory for candidate profiles?
