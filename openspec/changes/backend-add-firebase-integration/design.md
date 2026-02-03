## Context
Firebase is used for push notifications and token verification for certain workflows.

## Goals / Non-Goals
- Goals: centralized Firebase Admin initialization, secure token handling, reliable dispatch.
- Non-Goals: manage full Firebase project provisioning.

## Decisions
- Decision: encapsulate Firebase Admin in a shared service module.
- Alternatives considered: initialize Firebase in each controller; rejected to avoid duplication.

## Risks / Trade-offs
- Token leakage risk -> mitigate by encrypting stored tokens and limiting scopes.

## Migration Plan
Start with token registration and messaging; expand to other Firebase services if needed.

## Open Questions
- Which notification types are mandatory for initial release?
