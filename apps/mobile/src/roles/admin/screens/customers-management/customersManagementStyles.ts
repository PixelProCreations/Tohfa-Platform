/**
 * Styles of the Customers Management screen, from the design's `customerStyles`
 * (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen, "Customer Module
 * Stylesheet") on admin theme tokens only. Where the design used a numeric
 * fontSize (20, 15, 14, 13.5, 12.5, 12, 11.5, 11) the nearest adminType style is
 * used, as the Purchase Orders styles do; its raw sizes (36, 46, 10, 75 ...) are
 * built from the spacing scale.
 */
import { StyleSheet } from 'react-native';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

/** Round header button (the design's 36). */
export const HEADER_BUTTON = adminSpacing.xxl + adminSpacing.xs;
/** Search box height (the design's 46). */
const SEARCH_HEIGHT = adminSpacing.largeSection + adminSpacing.xsSm;
/** Progress track thickness (the design's 10). */
const TRACK_HEIGHT = adminSpacing.smMd;

export const customersManagementStyles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    backgroundColor: adminColors.brand,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    flexShrink: 1,
  },
  headerBackBtn: {
    paddingRight: adminSpacing.xs / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    flexShrink: 1,
  },
  circularHeaderBtn: {
    width: HEADER_BUTTON,
    height: HEADER_BUTTON,
    borderRadius: HEADER_BUTTON / 2,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.lg,
    height: SEARCH_HEIGHT,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.smMd,
  },
  searchInput: {
    ...adminType.body,
    flex: 1,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  metricsGrid: {
    marginBottom: adminSpacing.sm,
  },
  helperNote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.mdLg,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.xl - adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  chartCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  progressLabel: {
    ...adminType.rowTitle,
    width: adminSpacing.pageMargin,
    fontWeight: '600',
    color: adminColors.ink,
  },
  progressTrack: {
    flex: 1,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: adminColors.border,
    overflow: 'hidden',
  },
  progressValue: {
    ...adminType.sectionHead,
    width: adminSpacing.input,
    textAlign: 'right',
    color: adminColors.ink,
  },
  chartEmptyNote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.md,
  },
  recentCustomerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.smMd,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpacing.sm,
  },
  customerCardTitle: {
    ...adminType.sectionHead,
    flex: 1,
    color: adminColors.ink,
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs - 1,
    borderRadius: adminRadius.md,
  },
  badgePendingText: {
    ...adminType.caption,
    color: adminColors.warning.text,
  },
  badgeActive: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs - 1,
    borderRadius: adminRadius.md,
  },
  badgeActiveText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  customerCardSubtext: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.xsSm,
  },
  listState: {
    marginBottom: adminSpacing.smMd,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.lg + adminSpacing.xs / 2,
    paddingHorizontal: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.sm,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },

  // Period filter modal
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalCard: {
    width: '92%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  modalTitle: {
    ...adminType.title,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  filterSectionTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.smMd,
    marginBottom: adminSpacing.sm,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xsSm,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    ...adminType.rowTitle,
    fontWeight: '600',
    color: adminColors.ink,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: adminSpacing.smMd,
    marginTop: adminSpacing.lg,
  },
  modalResetBtn: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.smMd,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalResetBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  modalApplyBtn: {
    paddingHorizontal: adminSpacing.lg + adminSpacing.xs / 2,
    paddingVertical: adminSpacing.smMd,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
  },
  modalApplyBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});
