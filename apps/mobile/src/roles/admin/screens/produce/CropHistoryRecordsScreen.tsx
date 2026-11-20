import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowIcon,
  CompareIcon,
  FilterSlidersIcon,
  SearchIcon,
} from './produceIcons';

export interface CompareCropCyclesModalProps {
  visible: boolean;
  onClose: () => void;
  onExportDetails?: () => void;
}

export function CompareCropCyclesModal({
  visible,
  onClose,
  onExportDetails: _onExportDetails,
}: CompareCropCyclesModalProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismissArea} onPress={onClose} />
        <View style={styles.exportModalContent}>
          <Text style={styles.exportModalTitle}>Compare crop cycles</Text>

          {/* Comparison Table Box */}
          <View style={styles.compareTableBox}>
            <View style={styles.compareTableRow}>
              <View style={{ width: 85 }} />
              <Text style={styles.compareColHeader}>CR-2026-0040</Text>
              <Text style={styles.compareColHeader}>CR-2026-0031</Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.compareTableRow}>
              <Text style={styles.compareRowLabel}>Crop</Text>
              <Text style={styles.compareRowValue}>Potato</Text>
              <Text style={styles.compareRowValue}>Cabbage</Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.compareTableRow}>
              <Text style={styles.compareRowLabel}>Season</Text>
              <Text style={styles.compareRowValue}>Winter 2026</Text>
              <Text style={styles.compareRowValue}>Winter 2026</Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.compareTableRow}>
              <Text style={styles.compareRowLabel}>Zone / plot</Text>
              <Text style={styles.compareRowValue}>Kotagiri · PLT-00221-2</Text>
              <Text style={styles.compareRowValue}>Gudalur · PLT-00127-2</Text>
            </View>
            <View style={styles.dottedDivider} />

            <View style={styles.compareTableRow}>
              <Text style={styles.compareRowLabel}>Quantity</Text>
              <Text style={styles.compareRowValue}>5,225 KG</Text>
              <Text style={styles.compareRowValue}>5,700 KG</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8} accessibilityRole="button">
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export interface CropHistoryRecordsScreenProps {
  onBack: () => void;
  onOpenCompareModal?: () => void;
  onSelectCropRecord: (recordId: string) => void;
  onOpenFilters?: () => void;
  selectedCompareIds?: string[];
  onToggleCompare?: (recordId: string) => void;
}

export function CropHistoryRecordsScreen({
  onBack,
  onOpenCompareModal,
  onSelectCropRecord,
  onOpenFilters,
  selectedCompareIds: controlledCompareIds,
  onToggleCompare: controlledToggleCompare,
}: CropHistoryRecordsScreenProps): React.JSX.Element {
  const [searchTxt, setSearchTxt] = useState('');
  const [localCompareIds, setLocalCompareIds] = useState<string[]>([]);
  const [compareModalVisible, setCompareModalVisible] = useState(false);

  const compareIds = controlledCompareIds ?? localCompareIds;
  const toggleCompare = controlledToggleCompare ?? ((id: string) => {
    setLocalCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  });

  const handleOpenCompare = onOpenCompareModal ?? (() => setCompareModalVisible(true));
  const handleCloseCompare = () => setCompareModalVisible(false);

  const historyRecords = [
    {
      id: 'CR-2026-0040',
      title: 'Potato · Winter 2026',
      badge: 'Harvested',
      farmerLine: 'CR-2026-0040 · FMR-00221 · Priya',
      plotLine: 'Kotagiri · PLT-00221-2',
      datesLine: 'Planted 17 Jun 2026 · Harvested 28 Sep 2026',
      quantityLine: 'Quantity 5,225 KG · Source Farmer entry',
    },
    {
      id: 'CR-2026-0031',
      title: 'Cabbage · Winter 2026',
      badge: 'Harvested',
      farmerLine: 'CR-2026-0031 · FMR-00127 · Senthil',
      plotLine: 'Gudalur · PLT-00127-2',
      datesLine: 'Planted 30 Jun 2026 · Harvested 26 Sep 2026',
      quantityLine: 'Quantity 5,700 KG · Source Farmer entry',
    },
    {
      id: 'CR-2026-0024',
      title: 'Carrot · Winter 2026',
      badge: 'Harvested',
      farmerLine: 'CR-2026-0024 · FMR-00146 · Sundar',
      plotLine: 'Gudalur · PLT-00146-1',
      datesLine: 'Planted 9 Jun 2026 · Harvested 20 Sep 2026',
      quantityLine: 'Quantity 9,975 KG · Source Farmer entry',
    },
  ];

  return (
    <View style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtnTouch} accessibilityRole="button">
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crop History & Records</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor={adminColors.placeholder}
            value={searchTxt}
            onChangeText={setSearchTxt}
          />
          <TouchableOpacity
            style={styles.filterTouchBtn}
            onPress={onOpenFilters}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <FilterSlidersIcon size={20} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Compare Button */}
        <TouchableOpacity
          style={styles.comparePillButton}
          onPress={handleOpenCompare}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <CompareIcon size={18} color={adminColors.brandDeep} />
          <Text style={styles.comparePillButtonText}>
            Compare ({compareIds.length})
          </Text>
        </TouchableOpacity>

        {/* Subtitle count */}
        <Text style={styles.historyCyclesCount}>16 completed 2025 cycles</Text>

        {/* List of cards */}
        {historyRecords.map((item) => {
          const isSelected = compareIds.includes(item.id);
          return (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyCardTopRow}>
                <Text style={styles.historyCardTitle}>{item.title}</Text>
                <View style={styles.harvestedBadge}>
                  <Text style={styles.harvestedBadgeText}>{item.badge}</Text>
                </View>
              </View>

              <Text style={styles.historyCardMeta}>{item.farmerLine}</Text>
              <Text style={styles.historyCardMeta}>{item.plotLine}</Text>
              <Text style={styles.historyCardMeta}>{item.datesLine}</Text>
              <Text style={styles.historyCardMeta}>{item.quantityLine}</Text>

              <View style={styles.historyCardActionsRow}>
                <TouchableOpacity
                  onPress={() => onSelectCropRecord(item.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text style={styles.historyActionLink}>Open full record</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => toggleCompare(item.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.historyActionLink,
                      isSelected && { color: adminColors.brand, fontWeight: '700' },
                    ]}
                  >
                    {isSelected ? 'Selected to compare ✓' : 'Select to compare'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <CompareCropCyclesModal
        visible={compareModalVisible}
        onClose={handleCloseCompare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtnTouch: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    height: 46,
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.xs,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
  },
  filterTouchBtn: {
    padding: adminSpacing.xs,
  },
  comparePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.xs,
    gap: adminSpacing.xs,
  },
  comparePillButtonText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  historyCyclesCount: {
    ...adminType.caption,
    color: adminColors.muted,
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  historyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginHorizontal: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  historyCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  historyCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  harvestedBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs / 2,
  },
  harvestedBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  historyCardMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  historyCardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  historyActionLink: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  exportModalContent: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.lg,
  },
  exportModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  compareTableBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
  },
  compareTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  compareColHeader: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    flex: 1,
    textAlign: 'center',
  },
  compareRowLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    width: 85,
  },
  compareRowValue: {
    ...adminType.caption,
    color: adminColors.ink,
    flex: 1,
    textAlign: 'center',
  },
  dottedDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.xs / 2,
  },
  closeBtn: {
    paddingVertical: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    alignItems: 'center',
  },
  closeBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
});
