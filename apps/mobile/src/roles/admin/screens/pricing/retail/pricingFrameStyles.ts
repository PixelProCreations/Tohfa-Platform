/**
 * Styles shared by the three Market & Pricing 2B screens (retail, categories,
 * markup): the orange header banner, the scroll body, the search bar, cards,
 * badges and the bottom-sheet filter, after the team design's stylesheets on
 * admin theme tokens only. Where the design used a numeric font size or a raw
 * spacing number, the nearest adminType style / adminSpacing step is used
 * (e.g. header 20/800 -> adminType.title, badge 11/700 -> adminType.caption,
 * paddingVertical 10 -> adminSpacing.smMd, sheet corner 24 -> adminRadius.xl).
 */
import { StyleSheet } from 'react-native';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';

/** The round header filter button (36, as in the design), from the spacing scale. */
const HEADER_BUTTON = adminSpacing.xxl + adminSpacing.xs;

export const frameStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },

  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: adminSpacing.xs, marginRight: adminSpacing.sm },
  headerTextCol: { flex: 1 },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  headerSubtitle: { ...adminType.rowMeta, color: adminOverlay.headerText, marginTop: adminSpacing.xs / 2 },
  headerFilterBtn: {
    width: HEADER_BUTTON,
    height: HEADER_BUTTON,
    borderRadius: adminRadius.full,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollPad: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: adminSpacing.xxxl },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.smMd,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  searchFilterBtn: { padding: adminSpacing.xs },

  recordCountText: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.sm },

  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.xs },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink, flexShrink: 1 },
  cardSubtitle1: { ...adminType.body, color: adminColors.muted, marginTop: adminSpacing.xs / 2 },
  cardSubtitle2: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs / 2 },

  badge: { paddingHorizontal: adminSpacing.smMd, paddingVertical: adminSpacing.xs / 2, borderRadius: adminRadius.full },
  badgeText: { ...adminType.caption },

  sectionHeading: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.sm },

  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.xsSm },

  linkText: { ...adminType.rowTitle, color: adminColors.brandDeep },
  loadMore: { alignSelf: 'center', paddingVertical: adminSpacing.md },

  // Bottom sheet (filters, grade details)
  modalOverlay: { flex: 1, backgroundColor: adminOverlay.scrim, justifyContent: 'flex-end' },
  sheetContainer: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  sheetHeading: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.md },
  filterFieldLabel: { ...adminType.rowTitle, color: adminColors.ink, marginTop: adminSpacing.smMd, marginBottom: adminSpacing.xsSm },
  dropdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  dropdownSelectedText: { ...adminType.body, color: adminColors.ink },
  dropdownMenu: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    marginTop: adminSpacing.xs,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  dropdownOption: { paddingHorizontal: adminSpacing.md, paddingVertical: adminSpacing.smMd, backgroundColor: adminColors.card },
  dropdownOptionSelected: { backgroundColor: adminColors.muted },
  dropdownOptionText: { ...adminType.body, color: adminColors.ink },
  dropdownOptionTextSelected: { color: adminColors.onBrand, fontWeight: '700' },
  sheetActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: adminSpacing.xl,
    gap: adminSpacing.md,
  },
  pillBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    backgroundColor: adminColors.card,
  },
  pillBtnBrandText: { ...adminType.rowTitle, color: adminColors.brandDeep },
  pillBtnInkText: { ...adminType.rowTitle, color: adminColors.ink },
});
