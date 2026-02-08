## Context
Multiple modules handle file uploads and need shared utilities.

## Goals / Non-Goals
- Goals: Provide consistent file upload and metadata handling.
- Goals: Support previews and size formatting.
- Non-Goals: Server-side file processing.

## Decisions
- Decision: Centralize file utilities in utils and FileService.

## Risks / Trade-offs
- Uploading large files may require chunking and progress UI.

## Migration Plan
- Implement utilities first, then integrate into features.

## Open Questions
- What file size limits and types are required?
