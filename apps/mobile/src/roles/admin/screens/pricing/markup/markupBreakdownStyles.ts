/**
 * Markup breakdown styles, after the team design's MarkupPricingBreakdownScreen
 * stylesheet on admin theme tokens only. The design's ten raw colours
 * (#8A5835 section heading, #1A1412 ink, #8A827B muted, #C62828 alert) map to
 * brandDeep / ink / muted / danger.text; its numeric font sizes map to
 * adminType styles.
 */
import { StyleSheet } from 'react-native';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';

export const markupStyles = StyleSheet.create({
  sectionContainer: { marginBottom: adminSpacing.lg },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: adminSpacing.md },
  rowLabel: { ...adminType.body, color: adminColors.ink, flexShrink: 1 },
  rowValueBold: { ...adminType.rowTitle, color: adminColors.ink },
  divider: { height: 1, backgroundColor: adminColors.border },
  calcNoticeText: { ...adminType.body, color: adminColors.ink, paddingVertical: adminSpacing.md },
  validationLabel: { ...adminType.rowMeta, color: adminColors.muted },
  validationValue: { ...adminType.rowTitle, color: adminColors.ink, textAlign: 'right', flex: 1, marginLeft: adminSpacing.sm },
  validationValueAlert: { color: adminColors.danger.text },

  flowCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.mdLg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  flowLabel: { ...adminType.rowTitle, color: adminColors.ink },
  flowValue: { ...adminType.rowTitle, color: adminColors.ink },
  operatorText: { ...adminType.title, color: adminColors.muted, textAlign: 'center', marginVertical: adminSpacing.xs },
  finalPriceCard: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.mdLg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  finalPriceLabel: { ...adminType.rowTitle, color: adminColors.brandDeep },
  finalPriceValue: { ...adminType.title, color: adminColors.brandDeep },
  expenseCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.card,
    ...adminShadow.sm,
  },
  expenseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: adminSpacing.sm },
});
