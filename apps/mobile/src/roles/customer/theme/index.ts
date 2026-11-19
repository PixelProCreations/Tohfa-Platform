/**
 * Customer app theme — TOHFA MARKET / FIELD GUIDE System 01 (Nov 2026 Mobile).
 *
 * Implements the full design system specifications:
 * 01 Color ("Green has a job.")
 * 02 Foundations ("A little warmth. A lot of order.")
 * 03 Actions ("Make the next step clear.")
 * 04 Forms ("Ask clearly. Keep it easy.")
 * 05 Feedback ("Be helpful in the in-between.")
 *
 * Provides customer tokens and exports adminTheme / adminColors aliases so
 * customer components can be authored using either convention seamlessly.
 */

import { hex, neutral } from '@tohfa/design-tokens';

// ── 01 COLOR PALETTE ────────────────────────────────────────────────────────

/** Primitive swatches directly from Field Guide Page 01. */
export const customerPrimitives = {
  // Brand Greens
  green700: '#2E7D32', // action/primary, brand
  green800: '#205B24', // action/pressed
  green900: '#1A2E1A', // text/heading, focus ring, shadow base
  green50: '#E9F7E9',  // surface/selected, success bg
  lime50: '#E7FFE0',   // surface/brand-soft

  // Neutrals & Surfaces
  neutral950: '#0F0F0F', // text/body
  neutral600: '#676767', // text/secondary, muted
  white: '#FFFFFF',      // surface/raised, text/inverse
  warm50: '#FEFDFA',     // surface/canvas

  // Sage Borders & Disabled
  sage500: '#7B8577',    // border/control
  sage200: '#DADFD4',    // border/decorative, dividers
  sage100: '#E6E8E2',    // surface/disabled, disabled border
  disabledBg: '#F6F8F2', // surface behind disabled text
  disabledText: '#676767',

  // Status Palette (Meaning + Words + Glyph)
  red700: '#B3261E',     // error text / glyph
  red50: '#FEE4E2',      // error background
  amber900: '#7A4E00',   // warning text / glyph
  amber50: '#FEF4D6',    // warning background
  blue800: '#1B5C87',    // information text / glyph
  blue50: '#EDF6FC',     // information background
} as const;

/**
 * Customer Colours, named by semantic intent with full palette access.
 */
