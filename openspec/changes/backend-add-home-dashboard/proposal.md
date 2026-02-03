# Change: Add backend home dashboard data

## Why
Provide dashboard metrics and activity data for the admin landing page with secure access controls and operational safeguards.

## What Changes
- Add endpoints for KPI summary metrics.
- Add endpoints for recent activity and trend data.
- Document dashboard metric schemas.
- Enforce tenant-scoped access and role-based controls for dashboard data.
- Add audit logging for dashboard metric access.
- Apply caching, rate limits, and SLO targets for dashboard endpoints.

## Impact
- Affected specs: home-dashboard
- Affected code: backend analytics services, reporting queries
- Operational impact: audit logging, caching, rate limiting, and SLO monitoring for dashboard endpoints
