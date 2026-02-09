## Context
Localization enables the UI to support multiple languages and regional formats.

## Goals / Non-Goals
- Goals: Provide translation keys and locale switching.
- Goals: Persist selected locale.
- Non-Goals: Full CMS for translations.

## Decisions
- Decision: Use a standard i18n library and translation JSON files.
- Decision: Store locale selection in a global store.

## Risks / Trade-offs
- Translation coverage requires continuous updates.

## Migration Plan
- Start with key navigation and auth strings, then expand.

## Open Questions
- Which locales are required for MVP?
