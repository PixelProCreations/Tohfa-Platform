/**
 * Styles of the Market & Pricing home, after the team design's stylesheet
 * (origin/tofhafarmfin-rbac MarketPricingHomeScreen.tsx) on admin theme
 * tokens only. The design's numeric fontSize overrides (15, 13.5, 11.5 ...)
 * and raw spacing numbers (6, 10, 20 ...) are replaced by the nearest
 * adminType style / spacing token.
 */
import { StyleSheet } from 'react-native';
import { ADMIN_BUTTON_HEIGHT, adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';

export const homeStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  backButton: {
    padding: adminSpacing.xs,
    marginRight: adminSpacing.sm,
  },
  saHeader: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.smMd,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  saHeaderTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  saHeaderFilterBtn: {
    width: adminSpacing.xxl + adminSpacing.xs,
    height: adminSpacing.xxl + adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiGrid: {
    marginBottom: adminSpacing.lg,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  viewLinkText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  sectionBlock: {
    marginBottom: adminSpacing.lg,
  },
  listGap: {
    gap: adminSpacing.sm,
  },
  emptyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  rowCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  rowCardOver: {
    borderColor: adminColors.danger.text,
  },
  rowTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  rowTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flex: 1,
    marginRight: adminSpacing.sm,
  },
  rowSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  badge: {
    borderWidth: 1,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs / 2,
  },
  badgeText: {
    ...adminType.caption,
  },
  viewHistoryOutlineBtn: {
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    marginTop: adminSpacing.sm,
  },
  viewHistoryOutlineBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  quickCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.input,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  quickCardLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    textAlign: 'center',
  },
  notificationBtn: {
    width: adminSpacing.xxl + adminSpacing.xs,
    height: adminSpacing.xxl + adminSpacing.xs,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Super Admin Home styles
  saScrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl * 2,
  },
  saKpiGrid: {
    marginBottom: adminSpacing.md,
  },
  saKpiCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  saKpiVal: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  saKpiSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  saPrimaryBtn: {
    backgroundColor: adminColors.brand,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.smMd,
    ...adminShadow.sm,
  },
  saPrimaryBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  saSecondaryBtn: {
    backgroundColor: adminColors.card,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.sm,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  saSecondaryBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  saSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
  },
  saSectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  saViewLink: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  saRecentCardItem: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.smMd,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  saBadgeBoxSuccess: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.xs,
    paddingVertical: adminSpacing.xs / 2,
    paddingHorizontal: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saBadgeBoxDanger: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.xs,
    paddingVertical: adminSpacing.xs / 2,
    paddingHorizontal: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saCropInfoCol: {
    flex: 1.2,
  },
  saCropName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  saCropGrade: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  saPriceCol: {
    flex: 1.1,
  },
  saPriceCurrent: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  saPriceOld: {
    ...adminType.caption,
    color: adminColors.muted,
    textDecorationLine: 'line-through',
  },
  /**
   * The previous price when it was not loaded: the dash, muted and with no
   * strike-through, so it does not read as a real superseded amount. Same for
   * the delta pill, which gets no success/danger tone because there is no
   * direction to colour.
   */
  saPriceOldUnknown: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  saPillUnknownText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  saBadgeCol: {
    flex: 1.1,
    alignItems: 'center',
  },
  saPillSuccessText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  saPillDangerText: {
    ...adminType.caption,
    color: adminColors.danger.text,
  },
  saPillSubDanger: {
    ...adminType.caption,
    color: adminColors.danger.text,
    marginTop: 2,
  },
  saDateCol: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  saDatePrimary: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  saDateSecondary: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  saQuickHeaderRow: {
    marginTop: adminSpacing.xl,
    marginBottom: adminSpacing.md,
  },
  saQuickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: adminSpacing.md,
  },
  saQuickCard: {
    width: '48.5%',
    minHeight: 96,
  },
  saQuickCardFull: {
    width: '100%',
    minHeight: 92,
  },
  saQuickIconBox: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.xs,
  },
  saQuickLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    textAlign: 'center',
  },

  // Farmer Admin Home styles
  snapshotCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  snapshotLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  snapshotValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  snapshotDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.xs,
  },
  activeStatusText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  recentPriceCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  recentPriceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  recentPriceCropTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  activePill: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs / 2,
  },
  activePillText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
});
