/**
 * Styles for the Accounts & Finance hub, ported from the design's
 * "Accounts & Finance Screen Styles" (origin/tofhafarmfin-rbac
 * TohfaAdminDashboardScreen) with every literal moved onto a token:
 *   - spacing 8/10/12/14/16/4/6 are adminSpacing sm/smMd/md/mdLg/lg/xs/xsSm
 *     (the half steps per tokens.json $spacingHalfStepNote); the back button's
 *     2px right margin is dropped (no token, the title group's gap covers it);
 *   - the 32 back button is xxl; the 38 header pill is xxl + xsSm; the 72 / 84
 *     progress label and value columns are page + xl and page + xxl + xs;
 *     card minimum height 96 is page + page; the 10 bar is smMd;
 *   - radii 16 are adminRadius.xl, 19 / 12 / 5 pills are adminRadius.full;
 *   - colours: the design's warm card border, bar track and divider literals
 *     map to the nearest owner-approved dashboard tokens (overviewBorder,
 *     track, divider; each within a few units per channel); the 22% white
 *     header pill is adminOverlay.whitePill (same value) and the 92% white
 *     subtitle is adminOverlay.headerText (90%). The green and amber bar fills
 *     are dashboard.greenText (nearest) and platform.warning (same value);
 *   - type sizes have no admin token at 20 / 14.5 / 13.5 / 12 / 11, so each
 *     takes the nearest admin type style (title 19, sectionHead 13, body 13,
 *     rowTitle 12.5, caption 10) and keeps the design's weight.
 */
import { StyleSheet } from 'react-native';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

const card = {
  backgroundColor: adminColors.card,
  borderRadius: adminRadius.xl,
  borderWidth: 1,
  borderColor: adminColors.dashboard.overviewBorder,
  ...adminShadow.sm,
} as const;

export const financeHubStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  scroll: { flex: 1, backgroundColor: adminColors.canvas },
  scrollContent: { paddingBottom: adminSpacing.xxxl, backgroundColor: adminColors.canvas },

  // 1. Header banner
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  backBtn: { width: adminSpacing.xxl, height: adminSpacing.xxl, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...adminType.title, fontWeight: '800', color: adminColors.onBrand },
  headerActionsRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  headerPillBtn: {
    width: adminSpacing.xxl + adminSpacing.xsSm,
    height: adminSpacing.xxl + adminSpacing.xsSm,
    borderRadius: adminRadius.full,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: { ...adminType.body, fontWeight: '600', color: adminOverlay.headerText, marginTop: adminSpacing.smMd },

  // 2. Sub-header
  subheaderRow: { paddingHorizontal: adminSpacing.md, marginTop: adminSpacing.mdLg, marginBottom: adminSpacing.smMd },
  lastUpdated: { ...adminType.rowTitle, fontWeight: '500', color: adminColors.muted },

  // 3. KPI grid (OverviewCardsGrid with the design's padding and row gap)
  kpiGrid: { paddingHorizontal: adminSpacing.md, rowGap: adminSpacing.smMd },

  // Sections
  sectionBlock: { paddingHorizontal: adminSpacing.md, marginTop: adminSpacing.md },
  sectionHeading: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.md },

  // 5./6. Progress rows
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.smMd,
  },
  progressLabel: {
    width: adminSpacing.page + adminSpacing.xl,
    ...adminType.rowTitle,
    fontWeight: '600',
    color: adminColors.muted,
  },
  progressTrack: {
    flex: 1,
    height: adminSpacing.smMd,
    backgroundColor: adminColors.dashboard.track,
    borderRadius: adminRadius.full,
    marginHorizontal: adminSpacing.smMd,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: adminRadius.full },
  fillRevenue: { backgroundColor: adminColors.dashboard.greenText },
  fillPurchase: { backgroundColor: adminColors.brand },
  fillExpense: { backgroundColor: adminColors.platform.warning },
  progressValue: {
    width: adminSpacing.page + adminSpacing.xxl + adminSpacing.xs,
    textAlign: 'right',
    ...adminType.sectionHead,
    color: adminColors.ink,
  },

  // 7. By warehouse
  warehouseCard: { ...card, paddingHorizontal: adminSpacing.lg, paddingVertical: adminSpacing.xs },
  emptyText: { ...adminType.body, color: adminColors.muted, paddingVertical: adminSpacing.md },

  // 8. Recent transactions
  txnCard: {
    ...card,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    marginBottom: adminSpacing.smMd,
  },

  // 9. Go to
  goToGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: adminSpacing.smMd },
  goToCard: {
    ...card,
    width: '48.5%',
    minHeight: adminSpacing.page + adminSpacing.page,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.smMd,
    paddingVertical: adminSpacing.mdLg,
  },
  goToCardTitle: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
    marginTop: adminSpacing.sm,
  },

  bottomSpacer: { height: adminSpacing.xxl },
});
