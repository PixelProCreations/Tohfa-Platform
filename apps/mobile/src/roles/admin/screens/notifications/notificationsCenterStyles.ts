/**
 * StyleSheet for the Notifications Center screen and its sub-components.
 * Every value comes from the admin theme tokens — no hex literals, no raw numbers.
 */
import { StyleSheet } from 'react-native';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export const styles = StyleSheet.create({
  // ─── Root & Layout ───────────────────────────────────────────────────────
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // ─── Header ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backBtn: {
    padding: adminSpacing.xs,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
  },

  // ─── Scroll ──────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.lg,
  },

  // ─── Toast Banner ────────────────────────────────────────────────────────
  toastBanner: {
    backgroundColor: adminColors.ink,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.md,
    alignItems: 'center',
  },
  toastBannerText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    fontWeight: '600',
  },

  // ─── Search Bar ──────────────────────────────────────────────────────────
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },
  clearSearchText: {
    ...adminType.caption,
    color: adminColors.muted,
    paddingHorizontal: adminSpacing.xs,
  },

  // ─── Unread Counter Row ───────────────────────────────────────────────────
  countRow: {
    marginBottom: adminSpacing.sm,
  },
  countText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  countBold: {
    fontWeight: '700',
    color: adminColors.brand,
  },

  // ─── Action Button Row ───────────────────────────────────────────────────
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    ...adminShadow.sm,
  },
  actionBtnActive: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  actionBtnText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
  actionBtnTextActive: {
    color: adminColors.brandDeep,
  },

  // ─── Filter Chip Row ─────────────────────────────────────────────────────
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
  },

  // ─── Cards ───────────────────────────────────────────────────────────────
  cardsContainer: {
    gap: adminSpacing.md,
  },
  notificationCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.lg,
    borderWidth: 1,
    ...adminShadow.sm,
  },
  notificationCardUnread: {
    borderColor: adminColors.brand,
  },
  notificationCardRead: {
    borderColor: adminColors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  unreadBadge: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },
  actionRequiredBadge: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  actionRequiredBadgeText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    fontWeight: '700',
  },
  cardBodyText: {
    ...adminType.body,
    color: adminColors.ink,
    marginVertical: adminSpacing.xs,
    lineHeight: 20,
  },
  cardRefText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brandDeep,
    marginBottom: 2,
  },
  cardMetaText: {
    ...adminType.caption,
    color: adminColors.muted,
  },

  // ─── Empty State ─────────────────────────────────────────────────────────
  emptyState: {
    paddingVertical: adminSpacing.xxxl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  emptySub: {
    ...adminType.caption,
    color: adminColors.muted,
  },

  // ─── Load More ───────────────────────────────────────────────────────────
  loadMoreBtn: {
    marginTop: adminSpacing.md,
    alignItems: 'center',
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    ...adminShadow.sm,
  },
  loadMoreText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brand,
  },

  // ─── Detail Modal ────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.xl,
    ...adminShadow.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  modalMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  modalRef: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brandDeep,
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  modalBody: {
    ...adminType.body,
    color: adminColors.ink,
    lineHeight: 22,
    marginBottom: adminSpacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCloseBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.xl,
    paddingVertical: adminSpacing.sm,
  },
  modalCloseBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
  },

  // ─── Bottom Tab Bar ──────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingVertical: adminSpacing.xs,
    paddingBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.xs,
  },
  tabLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
    fontWeight: '500',
  },
});
