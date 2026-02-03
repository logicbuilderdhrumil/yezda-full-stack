## 1. Implementation
- [x] 1.1 Create a shared HTTP client module for outbound calls.
- [x] 1.2 Add standardized error handling and retry policy helpers.
- [x] 1.3 Add tests for outbound client behavior and retries.
- [x] 1.4 Add outbound security controls (allowlists, secret handling, TLS requirements).
- [x] 1.5 Add circuit breakers and dependency SLO metrics for outbound calls.
- [x] 1.6 Add compliance logging for outbound integration access.

## 2. Review Fixes
- [x] 2.1 Expand IPv6 private range detection (fc00::/7 ULA, ff00::/8 multicast, 2001:db8::/32 docs, link-local hostnames).
- [x] 2.2 Add DNS rebinding protection with validateResolvedIP helper.
- [x] 2.3 Add response size limit guard (maxResponseSizeBytes config, RESPONSE_TOO_LARGE error).
- [x] 2.4 Add tests for SLO checks, cleanup, convenience methods (PUT, PATCH, DELETE), parse error.
- [x] 2.5 Add CGN range (100.64.0.0/10) and link-local IPv4 (169.254.x.x) detection.
