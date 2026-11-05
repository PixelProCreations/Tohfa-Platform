import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ApplicationGuideDraft {
  id?: string;
  guideTitle: string;
  guideType: string;
  linkedInput: string;
  linkedPestDisease: string;
  applicableCrops: string;
  growingStage: string;
  applicationMethod: string;
  instructions: string;
  dosage: string;
  unit: string;
  timingFrequency: string;
  precautions: string;
  restrictions: string;
}

export interface AddNewGuideScreenProps {
  onBack: () => void;
  onSave?: (draft: ApplicationGuideDraft) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AddNewGuideScreen({ onBack, onSave }: AddNewGuideScreenProps) {
  // Section 1: Overview
  const [guideTitle, setGuideTitle] = useState('');
  const [guideType, setGuideType] = useState('');
  const [linkedInput, setLinkedInput] = useState('');
  const [linkedPestDisease, setLinkedPestDisease] = useState('');
  const [applicableCrops, setApplicableCrops] = useState('');
  const [growingStage, setGrowingStage] = useState('');

  // Section 2: Instructions
  const [applicationMethod, setApplicationMethod] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('');
  const [timingFrequency, setTimingFrequency] = useState('');

  // Section 3: Safety & restrictions
  const [precautions, setPrecautions] = useState('');
  const [restrictions, setRestrictions] = useState('');

  // Dropdown Picker Modal
  const [pickerTitle, setPickerTitle] = useState('');
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [pickerOnSelect, setPickerOnSelect] = useState<(v: string) => void>(() => () => {});
  const [showPicker, setShowPicker] = useState(false);

  const openSelect = (title: string, options: string[], onSelect: (v: string) => void) => {
    setPickerTitle(title);
    setPickerOptions(options);
    setPickerOnSelect(() => onSelect);
    setShowPicker(true);
  };

  const handleSave = () => {
    const draft: ApplicationGuideDraft = {
      id: `GD-${Math.floor(1000 + Math.random() * 9000)}`,
      guideTitle: guideTitle.trim() || 'New Application Guide',
      guideType: guideType || 'Preventive',
      linkedInput: linkedInput || 'Neem Oil Concentrate',
      linkedPestDisease: linkedPestDisease || 'Late Blight (Tomato)',
      applicableCrops: applicableCrops || 'Tomato, Potato',
      growingStage: growingStage || 'Vegetative stage',
      applicationMethod: applicationMethod || 'Foliar spray',
      instructions: instructions || 'Apply thoroughly on upper and lower leaf surfaces.',
      dosage: dosage || '5',
      unit: unit || 'mL/L',
      timingFrequency: timingFrequency || 'Every 7-10 days, early morning',
      precautions: precautions || 'Wear protective mask and gloves.',
      restrictions: restrictions || 'Do not spray during peak noon heat.',
    };

    if (onSave) {
      onSave(draft);
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header Banner ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Guide</Text>
        </View>
      </View>

      {/* ─── Scroll Form Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Section 1: Overview ─── */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.cardContainer}>
          {/* Guide title * */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Guide title <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={guideTitle}
              onChangeText={setGuideTitle}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Guide type * */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Guide type <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectBox}
              activeOpacity={0.75}
              onPress={() =>
                openSelect(
                  'Select Guide Type',
                  ['Preventive', 'Curative', 'Integrated Pest Management', 'Nutritional', 'Organic Treatment'],
                  setGuideType
                )
              }
            >
              <Text style={[styles.selectText, !guideType && styles.selectPlaceholder]}>
                {guideType || 'Select'}
              </Text>
              <ChevronDownIcon size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Linked input (approved only) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Linked input (approved only)</Text>
            <TouchableOpacity
              style={styles.selectBox}
              activeOpacity={0.75}
              onPress={() =>
                openSelect(
                  'Select Linked Input',
                  [
                    'Neem Oil Concentrate',
                    'Panchagavya Mix',
                    'Bio-NPK Liquid',
                    'Trichoderma Viride',
                    'Pseudomonas Fluorescens',
                    'Vermiwash',
                  ],
                  setLinkedInput
                )
              }
            >
              <Text style={[styles.selectText, !linkedInput && styles.selectPlaceholder]}>
                {linkedInput || 'Select'}
              </Text>
              <ChevronDownIcon size={18} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.subtextNote}>Only approved inputs are offered.</Text>
          </View>

          {/* Linked pest or disease (published only) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Linked pest or disease (published only)</Text>
            <TouchableOpacity
              style={styles.selectBox}
              activeOpacity={0.75}
              onPress={() =>
                openSelect(
                  'Select Linked Pest or Disease',
                  [
                    'Late Blight (Tomato)',
                    'Early Blight (Tomato)',
                    'Aphids (Carrot)',
                    'Fruit Borer (Tomato)',
                    'Powdery Mildew (Cabbage)',
                    'Damping Off (Seedlings)',
                  ],
                  setLinkedPestDisease
                )
              }
            >
              <Text style={[styles.selectText, !linkedPestDisease && styles.selectPlaceholder]}>
                {linkedPestDisease || 'Select'}
              </Text>
              <ChevronDownIcon size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Applicable crops */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Applicable crops</Text>
            <TouchableOpacity
              style={styles.selectBox}
              activeOpacity={0.75}
              onPress={() =>
                openSelect(
                  'Select Applicable Crops',
                  ['Tomato', 'Potato', 'Carrot', 'Cabbage', 'Beans', 'All Crops'],
                  setApplicableCrops
                )
              }
            >
              <Text style={[styles.selectText, !applicableCrops && styles.selectPlaceholder]}>
                {applicableCrops || 'Select..'}
              </Text>
              <ChevronDownIcon size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Growing stage (only if verified) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Growing stage (only if verified)</Text>
            <TouchableOpacity
              style={styles.selectBox}
              activeOpacity={0.75}
              onPress={() =>
                openSelect(
                  'Select Growing Stage',
                  [
                    'Vegetative stage',
                    'Flowering stage',
                    'Fruiting stage',
                    'Seedling stage',
                    'Maturity stage',
                    'All stages',
                  ],
                  setGrowingStage
                )
              }
            >
              <Text style={[styles.selectText, !growingStage && styles.selectPlaceholder]}>
                {growingStage || 'Select'}
              </Text>
              <ChevronDownIcon size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Section 2: Instructions ─── */}
        <Text style={styles.sectionTitle}>Instructions</Text>
        <View style={styles.cardContainer}>
          {/* Application method * */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Application method <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={applicationMethod}
              onChangeText={setApplicationMethod}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Instructions * */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Instructions <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Dosage & Unit (2 columns) */}
          <View style={styles.twoColRow}>
            <View style={styles.colLeft}>
              <Text style={styles.label}>Dosage</Text>
              <TextInput
                style={styles.textInput}
                value={dosage}
                onChangeText={setDosage}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.colRight}>
              <Text style={styles.label}>Unit</Text>
              <TouchableOpacity
                style={styles.selectBox}
                activeOpacity={0.75}
                onPress={() =>
                  openSelect(
                    'Select Unit',
                    ['mL/L', 'g/L', 'L/acre', 'kg/acre', 'g/plant', 'mL/plant'],
                    setUnit
                  )
                }
              >
                <Text style={[styles.selectText, !unit && styles.selectPlaceholder]}>
                  {unit || 'Select'}
                </Text>
                <ChevronDownIcon size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Timing / frequency */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Timing / frequency</Text>
            <TextInput
              style={styles.textInput}
              value={timingFrequency}
              onChangeText={setTimingFrequency}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* ─── Section 3: Safety & restrictions ─── */}
        <Text style={styles.sectionTitle}>Safety & restrictions</Text>
        <View style={styles.cardContainer}>
          {/* Precautions * */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Precautions <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={precautions}
              onChangeText={setPrecautions}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Restrictions and protective measures */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Restrictions and protective measures</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={restrictions}
              onChangeText={setRestrictions}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* ─── Section 4: Review & publish ─── */}
        <Text style={styles.sectionTitle}>Review & publish</Text>
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Save Guide"
          >
            <Text style={styles.saveBtnText}>Save Guide</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ─── Dropdown Picker Modal ─── */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pickerTitle}</Text>
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={pickerOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    pickerOnSelect(item);
                    setShowPicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header Banner
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  backBtn: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    paddingHorizontal: 2,
  },

  // Card Container
  cardContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },

  // Field Group
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
    fontWeight: '800',
  },
  subtextNote: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  textInput: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  multilineInput: {
    height: 76,
    textAlignVertical: 'top',
    paddingTop: 10,
  },

  // Dropdown Select Box
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    height: 44,
  },
  selectText: {
    fontSize: 13.5,
    color: adminColors.ink,
    fontWeight: '500',
  },
  selectPlaceholder: {
    color: '#6B7280',
  },

  // Two Column Row (Dosage & Unit)
  twoColRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginBottom: 14,
  },
  colLeft: {
    flex: 1,
  },
  colRight: {
    flex: 1,
  },

  // Action Buttons
  saveBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  cancelBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '65%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: adminSpacing.md,
    ...adminShadow.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: adminSpacing.xs,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '600',
    color: adminColors.muted,
    paddingHorizontal: 4,
  },
  modalOption: {
    paddingVertical: 13,
    paddingHorizontal: adminSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionText: {
    fontSize: 14.5,
    color: adminColors.ink,
    fontWeight: '500',
  },
});

