# Change: Add backend charting data

## Why
Provide consistent chart data and defaults for dashboards and reporting with secure access controls and operational safeguards.

## What Changes
- Add endpoints that return chart-ready series data.
- Provide default aggregation and time-range helpers for metrics.
- Document chart data schemas for client use.
- Enforce tenant-scoped access controls for chart data.
- Add audit logging for chart data access.
- Apply caching, rate limits, and SLO targets for chart endpoints.

## Impact
- Affected specs: charting
- Affected code: backend analytics services, reporting queries
- Operational impact: audit logging, caching, rate limiting, and SLO monitoring for chart endpoints
