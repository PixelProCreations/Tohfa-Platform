/**
 * Styles of the Market & Pricing home, after the team design's stylesheet
 * (origin/tofhafarmfin-rbac MarketPricingHomeScreen.tsx) on admin theme
 * tokens only. The design's numeric fontSize overrides (15, 13.5, 11.5 ...)
 * and raw spacing numbers (6, 10, 20 ...) are replaced by the nearest
 * adminType style / spacing token.
 */
import { StyleSheet } from 'react-native';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';

export const homeStyles = StyleSheet.create({
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
});
