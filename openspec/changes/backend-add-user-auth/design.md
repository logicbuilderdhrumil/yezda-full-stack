## Context
Authentication requires secure credential handling, token issuance, and MFA support.

## Goals / Non-Goals
- Goals: secure credential auth, password reset, MFA with TOTP.
- Non-Goals: support all identity providers in phase one.

## Decisions
- Decision: issue short-lived access tokens with refresh tokens.
- Alternatives considered: long-lived tokens only; rejected for security.

## Risks / Trade-offs
- MFA adoption may slow sign-in -> mitigate with clear recovery flows.

## Migration Plan
Start with credential auth and password reset; enable TOTP once stable.

## Open Questions
- Should candidate auth reuse the same user auth store or separate tenant?