export const customerColors = {
  // Brand & Accent
  brand: customerPrimitives.green700,
  primary: customerPrimitives.green700,
  primaryPressed: customerPrimitives.green800,
  heading: customerPrimitives.green900,
  brandSoft: customerPrimitives.lime50,
  selected: customerPrimitives.green50,

  // Direct string status values for backward-compatibility with screens
  // NOTE: two success greens coexist — this one (Field Guide #2E7D32) and
  // shared.success (#16A34A) below. Design should pick one standard success colour.
  success: customerPrimitives.green700,
  danger: customerPrimitives.red700,
  error: customerPrimitives.red700,
  warning: customerPrimitives.amber900,
  info: customerPrimitives.blue800,
  accent: customerPrimitives.green800,
  secondary: customerPrimitives.neutral600,

  // Text
  body: customerPrimitives.neutral950,
  ink: customerPrimitives.neutral950,
  muted: customerPrimitives.neutral600,
  onBrand: customerPrimitives.white,
  onPrimary: customerPrimitives.white,
  placeholder: customerPrimitives.neutral600,
  disabledText: customerPrimitives.disabledText,

  // Surfaces & Canvas
  canvas: customerPrimitives.warm50,
  card: customerPrimitives.white,
  surface: customerPrimitives.white,
  onSurface: customerPrimitives.neutral950,
  surfaceWarm: customerPrimitives.warm50,
  surfaceSelected: customerPrimitives.green50,
  surfaceBrandSoft: customerPrimitives.lime50,
  surfaceDisabled: customerPrimitives.sage100,
  disabledBg: customerPrimitives.disabledBg,
  white: customerPrimitives.white,

  // Borders & Dividers
  borderControl: customerPrimitives.sage500,
  borderDecorative: customerPrimitives.sage200,
  borderDisabled: customerPrimitives.sage100,
  border: customerPrimitives.sage500,
  divider: customerPrimitives.sage200,
  focusRing: customerPrimitives.green900,

  // Semantic Status Pairs (with text/bg/border triples)
  status: {
    success: {
      text: customerPrimitives.green700,
      bg: customerPrimitives.green50,
      border: customerPrimitives.green700,
    },
    error: {
      text: customerPrimitives.red700,
      bg: customerPrimitives.red50,
      border: customerPrimitives.red700,
    },
    danger: {
      text: customerPrimitives.red700,
      bg: customerPrimitives.red50,
      border: customerPrimitives.red700,
    },
    warning: {
      text: customerPrimitives.amber900,
      bg: customerPrimitives.amber50,
      border: customerPrimitives.amber900,
    },
    info: {
      text: customerPrimitives.blue800,
      bg: customerPrimitives.blue50,
      border: customerPrimitives.blue800,
    },
  },

  // Toast / Confirmation (white text on green900, success glyph in green700)
  toast: {
    bg: customerPrimitives.green900,
    text: customerPrimitives.white,
    icon: customerPrimitives.green50,
  },

  // Raw primitives exposed under swatches
  primitives: customerPrimitives,

  /**
   * The shared @tohfa/design-tokens neutral ramp, read through neutral() (never
   * re-typed). Customer screens painted these greys before the Field Guide
   * palette existed; named exactly after the token so a screen stays traceable.
   */
  neutral: {
    neutral950: neutral('neutral950'), // #111827
    neutral900: neutral('neutral900'), // #1F2937
    neutral800: neutral('neutral800'), // #374151
    neutral700: neutral('neutral700'), // #4B5563
    neutral600: neutral('neutral600'), // #6B7280
    neutral500: neutral('neutral500'), // #9CA3AF
    neutral400: neutral('neutral400'), // #D1D5DB
    neutral300: neutral('neutral300'), // #E5E7EB
    neutral100: neutral('neutral100'), // #F3F4F6
    neutral50: neutral('neutral50'), // #F9FAFB
    black: neutral('black'), // #000000
  },

  /**
   * Shared semantic colours from the @tohfa/design-tokens `color` group, read
   * through hex(). NOTE: these differ from the Field Guide status colours above
   * (e.g. shared.error #DC2626 vs error #B3261E) — they are the values the
   * screens already used, kept so nothing renders differently. shared.success
   * (#16A34A) vs success (#2E7D32): design should pick one standard success colour.
   */
  shared: {
    primaryLight: hex('primaryLight'), // #E8F5E9
    success: hex('success'), // #16A34A
    successLight: hex('successLight'), // #F0FDF4
    warning: hex('warning'), // #D97706
    error: hex('error'), // #DC2626
    errorLight: hex('errorLight'), // #FEF2F2
    info: hex('info'), // #2563EB
  },

  /**
   * LEGACY — off-palette values lifted verbatim from customer screens during
   * the B4 literal-colour cleanup (each used 10+ times), so nothing renders
   * differently. They are NOT part of the Field Guide: do not use them for new
   * work, and do not 'round' another design onto them. Pending design review
   * to fold each into a Field Guide token.
   */
  legacy: {
    nearBlack: '#1A1A1A', // same value as design-tokens neutral.adminInk
    charcoal: '#222222',
    amber: '#F59E0B',
    red: '#EF4444', // same value as design-tokens color.adminAlertIcon
    greenDeep: '#15803D',
    greenDeeper: '#166534',
    greenTint: '#DCFCE7',
    greenWash: '#EDF8EE',
    greenMid: '#4CAF50',
    greenForest: '#2D7A47',
    greenDark: '#1E7E34',
    greenPine: '#2D6A4F',
  },

  /** Modal / sheet backdrops (black scrims), values verbatim from the screens. */
  overlay: {
    scrim45: 'rgba(0, 0, 0, 0.45)', // same value as design-tokens color.adminScrim
    scrim50: 'rgba(0, 0, 0, 0.5)',
    scrim55: 'rgba(0, 0, 0, 0.55)',
    // Translucent veils over photos / brand surfaces; each value repeats in the screens.
    white10: 'rgba(255, 255, 255, 0.1)',
    white60: 'rgba(255, 255, 255, 0.6)',
    white95: 'rgba(255, 255, 255, 0.95)',
    mintVeil45: 'rgba(232, 245, 233, 0.45)',
  },

  /**
   * OFF-PALETTE, PENDING DESIGN REVIEW. Customer-owned swatches lifted verbatim
   * (exact hex, zero visual change) from customer screens during the B4
   * literal-colour cleanup, grouped by hue family and named by hue. They are not
   * Field Guide colours: do not use them for new work and do not 'round' another
   * design onto them. Some values happen to equal admin-only design tokens
   * (e.g. grey.warmMuted = adminMuted, slate.* = adminSlate*, blue.sky =
   * adminInfoCardIcon); they are deliberately re-declared here so the customer
   * role does not depend on admin-named tokens.
   */
  palette: {
    green: {
      leafTint: '#C8E6C9',
      successWash: '#EAF6E9',
      paleMint: '#F0F8EE',
      deepForest: '#1B4332',
      fern: '#1E6B35',
      sprout: '#81C784',
      mistLight: '#EFF9F0',
      emerald: '#059669',
      frost: '#E8F8EE',
      vivid: '#00C853',
      emeraldBright: '#10B981',
      bright: '#22C55E',
      dew: '#EBF8E7',
      seafoam: '#EAF5EE',
      sage: '#A8C4A7',
      sageDeep: '#97B896',
      grass: '#43A047',
      whisper: '#F3F8F2',
      mintSoft: '#C6F6D5',
      slateGreen: '#52796F',
      haze: '#EAF7EC',
      mintBorder: '#C6E7D0',
      pineDark: '#1E3D29',
      basil: '#1E6F38',
      ivoryTint: '#F7FAF5',
      emeraldLight: '#34D399',
      lightBright: '#4ADE80',
      cloud: '#EDF7ED',
      meadow: '#388E3C',
      olive: '#558B2F',
      limeLeaf: '#7CB342',
      blackGreen: '#131B14',
      moss: '#A3B899',
      midnight: '#0D1912',
      celadon: '#A8D5BA',
      jade: '#7CB992',
      hunter: '#1E5128',
      greyGreen: '#5E6F5E',
      pastel: '#A7D7A9',
    },
    red: {
      blush: '#FEE2E2',
      brick: '#B42318',
      tomato: '#E53935',
      crimson: '#B91C1C',
      rose: '#FFEBEE',
      petal: '#FED7D7',
      signal: '#E53E3E',
      cherry: '#D32F2F',
      raspberry: '#E11D48',
    },
    amber: {
      paleTint: '#FEF3C7',
      gold: '#F4B400',
      bronze: '#B45309',
      sun: '#FBC02D',
      peachWash: '#FEF7EE',
      honey: '#E5A93C',
      ivory: '#FFFBF2',
    },
    orange: {
      bright: '#F97316',
      coral: '#FF7043',
      tangerine: '#FFA726',
      pumpkin: '#E08A38',
      burnt: '#EA580C',
    },
    blue: {
      sky: '#0284C7',
      bright: '#3B82F6',
      skyLight: '#38BDF8',
      skyTint: '#BAE6FD',
      skyWash: '#F0F9FF',
      skyDeep: '#0369A1',
      material: '#1976D2',
      ice: '#E3F2FD',
      soft: '#60A5FA',
      cyan: '#06B6D4',
      teal: '#14B8A6',
    },
    purple: {
      violet: '#9333EA',
      lavender: '#F3E8FF',
      iris: '#8B5CF6',
      pink: '#EC4899',
    },
    slate: {
      dark: '#334155',
      night: '#0F172A',
      mist: '#94A3B8',
      snow: '#F8FAFC',
      line: '#CBD5E1',
      charcoal: '#1E293B',
      steel: '#475569',
      cloud: '#E2E8F0',
    },
    grey: {
      smoke: '#F0F0F0',
      graphite: '#333333',
      mid: '#777777',
      dim: '#666666',
      silver: '#CCCCCC',
      ash: '#888888',
      mist: '#EEEEEE',
      iron: '#555555',
      snow: '#FAFAFA',
      systemGrey: '#8E8E93',
      pewter: '#A0A7B1',
      fog: '#EBEBEB',
      warmMuted: '#5F5E5A',
      paper: '#F8F9FA',
      chalk: '#F7F7F7',
      cloud: '#EFEFEF',
      gunmetal: '#373A40',
      pearl: '#EAEAEA',
      charcoalSoft: '#444444',
      frost: '#F4F5F7',
    },
    warm: {
      offWhite: '#FAF9F6',
      stone: '#FAFAF9',
      linen: '#FEFDFB',
      parchment: '#F4F5F0',
      cream: '#FFFDF9',
      eggshell: '#FDFBF7',
    },
    brown: {
      cocoa: '#6D4C41',
      taupe: '#A1887F',
      sand: '#D7CCC8',
    },
  },
} as const;

