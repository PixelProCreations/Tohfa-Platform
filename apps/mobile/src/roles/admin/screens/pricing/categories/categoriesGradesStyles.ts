/**
 * Categories & Grades styles, after the team design's CategoriesGradesScreen
 * stylesheet on admin theme tokens only (its two raw colours, #E8F5E9 /
 * #2E7D32 on the Farmer Admin "Active" pill, belong to a card that is not
 * drawn: status has no source). Shared card / sheet styles come from
 * ../retail/pricingFrameStyles.
 */
import { StyleSheet } from 'react-native';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';

export const categoriesStyles = StyleSheet.create({
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  segmentBtn: { flex: 1, paddingVertical: adminSpacing.smMd, alignItems: 'center', borderRadius: adminRadius.md },
  segmentBtnActive: { backgroundColor: adminColors.brand },
  segmentBtnText: { ...adminType.rowTitle, color: adminColors.ink },
  segmentBtnTextActive: { color: adminColors.onBrand },
  cardSubtitle3: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs / 2 },
  cardActionBtn: { marginTop: adminSpacing.smMd, alignSelf: 'flex-start' },
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: adminSpacing.xsSm },
  specKey: { ...adminType.body, color: adminColors.muted },
  specValBold: { ...adminType.rowTitle, color: adminColors.ink, flexShrink: 1, textAlign: 'right', marginLeft: adminSpacing.md },
  dottedDivider: { height: 1, borderWidth: 1, borderColor: adminColors.border, borderStyle: 'dashed', marginVertical: adminSpacing.xs / 2 },
  sheetFootnote: { ...adminType.rowMeta, color: adminColors.muted, marginVertical: adminSpacing.md },
  sheetCloseBtn: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
  },
});
