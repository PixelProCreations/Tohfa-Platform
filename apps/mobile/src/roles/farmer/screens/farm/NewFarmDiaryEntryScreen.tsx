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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P } from '../../theme';
import type { CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19M19 12L12 5M19 12L12 19"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FieldSquareIcon({ size = 16, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2.2" />
    </Svg>
  );
}

function CropSproutIcon({ size = 16, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21v-8M12 13c-2-3-6-2.5-7-2 0 4 3 6 7 2zM12 11c2-3 6-2.5 7-2 0 4-3 6-7 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LeafOutlineIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C6 22 4 17 4 12 4 6.5 8.5 2 12 2c3.5 0 8 4.5 8 10 0 5-2 10-8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 22V10M12 14c3-1.5 5-1.5 5-1.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarBoxIcon({ size = 22, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────

const FIELD_OPTIONS = [
  'Zone 1 — Upper Field',
  'Zone 2 — Lower Slope',
  'Zone 3 — Terrace Field',
];

const CROP_OPTIONS_BY_FIELD: Record<string, string[]> = {
  'Zone 1 — Upper Field': ['Beans', 'Potato'],
  'Zone 2 — Lower Slope': ['Tomato'],
  'Zone 3 — Terrace Field': ['Carrot', 'Cabbage'],
};

// ─────────────────────────────────────────────
// Props & Component
// ─────────────────────────────────────────────

export interface NewFarmDiaryEntryScreenProps {
  crop?: CropItem | null;
  onBack?: () => void;
  onCancel?: () => void;
  onNext?: (data?: { field: string; crop: string; date: string }) => void;
}

export function NewFarmDiaryEntryScreen({
  crop,
  onBack,
  onCancel,
  onNext,
}: NewFarmDiaryEntryScreenProps): React.JSX.Element {
  const initialField = crop?.zoneShort === 'Zone 1' ? 'Zone 1 — Upper Field' : 'Zone 2 — Lower Slope';
  const [selectedField, setSelectedField] = useState<string>(initialField);
  const [selectedCrop, setSelectedCrop] = useState<string>(crop?.name ?? 'Tomato');

  const [isFieldModalOpen, setIsFieldModalOpen] = useState<boolean>(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);

  const availableCrops = CROP_OPTIONS_BY_FIELD[selectedField] || ['Tomato', 'Carrot', 'Beans'];

  const handleFieldChange = (field: string) => {
    setSelectedField(field);
    const crops = CROP_OPTIONS_BY_FIELD[field] || ['Tomato'];
    setSelectedCrop(crops[0] ?? 'Tomato');
    setIsFieldModalOpen(false);
  };

  const handleCropChange = (cropName: string) => {
    setSelectedCrop(cropName);
    setIsCropModalOpen(false);
  };

  const handleProceed = () => {
    if (onNext) {
      onNext({
        field: selectedField,
        crop: selectedCrop,
        date: 'Today · 16 Jul 2026',
      });
    }
  };

  const handleExit = onCancel ?? onBack;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.navCircleButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={18} color={P.twGreen700} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>New Entry</Text>
            <Text style={styles.headerSubtitle}>Step 1 of 3 · Field & Crop</Text>
          </View>

          <TouchableOpacity
            onPress={handleExit}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3-Segment Progress Bar ── */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressInactive]} />
          <View style={[styles.progressSegment, styles.progressInactive]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Subtitle Instruction ── */}
        <Text style={styles.introInstruction}>
          Pick the field and crop this entry belongs to. Everything after this is scoped to your choice.
        </Text>

        {/* ── 1. Field Dropdown ── */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <FieldSquareIcon size={15} color={P.twGreen800} />
            <Text style={styles.labelTitle}> Field </Text>
            <Text style={styles.requiredAsterisk}>*</Text>
          </View>

          <TouchableOpacity
            style={[styles.dropdownBox, styles.dropdownBoxActive]}
            activeOpacity={0.8}
            onPress={() => setIsFieldModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Select Field"
          >
            <Text style={styles.dropdownSelectedText}>{selectedField}</Text>
            <ChevronDownIcon size={18} color={P.twGreen700} />
          </TouchableOpacity>

          <Text style={styles.helperNote}>From your registered FMB zones (Screen 19).</Text>
        </View>

        {/* ── 2. Crop Dropdown ── */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <CropSproutIcon size={16} color={P.twGreen800} />
            <Text style={styles.labelTitle}> Crop </Text>
            <Text style={styles.requiredAsterisk}>*</Text>
          </View>

          <TouchableOpacity
            style={styles.dropdownBox}
            activeOpacity={0.8}
            onPress={() => setIsCropModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Select Crop"
          >
            <Text style={styles.dropdownSelectedText}>{selectedCrop}</Text>
            <ChevronDownIcon size={18} color={P.twGray500} />
          </TouchableOpacity>

          <Text style={styles.helperNote}>Enabled once a field is chosen — this zone has one active crop.</Text>
        </View>

        {/* ── 3. Crop Duration Card ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            <LeafOutlineIcon size={22} color={P.twGreen700} />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>CROP DURATION</Text>
            <Text style={styles.infoCardValue}>62 days old</Text>
            <Text style={styles.infoCardSub}>Planted 15 May · harvest ~24 Jul 2026</Text>
          </View>
        </View>

        {/* ── 4. Date Card ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            <CalendarBoxIcon size={22} color={P.twGray500} />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>DATE</Text>
            <Text style={styles.infoCardValue}>Today · 16 Jul 2026</Text>
          </View>
          <View style={styles.autoBadge}>
            <Text style={styles.autoBadgeText}>AUTO</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Sticky Action Button ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.activityTypeBtn}
          onPress={handleProceed}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Proceed to Activity Type"
        >
          <Text style={styles.activityTypeBtnText}>Activity Type</Text>
          <ArrowRightIcon size={18} color={P.white} />
        </TouchableOpacity>
      </View>

      {/* ── Field Selection Modal ── */}
      <Modal
        visible={isFieldModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFieldModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFieldModalOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Select Field Zone</Text>
            {FIELD_OPTIONS.map((field) => (
              <TouchableOpacity
                key={field}
                style={[
                  styles.modalOption,
                  selectedField === field ? styles.modalOptionSelected : undefined,
                ]}
                onPress={() => handleFieldChange(field)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedField === field ? styles.modalOptionTextSelected : undefined,
                  ]}
                >
                  {field}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Crop Selection Modal ── */}
      <Modal
        visible={isCropModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCropModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCropModalOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Select Crop</Text>
            {availableCrops.map((cropName) => (
              <TouchableOpacity
                key={cropName}
                style={[
                  styles.modalOption,
                  selectedCrop === cropName ? styles.modalOptionSelected : undefined,
                ]}
                onPress={() => handleCropChange(cropName)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedCrop === cropName ? styles.modalOptionTextSelected : undefined,
                  ]}
                >
                  {cropName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    color: P.slate900,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: P.slate500,
    fontSize: 12,
    marginTop: 2,
  },
  cancelBtnText: {
    color: P.slate600,
    fontSize: 14,
    fontWeight: '600',
  },

  /* 3-Segment Progress */
  progressContainer: {
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
    backgroundColor: P.twGreen700,
  },
  progressInactive: {
    backgroundColor: P.slate200,
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  introInstruction: {
    fontSize: 13,
    color: P.slate500,
    lineHeight: 19,
    marginBottom: 20,
  },

  fieldGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.slate800,
  },
  requiredAsterisk: {
    color: P.twRed500,
    fontWeight: '700',
    fontSize: 13,
  },

  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: P.white,
  },
  dropdownBoxActive: {
    borderColor: P.twGreen600,
    borderWidth: 1.5,
  },
  dropdownSelectedText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.slate900,
  },
  helperNote: {
    fontSize: 11,
    color: P.slate400,
    marginTop: 6,
  },

  /* Info Cards */
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.slate50,
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  infoIconBox: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardContent: {
    flex: 1,
    marginLeft: 10,
  },
  infoCardLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoCardValue: {
    fontSize: 15,
    fontWeight: '700',
    color: P.slate900,
  },
  infoCardSub: {
    fontSize: 11.5,
    color: P.slate500,
    marginTop: 2,
  },
  autoBadge: {
    backgroundColor: P.slate200,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  autoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: P.slate600,
    letterSpacing: 0.4,
  },

  /* Bottom Sticky Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
  },
  activityTypeBtn: {
    height: 48,
    backgroundColor: P.primary,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  activityTypeBtnText: {
    color: P.white,
    fontSize: 15,
    fontWeight: '700',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 14,
    padding: 16,
    elevation: 6,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: P.slate900,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: P.twGreen50,
  },
  modalOptionText: {
    fontSize: 14,
    color: P.slate800,
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: P.twGreen700,
    fontWeight: '700',
  },
});