// ── 02 FOUNDATIONS: TYPOGRAPHY ──────────────────────────────────────────────

export type CustomerFontWeight = '400' | '500' | '600' | '700';

export interface CustomerTypeStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: CustomerFontWeight;
  fontFamily?: string;
  letterSpacing?: number;
}

import { Platform } from 'react-native';

export const customerFonts = {
  editorial: Platform.select({
    ios: 'ArchitectsDaughter-Regular',
    android: 'ArchitectsDaughter-Regular',
    default: 'ArchitectsDaughter-Regular',
  }) as string,
  regular: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }) as string,
  semibold: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'sans-serif-medium',
  }) as string,
  bold: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }) as string,
} as const;

/**
 * Normalized Type Scale from Field Guide Page 02.
 */
export const customerType = {
  /** 32 / 40 — Editorial titles ("Fresh from our farmers"). Architects Daughter. */
  editorial: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400',
    fontFamily: customerFonts.editorial,
  } as CustomerTypeStyle,

  /** 24 / 30 — Page & modal titles ("A fresher experience starts here"). Manrope Bold. */
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: customerFonts.bold,
  } as CustomerTypeStyle,

  /** 20 / 26 — Section headings ("Fresh Finds for You"). Manrope Bold. */
  section: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    fontFamily: customerFonts.bold,
  } as CustomerTypeStyle,

  /** 16 / 24 — Primary body copy ("Choose fresh produce available near you"). Manrope Regular. */
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: customerFonts.regular,
  } as CustomerTypeStyle,

  /** 16 / 20 — Button & control labels ("Confirm address"). Manrope Bold. */
  control: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: customerFonts.bold,
  } as CustomerTypeStyle,

  /** 14 / 20 — Supporting copy, input labels, hints. Manrope Regular. */
  support: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: customerFonts.regular,
  } as CustomerTypeStyle,

  /** 12 / 16 — Meta info, tags, step indicators ("STEP 1 OF 3"). Manrope SemiBold. */
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    fontFamily: customerFonts.semibold,
  } as CustomerTypeStyle,
} as const;

