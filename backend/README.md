# Yezda Backend

Backend authentication service for the Yezda Employment Screening platform.

## Features

- **Credential Authentication**: Sign-in and sign-up with email/password
- **Token Management**: JWT access/refresh tokens with rotation
- **Password Reset**: Secure password recovery flow
- **MFA (TOTP)**: Two-factor authentication with authenticator apps
- **Rate Limiting**: Protection against brute-force attacks
- **Account Lockout**: Automatic lockout after failed attempts
- **Audit Logging**: Comprehensive security event logging
- **SLO Metrics**: Built-in observability for auth endpoints

## Getting Started

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

All endpoints are prefixed with `/api/v1/auth`.

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Create a new account |
| POST | `/signin` | Sign in with credentials |
| POST | `/mfa/verify` | Complete MFA verification |
| POST | `/refresh` | Refresh access token |
| POST | `/password/reset-request` | Request password reset |
| POST | `/password/reset-complete` | Complete password reset |

### Protected Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signout` | Sign out current session |
| GET | `/me` | Get current user info |
| POST | `/mfa/enroll` | Start MFA enrollment |
| POST | `/mfa/enroll/verify` | Complete MFA enrollment |
| DELETE | `/mfa` | Disable MFA |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `JWT_ACCESS_SECRET` | dev-secret | Access token signing secret |
| `JWT_REFRESH_SECRET` | dev-secret | Refresh token signing secret |
| `JWT_ACCESS_TTL_SECONDS` | 900 | Access token TTL (15 min) |
| `JWT_REFRESH_TTL_SECONDS` | 604800 | Refresh token TTL (7 days) |
| `AUTH_MAX_FAILED_ATTEMPTS` | 5 | Failed attempts before lockout |
| `AUTH_LOCKOUT_DURATION_MINUTES` | 30 | Lockout duration |
| `RATE_LIMIT_MAX_AUTH_REQUESTS` | 10 | Auth requests per window |

## Architecture

```
src/
├── config/          # Configuration management
├── controllers/     # Request handlers
├── middleware/      # Express middleware
│   ├── auth         # Token validation
│   ├── rate-limit   # Rate limiting
│   ├── validation   # Request validation
│   └── error        # Error handling
├── models/          # Type definitions
├── routes/          # API routes
├── services/        # Business logic
│   ├── auth         # Authentication
│   ├── token        # JWT management
│   ├── password     # Password hashing
│   ├── mfa          # TOTP handling
│   ├── audit        # Event logging
│   └── metrics      # SLO metrics
└── index.ts         # Entry point
```

## Testing

```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Security Considerations

- Passwords are hashed with bcrypt (12 rounds)
- Access tokens expire in 15 minutes
- Refresh tokens are rotated on each use
- Account lockout after 5 failed attempts
- Rate limiting on authentication endpoints
- All auth events are logged for audit

## SLO Targets

| Metric | Target |
|--------|--------|
| Sign-in latency (P99) | < 500ms |
| Sign-in latency (P95) | < 200ms |
| Sign-in success rate | > 99.9% |
| Token refresh success rate | > 99.99% |
