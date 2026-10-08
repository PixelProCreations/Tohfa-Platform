# Admin theme

One theme for all five admin roles, from the client's **TOHFA Admin App — Design System v1.0** PDF. Values
live in `packages/design-tokens/src/tokens.json` (ground truth); `theme/index.ts` is a typed view over them,
as `roles/farmer/theme` is for farmer screens. Screens never contain a hex, rgba or font name.

## Import

```ts
// screens/<folder>/MyScreen.tsx          -> '../../theme'
// screens/swa/<module>/MyScreen.tsx      -> '../../../theme'
// components/MyComponent.tsx             -> '../theme'
import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../theme';
```

## Values (from the PDF)

| Theme | Token | Hex | Use |
|---|---|---|---|
| `adminColors.brand` | `adminOrange` | #F0562A | primary actions, active states, icons |
| `adminColors.brandDeep` | `adminOrangeDeep` | #7A2E14 | section headings, emphasis text |
| `adminColors.brandTint` | `adminOrangeTint` | #FDF3F0 | icon chips, role badges, active pills |
| `adminColors.canvas` | `adminBackground` | #F3EFE9 | app background |
| `adminColors.ink` / `.muted` | `adminInk` / `adminMuted` | #1A1A1A / #5F5E5A | primary / secondary text |
| `adminColors.border` / `.card` | `adminBorder` / `adminCard` | #EEDCD3 / #FFFFFF | card + input strokes / card surface |
| `adminColors.onBrand` | `white` | #FFFFFF | label/icon on a filled orange button |
| `adminColors.placeholder` | `adminPlaceholder` | #C9BDAF | input placeholder (drawn in the PDF, not a named swatch) |
| `adminColors.toast` | ink / white / `adminSuccessOnDark` | #1A1A1A / #FFFFFF / #8FE3A0 | the PDF's dark confirmation toast |

Status pairs — `adminColors.<tone>.text | .bg | .border` (`text` is also the icon colour):

| Tone | text | bg | border | PDF example |
|---|---|---|---|---|
| `success` | #173404 | #EAF3DE | = text (derived) | "Active", KPI deltas |
| `warning` | #854F0B | #FEF3E2 | = text (derived) | "Pending" |
| `danger` | #E24B4A | #FCEBEB | = text (PDF: error input) | "Overdue", errors |
| `info` | #0C447C | #E6F1FB | = text (derived) | "Under Review" |
| `purple` | #3C3489 | #EEEDFE | = text (derived) | "Escalated" |
| `brandSoft` | #7A2E14 | #FDF3F0 | #F0562A (PDF: active chip) | "All Operational" |

Status badges in the PDF have **no border**; use `.border` for the left accent stripe of alert cards and for
outlined/error states. A plain card outline is `adminColors.border`. Contrast: `danger` text on its bg is
3.41:1 and white on `brand` is 3.46:1 (below AA 4.5:1) — PDF values, reported in `tests/adminTheme.test.ts`.

| `adminType.` | Size / weight | Use | `adminRadius.` | px | Use |
|---|---|---|---|---|---|
| `title`, `kpiValue` | 19 / 800 | greeting, tab title, KPI | `xs` | 8 | icon boxes |
| `sectionHead` | 13 / 800 | section heading (`brandDeep`) | `sm` | 10 | small icon tiles |
| `rowTitle` | 12.5 / 800 | row / card title | `md` | 12 | inputs, buttons, search |
| `body` | 13 / 400 | body copy | `lg` | 14 | cards, KPI tiles, rows |
| `rowMeta` | 10.5 / 400 | row subtitle (`muted`) | `xl` | 16 | panels, sheets |
| `caption` | 10 / 700 | delta, badge label | `full` | 100 | chips, badges, pills |

- Type styles set no `fontFamily`: React Native then uses the native system font (SF / Roboto), which is
  what the PDF specifies. Line heights are ours (~1.3x), the PDF gives none.
- `adminSpacing` is the platform scale (`xs 4, sm 8, md 12, lg 16, xl 24, xxl 32, xxxl 48`, plus the
  intent aliases in tokens.json). The admin PDF defines radii but no spacing.
- `adminShadow.sm` alert cards, `.md` toasts/floating actions, `.lg` modals — spread them, they include
  Android `elevation`. `ADMIN_BUTTON_HEIGHT` = 48 for full-width primary buttons.

## DO / DON'T

- DO `{ ...adminType.rowTitle, color: adminColors.ink }`; DON'T `{ fontSize: 13, fontWeight: '800', color: '#1E1612' }`.
- DON'T write a hex, `rgba(...)` or `shadowColor: '#000'` in a screen. Use `adminShadow.*`. For a
  translucent overlay or a colour the theme lacks, add a token (tokens.json, with a note) and expose it here.
