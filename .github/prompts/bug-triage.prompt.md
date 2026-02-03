---
name: bug-triage
description: Triage a bug, identify root cause, and propose next steps.
agent: orchestrator
tools: ['search', 'fetch', 'usages']
model: GPT-5.2-Codex (copilot)
---

$ARGUMENTS

Triage the issue, identify likely root causes, list validation steps, and propose the smallest safe fix. Route to planner or implementer based on scope.