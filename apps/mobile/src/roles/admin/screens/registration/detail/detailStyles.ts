/**
 * Styles shared by the application review sections (team design
 * AdminApplicationDetailScreen, redesigned 2026-11-19), on admin theme tokens
 * only.
 *
 * This is the design's VISUAL TREATMENT, not its stylesheet: the design file
 * carries raw hex and raw spacing numbers, and none of them are copied. Every
 * value below is the nearest token in ../../theme. Where the design asked for
 * something the token set has no answer for, the closest token is used and the
 * gap is noted inline with the design's own value, so the owner can decide
 * whether a token should be added:
 *
 *   #FAF8F5 / #F8F6F2 soft fills   -> adminColors.warehouse.warmCanvas (#FBF8F2)
 *                                     and adminColors.dashboard.overviewCanvas
 *   #F5F0EA hairline divider       -> adminColors.dashboard.divider (#F2ECE5)
 *   #F3E8DF / #F5EBE1 / #FFF7ED    -> adminColors.brandTint (#FDF3F0)
 *   #2E7D32 / #E8F5E9 green        -> adminColors.success.{text,bg}
 *   #B45309 / #FEF3C7 amber        -> adminColors.warning.{text,bg}
 *   #E5E7EB tracker grey           -> adminColors.dashboard.track (#EBE5DC)
 *   #2E4A28 dark map panel         -> adminColors.success.text (#173404)
 *   radius 4 / 6                   -> adminRadius.xs (8; the smallest admin radius)
 *   height 38 / 150, fontSize 15   -> no token; see the comments at each use
 */
import { StyleSheet } from 'react-native';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';

/** The design's warm off-white behind inputs, dropdowns, pills and soft boxes. */
const SOFT_SURFACE = adminColors.warehouse.warmCanvas;
/** The design's hairline between rows inside a card (lighter than adminColors.border). */
const HAIRLINE = adminColors.dashboard.divider;
/** The design's inactive tracker grey (dot fill and connector). */
const TRACK = adminColors.dashboard.track;

