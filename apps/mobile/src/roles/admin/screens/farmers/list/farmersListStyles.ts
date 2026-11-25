/**
 * Styles of the farmers list, after the team design's stylesheet
 * (origin/tofhafarmfin-rbac AdminAllFarmersScreen.tsx) on admin theme tokens
 * only. Where the design used a raw colour or a numeric font size, the
 * nearest token / adminType style is used instead (design colour -> token):
 *   #EDE5DB tab track -> dashboard.track, #6E6258 tab text -> muted,
 *   #FEEAE3 avatar -> brandTint, #16A34A / #D97706 status -> success / warning,
 *   rgba white header text / filter pill / modal scrim -> adminOverlay.
 */
import { StyleSheet } from 'react-native';
import type { ListTone } from './farmersListLogic';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';

/** Header icon button and card avatar sizes, built from the spacing scale. */
const HEADER_BUTTON = adminSpacing.xxl + adminSpacing.xs;
const AVATAR = adminSpacing.xxl + adminSpacing.md;

export const TONE_TEXT: Readonly<Record<ListTone, string>> = {
  success: adminColors.success.text,
  warning: adminColors.warning.text,
  danger: adminColors.danger.text,
  info: adminColors.info.text,
  muted: adminColors.muted,
};

export const TONE_BG: Readonly<Record<ListTone, string>> = {
  success: adminColors.success.bg,
  warning: adminColors.warning.bg,
  danger: adminColors.danger.bg,
  info: adminColors.info.bg,
  muted: adminColors.dashboard.track,
};

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header banner
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: adminSpacing.xs,
    marginRight: adminSpacing.xs,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitleTextCol: {
    marginLeft: adminSpacing.md,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.body,
    color: adminOverlay.headerText,
  },
  headerFilterBtn: {
    width: HEADER_BUTTON,
    height: HEADER_BUTTON,
    borderRadius: adminRadius.sm,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll body
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl,
  },
  kpiGrid: {
    marginBottom: adminSpacing.md,
  },

  // Farmers | Applications toggle
  tabToggleContainer: {
    flexDirection: 'row',
    backgroundColor: adminColors.dashboard.track,
    borderRadius: adminRadius.md,
    padding: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  tabToggleButton: {
    flex: 1,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
  },
  tabToggleButtonActive: {
    backgroundColor: adminColors.brand,
    ...adminShadow.sm,
  },
  tabToggleText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  tabToggleTextActive: {
    color: adminColors.onBrand,
  },

  // Search
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },

  // Lists
  countText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  cardsList: {
    gap: adminSpacing.md,
  },
  loadMore: {
    alignSelf: 'center',
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.sm,
  },
  loadMoreText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },

  // Farmer card
  farmerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatarCircle: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  cardIdentityCol: {
    flex: 1,
  },
  cardFarmerName: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  cardFarmerCodeZone: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: adminSpacing.xs / 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  cardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStatCol: {
    flex: 1,
  },
  cardStatLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs / 2,
  },
  cardStatValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },

  // Application card
  applicationCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  cardName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flexShrink: 1,
    marginRight: adminSpacing.sm,
  },
  cardSubText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs / 2,
  },
  cardDetailText: {
    ...adminType.rowMeta,
    color: adminColors.ink,
  },
  statusBadge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs / 2,
    borderRadius: adminRadius.full,
  },
  statusBadgeText: {
    ...adminType.caption,
  },

  // Bottom navigation
  bottomNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    ...adminShadow.md,
  },
  navTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.xs,
    paddingHorizontal: adminSpacing.md,
  },
  navTabLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  navTabLabelActive: {
    color: adminColors.brand,
  },

  // Filter modal
  filterModalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  filterModalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    ...adminShadow.lg,
  },
  filterModalTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  filterSectionLabel: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
  },
  filterModalCloseBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.lg,
  },
  filterModalCloseBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
});
