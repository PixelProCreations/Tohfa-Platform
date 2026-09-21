import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';
import type { CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons
// ─────────────────────────────────────────────

const ArrowBackIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={colors.brandGreen}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FieldIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={colors.brandGreen} strokeWidth="2.2" />
    <Path d="M3 9H21M9 21V9" stroke={colors.brandGreen} strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

const PlantCropIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22V12M12 12C12 7.5 16 5 20 5C20 9.5 16.5 12 12 12ZM12 12C12 8 8.5 6 4 6C4 10.5 7.5 12 12 12Z"
      stroke={colors.brandGreen}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDownGreen = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9L12 15L18 9"
      stroke={colors.brandGreen}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDownGray = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9L12 15L18 9"
      stroke={P.twGray500}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LeafDurationIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C6 22 4 17 4 12C4 6.5 8.5 2 12 2C15.5 2 20 6.5 20 12C20 17 18 22 12 22Z"
      stroke={colors.brandGreen}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 22V10M12 14C15 12.5 17 12.5 17 12.5"
      stroke={colors.brandGreen}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CalendarDateIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={P.twGray500} strokeWidth="2" />
    <Path d="M16 2V6M8 2V6M3 10H21" stroke={P.twGray500} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ArrowRightIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12H19M19 12L12 5M19 12L12 19"
      stroke={colors.white}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─────────────────────────────────────────────
// Sample Options
// ─────────────────────────────────────────────

const ZONE_OPTIONS = [
  'Zone 1 — Upper Terrace',
  'Zone 2 — Lower Slope',
  'Zone 3 — East Basin',
  'Zone 4 — North Slope',
];

const CROP_OPTIONS = [
  { name: 'Tomato', duration: '62 days old', planted: '15 May', harvest: '24 Jul 2026' },
  { name: 'Carrot', duration: '45 days old', planted: '01 Jun', harvest: '15 Aug 2026' },
  { name: 'French Beans', duration: '30 days old', planted: '16 Jun', harvest: '30 Jul 2026' },
  { name: 'Cabbage', duration: '50 days old', planted: '27 May', harvest: '10 Aug 2026' },
  { name: 'Potato', duration: '70 days old', planted: '07 May', harvest: '28 Jul 2026' },
];

export interface NewFarmDiaryEntryScreenProps {
  crop?: CropItem | null;
  selectedCategory?: string;
  onBack?: () => void;
  onNext?: (data: { field: string; cropName: string; category?: string }) => void;
}

export function NewFarmDiaryEntryScreen({
  crop,
  selectedCategory,
  onBack,
  onNext,
}: NewFarmDiaryEntryScreenProps): React.JSX.Element {
  const [selectedZone, setSelectedZone] = useState<string>('Zone 2 — Lower Slope');
  const [selectedCropName, setSelectedCropName] = useState<string>(crop?.name || 'Tomato');
  const [zoneModalVisible, setZoneModalVisible] = useState<boolean>(false);
  const [cropModalVisible, setCropModalVisible] = useState<boolean>(false);

  const currentCropInfo =
    CROP_OPTIONS.find((c) => c.name.toLowerCase() === selectedCropName.toLowerCase()) ||
    CROP_OPTIONS[0];

  const handleNext = () => {
    if (onNext) {
      onNext({
        field: selectedZone,
        cropName: selectedCropName,
        category: selectedCategory || 'Crop Care',
      });
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon />
          </TouchableOpacity>

          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>New Entry</Text>
            <Text style={styles.headerSubtitle}>Step 1 of 3 · Field & Crop</Text>
          </View>

          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* 3-Step Progress Bar */}
        <View style={styles.progressBarRow}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressInactive]} />
          <View style={[styles.progressSegment, styles.progressInactive]} />
        </View>
      </View>

      {/* ── Form Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Pick the field and crop this entry belongs to. Everything after this is scoped to your choice.
        </Text>

        {/* Field Selector */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <FieldIcon />
            <Text style={styles.labelText}>Field</Text>
            <Text style={styles.requiredStar}>*</Text>
          </View>

          <TouchableOpacity
            style={styles.fieldSelectorBox}
            activeOpacity={0.8}
            onPress={() => setZoneModalVisible(true)}
          >
            <Text style={styles.fieldSelectorText}>{selectedZone}</Text>
            <ChevronDownGreen />
          </TouchableOpacity>

          <Text style={styles.helperText}>
            From your registered FMB zones (Screen 19).
          </Text>
        </View>

        {/* Crop Selector */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <PlantCropIcon />
            <Text style={styles.labelText}>Crop</Text>
            <Text style={styles.requiredStar}>*</Text>
          </View>

          <TouchableOpacity
            style={styles.cropSelectorBox}
            activeOpacity={0.8}
            onPress={() => setCropModalVisible(true)}
          >
            <Text style={styles.cropSelectorText}>{selectedCropName}</Text>
            <ChevronDownGray />
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Enabled once a field is chosen — this zone has one active crop.
          </Text>
        </View>

        {/* Crop Duration Summary Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardIconBox}>
            <LeafDurationIcon />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardSubLabel}>CROP DURATION</Text>
            <Text style={styles.infoCardTitle}>{currentCropInfo.duration}</Text>
            <Text style={styles.infoCardMeta}>
              Planted {currentCropInfo.planted} · harvest ~{currentCropInfo.harvest}
            </Text>
          </View>
        </View>

        {/* Date Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardIconBox}>
            <CalendarDateIcon />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardSubLabel}>DATE</Text>
            <Text style={styles.infoCardTitle}>Today · 16 Jul 2026</Text>
          </View>
          <View style={styles.autoBadge}>
            <Text style={styles.autoBadgeText}>AUTO</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Fixed Bottom Button ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.nextBtn}
          activeOpacity={0.85}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>Next · Activity Type</Text>
          <ArrowRightIcon />
        </TouchableOpacity>
      </View>

      {/* Zone Picker Modal */}
      <Modal
        visible={zoneModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setZoneModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setZoneModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalHeaderTitle}>Select Field / Zone</Text>
            {ZONE_OPTIONS.map((zone) => {
              const isSelected = selectedZone === zone;
              return (
                <TouchableOpacity
                  key={zone}
                  style={[
                    styles.modalOption,
                    isSelected && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedZone(zone);
                    setZoneModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected && styles.modalOptionTextSelected,
                    ]}
                  >
                    {zone}
                  </Text>
                  {isSelected && <View style={styles.selectedDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Crop Picker Modal */}
      <Modal
        visible={cropModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCropModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCropModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalHeaderTitle}>Select Crop</Text>
            {CROP_OPTIONS.map((c) => {
              const isSelected = selectedCropName.toLowerCase() === c.name.toLowerCase();
              return (
                <TouchableOpacity
                  key={c.name}
                  style={[
                    styles.modalOption,
                    isSelected && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedCropName(c.name);
                    setCropModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected && styles.modalOptionTextSelected,
                    ]}
                  >
                    {c.name}
                  </Text>
                  {isSelected && <View style={styles.selectedDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2EE',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 4,
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: colors.brandGreen,
  },
  progressInactive: {
    backgroundColor: '#E5E7EB',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  requiredStar: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  fieldSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
  fieldSelectorText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cropSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
  cropSelectorText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 14,
  },
  infoCardIconBox: {
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  infoCardMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  autoBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  autoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F2EE',
    backgroundColor: colors.white,
  },
  nextBtn: {
    backgroundColor: colors.brandGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#F0FDF4',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: '#166534',
    fontWeight: '700',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#166534',
  },
});