- DON'T add a local `PALETTE` / `P` / `COLORS` block — that is exactly what this theme replaces.
- DON'T set `fontFamily: 'Poppins'` (or any font). DON'T import `roles/farmer/theme` from admin code.
- DO use status pairs for chips (`warning.bg` + `warning.text`); pick radius by intent (card `lg`, input `md`, pill `full`).

## Example: `components/TohfaToast.tsx`

```ts
// before (abridged)                          // after
approve: {                                    approve: {
  accent: '#2E7D32',                            accent: adminColors.success.border,
  iconBg: '#E8F5E9',                            iconBg: adminColors.success.bg,
  titleColor: '#1B5E20',                        titleColor: adminColors.success.text,
  borderColor: '#C8E6C9',                       borderColor: adminColors.border,
},                                            },
toastCard: {                                  toastCard: {
  backgroundColor: '#FFFFFF',                   backgroundColor: adminColors.card,
  borderRadius: 16, paddingVertical: 12,        borderRadius: adminRadius.xl, paddingVertical: adminSpacing.md,
  shadowColor: '#000', shadowOpacity: 0.14,     ...adminShadow.md,
  shadowRadius: 10, elevation: 8,             },
},                                            titleText: { ...adminType.rowTitle },
titleText: { fontSize: 13.5, fontWeight: '800', letterSpacing: -0.2 },
```

## Converting a screen

1. Import the theme; delete the local palette block.
2. Replace each literal by meaning, using the table below (counts = admin tree today, incl. `swa/`).
3. Fonts -> `adminType.*`, shadows -> `adminShadow.*`, radii -> `adminRadius.*`, paddings/margins ->
   `adminSpacing.*` (1-2px optical nudges and fixed sizes may stay). Expect a visible shift toward the PDF
   (e.g. emerald -> deep green); that is the point. Check on a device, then regenerate the guard baseline.

| Legacy hex (uses, of which swa/) | Seen as | Use |
|---|---|---|
| #F0562A (249, 0), #E85226 (204, 174) | primary, orange | `brand` |
| #FFF0EB (72, 0) | primaryLight, activeChipBg | `brandTint` |
| #FFFFFF (1532, 328) | card bg / text on orange | `card` / `onBrand` |
| #FAF8F5 (154, 65), #FAF7F2 (87, 0), #F4F1EA (62, 62) | pageBg | `canvas` |
| #1E1612 (178, 0), #1D2420 (225, 197), #1A1412 (89, 0) | textInk | `ink` |
| #7A726C (232, 93), #6B7280 (87, 0), #5C6B63 (6, 5) | textSecondary | `muted` |
| #9E9690 (141, 1), #9CA3AF (115, 2) | textMuted, placeholderTextColor | `muted` / `placeholder` |
| #EBE5DC (88, 0), #F4EFE9 (49, 1) | border, divider | `border` |
| #DC2626 (156, 22), #E24B4A (18, 18) / #FEE2E2 (66, 9) | red text / red bg | `danger.text` / `danger.bg` |
| #B45309 (109, 3), #D97706 (75, 12) / #FEF3C7 (67, 3) | amber text / amber bg | `warning.text` / `warning.bg` |
| #059669 (83, 1), #15803D (52, 6) / #DCFCE7 (56, 5) | green text / green bg | `success.text` / `success.bg` |
| #2563EB (49, 17), #1E40AF (45, 12) / #EFF6FF (39, 6) | blue text / blue bg | `info.text` / `info.bg` |
| #000 (177, 4), #000000 (104, 1) | shadowColor | `adminShadow.*` |

**Order:** shared pieces first (headers, tab bar, cards, badges, toasts used by many screens), then one
module folder at a time (`dashboard/`, `farmers/`, `finance/`, ...). **`swa/` is last:** `screens/swa/constants.ts`
defines `SWA_COLORS` ("DO NOT modify these values - they match the uploaded HTML exactly") and most swa
screens carry raw hex; the guard only baselines them for now. Converting swa needs a design decision first.

## Guard test

`src/tests/admin_theme_guard.test.ts` scans `src/roles/admin` (not `theme/` or tests) and fails if a file
gains raw colours or `fontFamily: 'Poppins'`, or newly imports the farmer theme, versus
`src/tests/admin_theme_guard.baseline.json`. Run it; after a conversion, lock the gain in:
```bash
pnpm --filter @tohfa/mobile exec vitest run src/tests/admin_theme_guard.test.ts
UPDATE_ADMIN_THEME_BASELINE=1 pnpm --filter @tohfa/mobile exec vitest run src/tests/admin_theme_guard.test.ts
```
Only regenerate after removing colours, never to silence a failure.
