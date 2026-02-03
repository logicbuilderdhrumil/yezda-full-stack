---
name: openspec-workflow
description: Guide OpenSpec proposal, delta writing, and validation. Trigger keywords: openspec, proposal, spec, change, validate, archive.
---

## Purpose
Provide a step-by-step OpenSpec workflow to ensure proposals, deltas, and validations are correct and complete.

## Workflow
1. Read openspec/project.md and openspec/AGENTS.md for conventions.
2. List active changes and specs (openspec list, openspec list --specs) if available.
3. Choose or confirm a verb-led change id with frontend-/backend- prefix.
4. Create proposal.md, tasks.md, and optional design.md under openspec/changes/<id>/.
5. Add delta specs under openspec/changes/<id>/specs/<capability>/spec.md with ADDED/MODIFIED/REMOVED and at least one Scenario each.
6. Validate with strict checks and fix formatting errors.

## Guardrails
- Do not implement code during proposal stage.
- Use #### Scenario headers, not bullets or bold text.
- Prefer modifying existing capabilities over creating duplicates.

## Outputs
- Proposal, tasks, design (if required), and spec delta files.
- Validation notes and any open questions.
