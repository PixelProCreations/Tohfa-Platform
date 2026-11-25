/**
 * Styles of the Purchase Orders screens, after the design branch's stylesheets
 * (origin/tofhafarmfin-rbac screens/dashboard/PurchaseOrdersScreen,
 * PurchaseHistoryScreen, PurchaseOrderDetailScreen, ConfirmPurchaseTermsScreen)
 * on admin theme tokens only. Where the design used a numeric fontSize
 * (16, 14, 13, 12, 11) the nearest adminType style is used; its raw sizes
 * (36, 40, 60, 90, 18 ...) are built from the spacing scale. The half steps
 * (6, 10, 14) are the exact values the design specifies.
 */
import { StyleSheet } from 'react-native';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import type { StatusTone } from './purchaseOrdersLogic';

/** Header icon button size (the design's 36). */
export const HEADER_BUTTON = adminSpacing.xxl + adminSpacing.xs;
/** Timeline badge (the design's 32). */
const TIMELINE_BADGE = adminSpacing.xxl;
/** Checkbox (the design's 20). */
const CHECKBOX = adminSpacing.input;

export const TONE_BG: Readonly<Record<StatusTone, string>> = {
  amber: adminColors.warning.bg,
  blue: adminColors.info.bg,
  green: adminColors.success.bg,
  muted: adminColors.border,
};

