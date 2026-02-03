---
name: Shared Conventions
description: Shared code standards for shared types and utilities.
applyTo: "shared/**/*.{ts,tsx}"
---

## Shared Standards
- Place shared types in shared/@types and utilities in shared/utils.
- Keep APIs minimal and stable; prefer named exports.
- Avoid frontend or backend dependencies inside shared modules.
