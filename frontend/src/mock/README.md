# Mock API Layer

This module provides mock API responses for local development without backend dependencies.

## Quick Start

### Enable Mock Mode

Set the `VITE_MOCK_API` environment variable to `true` in your `.env.local` file:

```env
VITE_MOCK_API=true
```

### Manual Setup

If you need to set up the mock adapter manually (e.g., for testing):

```typescript
import { setupMockAdapter, isMockEnabled } from '@/mock';
import { apiClient } from '@/services';

if (isMockEnabled()) {
  setupMockAdapter(apiClient);
}
```

## Configuration

The mock adapter supports the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` (unless `VITE_MOCK_API=true`) | Enable mock responses |
| `latencyMs` | `number` | `200` | Simulated network latency in milliseconds |
| `logRequests` | `boolean` | `true` in dev mode | Log mock requests to console |

### Programmatic Configuration

```typescript
import { setMockConfig } from '@/mock';

// Adjust latency for testing
setMockConfig({ latencyMs: 0 });

// Enable verbose logging
setMockConfig({ logRequests: true });
```

## Available Endpoints

### Auth Endpoints
- `POST /api/v1/auth/sign-in` - User sign in
- `POST /api/v1/auth/sign-up` - User registration
- `POST /api/v1/auth/sign-out` - Sign out
- `POST /api/v1/auth/password/reset-request` - Request password reset
- `POST /api/v1/auth/password/reset-complete` - Reset password
- `POST /api/v1/auth/mfa/verify` - Verify TOTP code
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### User Endpoints
- `GET /api/v1/users` - List users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `PATCH /api/v1/users/:id` - Partial update user
- `DELETE /api/v1/users/:id` - Delete user

### Candidate Endpoints
- `GET /api/v1/candidates` - List candidates
- `GET /api/v1/candidates/:id` - Get candidate by ID
- `POST /api/v1/candidates` - Create candidate
- `PUT /api/v1/candidates/:id` - Update candidate
- `PATCH /api/v1/candidates/:id` - Partial update candidate
- `DELETE /api/v1/candidates/:id` - Delete candidate

## Fixtures

Mock data fixtures are located in `src/mock/fixtures/`:

- `auth.ts` - Authentication fixtures (users, tokens)
- `users.ts` - User management fixtures
- `candidates.ts` - Candidate screening fixtures

### Accessing Fixtures

```typescript
import { fixtures } from '@/mock';

// Use in tests
expect(fixtures.mockUser.email).toBe('demo@example.com');
```

## Testing

### Reset Between Tests

```typescript
import { resetMockHandlers } from '@/mock';

beforeEach(() => {
  resetMockHandlers();
});
```

### Disable Mocks

```typescript
import { resetMockAdapter } from '@/mock';

afterAll(() => {
  resetMockAdapter();
});
```

## Adding New Endpoints

1. Create fixture data in `src/mock/fixtures/<module>.ts`
2. Create handler in `src/mock/handlers/<module>.ts`
3. Register handler in `src/mock/adapter.ts`
4. Export from `src/mock/fixtures/index.ts` and `src/mock/handlers/index.ts`

### Example Handler

```typescript
// src/mock/handlers/example.ts
import type MockAdapter from 'axios-mock-adapter';
import { exampleData } from '../fixtures/example';

export function registerExampleHandlers(mock: MockAdapter): void {
  mock.onGet('/api/v1/example').reply(200, exampleData);
}
```
