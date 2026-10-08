/**
 * Admin app theme — the ONE place admin screens get colour, type, radius,
 * spacing and elevation from.
 *
 * This mirrors src/roles/farmer/theme: a role-scoped wrapper over
 * @tohfa/design-tokens that screens import directly
 * (`import { adminColors, adminType } from '../../theme'`). It applies to every
 * admin role — Super Admin, TOHFA Admin, Farmer Admin, Main Warehouse and Sub
 * Warehouse — because the client's "TOHFA Admin App — Design System v1.0" PDF
 * is one palette for the whole admin app (product decision, 2026-10-06).
 *
 * Unlike the farmer theme there is no legacy `authPalette` escape hatch here
 * and there must never be one: every value below resolves through a token, so
 * this file contains no hex literals (enforced by tests/adminTheme.test.ts).
 * If a screen needs a colour that is not here, that is a design gap — add a
 * token to packages/design-tokens/src/tokens.json with a note, then expose it
 * here. See ./README.md for the conversion guide.
 *
 * No `react-native` import on purpose: the plain objects below are valid RN
 * style values, and keeping RN out lets the theme be unit-tested in plain Node
 * (apps/mobile/CLAUDE.md "Testing").
 */
import { hex, neutral, semantic, tokens, type ShadowName, type TypeStyle } from '@tohfa/design-tokens';

/**
 * Colours, named by role rather than by hue so a screen says what it is
 * painting (`adminColors.muted`), not what colour it happens to be today.
 */
export const adminColors = {
  // Brand (PDF "Brand Palette")
  /** Orange — primary actions, active states, icons. */
  brand: hex('adminOrange'),
  /** Orange Deep — section headings, emphasis text. */
  brandDeep: hex('adminOrangeDeep'),
  /** Orange Tint — icon chips, role badges, active pills. */
  brandTint: hex('adminOrangeTint'),
  /** Background — the app canvas behind cards. */
  canvas: hex('adminBackground'),

  // Neutrals (PDF "Neutrals")
  /** Ink — primary text. */
  ink: neutral('adminInk'),
  /** Muted — secondary text, inactive tab icons, chevrons. */
  muted: neutral('adminMuted'),
  /** Border — card, input, chip and divider strokes. */
  border: neutral('adminBorder'),
  /** Card — card surfaces. */
  card: neutral('adminCard'),
  /** Input / search placeholder text (drawn in the PDF, not a named swatch). */
  placeholder: neutral('adminPlaceholder'),
  /** Text and icons sitting on a filled `brand` surface (primary button label). */
  onBrand: neutral('white'),

  // Semantic pairs (PDF "Semantic Colors"). `text` doubles as the icon colour;
  // `bg` is the soft tint behind it. `border` is for accent stripes and
  // outlined states — see tokens.json $semanticColorNote for which borders the
  // PDF specifies (danger, brand) and which follow its alert-card pattern.
  success: {
    text: hex('adminSuccess'),
    bg: hex('adminSuccessBg'),
    border: semantic('adminSuccessBorder'),
  },
  warning: {
    text: hex('adminWarning'),
    bg: hex('adminWarningBg'),
    border: semantic('adminWarningBorder'),
  },
  danger: {
    text: hex('adminDanger'),
    bg: hex('adminDangerBg'),
    border: semantic('adminDangerBorder'),
  },
  info: {
    text: hex('adminInfo'),
    bg: hex('adminInfoBg'),
    border: semantic('adminInfoBorder'),
  },
  purple: {
    text: hex('adminPurple'),
    bg: hex('adminPurpleBg'),
    border: semantic('adminPurpleBorder'),
  },
  /** The PDF's orange status badge ("All Operational"): Orange Deep on Orange Tint. */
  brandSoft: {
    text: hex('adminOrangeDeep'),
    bg: hex('adminOrangeTint'),
    border: semantic('adminBrandBorder'),
  },

  /** The PDF's dark confirmation toast: white text on Ink, success icon in mint. */
  toast: {
    bg: neutral('adminInk'),
    text: neutral('white'),
    icon: hex('adminSuccessOnDark'),
  },
} as const;

export type AdminColors = typeof adminColors;
/** One of the status pairs — handy for a chip/badge component's `tone` prop. */
export type AdminTone = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'brandSoft';

