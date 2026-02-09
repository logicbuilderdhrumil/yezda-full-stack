# Change: Rejuvenate Full-Stack UI/UX with Trust & Authority Design System

## Why
The YEZDA platform currently uses a generic system-ui font stack (system-ui, Segoe UI, Roboto…) with default blue (#2563eb) primary colors that do not convey the professional trust and authority required for an enterprise employment-screening SaaS. The admin dashboard, client portal, and mobile candidate app lack a cohesive visual identity, consistent interaction patterns, and polished micro-interactions that enterprise HR buyers expect. Additionally, the invite flows (org-member invites, candidate invites, admin-initiated candidate invites) described in InviteFlows.md have no dedicated frontend UI — only backend endpoints exist.

## What Changes

### 1. Design System Foundation
- **Typography**: Replace system-ui with **Plus Jakarta Sans** across frontend and app — modern, friendly, professional
- **Color palette**: Adopt Trust & Authority palette — Primary #0F172A (navy), CTA #0369A1 (professional blue), Background #F8FAFC (soft white)
- **Dark mode**: Update dark theme tokens to complement new palette
- **Spacing & shadows**: Standardize spacing scale and shadow depths per MASTER.md
- **CSS variable migration**: Update `:root` and `.dark` token blocks in `index.css`
- **Theme presets**: Update `theme.constant.ts` and `theme.config.ts` with new palette values

### 2. Component Library Polish
- **Button variants**: Update CVA variants in `variants.ts` to use new palette and add smooth 200ms transitions
- **Card components**: Add `cursor-pointer` on interactive cards, shadow-lift hover states
- **Form inputs**: Focus ring using primary navy, on-blur validation patterns
- **Tables / DataTable**: Professional header styling, row hover states, zebra striping
- **Loading states**: Skeleton pulse animations using muted token colors
- **Badges / Status indicators**: Metric pulse animation for live screening statuses
- **Toast / Notifications**: Consistent styling with design tokens

### 3. Layout & Navigation Refresh
- **AdminShell / AdminSidebar**: Floating sidebar design with navy accent, smooth collapse animation
- **ClientShell / ClientSidebar**: Softer professional styling for org portal
- **Header**: Refined header with Plus Jakarta Sans, improved search input, notification dropdown polish
- **PageContainer**: Consistent max-width (max-w-7xl), proper spacing below fixed header
- **Responsive breakpoints**: Validate and fix at 375px, 768px, 1024px, 1440px

### 4. Page-Level UI/UX Improvements
- **Dashboard (HomeView)**: KPI cards with metric pulse, funnel chart for screening pipeline, trend line charts with Recharts
- **Auth pages (SignIn, SignUp, ForgotPassword)**: Trust & Authority styling, security badge display, professional form layout
- **Organization pages**: Users tab with invite member button/dialog, improved org details layout
- **Candidate pages**: Invite candidate button/dialog, bulk create polish, submission view improvements
- **Pipeline builder**: Node styling improvements, better visual hierarchy
- **Chat**: Refined message bubbles, professional conversation layout
- **Billing/Ledger**: Clean tabular layout with proper shadows

### 5. Invite Flow UI (InviteFlows.md Coverage)
- **Org Member Invite**: Dialog on Organization → Users tab with email input, sends invite via backend `POST /api/organizations/:id/invite-member`
- **Candidate Invite (Org User)**: Dialog on Candidates page with email + optional fields (name, phone, DOB, NI number), sends via `POST /api/candidates/invite`
- **Candidate Invite (Admin)**: Dialog on Organization → Candidates tab with email validation against global identity, conditional fields, sends via `POST /api/candidates/invite`
- **Invite status tracking**: Badge/status indicators on user and candidate list views
- **Email link landing page**: Accept-invite page at `/accept-invite?token=...` for invited users

### 6. Mobile App (Expo/React Native) Polish
- **Typography**: Plus Jakarta Sans via expo-google-fonts
- **Color tokens**: Update NativeWind/Tailwind config with matching palette
- **Login screen**: Professional trust styling matching web auth pages
- **Application screens**: Consistent card and list styling
- **Profile screens**: Refined form inputs and layout
- **Consent screens**: Improved badge and disclosure components

### 7. Accessibility & Performance
- WCAG AAA contrast ratios (Trust & Authority palette provides 4.5:1+ minimum)
- `prefers-reduced-motion` media query respected on all animations
- Focus-visible states on all interactive elements
- All icons via Lucide React (frontend) and Ionicons (app) — zero emojis as icons
- Responsive testing at 375px, 768px, 1024px, 1440px — no horizontal scroll

## Impact
- **Affected specs**: ui-kit, theme-system, template-layouts, app-shell, candidate-management (UI delta only), org-management (UI delta only)
- **Affected code**:
  - `frontend/src/index.css` — Token redesign
  - `frontend/src/constants/theme.constant.ts` — Preset values
  - `frontend/src/configs/theme.config.ts` — Token schema
  - `frontend/src/components/ui/variants.ts` — CVA variants
  - `frontend/src/components/ui/*.tsx` — 34 UI primitives
  - `frontend/src/components/layouts/*.tsx` — 9 layout components
  - `frontend/src/components/template/*.tsx` — Header, footer, theme configurator
  - `frontend/src/features/*/pages/*.tsx` — ~72 page components
  - `frontend/src/features/organizations/` — Invite member dialog (new)
  - `frontend/src/features/candidates/` — Invite candidate dialog (new)
  - `frontend/src/features/shared/pages/` — Accept-invite page (new)
  - `app/global.css` — NativeWind tokens
  - `app/tailwind.config.js` — Theme extension
  - `app/src/screens/*.tsx` — 9 mobile screens
  - `design-system/yezda/MASTER.md` — Design reference (already persisted)
- **Non-breaking**: All changes are visual/UX; no API contract changes
- **Risk**: Low — progressive enhancement; can be deployed feature-by-feature
