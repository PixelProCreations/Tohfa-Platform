/**
 * Styles for the System Settings & Audit Log flow, ported from the design
 * (origin/Superadmin-main SystemSettingsFlow.tsx `styles`) with every literal
 * on a token. Where the design overrides a size with a number that has no
 * token, the nearest token is used:
 *   - header title 18/700        -> title (19) at 700
 *   - card / row titles 14-15    -> body (13) at 700
 *   - subtitles / help / meta 12 -> rowTitle (12.5) at 400
 *   - timestamp / pill text 11   -> rowMeta (10.5) / caption (10, 700)
 *   - input / option text 14     -> body (13)
 *   - section heading 15/700     -> sectionHead (13/800)
 *   - dropdown title 16          -> title (19) at 700
 *   - icon boxes 42-44           -> xxl + md (44); inputs / buttons 46-50 -> ADMIN_BUTTON_HEIGHT (48)
 *   - checkbox 18-20             -> lg + xs (20); bullet dot 6 -> xs + xs/2
 *   - 1-2pt / 6pt gaps           -> xs/2 / xs + xs/2; text area 100 -> xxxl x 2 (96)
 *   - modal backdrop (40% black) -> adminOverlay.scrim
 *   - Test Connection hex border / text -> adminColors.border / ink
 *   - status pill hex tints      -> success / danger pairs
 */
