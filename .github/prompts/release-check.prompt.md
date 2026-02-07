---
name: release-check
description: Generate a release checklist with validation and rollback steps.
agent: ops-maintainer
tools: ['search', 'fetch', 'usages']
model: Claude Opus 4.6 (copilot)
---

$ARGUMENTS

Create a release checklist that includes pre-release checks, validation steps, monitoring/alert updates, and rollback instructions tailored to the described change.