/**
 * Edit Farmer styles: the team design's single long form (tofhafarmfin-rbac
 * AdminEditFarmerScreen) on admin theme tokens only (no hex, no numeric
 * fontSize). The header banner and pills reuse ../detail/styles.
 */
import { StyleSheet } from 'react-native';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';

const field = {
  ...adminType.body,
  borderWidth: 1,
  borderColor: adminColors.border,
  borderRadius: adminRadius.md,
  backgroundColor: adminColors.card,
  paddingHorizontal: adminSpacing.md,
  minHeight: ADMIN_BUTTON_HEIGHT - adminSpacing.xs,
  color: adminColors.ink,
} as const;

const readOnlyField = {
  ...field,
  backgroundColor: adminColors.canvas,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
} as const;

export const editStyles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.pageMargin + adminSpacing.xxxl },
  sectionHeading: { ...adminType.sectionHead, color: adminColors.brandDeep, marginTop: adminSpacing.sm, marginBottom: adminSpacing.sm },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  fieldLabel: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.xsSm, marginTop: adminSpacing.md },
  fieldLabelFirst: { marginTop: 0 },
  reqStar: { color: adminColors.danger.text },
  input: { ...field },
  inputLocked: { backgroundColor: adminColors.canvas, color: adminColors.muted },
  readOnlyField: { ...readOnlyField },
  readOnlyText: { ...adminType.body, color: adminColors.muted, flexShrink: 1 },
  helper: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  phoneRow: { flexDirection: 'row', gap: adminSpacing.sm },
  phonePrefix: { ...readOnlyField, justifyContent: 'center', paddingHorizontal: adminSpacing.md },
  phonePrefixText: { ...adminType.rowTitle, color: adminColors.ink },
  phoneInput: { ...field, flex: 1 },
  phoneLockIcon: { position: 'absolute', right: adminSpacing.md, top: adminSpacing.md + adminSpacing.xs / 2 },
  phoneInputWrap: { flex: 1 },
  twoColRow: { flexDirection: 'row', gap: adminSpacing.md },
  col: { flex: 1 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
  },
  chipSelected: { backgroundColor: adminColors.brandTint, borderColor: adminColors.brand },
  chipText: { ...adminType.rowTitle, color: adminColors.muted },
  chipTextSelected: { color: adminColors.brandDeep },

  // Locked identity card
  lockedCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    marginBottom: adminSpacing.lg,
  },
  lockedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: adminSpacing.md },
  lockedLabel: { ...adminType.body, color: adminColors.muted },
  lockedValueRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xsSm },
  lockedValue: { ...adminType.rowTitle, color: adminColors.ink },
  lockedDivider: { height: 1, backgroundColor: adminColors.border },

  // Plots + documents (read-only)
  listRow: { paddingVertical: adminSpacing.smMd },
  listDivider: { height: 1, backgroundColor: adminColors.border },
  listTitle: { ...adminType.rowTitle, color: adminColors.ink },
  listMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs / 2 },
  docCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  docHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: adminSpacing.sm },
  docTitle: { ...adminType.sectionHead, color: adminColors.ink, flexShrink: 1 },
  disclaimerBox: {
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  disclaimerText: { ...adminType.rowMeta, color: adminColors.info.text },

  // Sticky bottom bar
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    ...adminShadow.lg,
  },
  bottomRow: { flexDirection: 'row', gap: adminSpacing.md },
  cancelBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { ...adminType.sectionHead, color: adminColors.ink },
  saveBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...adminType.sectionHead, color: adminColors.onBrand },
  barMessage: { ...adminType.rowMeta, color: adminColors.danger.text, textAlign: 'center', marginBottom: adminSpacing.xs },
  barInfo: { ...adminType.rowMeta, color: adminColors.muted, textAlign: 'center', marginBottom: adminSpacing.xs },
});