import { StyleSheet } from 'react-native';
import {
  ADMIN_BUTTON_HEIGHT,
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../../theme';

const HALF = adminSpacing.xs / 2;
const SIX = adminSpacing.xs + HALF;
const ICON_BOX = adminSpacing.xxl + adminSpacing.md;
const CHECKBOX = adminSpacing.lg + adminSpacing.xs;
const TEXT_AREA = adminSpacing.xxxl * 2;
const BULLET_KEY = adminSpacing.xxxl + adminSpacing.xxl;

const card = {
  backgroundColor: adminColors.card,
  borderRadius: adminRadius.xl,
  borderWidth: 1,
  borderColor: adminColors.border,
  ...adminShadow.sm,
} as const;

const inputBox = {
  height: ADMIN_BUTTON_HEIGHT,
  borderRadius: adminRadius.md,
  borderWidth: 1,
  borderColor: adminColors.border,
  backgroundColor: adminColors.card,
  paddingHorizontal: adminSpacing.md,
} as const;

const meta = { ...adminType.rowTitle, fontWeight: '400', color: adminColors.muted } as const;

export const ssStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    ...adminShadow.sm,
  },
  headerBackBtn: { padding: adminSpacing.xs, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { ...adminType.title, fontWeight: '700', color: adminColors.onBrand, flex: 1, textAlign: 'left' },
  headerAction: { padding: adminSpacing.xs },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },
  sectionHeaderTitle: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.md },
  sectionGap: { marginTop: adminSpacing.xl },
  disabled: { opacity: 0.5 },

  // Hub cards
  hubCard: { ...card, padding: adminSpacing.md, marginBottom: adminSpacing.md, flexDirection: 'row', alignItems: 'center' },
  hubIconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  hubTextBox: { flex: 1, paddingRight: adminSpacing.xs },
  hubCardTitle: { ...adminType.body, fontWeight: '700', color: adminColors.ink },
  hubCardSubtitle: { ...meta, marginTop: HALF },

  // Form fields
  formGroup: { ...card, padding: adminSpacing.lg },
  fieldLabel: { ...adminType.body, fontWeight: '600', color: adminColors.ink, marginBottom: adminSpacing.xs },
  fieldLabelGap: { marginTop: adminSpacing.md },
  textInputBox: { ...inputBox, ...adminType.body, color: adminColors.ink },
  selectInput: { ...inputBox, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectInputLead: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, flex: 1 },
  selectInputText: { ...adminType.body, color: adminColors.ink },
  placeholderText: { color: adminColors.placeholder },
  inputWithLeadingIcon: { ...inputBox, flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  inputRow: { flexDirection: 'row', gap: adminSpacing.sm, alignItems: 'center' },
  flex1: { flex: 1 },
  textInputInner: { flex: 1, height: ADMIN_BUTTON_HEIGHT, ...adminType.body, color: adminColors.ink },
  suffixText: { ...adminType.body, fontWeight: '600', color: adminColors.muted },
  fieldHelpRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs, marginTop: SIX },
  fieldHelpText: { ...meta, flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: adminSpacing.md,
    marginTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  switchRowPlain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchTextBox: { flex: 1, paddingRight: adminSpacing.sm },
  switchLabel: { ...adminType.body, fontWeight: '600', color: adminColors.ink },
  switchSubLabel: { ...meta, marginTop: HALF },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md },

  // Checkboxes
  checkboxGrid: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xl, marginTop: adminSpacing.xs },
  checkboxItem: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  checkboxItemPadded: { paddingVertical: SIX },
  checkboxBox: {
    width: CHECKBOX,
    height: CHECKBOX,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: { borderColor: adminColors.brand, backgroundColor: adminColors.brand },
  checkboxLabel: { ...adminType.body, color: adminColors.ink },

  // Role access notice
  roleAccessBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  roleAccessText: { ...adminType.rowTitle, fontWeight: '500', color: adminColors.ink, flex: 1 },

  // Dual buttons
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md, marginTop: adminSpacing.xl },
  resetButton: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: { ...adminType.body, fontWeight: '600', color: adminColors.ink },
  saveButton: {
    flex: 2,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonSolo: { flex: 0, marginTop: adminSpacing.xl },
  saveButtonText: { ...adminType.body, fontWeight: '700', color: adminColors.onBrand },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },

  // Audit log list
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.md },
  filterBarTitle: { ...adminType.sectionHead, color: adminColors.brandDeep },
  clearAllText: { ...adminType.body, fontWeight: '600', color: adminColors.brand },
  logCard: { ...card, padding: adminSpacing.md, marginBottom: adminSpacing.md, flexDirection: 'row', alignItems: 'center' },
  logIconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  logBody: { flex: 1 },
  logTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: adminSpacing.sm },
  logTitle: { ...adminType.body, fontWeight: '700', color: adminColors.ink, flexShrink: 1 },
  logTimestamp: { ...adminType.rowMeta, color: adminColors.muted },
  logSubtitle: { ...meta, marginTop: HALF },
  moreDotsBtn: { padding: adminSpacing.xs, marginLeft: adminSpacing.sm },
  loadMore: { alignItems: 'center', paddingVertical: adminSpacing.md },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  menuPopupCard: {
    width: '85%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.sm,
    ...adminShadow.md,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  menuItemText: { ...adminType.body, fontWeight: '500', color: adminColors.ink },
  menuItemDanger: { color: adminColors.danger.text },
  menuDivider: { height: 1, backgroundColor: adminColors.border, marginHorizontal: adminSpacing.md },
  dropdownModalCard: {
    width: '85%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.md,
  },
  dropdownModalTitle: { ...adminType.title, fontWeight: '700', color: adminColors.ink, marginBottom: adminSpacing.md },
  dropdownOptionRow: {
    paddingVertical: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownOptionRowActive: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: adminSpacing.sm,
    borderRadius: adminRadius.sm,
  },
  dropdownOptionText: { ...adminType.body, color: adminColors.ink },
  dropdownOptionTextActive: { color: adminColors.brand, fontWeight: '700' },

  // Detail cards
  detailCard: { ...card, padding: adminSpacing.lg },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
    gap: adminSpacing.sm,
  },
  detailLabel: { ...adminType.body, color: adminColors.muted },
  detailValue: { ...adminType.body, fontWeight: '500', color: adminColors.ink, flexShrink: 1, textAlign: 'right' },
  detailValueStrong: { fontWeight: '700' },
  detailValueCopy: { flexDirection: 'row', alignItems: 'center', gap: SIX, flexShrink: 1 },
  detailDivider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.xs },
  changeSubhead: { ...adminType.body, fontWeight: '600', color: adminColors.ink },
  bulletList: { marginTop: adminSpacing.md, gap: adminSpacing.sm },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  bulletDot: { width: SIX, height: SIX, borderRadius: adminRadius.full, backgroundColor: adminColors.brand },
  bulletKey: { ...adminType.body, fontWeight: '600', color: adminColors.ink, width: BULLET_KEY },
  bulletVal: { ...adminType.body, color: adminColors.ink, flex: 1 },
  downloadOutlineBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIX,
  },
  downloadOutlineBtnText: { ...adminType.rowTitle, fontWeight: '700', color: adminColors.brand },
  downloadSolidBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIX,
  },
  downloadSolidBtnText: { ...adminType.rowTitle, fontWeight: '700', color: adminColors.onBrand },

  // Integration cards
  integrationCard: {
    ...card,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  integrationIconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  integrationTextBox: { flex: 1, paddingRight: adminSpacing.xs },
  integrationCardTitle: { ...adminType.body, fontWeight: '700', color: adminColors.ink },
  integrationCardSubtitle: { ...meta, marginTop: HALF },
  statusPill: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    marginRight: adminSpacing.sm,
  },
  statusPillConnected: { backgroundColor: adminColors.success.bg },
  statusPillDisconnected: { backgroundColor: adminColors.danger.bg },
  statusPillUnknown: { backgroundColor: adminColors.brandTint },
  statusPillText: { ...adminType.caption },
  statusTextConnected: { color: adminColors.success.text },
  statusTextDisconnected: { color: adminColors.danger.text },
  statusTextUnknown: { color: adminColors.muted },

  // Test connection
  testingCard: { ...card, padding: adminSpacing.lg, marginTop: adminSpacing.lg },
  testingHead: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  testingTitle: { ...adminType.body, fontWeight: '700', color: adminColors.ink },
  testingSubtitle: { ...meta, marginTop: adminSpacing.xs },
  progressBarTrack: {
    height: adminSpacing.sm,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.border,
    marginTop: adminSpacing.md,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: adminColors.success.text, borderRadius: adminRadius.full },
  testConnectionOutlineBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.md,
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  testConnectionOutlineBtnText: { ...adminType.body, fontWeight: '700', color: adminColors.ink },
  editIntegrationBtn: {
    flex: 1.15,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.md,
    ...adminShadow.sm,
  },
  editIntegrationBtnText: { ...adminType.body, fontWeight: '700', color: adminColors.onBrand },
  allowedUsesLabel: { ...adminType.body, fontWeight: '700', color: adminColors.brandDeep, marginBottom: adminSpacing.sm },
  regenerateBtn: {
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIX,
  },
  regenerateBtnText: { ...adminType.body, fontWeight: '700', color: adminColors.onBrand },

  // Emergency export
  emergencyWarningBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    gap: adminSpacing.md,
    alignItems: 'flex-start',
  },
  emergencyWarningText: { ...adminType.body, fontWeight: '500', color: adminColors.ink, flex: 1 },
  exportSectionGap: { marginTop: adminSpacing.lg },
  multiLineTextArea: {
    height: TEXT_AREA,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    padding: adminSpacing.md,
    ...adminType.body,
    color: adminColors.ink,
    textAlignVertical: 'top',
  },
  charCountText: { ...meta, textAlign: 'right', marginTop: adminSpacing.xs },
});
