/**
 * Shared styles of the Market & Pricing view-only screens, after the team
 * design's stylesheets (origin/tofhafarmfin-rbac FairPriceCeilingScreen /
 * PriceHistoryScreen) on admin theme tokens only. Where the design overrode a
 * type style with a numeric fontSize (15, 13.5, 12.5, 11 ...) or used a raw
 * spacing number (6, 10, 22 ...), the nearest adminType style / spacing token
 * is used instead; the sheet's 24px top radius is adminSpacing.xl.
 */
import { StyleSheet } from 'react-native';
import { ADMIN_BUTTON_HEIGHT, adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import type { PricingTone } from './pricingLogic';

/** Header icon button size, built from the spacing scale (36). */
export const HEADER_BUTTON = adminSpacing.xxl + adminSpacing.xs;

export const TONE_TEXT: Readonly<Record<PricingTone, string>> = {
  success: adminColors.success.text,
  info: adminColors.info.text,
  danger: adminColors.danger.text,
  muted: adminColors.muted,
};

export const TONE_BG: Readonly<Record<PricingTone, string>> = {
  success: adminColors.success.bg,
  info: adminColors.info.bg,
  danger: adminColors.danger.bg,
  muted: adminColors.border,
};

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header banner
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: adminSpacing.xs,
    marginRight: adminSpacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminOverlay.headerText,
    marginTop: adminSpacing.xs,
  },
  headerIconBtn: {
    width: HEADER_BUTTON,
    height: HEADER_BUTTON,
    borderRadius: adminRadius.full,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: adminSpacing.sm,
  },

  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },

  // Search bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  searchFilterBtn: {
    padding: adminSpacing.xs,
  },

  // Counts, sections, lists
  recordCountText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  sectionSpacer: {
    marginTop: adminSpacing.md,
  },
  emptyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
  },
  loadMore: {
    alignSelf: 'center',
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
  },
  loadMoreText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },

  // Cards
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  cardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flex: 1,
    marginRight: adminSpacing.sm,
  },
  cardSubtitle1: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  cardSubtitle2: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  badge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs / 2,
    borderRadius: adminRadius.full,
  },
  badgeText: {
    ...adminType.caption,
  },
  priceColsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: adminSpacing.md,
  },
  priceCol: {
    flex: 1,
  },
  priceColLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs / 2,
  },
  priceColValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: adminSpacing.lg,
    marginTop: adminSpacing.md,
  },
  cardActionBtn: {
    paddingVertical: adminSpacing.xs / 2,
  },
  cardActionText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },

  // Bottom sheets
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminSpacing.xl,
    borderTopRightRadius: adminSpacing.xl,
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    maxHeight: '90%',
  },
  sheetTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  specCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  specKey: {
    ...adminType.body,
    color: adminColors.muted,
    marginRight: adminSpacing.md,
  },
  specValBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  dottedDivider: {
    height: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: adminSpacing.xs / 2,
  },
  sheetSubheading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.xs,
  },
  sheetNoteBlock: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  sheetNoteText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  sheetCloseBtn: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
  },
  sheetCloseText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },

  // Filter sheet
  filterFieldLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  dropdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  dropdownBoxDisabled: {
    backgroundColor: adminColors.canvas,
  },
  dropdownSelectedText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownHint: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  dropdownMenu: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    marginTop: adminSpacing.xs,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  dropdownOption: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  dropdownOptionSelected: {
    backgroundColor: adminColors.muted,
  },
  dropdownOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownOptionTextSelected: {
    color: adminColors.onBrand,
  },
  dateInputBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  dateTextInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  fieldError: {
    ...adminType.rowMeta,
    color: adminColors.danger.text,
    marginTop: adminSpacing.xs,
  },
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: adminSpacing.xl,
    gap: adminSpacing.md,
  },
  pillBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    backgroundColor: adminColors.card,
  },
  applyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  resetBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },

  // Super Admin & Farmer Admin ceiling styles
  saKpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  saKpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.xs,
    alignItems: 'center',
  },
  saKpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  saKpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs / 2,
  },
  saFilterCountText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  saFilterRowBoxes: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  saFilterBoxBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.sm,
  },
  saFilterBoxText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  saCropCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  saCropCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: adminSpacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: adminColors.border,
    marginBottom: adminSpacing.sm,
  },
  saCropTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  saCropGradeSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 1,
  },
  saCropGradesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saGradeColWithBorder: {
    flex: 1,
    alignItems: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: adminColors.border,
    paddingRight: adminSpacing.sm,
  },
  saBadgeColRight: {
    paddingLeft: adminSpacing.sm,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  saGradeColLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  saGradeColPrice: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: 2,
  },
  saFreqBadgeWeekly: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs / 2,
  },
  saFreqTextWeekly: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  saFreqBadgeDaily: {
    backgroundColor: adminColors.purple.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs / 2,
  },
  saFreqTextDaily: {
    ...adminType.caption,
    color: adminColors.purple.text,
  },
  saBottomBar: {
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    ...adminShadow.md,
  },
  saBottomButton: {
    backgroundColor: adminColors.brand,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saBottomButtonText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  faCeilingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  faCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  faActivePill: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs / 2,
  },
  faActivePillText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  faCardSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  faPriceColsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: adminSpacing.sm,
  },
  faPriceCol: {
    flex: 1,
  },
  faPriceColLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  faPriceColValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: 2,
  },
});
