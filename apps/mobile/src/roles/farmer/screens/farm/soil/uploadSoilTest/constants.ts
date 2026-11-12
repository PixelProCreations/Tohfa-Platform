import { radius, spacing } from '../../../../theme';

/**
 * Layout and domain constants for the Upload Soil Test screen.
 *
 * Where the design-token scale has an exact match (spacing / radius) it is
 * used; the remaining values are the one-off measurements of this screen's
 * approved mock, named here so that styles carry no bare numbers. Do not
 * "round" them to a token: that would change the UI.
 */
export const SP = {
  xxs: 2,
  xs: spacing.xs,
  s3: 3,
  s6: 6,
  sm: spacing.sm,
  s10: 10,
  md: spacing.md,
  s14: 14,
  lg: spacing.lg,
  s18: 18,
  s20: 20,
  s22: 22,
  xl: spacing.xl,
  scrollBottom: 100,
} as const;

export const RAD = {
  xs: radius.sm,
  sm: radius.md,
  field: 10,
  card: radius.lg,
  modal: 14,
  xl: radius.xl,
  successCard: 20,
} as const;

export const DIM = {
  navCircle: 38,
  navCircleRadius: 19,
  inputHeight: 46,
  buttonHeight: 48,
  waterIconWidth: 32,
  docIconBox: 36,
  docRemoveBtn: 28,
  docRemoveRadius: 14,
  successIconCircle: 52,
  successIconRadius: 26,
  successCardMaxWidth: 380,
  successOverlayPadding: 20,
  modalOverlayPadding: 24,
  dateHintLineHeight: 16,
  subtitleLineHeight: 18,
  tinyFont: 10,
  smallFont: 11,
  borderThick: 1.5,
  borderErrorWidth: 1.2,
  letterWide: 0.6,
  letterMedium: 0.5,
  letterTight: 0.4,
  hairline: 1,
  chipVerticalPad: 4,
  badgeVerticalPad: 1,
  skeletonSpacer: 16,
  skeletonInputHeight: 48,
  skeletonCardHeight: 200,
  sectionTopGap: 18,
  maxValueWidth: '65%',
} as const;

export const ICON = {
  tiny: 12,
  small: 14,
  base: 16,
  medium: 18,
  doc: 20,
  large: 30,
  upload: 32,
} as const;

export const HIT_SLOP_LARGE = { top: 10, bottom: 10, left: 10, right: 10 } as const;
export const HIT_SLOP_SMALL = { top: 8, bottom: 8, left: 8, right: 8 } as const;

export const OPACITY = { disabled: 0.7, enabled: 1 } as const;

export const SHADOW = {
  barOffset: { width: 0, height: -2 },
  barOpacity: 0.05,
  barRadius: 4,
  barElevation: 8,
  modalElevation: 6,
  cardOffset: { width: 0, height: 8 },
  cardOpacity: 0.15,
  cardRadius: 16,
  cardElevation: 8,
} as const;

/** Modal scrims. Not in the palette (it has no alpha-bearing neutral). */
export const SCRIM = {
  picker: 'rgba(0,0,0,0.4)',
  success: 'rgba(15, 23, 42, 0.65)',
} as const;

/** Clinical reference ranges used for the inline hints and result badges. */
export const RANGES = {
  oc: { low: 0.51, high: 0.75 },
  ph: { low: 6.0, high: 7.5 },
  ecGood: 1.0,
  ecSlight: 2.0,
  nitrogen: { low: 280, high: 560 },
  phosphorus: { low: 10, high: 25 },
  potassium: { low: 110, high: 280 },
  phFallback: 7,
} as const;

/** Wire values of the lime-status enum; the API receives exactly these. */
export const LIME_STATUS_OPTIONS = ['Harmless', 'Slight', 'Moderate', 'Severe'] as const;

/** Fallback file name when the picker returns none. A filename, not UI text. */
export const DEFAULT_REPORT_FILE_NAME = 'soil_lab_report.pdf';
export const BYTES_PER_MB = 1024 * 1024;
export const BYTES_FALLBACK = BYTES_PER_MB;
export const PRESET_WATER_SOURCES_SEPARATOR = ' · ';

/** Numeric example values shown as input placeholders (locale-neutral). */
export const PLACEHOLDERS = {
  organicCarbon: '0.62',
  ph: '5.8',
  ec: '0.7',
  tds: '312',
  nitrogen: '280',
  phosphorus: '24',
  potassium: '195',
} as const;
