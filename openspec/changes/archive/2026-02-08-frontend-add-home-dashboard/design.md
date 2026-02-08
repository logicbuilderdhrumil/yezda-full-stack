## Context
The home dashboard is the first view after sign-in and should provide a high-level summary of system activity.

## Goals / Non-Goals
- Goals: Show KPIs and recent activity in a single view.
- Goals: Provide quick access links to major modules.
- Non-Goals: Deep analytics exploration.

## Decisions
- Decision: Use a grid layout of cards and widgets.
- Decision: Source metrics from a single dashboard API endpoint.

## Risks / Trade-offs
- Too many widgets can reduce clarity and performance.

## Migration Plan
- Start with KPI cards, then add charts and activity feed.

## Open Questions
- Which metrics are most important for the landing dashboard?
- Should dashboard widgets be configurable per role?