// ── 02 FOUNDATIONS: SPACING & RHYTHM ────────────────────────────────────────

/** 4-point spacing rhythm from Field Guide Page 02. */
export const customerSpacing = {
  /** 4 — Optical gap */
  4: 4,
  /** 8 — Icon/label gap, tight items */
  8: 8,
  /** 12 — Compact group, mobile gutter */
  12: 12,
  /** 16 — Card inset, control padding */
  16: 16,
  /** 20 — Screen gutter / outer margin */
  20: 20,
  /** 24 — Field group gap */
  24: 24,
  /** 32 — Section gap */
  32: 32,
  /** 48 — Major pause, button touch target */
  48: 48,
  /** 64 — Documentation / hero inset */
  64: 64,

  // Semantic named aliases
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

// ── 02 FOUNDATIONS: RADIUS ──────────────────────────────────────────────────

/** Corner radii from Field Guide Page 02 ("Purpose before softness"). */
export const customerRadius = {
  /** 6 — Meta badges, tags, status chips. */
  meta: 6,
  /** 12 — Inputs, text fields, inline alerts. */
  input: 12,
  /** 16 — Cards, product tiles, containers. */
  card: 16,
  /** 28 — Bottom sheets, top modal sheet corners. */
  sheet: 28,
  /** 9999 — Action buttons, interactive pills, search bar. */
  action: 9999,
  pill: 9999,
  full: 9999,

  // Size scale aliases
  xs: 6,
  sm: 12,
  md: 16,
  lg: 28,
} as const;

// ── 02 FOUNDATIONS: ELEVATION & SHADOWS ─────────────────────────────────────

/**
 * Three quiet elevation levels from Field Guide Page 02.
 * Hand-tuned for React Native (iOS shadow* and Android elevation).
 */
export const customerShadow = {
  /** Level 0: Flat / bordered only. */
  flat: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  /** Level 0.5: Subtle card elevation */
  subtle: {
    shadowColor: customerPrimitives.green900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  /** Level 1: Raised (y: 4, blur: 16, color: #1A2E1A at 8% opacity). Used for floating cards. */
  raised: {
    shadowColor: customerPrimitives.green900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  /** Level 2: Overlay (y: 12, blur: 32, color: #1A2E1A at 16% opacity). Modals and bottom sheets. */
  overlay: {
    shadowColor: customerPrimitives.green900,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },

  // Aliases for compatibility
  sm: {
    shadowColor: customerPrimitives.green900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: customerPrimitives.green900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: customerPrimitives.green900,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ── 03 ACTIONS & LAYOUT SPECIFICATIONS ──────────────────────────────────────

export const customerLayout = {
  baselineWidth: 390,
  contentWidth: 350,
  screenMargin: 20,
  gutter: 12,
  columns: 4,
} as const;

export const CUSTOMER_ACTION_HEIGHT = 48;
export const CUSTOMER_INPUT_HEIGHT = 56;
export const CUSTOMER_HEADER_HEIGHT = 72;
export const CUSTOMER_BOTTOM_NAV_HEIGHT = 60;
export const CUSTOMER_CIRCULAR_BUTTON_SIZE = 48;
export const CUSTOMER_MIN_TOUCH_TARGET = 48;

/** Button style presets for Primary, Secondary, Tertiary, and Circular actions. */
export const customerActions = {
  primary: {
    default: {
      backgroundColor: customerPrimitives.green700,
      textColor: customerPrimitives.white,
    },
    pressed: {
      backgroundColor: customerPrimitives.green800,
    },
    disabled: {
      backgroundColor: customerPrimitives.sage100,
      textColor: customerPrimitives.neutral600,
    },
  },
  secondary: {
    default: {
      backgroundColor: customerPrimitives.white,
      borderColor: customerPrimitives.sage500,
      textColor: customerPrimitives.neutral950,
    },
    pressed: {
      backgroundColor: customerPrimitives.green50,
    },
    disabled: {
      borderColor: customerPrimitives.sage100,
      textColor: customerPrimitives.neutral600,
    },
  },
  tertiary: {
    default: {
      backgroundColor: 'transparent',
      textColor: customerPrimitives.green700,
    },
    pressed: {
      backgroundColor: customerPrimitives.green50,
    },
  },
  circular: {
    size: 48,
    borderRadius: 9999,
    backgroundColor: customerPrimitives.green700,
    pressedColor: customerPrimitives.green800,
  },
} as const;

// ── 04 FORMS SPECIFICATIONS ─────────────────────────────────────────────────

export const customerForms = {
  input: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: customerRadius.input,
    borderWidth: 1,
    borderColor: customerPrimitives.sage500,
    activeBorderColor: customerPrimitives.green700,
    errorBorderColor: customerPrimitives.red700,
    backgroundColor: customerPrimitives.white,
    textColor: customerPrimitives.neutral950,
    placeholderTextColor: customerPrimitives.neutral600,
  },
  pinInput: {
    boxWidth: 48,
    boxHeight: 56,
    borderRadius: customerRadius.input,
    borderWidth: 1,
    borderColor: customerPrimitives.sage500,
    activeBorderColor: customerPrimitives.green700,
  },
  label: {
    ...customerType.support,
    marginBottom: 8,
    color: customerPrimitives.neutral950,
  },
} as const;

// ── COMPOSED THEMES & HOOKS ─────────────────────────────────────────────────

export const customerTheme = {
  colors: customerColors,
  type: customerType,
  radius: customerRadius,
  spacing: customerSpacing,
  shadow: customerShadow,
  layout: customerLayout,
  actions: customerActions,
  forms: customerForms,
  actionHeight: CUSTOMER_ACTION_HEIGHT,
  inputHeight: CUSTOMER_INPUT_HEIGHT,
  headerHeight: CUSTOMER_HEADER_HEIGHT,
  bottomNavHeight: CUSTOMER_BOTTOM_NAV_HEIGHT,
  minTouchTarget: CUSTOMER_MIN_TOUCH_TARGET,
} as const;

export type CustomerTheme = typeof customerTheme;

export function useCustomerTheme(): CustomerTheme {
  return customerTheme;
}

// ── ADMIN THEME COMPATIBILITY ALIASES ───────────────────────────────────────
// Allows screens and components written with admin styling naming to work
// seamlessly in the customer context.

export const adminColors = {
  ...customerColors,
  // Semantic status pairs matching admin structure (text, bg, border)
  success: customerColors.status.success,
  warning: customerColors.status.warning,
  danger: customerColors.status.danger,
  info: customerColors.status.info,
  brandSoft: {
    text: customerPrimitives.green800,
    bg: customerPrimitives.lime50,
    border: customerPrimitives.green700,
  },
  toast: customerColors.toast,
};

export const adminType = customerType;
export const adminRadius = customerRadius;
export const adminShadow = customerShadow;
export const adminSpacing = customerSpacing;
export const adminTheme = customerTheme;
export const ADMIN_BUTTON_HEIGHT = CUSTOMER_ACTION_HEIGHT;
export const ADMIN_FONT_STACK = 'Manrope, -apple-system, Roboto, sans-serif';

export type AdminTheme = CustomerTheme;
export function useAdminTheme(): CustomerTheme {
  return customerTheme;
}

// ── BACKWARDS COMPATIBILITY EXPORTS ─────────────────────────────────────────

export const colors = customerColors;
export const typography = {
  caption: customerType.meta,
  footnote: customerType.meta,
  bodySmall: customerType.support,
  bodyLarge: customerType.section,
  headline: customerType.editorial,
  display: customerType.editorial,
  editorial: customerType.editorial,
  title: customerType.title,
  section: customerType.section,
  body: customerType.body,
  control: customerType.control,
  support: customerType.support,
  meta: customerType.meta,
};

export const weights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeights = {
  meta: 16,
  support: 20,
  control: 20,
  body: 24,
  section: 26,
  title: 30,
  editorial: 40,
};

export const spacing = customerSpacing;
export const radius = customerRadius;
export const shadow = customerShadow;
export const MIN_TOUCH_TARGET = CUSTOMER_MIN_TOUCH_TARGET;

export const theme = {
  ...customerTheme,
  colors,
  typography,
  weights,
  lineHeights,
  spacing,
  radius,
  shadow,
  minTouchTarget: MIN_TOUCH_TARGET,
};

export type Theme = typeof theme;

export function useTheme() {
  return theme;
}
