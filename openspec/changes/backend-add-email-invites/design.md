# Design: Email Module with Postmark Integration

## Architecture
The email module follows Clean Architecture with four layers:

```
email/
├── domain/
│   ├── entities/InviteToken.ts       # Token entity with hash, expiry, status
│   ├── ports/EmailPort.ts            # Email sending abstraction
│   ├── ports/InviteTokenRepository.port.ts  # Token persistence port
│   ├── types/email-types.ts          # Shared types
│   └── index.ts                      # Barrel export
├── application/
│   └── use-cases/
│       ├── SendOrgMemberInviteUseCase.ts
│       ├── SendCandidateInviteUseCase.ts
│       ├── VerifyInviteTokenUseCase.ts
│       └── AcceptInviteUseCase.ts
├── infrastructure/
│   ├── adapters/
│   │   ├── PostmarkEmailAdapter.ts   # Postmark SDK wrapper
│   │   └── NoOpEmailAdapter.ts       # Dev/test adapter
│   └── repositories/
│       └── PostgresInviteTokenRepository.ts
├── interface/
│   ├── controllers/invite.controller.ts
│   ├── routes/invite.routes.ts
│   └── validators/invite.validators.ts
└── index.ts                          # Composition root
```

## Security
- Tokens are SHA-256 hashed before storage; plaintext is sent once via email
- Tokens are single-use (consumed on accept)
- Default expiry: 7 days for org members, 14 days for candidates
- Rate limiting: max 3 invites per email per hour
- Prior pending invites revoked when new invite sent to same email

## Provider Abstraction
`EmailPort` interface allows swapping Postmark for any provider:
- `PostmarkEmailAdapter` — production (with retry + exponential backoff)
- `NoOpEmailAdapter` — dev/test (logs to console, stores for assertions)

## API Endpoints
- `POST /api/v1/invites/orgs/members` — send org member invite (authenticated)
- `POST /api/v1/invites/orgs/candidates` — send candidate invite (authenticated)
- `GET /api/v1/invites/:token/verify` — verify invite token (public)
- `POST /api/v1/invites/:token/accept` — accept invite (public)

## Environment Variables
- `POSTMARK_SERVER_TOKEN` — Postmark API key (required in production)
- `POSTMARK_FROM_ADDRESS` — sender address (default: noreply@yezda.com)
- `INVITE_BASE_URL` — base URL for invite links (default: http://localhost:5173/invite)
