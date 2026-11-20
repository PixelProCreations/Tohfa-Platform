import React, { useState } from 'react';
import {
  FlatList,
  Modal,
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
  type ApplicationTreatmentGuideItem,
  INITIAL_TREATMENT_GUIDES,
} from './ApplicationTreatmentGuidesScreen';
import {
  BackArrowIcon,
  ChevronDownIcon,
} from './inputsIcons';

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
  initialGuide?: ApplicationTreatmentGuideItem | ApplicationGuideDraft | null | undefined;
  isEditing?: boolean;
}

export function AddNewGuideScreen({
  onBack,
  onSave,
  initialGuide,
  isEditing = false,
}: AddNewGuideScreenProps): React.JSX.Element {
  const guideItem = initialGuide as (ApplicationTreatmentGuideItem & Partial<ApplicationGuideDraft>) | undefined;

  // Section 1: Overview
  const [guideTitle, setGuideTitle] = useState(guideItem?.guideTitle || guideItem?.title || '');
  const [guideType, setGuideType] = useState(guideItem?.guideType || '');
  const [linkedInput, setLinkedInput] = useState(guideItem?.linkedInput || guideItem?.linkedItem || '');
  const [linkedPestDisease, setLinkedPestDisease] = useState(guideItem?.linkedPestDisease || guideItem?.linkedItem || '');
  const [applicableCrops, setApplicableCrops] = useState(guideItem?.applicableCrops || guideItem?.crops || '');
  const [growingStage, setGrowingStage] = useState(guideItem?.growingStage || 'Vegetative stage');

  // Section 2: Instructions
  const [applicationMethod, setApplicationMethod] = useState(guideItem?.applicationMethod || 'Foliar spray');
  const [instructions, setInstructions] = useState(guideItem?.instructions || 'Apply thoroughly on upper and lower leaf surfaces.');
  const [dosage, setDosage] = useState(guideItem?.dosage || '5');
  const [unit, setUnit] = useState(guideItem?.unit || 'mL/L');
  const [timingFrequency, setTimingFrequency] = useState(guideItem?.timingFrequency || 'Every 7-10 days, early morning');

  // Section 3: Safety & restrictions
  const [precautions, setPrecautions] = useState(guideItem?.precautions || 'Wear protective mask and gloves.');
  const [restrictions, setRestrictions] = useState(guideItem?.restrictions || 'Do not spray during peak noon heat.');

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
    if (isEditing && initialGuide) {
      if ('title' in initialGuide) {
        initialGuide.title = guideTitle.trim() || initialGuide.title;
        initialGuide.guideType = (guideType as 'Input Application' | 'Pest Treatment') || initialGuide.guideType;
        initialGuide.linkedItem = linkedInput || linkedPestDisease || initialGuide.linkedItem;
        initialGuide.crops = applicableCrops || initialGuide.crops;

        const idx = INITIAL_TREATMENT_GUIDES.findIndex((g) => g.id === initialGuide.id);
        if (idx !== -1) {
          INITIAL_TREATMENT_GUIDES[idx] = { ...initialGuide };
        }
      }
      const draft: ApplicationGuideDraft = {
        id: (initialGuide && 'id' in initialGuide && initialGuide.id) ? initialGuide.id : ('GUIDE-' + Date.now()),
        guideTitle: guideTitle.trim() || 'Application Guide',
        guideType: guideType || 'Input Application',
        linkedInput: linkedInput || '',
        linkedPestDisease: linkedPestDisease || '',
        applicableCrops: applicableCrops || '',
        growingStage: growingStage || '',
        applicationMethod: applicationMethod || '',
        instructions: instructions || '',
        dosage: dosage || '',
        unit: unit || '',
        timingFrequency: timingFrequency || '',
        precautions: precautions || '',
        restrictions: restrictions || '',
      };

      if (onSave) {
        onSave(draft);
      } else {
        onBack();
      }
      return;
    }

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
    <View style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
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
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Guide' : 'Add New Guide'}</Text>
        </View>
      </View>

      {/* Scroll Form Container */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Overview */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.cardContainer}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Guide title <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={guideTitle}
              onChangeText={setGuideTitle}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

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
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

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
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
            <Text style={styles.subtextNote}>Only approved inputs are offered.</Text>
          </View>

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
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

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
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

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
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Instructions */}
        <Text style={styles.sectionTitle}>Instructions</Text>
        <View style={styles.cardContainer}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Application method <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={applicationMethod}
              onChangeText={setApplicationMethod}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

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
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={styles.twoColRow}>
            <View style={styles.colLeft}>
              <Text style={styles.label}>Dosage</Text>
              <TextInput
                style={styles.textInput}
                value={dosage}
                onChangeText={setDosage}
                placeholderTextColor={adminColors.placeholder}
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
                <ChevronDownIcon size={18} color={adminColors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Timing / frequency</Text>
            <TextInput
              style={styles.textInput}
              value={timingFrequency}
              onChangeText={setTimingFrequency}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>
        </View>

        {/* Section 3: Safety & restrictions */}
        <Text style={styles.sectionTitle}>Safety & restrictions</Text>
        <View style={styles.cardContainer}>
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
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Restrictions and protective measures</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={restrictions}
              onChangeText={setRestrictions}
              multiline
              numberOfLines={3}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Save Guide'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          activeOpacity={0.85}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* Picker Modal */}
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
              <TouchableOpacity onPress={() => setShowPicker(false)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={pickerOptions}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    pickerOnSelect(item);
                    setShowPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export function EditGuideScreen(props: AddNewGuideScreenProps): React.JSX.Element {
  return <AddNewGuideScreen {...props} isEditing={true} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
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
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    paddingHorizontal: 2,
  },
  cardContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    ...adminType.caption,
    color: adminColors.ink,
    marginBottom: 6,
  },
  requiredStar: {
    color: adminColors.danger.text,
    fontWeight: '800',
  },
  subtextNote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  textInput: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    height: 44,
    ...adminType.body,
    color: adminColors.ink,
  },
  multilineInput: {
    height: 76,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    height: 44,
  },
  selectText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  selectPlaceholder: {
    color: adminColors.placeholder,
  },
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
  saveBtn: {
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  saveBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  cancelBtn: {
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  cancelBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '65%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    ...adminShadow.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    marginBottom: adminSpacing.xs,
  },
  modalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  modalCloseText: {
    ...adminType.title,
    color: adminColors.muted,
    paddingHorizontal: 4,
  },
  modalOption: {
    paddingVertical: 13,
    paddingHorizontal: adminSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  modalOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
});
