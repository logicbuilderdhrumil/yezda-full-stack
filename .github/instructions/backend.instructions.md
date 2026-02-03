---
name: Backend Conventions
description: Backend implementation rules for Node.js services.
applyTo: "backend/**/*.{ts,js}"
---

## Backend Standards
- Use layered structure: routes -> controllers -> services -> models.
- Validate and sanitize inputs; keep error handling middleware centralized.
- Maintain API versioning under /api/v1/.
- Prefer explicit types for public interfaces.

## Quality
- Add tests for new endpoints or behavior changes.
- Preserve backward compatibility unless the spec declares breaking changes.
