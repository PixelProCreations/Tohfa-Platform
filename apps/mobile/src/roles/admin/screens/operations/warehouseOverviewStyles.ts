/**
 * Styles of the Inventory & Warehouse overview (M10-S01), ported from the
 * design's warehouses view (AdminOperationsOverviewScreen on
 * tofhafarmfin-rbac) with every raw hex / number swapped for the admin theme
 * token nearest the design value.
 */
import { StyleSheet } from 'react-native';
import { ADMIN_BUTTON_HEIGHT, adminColors, adminOverlay, adminRadius, adminSpacing, adminType } from '../../theme';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xsSm,
    paddingBottom: adminSpacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: adminSpacing.xxl,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerBackBtn: {
    paddingRight: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },
  gridSpacing: {
    marginBottom: adminSpacing.lg,
  },

  // Search bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: ADMIN_BUTTON_HEIGHT,
    marginBottom: adminSpacing.lg,
  },
  searchInput: {
    ...adminType.body,
    flex: 1,
    color: adminColors.ink,
    paddingHorizontal: adminSpacing.sm,
  },
  searchFilterBtn: {
    padding: adminSpacing.xsSm,
  },

  // Inline figure failure
  figuresFailedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  figuresFailedText: {
    ...adminType.rowMeta,
    flex: 1,
    color: adminColors.danger.text,
  },
  figuresRetryText: {
    ...adminType.caption,
    color: adminColors.brand,
    paddingLeft: adminSpacing.sm,
  },

  // Section titles
  sectionTitleBrown: {
    ...adminType.sectionHead,
    color: adminColors.dashboard.brandBrown,
    marginTop: adminSpacing.smMd,
    marginBottom: adminSpacing.smMd,
  },

  // Warehouse cards
  whListSection: {
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  whCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.mdLg,
  },
  whCardFailed: {
    borderColor: adminColors.dashboard.borderLight,
  },
  whCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  whCardTitle: {
    ...adminType.rowTitle,
    flex: 1,
    color: adminColors.ink,
  },
  whStatusBadge: {
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs / 2,
  },
  whStatusActive: {
    backgroundColor: adminColors.success.bg,
  },
  whStatusInactive: {
    backgroundColor: adminColors.warning.bg,
  },
  whStatusText: {
    ...adminType.caption,
  },
  whStatusTextActive: {
    color: adminColors.success.text,
  },
  whStatusTextInactive: {
    color: adminColors.warning.text,
  },
  whCardLine: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  whCardLineFailed: {
    color: adminColors.danger.text,
    fontWeight: '600',
  },
  whCardActionRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  whCardActionBtn: {
    flex: 1,
    paddingVertical: adminSpacing.xsSm,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whCardActionBtnPrimary: {
    backgroundColor: adminColors.brand,
  },
  whCardActionBtnNeutral: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  whCardActionBtnText: {
    ...adminType.caption,
    fontWeight: '600',
  },
  whCardActionBtnTextPrimary: {
    color: adminColors.onBrand,
  },
  whCardActionBtnTextNeutral: {
    color: adminColors.ink,
  },
  emptyBox: {
    paddingVertical: adminSpacing.lg,
  },

  // Quick links
  quickNavRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  quickNavTile: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.smMd,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: adminSpacing.xxxl * 2,
  },
  quickNavSpacer: {
    flex: 1,
  },
  tileIconContainer: {
    marginBottom: adminSpacing.xsSm,
  },
  tileLabel: {
    ...adminType.rowMeta,
    fontWeight: '600',
    color: adminColors.ink,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: adminSpacing.xxxl,
  },

  // Filter modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalContent: {
    width: '85%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.md,
  },
  modalOptionText: {
    ...adminType.body,
    color: adminColors.ink,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: adminColors.brand,
  },
});