export const detailStyles = StyleSheet.create({
  docCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  docList: { gap: adminSpacing.sm },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
  },
  docTitle: { ...adminType.rowTitle, color: adminColors.ink },
  docSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  docButtonsRow: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.sm },
  /** The design's outlined "Preview": a neutral stroke and ink label, not a brand one. */
  outlineBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    // The design fixes these buttons at 38pt tall; no size token is that value,
    // so the height comes from the label plus adminSpacing.smMd padding.
    borderRadius: adminRadius.sm,
    paddingVertical: adminSpacing.smMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { ...adminType.rowTitle, color: adminColors.ink },
  filledBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.sm,
    paddingVertical: adminSpacing.smMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
  /** A DESIGN-ONLY control: drawn as designed but visibly not available. */
  unavailable: { opacity: 0.45 },
  caption: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  section: { gap: adminSpacing.md },
  infoBox: {
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.xs,
    padding: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  infoText: { ...adminType.rowMeta, color: adminColors.info.text },
  fieldLabel: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.xsSm },
  notesInput: {
    ...adminType.body,
    backgroundColor: SOFT_SURFACE,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    color: adminColors.ink,
    minHeight: adminSpacing.modalGap,
    textAlignVertical: 'top',
  },
  notesBox: {
    backgroundColor: SOFT_SURFACE,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  notesText: { ...adminType.body, color: adminColors.ink },
  saveProgressBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.sm,
    paddingVertical: adminSpacing.smMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveProgressText: { ...adminType.rowTitle, color: adminColors.brand },
  reqCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  reqTitle: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.xsSm },
  historyEmpty: { ...adminType.rowMeta, color: adminColors.muted },
  rejectedTitle: { ...adminType.sectionHead, color: adminColors.danger.text, marginBottom: adminSpacing.xsSm },

  // --- the 2026-11-19 design's document cards, tracker and chips -----------
  /** The review-stage line above the document cards. */
  stageLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  stageLineLabel: { ...adminType.rowMeta, color: adminColors.muted },
  stageLineValue: { ...adminType.rowTitle, color: adminColors.ink },
  /** The design's small square status pills: radius 4, which adminRadius has no step for. */
  badgeVerified: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.xs,
    paddingVertical: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
  },
  badgeVerifiedText: { ...adminType.caption, color: adminColors.success.text },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.xs,
    paddingVertical: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
  },
  badgePendingText: { ...adminType.caption, color: adminColors.warning.text },
  /** No verification data at all: the badge stays drawn and reads as the dash. */
  badgeUnknown: {
    backgroundColor: SOFT_SURFACE,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xs,
    paddingVertical: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
  },
  badgeUnknownText: { ...adminType.caption, color: adminColors.muted },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SOFT_SURFACE,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingVertical: adminSpacing.smMd,
    paddingHorizontal: adminSpacing.md,
    marginTop: adminSpacing.xsSm,
  },
  dropdownLabel: { ...adminType.rowMeta, color: adminColors.muted },
  dropdownValue: { ...adminType.body, color: adminColors.ink },
  tracker: { marginTop: adminSpacing.sm, paddingLeft: adminSpacing.xs },
  stageItem: { flexDirection: 'row', alignItems: 'flex-start', gap: adminSpacing.md },
  /** The indicator column: a 20pt dot and, between stages, the connector below it. */
  stageIndicator: { alignItems: 'center', width: adminSpacing.input },
  stageDot: {
    width: adminSpacing.input,
    height: adminSpacing.input,
    borderRadius: adminRadius.full,
    backgroundColor: TRACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotDone: { backgroundColor: adminColors.success.text },
  stageDotCurrent: { backgroundColor: adminColors.brand },
  /** Decoration only: the vertical rule joining one stage dot to the next. */
  stageConnector: {
    width: adminSpacing.xs / 2,
    height: adminSpacing.xl,
    backgroundColor: TRACK,
    marginVertical: adminSpacing.xs / 2,
  },
  stageBody: { flex: 1, paddingBottom: adminSpacing.mdLg },
  stageTitle: { ...adminType.rowTitle, color: adminColors.ink },
  stageSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },

  // --- the request-more-information chips (rounded pills) ------------------
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.xsSm },
  chip: {
    backgroundColor: SOFT_SURFACE,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingVertical: adminSpacing.xs,
    paddingHorizontal: adminSpacing.smMd,
  },
  chipText: { ...adminType.rowMeta, color: adminColors.muted },
  chipSelected: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  chipSelectedText: { color: adminColors.brand },

  // --- 02 · the Type of Farming chips (a four-up row of soft rectangles) ---
  farmingChipRow: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.sm },
  farmingChip: {
    flex: 1,
    backgroundColor: adminColors.dashboard.overviewCanvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xs,
    paddingVertical: adminSpacing.xsSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** The applicant's stored farming type: the design tints it green, not brand. */
  farmingChipSelected: {
    backgroundColor: adminColors.success.bg,
    borderColor: adminColors.success.border,
  },
  farmingChipText: { ...adminType.rowMeta, color: adminColors.muted, textAlign: 'center' },
  farmingChipTextSelected: { ...adminType.caption, color: adminColors.success.text },
  chipBlock: {
    paddingVertical: adminSpacing.smMd,
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },

  // --- 02 · the land-area variance box ------------------------------------
  varianceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpacing.md,
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.smMd,
    marginTop: adminSpacing.xsSm,
    marginBottom: adminSpacing.sm,
  },
  varianceBoxOk: {
    backgroundColor: adminColors.success.bg,
    borderColor: adminColors.success.border,
  },
  varianceTextBox: { flex: 1 },
  varianceTitle: { ...adminType.rowTitle, color: adminColors.ink },
  varianceSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  variancePill: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.xs,
    paddingVertical: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
  },
  variancePillText: { ...adminType.caption, color: adminColors.brand },

  // --- 03 · the boundary map card the API cannot fill ----------------------
  mapCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  mapHeader: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.sm,
  },
  mapTitle: { ...adminType.rowTitle, color: adminColors.ink },
  /**
   * The design's satellite panel: 150pt of dark green imagery. No imagery is
   * available and no size token is 150, so the panel is drawn at
   * modalGap + pageMargin (144) in the deepest green the theme has, and the
   * dash sits in it rather than the picture.
   */
  mapBody: {
    height: adminSpacing.modalGap + adminSpacing.pageMargin,
    backgroundColor: adminColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapDash: { ...adminType.sectionHead, color: adminColors.onBrand },
  mapFooter: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },

  // --- the header's 01/02/03 mode pills (a segmented bar on the orange) ----
  modePillBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: adminOverlay.headerPill,
    borderRadius: adminRadius.full,
    padding: adminSpacing.xs,
    marginTop: adminSpacing.sm,
  },
  modePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.full,
    paddingVertical: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
  },
  modePillActive: {
    backgroundColor: adminColors.card,
    ...adminShadow.sm,
  },
  modePillText: { ...adminType.caption, color: adminColors.onBrand },
  modePillTextActive: { color: adminColors.brand },
  modePillNote: { ...adminType.caption, color: adminOverlay.headerSubtitle, marginTop: adminSpacing.xs },
});
