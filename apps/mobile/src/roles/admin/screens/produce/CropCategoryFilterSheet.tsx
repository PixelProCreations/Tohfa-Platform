/**
 * Crop Data's category filter: a bottom sheet opened from the search bar's
 * filter button. Same shape as ProduceControlFiltersModal (bottom sheet,
 * backdrop dismiss, Apply + Reset) with the chip rows of the Farmers filter
 * modal; a chip applies at once and Apply only closes, as in both.
 *
 * The options are the fetched catalog categories (see cropCategoryOptions),
 * never a fixed list. While they load, or if they fail, only All is offered
 * with a line saying why: a chip that cannot match any crop would show an
 * empty list and read as "no crops".
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../i18n';
import { adminColors, adminOverlay, adminRadius, adminSpacing, adminType } from '../../theme';

export interface CropCategoryChoice {
  id: string;
  label: string;
}

export type CropCategoryStatus = 'loading' | 'error' | 'ready';

export interface CropCategoryFilterSheetProps {
  visible: boolean;
  options: readonly CropCategoryChoice[];
  status: CropCategoryStatus;
  /** The selected category id, or null for All. */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}

function Chip({ label, selected, onPress, testID }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      testID={testID}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function CropCategoryFilterSheet({
  visible,
  options,
  status,
  selectedId,
  onSelect,
  onClose,
}: CropCategoryFilterSheetProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} testID="cropData.filterSheet">
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} accessibilityLabel={t('produce.close')} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('produce.cropData.filter.title')}</Text>

          <Text style={styles.fieldLabel}>{t('produce.cropData.filter.category')}</Text>
          <View style={styles.chipRow}>
            <Chip
              label={t('produce.filters.all')}
              selected={selectedId === null}
              onPress={() => onSelect(null)}
              testID="cropData.categoryChip.all"
            />
            {options.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                selected={selectedId === option.id}
                onPress={() => onSelect(option.id)}
                testID={`cropData.categoryChip.${option.id}`}
              />
            ))}
          </View>
          {status === 'loading' ? <Text style={styles.hint}>{t('produce.cropData.filter.loading')}</Text> : null}
          {status === 'error' ? <Text style={styles.hint}>{t('produce.cropData.filter.unavailable')}</Text> : null}

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityRole="button"
              testID="cropData.filterApply"
            >
              <Text style={styles.applyBtnText}>{t('produce.filters.apply')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                onSelect(null);
                onClose();
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              testID="cropData.filterReset"
            >
              <Text style={styles.resetBtnText}>{t('produce.filters.reset')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: adminOverlay.scrim, justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  sheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    maxHeight: '82%',
  },
  title: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.md },
  fieldLabel: { ...adminType.caption, color: adminColors.ink, marginBottom: adminSpacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginBottom: adminSpacing.sm },
  chip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  chipActive: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  chipText: { ...adminType.rowTitle, color: adminColors.ink },
  chipTextActive: { color: adminColors.onBrand },
  hint: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.sm },
  buttonsRow: { flexDirection: 'row', gap: adminSpacing.md, marginTop: adminSpacing.lg, marginBottom: adminSpacing.md },
  applyBtn: {
    flex: 1,
    paddingVertical: adminSpacing.md,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
  resetBtn: {
    flex: 1,
    paddingVertical: adminSpacing.md,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: { ...adminType.rowTitle, color: adminColors.ink },
});
