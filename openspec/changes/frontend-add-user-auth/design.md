## Context
Authentication gates access to all protected features. Users must be able to sign in, recover access, and complete MFA if required.

## Goals / Non-Goals
- Goals: Provide robust sign-in, sign-up, and password reset flows.
- Goals: Support TOTP verification for MFA.
- Non-Goals: Implement backend identity provider logic.

## Decisions
- Decision: Use a dedicated AuthContext with a useAuth hook for session state.
- Decision: Store session tokens and user profile in client state, with optional persistence.
- Decision: Route guards redirect unauthenticated users to sign-in.

## Risks / Trade-offs
- MFA flows add complexity to the sign-in state machine.
- Token persistence introduces security considerations.

## Migration Plan
- Implement core sign-in flow first, then add reset and MFA pages.
- Gate protected routes only after auth state is resolved.

## Open Questions
- What identity provider and token format are expected from the backend?
- Is SSO required in addition to email/password authentication?
