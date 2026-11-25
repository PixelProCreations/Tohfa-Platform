/**
 * Retail-only styles (card variants, Edit buttons, the edit drawer), after the
 * team design's RetailPricingScreen stylesheet on admin theme tokens only.
 * The design's numeric font sizes map to adminType styles and its raw
 * spacing numbers to the nearest adminSpacing step.
 */
import { StyleSheet } from 'react-native';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';

export const retailStyles = StyleSheet.create({
  /** The design's red-bordered "Action required" card, used here for a price above its ceiling. */
  dangerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    ...adminShadow.sm,
  },
  badgeWithin: { backgroundColor: adminColors.success.bg },
  badgeWithinText: { color: adminColors.success.text },
  badgeAbove: { backgroundColor: adminColors.danger.bg },
  badgeAboveText: { color: adminColors.danger.text },

  editOutlinedBtn: {
    marginTop: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    backgroundColor: adminColors.card,
  },
  editOutlinedBtnText: { ...adminType.rowTitle, color: adminColors.brandDeep },
  editFilledBtn: {
    marginTop: adminSpacing.md,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.smMd,
    alignItems: 'center',
  },
  editFilledBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },

  drawerSectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  drawerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  drawerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: adminSpacing.xs },
  drawerRowSpaced: { marginTop: adminSpacing.sm },
  drawerLabel: { ...adminType.body, color: adminColors.muted },
  drawerValBold: { ...adminType.rowTitle, color: adminColors.ink },
  drawerValWithin: { color: adminColors.success.text },
  drawerValAbove: { color: adminColors.danger.text },
  inputFieldLabel: { ...adminType.rowTitle, color: adminColors.ink, marginTop: adminSpacing.sm, marginBottom: adminSpacing.xsSm },
  inputWrapper: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.smMd,
  },
  drawerTextInput: { ...adminType.rowTitle, color: adminColors.ink, paddingVertical: 0 },
  hintText: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.xs },
  saveBtnDisabled: {
    marginTop: adminSpacing.md,
    backgroundColor: adminColors.dashboard.track,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.smMd,
    alignItems: 'center',
  },
  saveBtnDisabledText: { ...adminType.rowTitle, color: adminColors.muted },
  saveNote: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xsSm },
});
