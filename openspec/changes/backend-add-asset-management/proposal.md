# Change: Add backend asset management

## Why
Organize static assets and templates so services can retrieve them consistently with secure access controls and auditability.

## What Changes
- Add asset catalog storage and retrieval endpoints.
- Provide template asset retrieval for export and preview flows.
- Add metadata for asset type and usage.
- Enforce tenant-scoped access and asset usage policies.
- Add audit logging for asset access and updates.
- Apply caching and SLO targets for asset retrieval endpoints.

## Impact
- Affected specs: asset-management
- Affected code: backend asset services, storage adapters
- Operational impact: audit logging, caching, and SLO monitoring for asset endpoints
