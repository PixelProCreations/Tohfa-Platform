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

export const customerFonts = {
  editorial: 'ArchitectsDaughter-Regular',
  regular: 'Manrope-Regular',
  semibold: 'Manrope-SemiBold',
  bold: 'Manrope-Bold',
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
