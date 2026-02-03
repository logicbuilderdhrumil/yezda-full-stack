## Context
Service modules rely on a consistent HTTP client with shared headers and error handling.

## Goals / Non-Goals
- Goals: Centralize API configuration, auth headers, and error handling.
- Non-Goals: Backend service implementation.

## Decisions
- Decision: Use Axios with interceptors and a thin ApiService wrapper.
- Decision: Define endpoints in a configuration file.

## Risks / Trade-offs
- Interceptor logic can cause hidden side effects if misused.

## Migration Plan
- Start with ApiService, then update feature services to use it.

## Open Questions
- What retry policy is required for failed requests?
