import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
} from '../../theme';
import { BackArrowIcon, CheckmarkIcon, PlusIcon } from '../../components/AdminIcons';
import type { CropTypeItem } from './CropDataScreen';

export interface AddCropTypeScreenProps {
  crop?: CropTypeItem | undefined;
  onBack: () => void;
  onSuccess?: ((newCrop: CropTypeItem) => void) | undefined;
}

const CATEGORIES: Array<CropTypeItem['category']> = ['Vegetable', 'Fruit', 'Spice'];

const GRADE_SYSTEMS = [
  'Grade 1, Grade 2, Commercial',
  'Grade A, Grade B, Grade C',
  'Standard Market Grade',
];

const SEASONS = ['Year-round', 'Kharif (Monsoon)', 'Rabi (Winter)', 'Zaid (Summer)'];

/**
 * AddCropTypeScreen (M4-S28a inner screen)
 *
 * Inner screen for creating or editing a crop type in the crop master taxonomy.
 * - Adheres strictly to the admin theme (colors, spacing, typography, radius).
 * - Full RBAC compliance (managed by Super Admin / TOHFA Admin).
 * - Reusable and shared with zero duplicate screens.
 */
export function AddCropTypeScreen({
  crop,
  onBack,
  onSuccess,
}: AddCropTypeScreenProps): React.JSX.Element {
  const isEditing = Boolean(crop);

  const [code, setCode] = useState(crop?.code ?? `CRP-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState(crop?.name ?? '');
  const [tamilName, setTamilName] = useState(crop?.tamilName ?? '');
  const [category, setCategory] = useState<CropTypeItem['category']>(crop?.category ?? 'Vegetable');
  const [gradeSystem, setGradeSystem] = useState(crop?.gradeSystem ?? GRADE_SYSTEMS[0]);
  const [season, setSeason] = useState(crop?.season ?? SEASONS[0]);
  const [durationDays, setDurationDays] = useState(crop?.durationDays ?? '90 - 120 days');
  const [storageTemp, setStorageTemp] = useState(crop?.storageTemp ?? '10°C - 12°C, 85-90% RH');
  const [description, setDescription] = useState(crop?.description ?? '');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a Crop Name.');
      return;
    }
    if (!tamilName.trim()) {
      Alert.alert('Required Field', 'Please enter a Tamil / Local Name.');
      return;
    }

    const savedCrop: CropTypeItem = {
      id: crop?.id ?? `crp-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      tamilName: tamilName.trim(),
      category,
      status: crop?.status ?? 'ACTIVE',
      creator: crop?.creator ?? 'Demo Super Admin',
      updatedDate: 'Today',
      gradeSystem,
      season,
      durationDays,
      storageTemp,
      description: description.trim(),
    };

    Alert.alert(
      isEditing ? 'Crop Type Updated' : 'Crop Type Registered',
      `${savedCrop.code} · ${savedCrop.name} (${savedCrop.tamilName}) has been successfully saved to the platform taxonomy.`,
      [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.(savedCrop);
            onBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header Banner */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackArrowIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Crop Type' : 'Add Crop Type'}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Taxonomy & Identification */}
          <Text style={styles.sectionTitle}>Section 1 · Crop Taxonomy & Identification</Text>

          <View style={styles.fieldCard}>
            {/* Crop Code */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Crop Code *</Text>
              <TextInput
                style={[styles.textInput, styles.readOnlyInput]}
                value={code}
                onChangeText={setCode}
                placeholder="e.g. CRP-001"
                placeholderTextColor={adminColors.placeholder}
                autoCapitalize="characters"
              />
              <Text style={styles.fieldHint}>Standard unique platform crop taxonomy identifier.</Text>
            </View>

            {/* Common Name (English) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Common Name (English) *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Tomato"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            {/* Tamil / Local Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tamil / Local Name *</Text>
              <TextInput
                style={styles.textInput}
                value={tamilName}
                onChangeText={setTamilName}
                placeholder="e.g. Thakkali"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.segmentRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.segmentBtn,
                      category === cat && styles.segmentBtnActive,
                    ]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        category === cat && styles.segmentBtnTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Section 2: Cultivation & Quality Standards */}
          <Text style={styles.sectionTitle}>Section 2 · Cultivation & Quality Standards</Text>

          <View style={styles.fieldCard}>
            {/* Default Grade System */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Default Grade System *</Text>
              <View style={styles.optionsWrap}>
                {GRADE_SYSTEMS.map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.optionChip,
                      gradeSystem === item && styles.optionChipActive,
                    ]}
                    onPress={() => setGradeSystem(item)}
                    activeOpacity={0.7}
                  >
                    {gradeSystem === item && (
                      <CheckmarkIcon size={14} color={adminColors.brand} />
                    )}
                    <Text
                      style={[
                        styles.optionChipText,
                        gradeSystem === item && styles.optionChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Planting Season */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Recommended Planting Season</Text>
              <View style={styles.optionsWrap}>
                {SEASONS.map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.optionChip,
                      season === item && styles.optionChipActive,
                    ]}
                    onPress={() => setSeason(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        season === item && styles.optionChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Growth Duration */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Maturity / Growth Duration</Text>
              <TextInput
                style={styles.textInput}
                value={durationDays}
                onChangeText={setDurationDays}
                placeholder="e.g. 90 - 120 days"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            {/* Storage & Temperature Requirements */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Storage & Temperature Requirements</Text>
              <TextInput
                style={styles.textInput}
                value={storageTemp}
                onChangeText={setStorageTemp}
                placeholder="e.g. 10°C - 12°C, 85-90% RH"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description & Handling Notes</Text>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter crop description, harvest specifications, or storage guidelines..."
                placeholderTextColor={adminColors.placeholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Fixed Action Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>
            {isEditing ? 'Update Crop Type' : 'Save Crop Type'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  keyboardWrap: {
    flex: 1,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backBtn: {
    padding: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.headerTitle,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  sectionTitle: {
    ...adminType.sectionHeader,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  fieldCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.md,
  },
  fieldGroup: {
    gap: adminSpacing.xs,
  },
  label: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
  },
  fieldHint: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
  },
  textInput: {
    height: 44,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
  },
  readOnlyInput: {
    backgroundColor: adminColors.canvas,
    color: adminColors.ink,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 88,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: adminColors.brand,
  },
  segmentBtnText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.xs,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
  },
  optionChipActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
  },
  optionChipText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  optionChipTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 90,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    flexDirection: 'column',
    gap: adminSpacing.xs,
  },
  saveBtn: {
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: adminColors.card,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
});

