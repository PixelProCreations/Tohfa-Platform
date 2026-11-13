import { radius, spacing } from '../../../theme';

/**
 * Layout constants shared by the Log Soil Amendment and Log Erosion Note
 * screens.
 *
 * Where the design-token scale has an exact match (spacing / radius) it is
 * used; the remaining values are the one-off measurements of the approved
 * mock, named here so that styles carry no bare numbers. Do not "round" them
 * to a token: that would change the UI.
 */
export const SP = {
  px: 1,
  xxs: 2,
  s3: 3,
  xs: spacing.xs,
  s6: 6,
  sm: spacing.sm,
  s10: 10,
  md: spacing.md,
  s14: 14,
  lg: spacing.lg,
  s18: 18,
  s20: 20,
  xl: spacing.xl,
  scrollBottom: 100,
} as const;

export const RAD = {
  chip: radius.sm,
  option: radius.md,
  field: 10,
  card: radius.lg,
  modal: 14,
  successCard: 20,
} as const;

export const DIM = {
  hairline: 1,
  borderThick: 1.5,
  backBtn: 40,
  backBtnRadius: 20,
  inputHeight: 48,
  radio: 18,
  radioRadius: 9,
  successIconCircle: 52,
  successIconRadius: 26,
  successCardMaxWidth: 380,
  amendmentNotesMinHeight: 80,
  erosionNotesMinHeight: 90,
  tinyFont: 10,
  smallFont: 11,
  lineHeight: 18,
  letterWide: 0.6,
  letterMedium: 0.5,
  letterTight: -0.3,
  maxValueWidth: '65%',
  full: '100%',
} as const;

export const SHADOW = {
  faintOpacity: 0.05,
  cardOpacity: 0.15,
  backBtnRadius: 2,
  barRadius: 4,
  cardRadius: 16,
  backBtnOffset: { width: 0, height: 1 },
  barOffset: { width: 0, height: -2 },
  cardOffset: { width: 0, height: 8 },
  elevationLow: 1,
  elevationModal: 6,
  elevationHigh: 8,
} as const;

/** Modal backdrops. Translucent black / slate-900 scrims, not palette colours. */
export const SCRIM = {
  picker: 'rgba(0,0,0,0.4)',
  success: 'rgba(15, 23, 42, 0.65)',
} as const;

export const OPACITY = {
  pressed: 0.7,
  card: 0.75,
  strong: 0.85,
  disabled: 0.7,
  enabled: 1,
} as const;

export const HIT_SLOP = {
  back: { top: 12, bottom: 12, left: 12, right: 12 },
  dateIcon: { top: 10, bottom: 10, left: 10, right: 10 },
} as const;

export const ICON = {
  back: 20,
  chevron: 16,
  label: 14,
  dateBox: 16,
  mountain: 16,
  riskCheck: 20,
  success: 30,
} as const;

export const SKELETON = {
  fieldHeight: 48,
  cardHeight: 200,
  gap: 16,
} as const;

/** Requirement reference shown in the header tag. Not translated. */
export const HEADER_TAG = 'FR-F06';

/** Display / entry format for dates on both forms. Also the DatePicker format. */
export const DATE_FORMAT = 'DD/MM/YY';

/** Glyphs used as chip / button prefixes. Not words, so not translated. */
export const GLYPH = {
  check: '✓ ',
  plus: '+ ',
  bullet: '• ',
} as const;
