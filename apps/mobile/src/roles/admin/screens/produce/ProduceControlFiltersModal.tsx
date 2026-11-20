import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminColors, adminOverlay, adminRadius, adminSpacing, adminType } from '../../theme';
import { ChevronDownIcon } from './produceIcons';

export interface ProduceControlFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  selectedFarmer: string;
  onChangeFarmer: (v: string) => void;
  selectedZone: string;
  onChangeZone: (v: string) => void;
  selectedCrop: string;
  onChangeCrop: (v: string) => void;
  selectedSeason: string;
  onChangeSeason: (v: string) => void;
  selectedGrowthStage: string;
  onChangeGrowthStage: (v: string) => void;
}

export function ProduceControlFiltersModal({
  visible,
  onClose,
  selectedFarmer,
  onChangeFarmer,
  selectedZone,
  onChangeZone,
  selectedCrop,
  onChangeCrop,
  selectedSeason,
  onChangeSeason,
  selectedGrowthStage,
  onChangeGrowthStage,
}: ProduceControlFiltersModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismissArea} onPress={onClose} />
        <View style={styles.bottomSheet}>
          <Text style={styles.filtersModalTitle}>Filters</Text>

          {/* 1. Farmer / farm */}
          <Text style={styles.filterFieldLabel}>Farmer / farm</Text>
          <TouchableOpacity
            style={styles.filterDropdown}
            onPress={() => onChangeFarmer(selectedFarmer === 'All' ? 'Ramesh Kumar' : 'All')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.filterDropdownValue}>{selectedFarmer}</Text>
            <ChevronDownIcon size={16} color={adminColors.muted} />
          </TouchableOpacity>

          {/* 2. Zone */}
          <Text style={styles.filterFieldLabel}>Zone</Text>
          <TouchableOpacity
            style={styles.filterDropdown}
            onPress={() => onChangeZone(selectedZone === 'All' ? 'Coonoor' : 'All')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.filterDropdownValue}>{selectedZone}</Text>
            <ChevronDownIcon size={16} color={adminColors.muted} />
          </TouchableOpacity>

          {/* 3. Crop */}
          <Text style={styles.filterFieldLabel}>Crop</Text>
          <TouchableOpacity
            style={styles.filterDropdown}
            onPress={() => onChangeCrop(selectedCrop === 'All' ? 'Tomato' : 'All')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.filterDropdownValue}>{selectedCrop}</Text>
            <ChevronDownIcon size={16} color={adminColors.muted} />
          </TouchableOpacity>

          {/* 4. Season */}
          <Text style={styles.filterFieldLabel}>Season</Text>
          <TouchableOpacity
            style={styles.filterDropdown}
            onPress={() => onChangeSeason(selectedSeason === 'All' ? 'Kharif' : 'All')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.filterDropdownValue}>{selectedSeason}</Text>
            <ChevronDownIcon size={16} color={adminColors.muted} />
          </TouchableOpacity>

          {/* 5. Growth stage */}
          <Text style={styles.filterFieldLabel}>Growth stage</Text>
          <TouchableOpacity
            style={styles.filterDropdown}
            onPress={() => onChangeGrowthStage(selectedGrowthStage === 'All' ? 'Flowering' : 'All')}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.filterDropdownValue}>{selectedGrowthStage}</Text>
            <ChevronDownIcon size={16} color={adminColors.muted} />
          </TouchableOpacity>

          {/* Bottom Buttons Row: [Apply]  [Reset] */}
          <View style={styles.filterButtonsRow}>
            <TouchableOpacity style={styles.filterApplyBtn} onPress={onClose} activeOpacity={0.8} accessibilityRole="button">
              <Text style={styles.filterApplyBtnText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterResetBtn}
              onPress={() => {
                onChangeFarmer('All');
                onChangeZone('All');
                onChangeCrop('All');
                onChangeSeason('All');
                onChangeGrowthStage('All');
                onClose();
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.filterResetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    maxHeight: '82%',
  },
  filtersModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  filterFieldLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs / 2,
  },
  filterDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  filterDropdownValue: {
    ...adminType.body,
    color: adminColors.ink,
  },
  filterButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  filterApplyBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  filterResetBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
});
