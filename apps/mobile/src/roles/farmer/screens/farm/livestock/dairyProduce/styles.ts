import { StyleSheet } from 'react-native';
import { authPalette as P, colors, typography } from '../../../../theme';

// ─────────────────────────────────────────────
// Styles (shared by the screen and its three form sub-components)
// ─────────────────────────────────────────────

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.grey50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    marginTop: 4,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.twGray900,
  },
  headerSubtitle: {
    fontSize: typography.body,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 2,
  },

  /* 3 Summary Cards Row */
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 12,
    alignItems: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryNumber: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.twGray900,
  },
  summaryLabel: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
    textAlign: 'center',
  },

  /* Action Dropdown */
  logDropdownContainer: {
    marginBottom: 24,
  },
  logDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.brandGreen,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logDropdownBtnActive: {
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  logDropdownBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logDropdownIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logDropdownBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },
  logDropdownMenu: {
    backgroundColor: P.white,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderTopWidth: 0,
    paddingVertical: 8,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownCategoryHeader: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray400,
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  logDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionCategoryTag: {
    fontSize: typography.caption,
    color: P.twGray500,
    backgroundColor: P.twGray100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  logOptionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logOptionTextBox: {
    flex: 1,
  },
  logOptionTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
  },
  logOptionSub: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  logDropdownDivider: {
    height: 1,
    backgroundColor: P.twGray100,
    marginHorizontal: 16,
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.5,
  },
  historyLinkText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.brandGreen,
  },

  /* Lists & Cards */
  listContainer: {
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    gap: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  itemIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextCol: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  itemSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 2,
  },
  itemRightCol: {
    alignItems: 'flex-end',
  },
  itemStatBig: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  itemStatSub: {
    fontSize: typography.caption,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 2,
  },

  /* Info Callout */
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.twBlue50,
    borderWidth: 1,
    borderColor: P.blue100,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginTop: 20,
  },
  infoIconCol: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: P.twBlue800,
    lineHeight: 18,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: P.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.twGray900,
  },
  modalSub: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray500,
  },

  /* Form Elements in Modals */
  inputLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: typography.body,
    color: P.twGray900,
    backgroundColor: P.twGray50,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: P.twGray50,
  },
  dropdownSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  miniBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownSelectedText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  dropdownSelectedSub: {
    fontSize: typography.caption,
    color: P.twGray500,
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  dropdownMenuItemActive: {
    backgroundColor: colors.brandGreenLight,
  },
  menuItemTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  menuItemSub: {
    fontSize: typography.caption,
    color: P.twGray500,
    marginTop: 1,
  },

  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray600,
  },
  modalSaveBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },

  /* Save error banner (inside the log modal) */
  saveErrorBanner: {
    backgroundColor: P.twRed50,
    borderWidth: 1,
    borderColor: P.twRed200,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  fieldErrorText: {
    fontSize: typography.bodySmall,
    color: P.twRed700,
    marginTop: 4,
  },
  saveErrorBannerText: {
    fontSize: typography.bodySmall,
    color: P.twRed700,
    lineHeight: 18,
  },

  /* History Filter Tabs */
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterTabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: P.twGray100,
  },
  filterTabBtnActive: {
    backgroundColor: colors.brandGreen,
  },
  filterTabBtnText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.twGray600,
  },
  filterTabBtnTextActive: {
    color: P.white,
  },

  /* History Cards */
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    gap: 12,
  },
  historyTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  historySub: {
    fontSize: typography.caption,
    color: P.twGray500,
    marginTop: 1,
  },
  historyValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
  },

  /* Layout helpers (replace former inline styles) */
  loadingBody: {
    padding: 16,
    gap: 12,
  },
  errorBody: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  chevronFlipped: {
    transform: [{ rotate: '180deg' }],
  },
  modalForm: {
    maxHeight: 440,
  },
  flexFill: {
    flex: 1,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionHeaderRowSpaced: {
    marginTop: 24,
  },
  inputLabelSpaced: {
    marginTop: 14,
  },
  notesInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  menuItemTitleActive: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
  menuItemTitleActiveEgg: {
    color: P.brownDeep2,
    fontWeight: '700',
  },
  summaryIconBoxMilk: {
    backgroundColor: colors.brandGreenLight,
  },
  summaryIconBoxDairy: {
    backgroundColor: P.twOrange100,
  },
  summaryIconBoxEggs: {
    backgroundColor: P.twAmber100,
  },
  itemIconBadgeMilk: {
    backgroundColor: colors.brandGreenLight,
  },
  itemIconBadgeEggs: {
    backgroundColor: P.twAmber100,
  },
  miniBadgeMilk: {
    backgroundColor: colors.brandGreenLight,
  },
  miniBadgeEggs: {
    backgroundColor: P.twAmber100,
  },
  modalCardHistory: {
    maxHeight: '82%',
  },
  modalSaveBtnPrimary: {
    backgroundColor: colors.brandGreen,
  },
  modalSaveBtnHistoryClose: {
    marginTop: 16,
  },
  modalSaveBtnDisabled: {
    opacity: 0.6,
  },
});
