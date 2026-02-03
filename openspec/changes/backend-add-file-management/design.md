## Context
File handling must support uploads, downloads, and metadata storage while enabling multiple storage backends.

## Goals / Non-Goals
- Goals: pluggable storage adapters, standardized metadata, secure upload handling.
- Non-Goals: build a full digital asset management system.

## Decisions
- Decision: Use a storage adapter interface to support local and cloud storage.
- Alternatives considered: direct cloud SDK usage in controllers; rejected for testability.

## Risks / Trade-offs
- Large file uploads may require streaming support -> mitigate with size limits and streaming handlers.

## Migration Plan
Start with a single adapter and expand once requirements are validated.

## Open Questions
- Which storage backend is the initial target (local vs S3-compatible)?
