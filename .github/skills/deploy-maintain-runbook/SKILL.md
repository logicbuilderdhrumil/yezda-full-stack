---
name: deploy-maintain-runbook
description: Provide deployment, validation, monitoring, and rollback guidance. Trigger keywords: deploy, release, rollback, maintenance, runbook, monitoring.
---

## Pre-Release Checklist
- Confirm migrations, seed data, and backward compatibility.
- Verify environment variables and secrets.
- Ensure tests and linting complete.

## Release Steps
- Deploy in stages when possible (canary or small tenant).
- Validate API health, background jobs, and realtime channels.
- Monitor logs and error rates.

## Rollback Plan
- Define rollback commands or steps.
- Identify data migration rollback strategy.
- Note any one-way changes.

## Maintenance
- Document routine tasks (backups, reindexing, queue cleanup).
- Define alert thresholds and on-call response steps.
- Capture post-release observations and follow-up tasks.
