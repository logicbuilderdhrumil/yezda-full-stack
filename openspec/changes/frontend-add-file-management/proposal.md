# Change: Add file management utilities

## Why
Support file uploads, previews, and file metadata handling.

## What Changes
- Implement FileService for upload and download operations.
- Add file utility helpers and S3 upload helper.
- Add file size and type helpers for UI display.

## Impact
- Affected specs: file-management
- Affected code: src/services/FileService.ts, src/utils/fileUtils.ts
