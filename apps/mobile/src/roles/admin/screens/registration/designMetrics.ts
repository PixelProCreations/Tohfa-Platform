/**
 * The exact sizes the application screens' design (origin/Superadmin-main,
 * screens/registration/*) is drawn at, expressed through the design tokens.
 *
 * Why this file exists: the design states its sizes as raw numbers, and the
 * owner's brief for this port is that the rendered screens match the design
 * exactly. Many of those numbers ARE token values (8, 10, 12, 14, 16, 20, 48),
 * and the styles use the token directly. The rest have no token of their own
 * (13.5pt type, a 38pt button, a 150pt map panel, a 4pt badge radius, ...).
 * Rounding them to the nearest token is what left the previous port visibly
 * misaligned, so each one is derived here, once, from the token scale, and
 * named for where the design uses it. None of them is a new design decision:
 * every value is the design file's own number.
 *
 * TOKEN GAP: everything below is a value packages/design-tokens does not have.
 * If the owner adds tokens for them, this is the only file to change.
 */
import { tokens } from '@tohfa/design-tokens';
import { ADMIN_BUTTON_HEIGHT, adminRadius, adminSpacing, adminType } from '../../theme';

/** One point, the unit the design's off-grid values are built from. */
const PT = adminSpacing.xs / 4;

/** Font sizes, by the design's own number. */
export const FS = {
  /** design 9.5: the map summary's stat labels. */
  s9_5: adminType.caption.fontSize - PT / 2,
  s10: adminType.caption.fontSize,
  s10_5: adminType.rowMeta.fontSize,
  s11: tokens.typeStyle.caption.size,
  /** design 11.5: chips, stat values, the variance pill. */
  s11_5: tokens.typeStyle.caption.size + PT / 2,
  s12: tokens.typeStyle.small.size,
  s12_5: adminType.rowTitle.fontSize,
  s13: adminType.body.fontSize,
  /** design 13.5: section headings, sub-titles, list options. */
  s13_5: adminType.body.fontSize + PT / 2,
  s14: tokens.typeStyle.body.size,
  /** design 15: the primary buttons' labels. */
  s15: tokens.typeStyle.body.size + PT,
  s16: tokens.typeStyle.h4.size,
  /** design 17: the applicant avatar's initials. */
  s17: tokens.typeStyle.h4.size + PT,
  s18: tokens.typeStyle.h3.size,
  /** design 26: the decision screens' page title. */
  s26: tokens.typeStyle.h1.size - 2 * PT,
} as const;

/** Line heights the design sets explicitly. */
export const LH = {
  /** design 15: the declaration line. */
  l15: tokens.typeStyle.caption.lineHeight - PT,
  /** design 18: list options. */
  l18: adminType.body.lineHeight,
  /** design 19: the decision screens' sub-title. */
  l19: adminType.body.lineHeight + PT,
} as const;

/** Spacing and box sizes, by the design's own number. */
export const SP = {
  /** design 1: the gap under a label before its caption. */
  s1: PT,
  /** design 1.5: the OTP mini badge's vertical padding. */
  s1_5: PT * 1.5,
  s2: adminSpacing.xs / 2,
  /** design 2.5: the status badges' vertical padding. */
  s2_5: PT * 2.5,
  /** design 3: the header pill bar's inset, the name's bottom margin. */
  s3: PT * 3,
  s4: adminSpacing.xs,
  /** design 5: chip vertical padding. */
  s5: adminSpacing.xs + PT,
  s6: adminSpacing.xsSm,
  /** design 7: farming-type chip vertical padding. */
  s7: adminSpacing.xsSm + PT,
  s8: adminSpacing.sm,
  /** design 9: the variance box's vertical padding. */
  s9: adminSpacing.sm + PT,
  s10: adminSpacing.smMd,
  s12: adminSpacing.md,
  s14: adminSpacing.mdLg,
  s16: adminSpacing.lg,
  s20: adminSpacing.input,
  /** design 22: the tracker's connector length and indicator column width. */
  s22: adminSpacing.input + adminSpacing.xs / 2,
  s24: adminSpacing.xl,
  /** design 28: the action bar's bottom inset on iOS. */
  s28: adminSpacing.xl + adminSpacing.xs,
  s40: adminSpacing.largeSection,
  /** design 96 (xxxl * 2): room under the content for the sticky action bar. */
  s96: adminSpacing.xxxl * 2,
} as const;

/** Fixed box sizes. */
export const BOX = {
  /** design 38: Preview / Mark verified buttons. */
  docButton: adminSpacing.xxl + adminSpacing.xsSm,
  /** design 44: the light screens' back card (the platform's minimum touch target). */
  backCard: tokens.size.minTouchTarget,
  /** design 46: the preview sheet's buttons. */
  sheetButton: ADMIN_BUTTON_HEIGHT - adminSpacing.xs / 2,
  /** design 48: the action bar's buttons and the applicant avatar. */
  button: ADMIN_BUTTON_HEIGHT,
  /** design 52: the decision screens' primary button. */
  cta: ADMIN_BUTTON_HEIGHT + adminSpacing.xs,
  /** design 60: the review-notes box. */
  notesMin: adminSpacing.modalGap - adminSpacing.xs,
  /** design 70: the request message box. */
  messageMin: adminSpacing.modalGap + adminSpacing.xsSm,
  /** design 88: the decision screens' notes / feedback box. */
  formNotesMin: adminSpacing.pageMargin + adminSpacing.sm,
  /** design 150: the boundary map panel. */
  map: adminSpacing.pageMargin + adminSpacing.modalGap + adminSpacing.xsSm,
  /** design 60: the zone name column in the map card. */
  zoneName: adminSpacing.modalGap - adminSpacing.xs,
} as const;

/** Radii the admin radius scale has no step for. */
export const RAD = {
  /** design 4: the small square status badges. */
  r4: adminSpacing.xs,
  /** design 6: the variance / area pills and the checkbox. */
  r6: adminSpacing.xsSm,
  r8: adminRadius.xs,
  r10: adminRadius.sm,
  r12: adminRadius.md,
  r14: adminRadius.lg,
  r16: adminRadius.xl,
  /** design 18: the decision screens' cards. */
  r18: adminRadius.xl + adminSpacing.xs / 2,
} as const;
