# Change: Add API client infrastructure

## Why
Provide a consistent HTTP client and error handling layer for services.

## What Changes
- Implement ApiService and Axios configuration.
- Add endpoint configuration utilities.
- Add shared error handling and retry helpers.

## Impact
- Affected specs: api-client
- Affected code: src/services/ApiService.ts, src/services/axios, src/configs/endpoint.config.ts, src/utils/errorHandler.tsx
