# Theme Colors & Styling Guidelines

Strictly follow the project's design system and theme colors. Never use arbitrary, hardcoded hex values or generic colors.

## Ground Truth Source of Truth
1. **Design Tokens (`packages/design-tokens/src/tokens.json`)**:
   - Universal primary brand color: `#3F7D32` (`semantic('primary')` / `tokens.color.primary.hex`)
   - Primary dark / hover / secondary: `#1B6E20` (`primaryDark`)
   - Primary light (accent surfaces, active chips): `#E8F5E9` (`primaryLight`)
   - Primary pale (page background canvas): `#F4FBF4` (`primaryPale`)
   - Success: `#16A34A` / `#F0FDF4`
   - Warning: `#D97706` / `#FFFBEB`
   - Error / Danger: `#DC2626` / `#FEF2F2`
   - Neutral Ink (Body & Headings): `#111827` (`neutral950`)
   - Neutral ramp: `neutral50` through `neutral950`, plus `white` (`#FFFFFF`) and `black` (`#000000`)

2. **Mobile Farmer & Common Role Themes**:
   - For React Native screens under `apps/mobile/src/roles/farmer/`:
     - Import and use `useTheme()` or `colors` from `apps/mobile/src/roles/farmer/theme`:
       - `colors.primary` (`#3F7D32`)
       - `colors.brandGreen` (`#2E7D32`)
       - `colors.brandGreenLight` (`#E8F5E9`)
       - `colors.bgLight` (`#FCFCFC`)
       - `colors.borderLight` (`#E8E6DD`)
       - `colors.borderMedium` (`#E0DDD2`)
       - `colors.textDark` (`#1A2E1A`)
       - `colors.textBody` (`#3A3A3A`)
       - `colors.textSubtle` (`#6B7566`)
       - `colors.textPlaceholder` (`#8A927F`)
       - `colors.requiredRed` / `colors.danger`
     - When working with screens with approved mockups (e.g. auth, audits, farm management, weather), use `authPalette` defined in `theme/index.ts`.
     - Always use theme tokens for typography (`theme.typography`, `theme.weights`), spacing (`theme.spacing`), radii (`theme.radius`), and touch targets (`theme.minTouchTarget`).

3. **Strict Constraints**:
   - **Zero hardcoded random hex codes**: Never invent arbitrary colors inline.
   - **Consistency**: Keep UI styling harmonious with the TOHFA design system.