export const TONE_TEXT: Readonly<Record<StatusTone, string>> = {
  amber: adminColors.warning.text,
  blue: adminColors.info.text,
  green: adminColors.success.text,
  muted: adminColors.muted,
};

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },

  // Header (all four screens)
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRowWithSearch: { marginBottom: adminSpacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs, flexShrink: 1 },
  backBtn: { width: HEADER_BUTTON, height: HEADER_BUTTON, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...adminType.title, color: adminColors.onBrand, letterSpacing: -0.2 },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    marginTop: adminSpacing.xs,
    paddingLeft: adminSpacing.largeSection,
  },
  headerRightSpacer: { width: HEADER_BUTTON },
  filterBtn: {
    width: HEADER_BUTTON,
    height: HEADER_BUTTON,
    borderRadius: adminRadius.full,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchContainer: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xs },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.smMd,
    gap: adminSpacing.sm,
  },
  searchWrapInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  searchInput: { flex: 1, ...adminType.body, color: adminColors.ink, padding: 0 },

  // List
  scroll: { flex: 1 },
  listPad: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xxl },
  emptyContainer: { paddingVertical: adminSpacing.modalGap, alignItems: 'center' },
  emptyText: { ...adminType.body, color: adminColors.muted, textAlign: 'center' },
  orderCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderIdText: { ...adminType.rowTitle, color: adminColors.ink },
  orderIdTextHistory: { ...adminType.rowTitle, color: adminColors.brandDeep },
  statusBadge: { paddingHorizontal: adminSpacing.sm, paddingVertical: adminSpacing.xs, borderRadius: adminSpacing.xsSm },
  statusBadgeText: { ...adminType.caption },
  farmerProduceText: { ...adminType.body, color: adminColors.muted, marginTop: adminSpacing.xs },
  cardDivider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailRowSpacing: { marginTop: adminSpacing.xs },
  detailLabel: { ...adminType.body, color: adminColors.muted },
  detailValue: { ...adminType.body, fontWeight: '700', color: adminColors.ink },
  collectionDateText: { ...adminType.caption, color: adminColors.muted, marginTop: adminSpacing.sm },

  // Filter page
  filterScrollPad: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: adminSpacing.largeSection },
  filterCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.mdLg + adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: adminSpacing.xl,
  },
  filterSectionTitle: {
    ...adminType.caption,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  filterSectionSpacing: { marginTop: adminSpacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xsSm,
    borderRadius: adminRadius.xl,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChipActive: { backgroundColor: adminColors.warning.bg, borderColor: adminColors.warning.border },
  filterChipDisabled: { opacity: 0.5 },
  filterChipText: { ...adminType.caption, fontWeight: '600', color: adminColors.muted },
  filterChipTextActive: { color: adminColors.brandDeep, fontWeight: '700' },
  notAvailableNote: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xsSm },
  modalBtnRow: { flexDirection: 'row', gap: adminSpacing.md, marginTop: adminSpacing.xxl },
  modalResetBtn: {
    flex: 1,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.brandTint,
  },
  modalResetText: { ...adminType.rowTitle, color: adminColors.brandDeep },
  modalApplyBtn: {
    flex: 1,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brand,
  },
  modalApplyText: { ...adminType.rowTitle, color: adminColors.onBrand },

  // Detail
  detailScrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.pageMargin + adminSpacing.smMd,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCol: { width: '48%' },
  fieldLabel: { ...adminType.caption, color: adminColors.muted },
  fieldValue: { ...adminType.body, fontWeight: '700', color: adminColors.ink, marginTop: adminSpacing.xs },
  fieldRowSpacing: { marginTop: adminSpacing.md },
  chipToggleRow: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  chip: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: adminColors.brand },
  chipInactive: { backgroundColor: adminColors.card, borderWidth: 1, borderColor: adminColors.border },
  chipText: { ...adminType.body },
  chipTextActive: { color: adminColors.onBrand, fontWeight: '700' },
  chipTextInactive: { color: adminColors.ink, fontWeight: '600' },
  termHeading: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: adminSpacing.xsSm,
  },
  termBody: { ...adminType.body, fontWeight: '700', color: adminColors.ink },
  finalTermsCard: { backgroundColor: adminColors.card, borderWidth: 1.5, borderColor: adminColors.brand },
  timelineContainer: { paddingLeft: adminSpacing.xs, paddingTop: adminSpacing.xs, marginBottom: adminSpacing.xl },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', position: 'relative', minHeight: adminSpacing.xxxl + adminSpacing.xs },
  timelineIndicatorCol: { alignItems: 'center', width: TIMELINE_BADGE, position: 'relative' },
  timelineIconBadge: {
    width: TIMELINE_BADGE,
    height: TIMELINE_BADGE,
    borderRadius: TIMELINE_BADGE / 2,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    top: TIMELINE_BADGE,
    bottom: -adminSpacing.xsSm,
    width: 2,
    backgroundColor: adminColors.border,
    zIndex: 1,
  },
  timelineTextCol: { flex: 1, paddingLeft: adminSpacing.md, paddingTop: adminSpacing.xs, paddingBottom: adminSpacing.md },
  timelineTitle: { ...adminType.body, fontWeight: '700', color: adminColors.ink },
  timelineTime: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs / 2 },
  outlineActionBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.mdLg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
    backgroundColor: adminColors.card,
  },
  outlineActionBtnDisabled: { opacity: 0.5 },
  outlineActionBtnText: { ...adminType.body, fontWeight: '700', color: adminColors.brandDeep },
  outlineActionNote: { ...adminType.rowMeta, color: adminColors.muted, textAlign: 'center', marginTop: adminSpacing.xsSm, marginBottom: adminSpacing.lg },
  bottomSpacer: { height: adminSpacing.largeSection },

  // Confirm purchase terms
  confirmScrollPad: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: adminSpacing.xl },
  confirmCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between', gap: adminSpacing.md },
  col: { flex: 1 },
  confirmFieldLabel: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.xs },
  confirmFieldValue: { ...adminType.rowTitle, color: adminColors.ink },
  calcCard: { alignItems: 'center', paddingVertical: adminSpacing.lg },
  calcSubline: { ...adminType.body, color: adminColors.muted, marginBottom: adminSpacing.xs },
  calcTotal: { ...adminType.rowTitle, color: adminColors.ink },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: adminSpacing.xl,
    gap: adminSpacing.md,
    paddingHorizontal: adminSpacing.xs,
  },
  checkboxBox: {
    width: CHECKBOX,
    height: CHECKBOX,
    borderRadius: adminRadius.xs,
    borderWidth: 1.8,
    borderColor: adminColors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    backgroundColor: adminColors.card,
  },
  checkboxBoxChecked: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  checkboxLabel: { flex: 1, ...adminType.body, color: adminColors.ink },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  confirmBtn: {
    borderRadius: adminRadius.lg,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brandTint,
  },
  confirmBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
  confirmNote: { ...adminType.rowMeta, color: adminColors.muted, textAlign: 'center', marginTop: adminSpacing.xsSm },
  confirmBottomSpacer: { height: adminSpacing.pageMargin + adminSpacing.lg + adminSpacing.xs },
});
