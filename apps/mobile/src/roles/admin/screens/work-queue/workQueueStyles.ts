/**
 * Styles for the Work Queue tab and its filter sheet, ported from the design
 * (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen: subScreenHeader*,
 * workQueue*, bottomSheet*, filter*, modal* styles) with every literal on a
 * token. Where the design overrides a size with a number that has no token,
 * the nearest token is used:
 *   - card title 14 bold      -> sectionHead (13, 800)
 *   - badge text 11 bold      -> caption (10, 700)
 *   - detail 12, action 13.5, select / dropdown / button text 13-14 -> body (13)
 *   - header title 18, sheet title 17 -> title (19, 800)
 *   - filter label 14 bold    -> sectionHead
 *   - helper 10 / 14          -> caption at regular weight
 *   - 2-3pt paddings / margins -> half the `xs` step; 4 -> xs; 6 -> xs;
 *     10 -> sm; 12 -> md
 *   - back button 36 square   -> xxl + xs (32 + 4)
 *   - sheet top radius 24     -> adminRadius.xl (16, the "sheets" radius)
 *   - sheet scroll maxHeight 460 -> the sheet itself is capped at 85% of the
 *     screen and the list scrolls inside it
 *   - action border 1.2       -> 1
 */
import { StyleSheet } from 'react-native';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

const HALF = adminSpacing.xs / 2;
const BACK_BUTTON = adminSpacing.xxl + adminSpacing.xs;

export const workQueueStyles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: adminColors.canvas },
  scrollContent: { paddingBottom: adminSpacing.xxxl },

  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xs,
    paddingBottom: adminSpacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    flex: 1,
    marginLeft: adminSpacing.sm,
  },
  backButton: {
    width: BACK_BUTTON,
    height: BACK_BUTTON,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: BACK_BUTTON },

  searchContainer: { paddingHorizontal: adminSpacing.md, marginTop: adminSpacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    marginLeft: adminSpacing.sm,
    paddingVertical: HALF,
  },
  filterTrigger: { padding: adminSpacing.xs },
  countText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
    paddingHorizontal: adminSpacing.xs,
  },

  taskList: { paddingHorizontal: adminSpacing.md, marginTop: adminSpacing.xs },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  cardTitle: { ...adminType.sectionHead, color: adminColors.ink, flex: 1, marginRight: adminSpacing.sm },
  badge: { paddingHorizontal: adminSpacing.sm, paddingVertical: HALF, borderRadius: adminRadius.sm },
  badgeDanger: { backgroundColor: adminColors.danger.bg },
  badgeWarning: { backgroundColor: adminColors.warning.bg },
  badgeSuccess: { backgroundColor: adminColors.success.bg },
  badgeText: { ...adminType.caption },
  badgeTextDanger: { color: adminColors.danger.text },
  badgeTextWarning: { color: adminColors.warning.text },
  badgeTextSuccess: { color: adminColors.success.text },
  personName: { ...adminType.body, fontWeight: '700', color: adminColors.ink, marginBottom: HALF },
  taskCode: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  taskDetail: { ...adminType.body, color: adminColors.muted, marginBottom: HALF },
  taskCreated: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.md },
  actionButton: {
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  actionButtonDisabled: { opacity: 0.5 },
  actionText: { ...adminType.body, fontWeight: '700', color: adminColors.brand },
  loadMore: { alignItems: 'center', paddingVertical: adminSpacing.md },
  loadMoreText: { ...adminType.body, fontWeight: '700', color: adminColors.brand },
  bottomGap: { height: adminSpacing.xxl },

  sheetBackdrop: { flex: 1, backgroundColor: adminOverlay.scrim, justifyContent: 'flex-end' },
  sheetDismissArea: { flex: 1 },
  sheetContainer: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    maxHeight: '85%',
    ...adminShadow.lg,
  },
  sheetTitle: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.md },
  sheetScroll: { flexShrink: 1 },
  fieldGroup: { marginBottom: adminSpacing.sm },
  fieldLabel: { ...adminType.sectionHead, color: adminColors.ink, marginTop: adminSpacing.xs, marginBottom: adminSpacing.xs },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  selectBoxDisabled: { opacity: 0.5 },
  selectValue: { ...adminType.body, color: adminColors.ink, fontWeight: '600' },
  helperText: { ...adminType.caption, fontWeight: '400', color: adminColors.muted, marginTop: adminSpacing.xs },
  dropdownList: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: adminSpacing.xs,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  dropdownItem: { paddingHorizontal: adminSpacing.md, paddingVertical: adminSpacing.sm },
  dropdownItemSelected: { backgroundColor: adminColors.brandTint },
  dropdownItemText: { ...adminType.body, color: adminColors.ink },
  dropdownItemTextSelected: { color: adminColors.brand, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: adminSpacing.lg },
  applyButton: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.full,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    marginRight: adminSpacing.xs,
  },
  applyText: { ...adminType.body, color: adminColors.onBrand, fontWeight: '700' },
  resetButton: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.brand,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    marginHorizontal: adminSpacing.xs,
  },
  resetText: { ...adminType.body, color: adminColors.brand, fontWeight: '700' },
  cancelButton: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    marginLeft: adminSpacing.xs,
  },
  cancelText: { ...adminType.body, color: adminColors.muted, fontWeight: '600' },
});
