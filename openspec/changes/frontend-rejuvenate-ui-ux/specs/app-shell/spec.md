## MODIFIED Requirements

### Requirement: App shell navigation
The system SHALL provide mobile app navigation (tab bar, stack navigator) styled with Trust & Authority tokens — Plus Jakarta Sans typography and matching navy/CTA palette via NativeWind.

#### Scenario: Tab bar styling
- **WHEN** the mobile app tab navigator renders
- **THEN** it uses Trust & Authority colors with professional navy accents and CTA-blue active tab

#### Scenario: Stack screen transitions
- **WHEN** a user navigates between stack screens
- **THEN** transitions are smooth and consistent with the design system

## ADDED Requirements

### Requirement: Mobile typography consistency
The system SHALL use Plus Jakarta Sans via `@expo-google-fonts/plus-jakarta-sans` across all mobile screens, with font loading managed via `useFonts()` hook and splash screen held until fonts are loaded.

#### Scenario: Font loading on app launch
- **WHEN** the mobile app launches
- **THEN** the splash screen is held until Plus Jakarta Sans is loaded, preventing flash of unstyled text

#### Scenario: Font applied to all screens
- **WHEN** any mobile screen renders
- **THEN** Plus Jakarta Sans is used for all text elements

### Requirement: Mobile color token consistency
The system SHALL apply matching Trust & Authority color tokens in the NativeWind/Tailwind configuration so that mobile screens match the web frontend palette.

#### Scenario: Mobile light mode tokens
- **WHEN** the mobile app renders in light mode
- **THEN** it uses Primary #0F172A, CTA #0369A1, Background #F8FAFC matching the web frontend

#### Scenario: Mobile dark mode tokens
- **WHEN** the mobile app renders in dark mode
- **THEN** it uses complementary navy-derived dark tokens matching the web frontend dark mode
