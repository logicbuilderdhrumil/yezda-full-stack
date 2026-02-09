## Context
The YEZDA platform is an enterprise B2B employment-screening SaaS with three surfaces: React admin dashboard (72+ pages), React client portal (5 pages sharing the same frontend codebase), and Expo React Native candidate app (9 screens). The current UI uses default system fonts and generic blue theming that does not convey the professional trust required for HR/compliance buyers. The invite flows (InviteFlows.md) lack frontend UI entirely — only backend endpoints exist. A comprehensive UI/UX rejuvenation is needed across all surfaces, guided by the Trust & Authority design system generated via the ui-ux-pro-max skill and persisted in `design-system/yezda/MASTER.md`.

## Goals
- Establish a cohesive Trust & Authority visual identity across all three surfaces (frontend, client portal, mobile app)
- Replace system-ui with Plus Jakarta Sans for modern SaaS professionalism
- Adopt the navy/blue corporate color palette (#0F172A primary, #0369A1 CTA)
- Build complete invite flow UI for all three InviteFlows.md scenarios
- Achieve WCAG AAA compliance and responsive design at all breakpoints
- Maintain backward compatibility — no API or behavioral changes

## Non-Goals
- Backend API changes (all invite endpoints already exist)
- Multi-tenant theme customization redesign (existing backend theme system retained)
- Complete component rewrite (incremental style updates preferred)
- Mobile app navigation restructuring

## Decisions

### D1: Typography — Plus Jakarta Sans
**Decision**: Use Plus Jakarta Sans for both headings and body text across all surfaces.
**Rationale**: Recommended by ui-ux-pro-max for SaaS B2B products. Friendly, modern, professional mood. Available via Google Fonts CDN (web) and expo-google-fonts (mobile).
**Alternatives considered**:
- Inter: Too ubiquitous, lacks distinctiveness
- Geist: Limited font weight support
- System-ui: Current default — no brand identity

### D2: Color Palette — Trust & Authority
**Decision**: Primary #0F172A (navy), CTA/Accent #0369A1 (professional blue), Background #F8FAFC, Text #020617.
**Rationale**: Enterprise-grade professional palette. Navy conveys authority. Blue CTA maintains action clarity. High contrast exceeds WCAG AAA 7:1 ratio.
**Alternatives considered**:
- Keep current #2563eb: Too generic, lacks enterprise gravitas
- Teal/green palette: Misaligned with screening/compliance industry

### D3: Implementation Strategy — Phased Token-First
**Decision**: Phase 1 (tokens, components), Phase 2 (layout/nav), Phase 3 (pages), Phase 4 (invite UI), Phase 5 (mobile), Phase 6 (a11y/polish).
**Rationale**: Token-first ensures all downstream components inherit changes automatically. Avoids big-bang risks.
**Alternatives considered**:
- Big-bang: Higher risk, harder to review
- Page-first: Would require double-touching after token updates

### D4: Invite Flow UI — Modal Dialogs
**Decision**: Use shadcn Dialog components for invite flows rather than full pages.
**Rationale**: Invite actions are contextual (triggered from user/candidate lists); dialogs maintain user's place in the list view. Consistent with shadcn component library already in use.
**Alternatives considered**:
- Full page: Unnecessary navigation, disrupts workflow
- Drawer: Less appropriate for form completion flows

### D5: Chart Library — Recharts
**Decision**: Use Recharts for dashboard KPI charts (funnel, trend lines).
**Rationale**: Already referenced in chart recommendations. React-native-compatible philosophy (SVG), treeshakeable, well-maintained.
**Alternatives considered**:
- Chart.js: Canvas-based, less React-idiomatic
- D3: Over-engineered for this use case
- Existing `ChartWidget.tsx`: May already use Recharts; extend rather than replace

### D6: Mobile Font Loading — expo-google-fonts
**Decision**: Use `@expo-google-fonts/plus-jakarta-sans` package for consistent typography in the mobile app.
**Rationale**: Standard Expo approach, handles font loading states, ensures platform consistency.
**Alternatives considered**:
- Bundle font files: Larger app binary, manual updates
- System fonts: Inconsistent across Android/iOS

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Font loading flash (FOUT) on web | Brief unstyled text | Use `font-display: swap` in @import, preload hint in `index.html` |
| Mobile font loading delay | White screen on first launch | Use `useFonts()` hook with splash screen held until loaded |
| Dark mode token mismatch | Inconsistent dark UI | Test both modes at each phase, update dark tokens in parallel |
| 72+ pages to update | Large PR / review fatigue | Phase into 6 smaller waves; each independently reviewable |
| Breaking visual tests | Snapshot test failures | Update snapshots after each phase; avoid mixing logic changes |
| Recharts bundle size | Increased JS payload | Dynamic import for dashboard charts, code-split from main bundle |

## Migration Plan

### Phase 1: Design Tokens & Component Foundation
1. Update `frontend/src/index.css` with new `:root` and `.dark` token values
2. Import Plus Jakarta Sans via `@import url()` in `index.css`
3. Update `theme.constant.ts` and `theme.config.ts` with new palette
4. Update `variants.ts` (button, badge, input, status CVA variants)
5. Polish core UI primitives (Button, Card, Input, Badge, Table, Toast)

### Phase 2: Layout & Navigation
6. Update AdminShell, AdminSidebar, Header with navy accent and new typography
7. Update ClientShell, ClientSidebar for org portal
8. Polish PageContainer, ErrorPageLayout
9. Responsive testing at 375/768/1024/1440px

### Phase 3: Page-Level Polish
10. Dashboard: KPI cards, charts, activity feed
11. Auth pages: Trust & Authority login/signup styling
12. Organization, User, Candidate list/detail pages
13. Forms, Pipelines, Billing, Chat, Files, Reports, Reviews, Settings
14. Client Portal pages

### Phase 4: Invite Flow UI
15. Org Member Invite: Dialog on Organization Users tab
16. Candidate Invite (Org User): Dialog on Candidates list
17. Candidate Invite (Admin): Dialog on Organization Candidates tab
18. Accept-Invite landing page at `/accept-invite`
19. Invite status badges on list views

### Phase 5: Mobile App
20. Install and configure `@expo-google-fonts/plus-jakarta-sans`
21. Update `app/global.css` and `tailwind.config.js` with matching tokens
22. Polish all 9 screens (auth, applications, profile, consent)

### Phase 6: Accessibility & Final Polish
23. Audit WCAG AAA contrast across all pages
24. Add `prefers-reduced-motion` guards on all animations
25. Ensure focus-visible states on all interactive elements
26. Remove any emoji icons — ensure Lucide/Ionicons only
27. Final responsive testing and cross-browser verification

## Open Questions
- Should the Admin sidebar default to collapsed or expanded on desktop?
- Are there brand guidelines or logos beyond what's in `frontend/public/`?
- Should invite email templates be styled to match the new design system?
- Is a Storybook or component catalog desired for the UI kit?
