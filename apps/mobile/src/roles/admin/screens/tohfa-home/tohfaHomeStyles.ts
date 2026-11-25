/**
 * Styles for the Tohfa Admin Home tab, ported from the design's `styles`
 * (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen) with every literal
 * moved onto a token:
 *   - 6 / 10 / 14 are the approved half steps xsSm / smMd / mdLg;
 *   - 2-pixel gaps are half of xs; the badge's 5 vertical padding is xs;
 *   - sizes with no single token are sums of steps (36 = xl + md,
 *     42 = xxl + smMd, 46 = xxl + mdLg, 104 = 2 x xxxl + sm);
 *   - font sizes the admin type styles lack come from the platform type
 *     styles: 12 -> small, 11 -> caption, 14 -> body; the greeting's 17 has no
 *     token and uses h3 (18);
 *   - the quick-action tile's cool greys (#E5E7EB border, #111827 label) are
 *     the admin border / ink tokens; the toggle's #4B5563 is neutral700.
 * The search bar, date chip and modal, refresh button and notification dot
 * follow the design too: 32 = xxl, the dot's 5 inset is xs and 8 size is sm,
 * the chip's 14 / 7 / 6 are mdLg / xsSm / xsSm (7 has no token), and its 13
 * label is the admin body size. Styles for the fixture attention / warehouse /
 * activity cards are not ported: those lists are empty states here.
 */
import { StyleSheet } from 'react-native';
import { tokens } from '@tohfa/design-tokens';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

const half = adminSpacing.xs / 2;
const small = { fontSize: tokens.typeStyle.small.size, lineHeight: tokens.typeStyle.small.lineHeight };

export const tohfaHomeStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  scroll: { flex: 1, backgroundColor: adminColors.canvas },
  scrollContent: { paddingBottom: adminSpacing.xxl },
  bottomSpacer: { height: adminSpacing.xxxl },

  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xsSm,
    paddingBottom: adminSpacing.lg,
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.sm },
  headerLeftCol: { flex: 1, justifyContent: 'center' },
  headerBrandTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: adminSpacing.xs },
  headerBrandText: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginLeft: adminSpacing.sm,
  },
  headerDateText: { ...adminType.rowMeta, ...small, color: adminColors.onBrand, opacity: 0.9, fontWeight: '500' },
  headerIconsRow: { flexDirection: 'row', alignItems: 'center' },
  notificationDot: {
    position: 'absolute',
    top: adminSpacing.xs,
    right: adminSpacing.xs,
    width: adminSpacing.sm,
    height: adminSpacing.sm,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.danger.text,
  },
  headerIconButton: {
    width: adminSpacing.xl + adminSpacing.md,
    height: adminSpacing.xl + adminSpacing.md,
    borderRadius: adminRadius.full,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: adminSpacing.sm,
  },

  greetingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  greetingTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: half },
  greetingTitle: {
    ...adminType.title,
    fontSize: tokens.typeStyle.h3.size,
    lineHeight: tokens.typeStyle.h3.lineHeight,
    color: adminColors.ink,
    fontWeight: '800',
    flex: 1,
    marginRight: adminSpacing.sm,
  },
  roleBadgePill: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    flexShrink: 0,
    alignSelf: 'center',
  },
  roleBadgeText: {
    ...adminType.caption,
    fontSize: tokens.typeStyle.caption.size,
    lineHeight: tokens.typeStyle.caption.lineHeight,
    color: adminColors.onBrand,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  greetingSubTitle: { ...adminType.body, color: adminColors.muted, marginBottom: half },
  greetingDateStamp: { ...adminType.rowMeta, ...small, color: adminColors.muted, marginBottom: adminSpacing.md },
  greetingBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: half },
  lastUpdatedText: { ...adminType.rowMeta, ...small, color: adminColors.muted },
  refreshButton: {
    width: adminSpacing.xxl,
    height: adminSpacing.xxl,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchContainer: { marginTop: adminSpacing.lg, marginHorizontal: adminSpacing.lg, gap: adminSpacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: adminSpacing.xxl + adminSpacing.mdLg,
    gap: adminSpacing.sm,
  },
  searchInput: { flex: 1, ...adminType.body, color: adminColors.ink, paddingVertical: 0 },
  dateFilterContainer: { alignItems: 'flex-end' },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: adminSpacing.mdLg,
    paddingVertical: adminSpacing.xsSm,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.xsSm,
  },
  dateFilterText: {
    ...adminType.caption,
    fontSize: adminType.body.fontSize,
    lineHeight: adminType.body.lineHeight,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  datePickerModalContent: {
    width: '85%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalSheetTitle: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.md, textAlign: 'center' },
  datePickerOption: {
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.md,
    marginBottom: adminSpacing.xs,
  },
  datePickerOptionSelected: { backgroundColor: adminColors.brandTint },
  datePickerOptionText: { ...adminType.body, color: adminColors.ink, textAlign: 'center' },
  datePickerOptionTextSelected: { color: adminColors.brand, fontWeight: '700' },

  sectionContainer: { marginTop: adminSpacing.lg, marginHorizontal: adminSpacing.lg },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.md },
  sectionHeading: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.md },
  sectionOpenLink: { ...adminType.caption, color: adminColors.brand, fontWeight: '700' },

  toggleMetricsButton: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.brand,
    height: adminSpacing.xxl + adminSpacing.smMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.md,
  },
  toggleMetricsText: { ...adminType.rowTitle, color: adminColors.brand },

  emptyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  emptyText: { ...adminType.body, color: adminColors.muted },

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: adminSpacing.smMd,
    rowGap: adminSpacing.smMd,
    justifyContent: 'flex-start',
  },
  quickActionTile: {
    width: '31%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.mdLg,
    paddingHorizontal: adminSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: adminSpacing.xxxl * 2 + adminSpacing.sm,
    ...adminShadow.sm,
  },
  quickActionIconBox: { marginBottom: adminSpacing.sm, alignItems: 'center', justifyContent: 'center' },
  quickActionTileLabel: { ...small, color: adminColors.ink, textAlign: 'center', fontWeight: '700' },
  toggleActionsButton: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: adminSpacing.xxl + adminSpacing.mdLg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.mdLg,
  },
  toggleActionsText: {
    fontSize: tokens.typeStyle.body.size,
    lineHeight: tokens.typeStyle.body.lineHeight,
    fontWeight: '700',
    color: adminColors.platform.neutral700,
  },

  summaryListCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  summaryListCardSpaced: { marginTop: adminSpacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: adminSpacing.md },
  summaryRowLabel: { ...adminType.body, color: adminColors.muted },
  summaryRowValue: { ...adminType.rowTitle, color: adminColors.ink },
  summaryOrderValueBig: { ...adminType.title, color: adminColors.ink, letterSpacing: -0.5 },
  summaryDivider: { height: 1, backgroundColor: adminColors.border },
  salesSubNote: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.sm, paddingHorizontal: half },
});
