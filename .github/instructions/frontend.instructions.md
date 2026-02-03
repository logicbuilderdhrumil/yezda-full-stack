---
name: Frontend Conventions
description: Frontend implementation rules for React + Vite + Tailwind.
applyTo: "frontend/**/*.{ts,tsx,js,jsx}"
---

## Frontend Standards
- React 19 + TypeScript strict mode; prefer explicit types for public APIs.
- Vite SPA layout with src/ as root; views in src/views and reusable components in src/components.
- Services in src/services, stores in src/store, contexts in src/context.
- Use @/ path alias for frontend imports.
- Prefer named exports unless a file has a single primary export.
- Keep API calls in services and avoid direct fetch calls in components.

## Quality
- Avoid unused or duplicate imports.
- Align with ESLint and Prettier formatting.
- Add or update tests when behavior changes.