type AdminFontWeight = '400' | '500' | '600' | '700' | '800';

/**
 * React Native text style for a token type style. No `fontFamily` on purpose:
 * the PDF specifies the native system stack (-apple-system / Roboto) and "no
 * custom typeface is loaded", which is exactly what RN renders when
 * `fontFamily` is unset. Setting the CSS stack string here would not work —
 * RN takes a single family name, not a fallback list.
 */
function textStyle(style: TypeStyle) {
  return {
    fontSize: style.size,
    lineHeight: style.lineHeight,
    fontWeight: String(style.weight) as AdminFontWeight,
  };
}

/** Text styles from the PDF's type table. Spread them: `{ ...adminType.rowTitle, color: adminColors.ink }`. */
export const adminType = {
  /** 19 / 800 — greeting name, tab title. */
  title: textStyle(tokens.typeStyle.adminTitle),
  /** 19 / 800 — KPI value (same spec as title, named for intent). */
  kpiValue: textStyle(tokens.typeStyle.adminTitle),
  /** 13 / 800 — section heading; the PDF paints it in `brandDeep`. */
  sectionHead: textStyle(tokens.typeStyle.adminSectionHead),
  /** 12.5 / 800 — list row and card title. */
  rowTitle: textStyle(tokens.typeStyle.adminRowTitle),
  /** 13 / 400 — body copy. */
  body: textStyle(tokens.typeStyle.adminBody),
  /** 10.5 / 400 — row subtitle / metadata; the PDF paints it in `muted`. */
  rowMeta: textStyle(tokens.typeStyle.adminRowMeta),
  /** 10 / 700 — KPI delta, badge label, caption. */
  caption: textStyle(tokens.typeStyle.adminCaption),
} as const;

/**
 * The admin font stack as the PDF writes it, for web/admin-web parity and
 * documentation. Do NOT pass it to a React Native `fontFamily` (see textStyle).
 */
export const ADMIN_FONT_STACK = tokens.fontStack.adminSans;

/** Radius scale from the PDF ("Spacing & Border Radius"). */
export const adminRadius = {
  /** 8 — icon boxes. */
  xs: tokens.radius.adminXs,
  /** 10 — small icon tiles. */
  sm: tokens.radius.adminSm,
  /** 12 — inputs, buttons, search. */
  md: tokens.radius.adminMd,
  /** 14 — cards, KPI tiles, rows. */
  lg: tokens.radius.adminLg,
  /** 16 — control panels, sheets. */
  xl: tokens.radius.adminXl,
  /** 100 — chips, badges, pills. */
  full: tokens.radius.adminFull,
} as const;

/**
 * Spacing is the platform scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80).
 * The admin PDF publishes radii but no spacing values of its own.
 */
export const adminSpacing = tokens.spacing;

/** React Native shadow props for a token shadow. */
function rnShadow(name: ShadowName) {
  const s = tokens.shadow[name];
  return {
    shadowColor: s.color,
    shadowOffset: { width: s.x, height: s.y },
    shadowOpacity: s.opacity,
    // CSS blur is roughly twice iOS shadowRadius; see tokens.json $shadowNote.
    shadowRadius: s.blur / 2,
    // Android ignores the shadow* props and needs elevation instead.
    elevation: s.elevation,
  };
}

/** Elevation. Spread into a style: `{ ...adminShadow.md }`. */
export const adminShadow = {
  /** Alert cards. */
  sm: rnShadow('adminSm'),
  /** Toasts, floating actions. */
  md: rnShadow('adminMd'),
  /** Modals. */
  lg: rnShadow('adminLg'),
} as const;

/** Full-width primary action height (PDF "Buttons & Inputs": 48px tall). */
export const ADMIN_BUTTON_HEIGHT = tokens.size.adminButtonHeight;

export const adminTheme = {
  colors: adminColors,
  type: adminType,
  radius: adminRadius,
  spacing: adminSpacing,
  shadow: adminShadow,
  buttonHeight: ADMIN_BUTTON_HEIGHT,
} as const;

export type AdminTheme = typeof adminTheme;

/**
 * Same shape as the farmer theme's `useTheme()`: a plain accessor today, named
 * as a hook so screens written against it keep working if the theme later
 * moves into React context.
 */
export function useAdminTheme(): AdminTheme {
  return adminTheme;
}
