import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import {
  BackArrowIcon,
  CheckmarkIcon,
  ChevronDownIcon,
  CloseIcon,
  PlusIcon,
} from '../../components/AdminIcons';
import type { DiaryActivityItem } from './CropDataScreen';

export interface AddActivityCategoryScreenProps {
  activity?: DiaryActivityItem | undefined;
  isViewOnly?: boolean | undefined;
  onBack: () => void;
  onSuccess?: ((savedActivity?: DiaryActivityItem) => void) | undefined;
}

const ACTIVITY_TYPE_OPTIONS = [
  'Land Prep',
  'Sowing',
  'Irrigation & Drainage',
  'Weeding & Thinning',
  'Nutrient Application',
  'Pest & Disease Control',
  'Harvesting',
  'Post-Harvest Handling',
];

const CATEGORY_OPTIONS = [
  'Soil Management',
  'Crop Establishment',
  'Water Management',
  'Plant Protection',
  'Nutrient Management',
  'Harvesting & Storage',
];

const ACTIVITY_CROP_OPTIONS = [
  'All Crops',
  'Vegetables Only',
  'Fruits Only',
  'Spices & Condiments',
  'Root & Tuber Crops',
];

const METHOD_OPTIONS = [
  'Manual / Tiller',
  'Mechanized (Tractor)',
  'Automated Drip / Sprinkler',
  'Traditional Hand-Tool',
  'Integrated Method',
  'Manual Transplanting',
  'Foliar Spraying / Drenching',
  'Hand Weeding',
];

interface DropdownModalState {
  key: 'activityType' | 'category' | 'activityCrop' | 'method';
  title: string;
  options: string[];
}

/**
 * M3-S28b · Add / Edit Activity Category screen
 * Matching exact reference mockup: Image 5 left & User requirements
 */
export function AddActivityCategoryScreen({
  activity,
  isViewOnly = false,
  onBack,
  onSuccess,
}: AddActivityCategoryScreenProps): React.JSX.Element {
  const isEditing = Boolean(activity && !isViewOnly);
  const [activityType, setActivityType] = useState(activity?.categoryName ?? 'Land Prep');
  const [category, setCategory] = useState(
    activity?.id === 'da-2'
      ? 'Crop Establishment'
      : activity?.id === 'da-3'
      ? 'Water Management'
      : 'Soil Management'
  );
  const [activityCrop, setActivityCrop] = useState('All Crops');
  const [method, setMethod] = useState(
    activity?.id === 'da-2'
      ? 'Manual Transplanting'
      : activity?.id === 'da-3'
      ? 'Drip / Sprinkler Automation'
      : 'Manual / Tiller'
  );
  const [description, setDescription] = useState(
    activity?.description && activity.description !== '—' ? activity.description : ''
  );
  const [subActivities, setSubActivities] = useState<string[]>(
    activity?.id === 'da-2'
      ? ['Direct Sowing', 'Transplanting']
      : activity?.id === 'da-3'
      ? ['Drip Irrigation', 'Sprinkler Check', 'Furrow Cleaning', 'Drainage Maintenance']
      : [
          'Primary Tillage',
          'Bed Preparation',
          'Basal Fertilizer Application',
        ]
  );

  const [newSubText, setNewSubText] = useState('');
  const [showAddSubInput, setShowAddSubInput] = useState(false);
  const [activeModal, setActiveModal] = useState<DropdownModalState | null>(null);

  const handleSelectOption = (opt: string) => {
    if (!activeModal) return;
    if (activeModal.key === 'activityType') {
      setActivityType(opt);
    } else if (activeModal.key === 'category') {
      setCategory(opt);
    } else if (activeModal.key === 'activityCrop') {
      setActivityCrop(opt);
    } else if (activeModal.key === 'method') {
      setMethod(opt);
    }
    setActiveModal(null);
  };

  const getSelectedValueForActiveModal = () => {
    if (!activeModal) return '';
    if (activeModal.key === 'activityType') return activityType;
    if (activeModal.key === 'category') return category;
    if (activeModal.key === 'activityCrop') return activityCrop;
    if (activeModal.key === 'method') return method;
    return '';
  };

  const handleSave = () => {
    if (!activityType.trim() || !category.trim()) {
      Alert.alert('Required Fields', 'Please complete Activity Type and Category.');
      return;
    }
    const savedItem: DiaryActivityItem = {
      id: activity?.id ?? `act-${Date.now()}`,
      code: activity?.code ?? `DA0${Math.floor(Math.random() * 90 + 10)}`,
      categoryName: activityType.trim(),
      subActivityCount: subActivities.length,
      description: description.trim() || '—',
      status: activity?.status ?? 'ACTIVE',
      createdBy: activity?.createdBy ?? 'Demo Super Admin',
      lastUpdated: 'Today',
    };

    onSuccess?.(savedItem);
    onBack();
  };

  const handleAddSubActivity = () => {
    if (newSubText.trim()) {
      setSubActivities((prev) => [...prev, newSubText.trim()]);
      setNewSubText('');
      setShowAddSubInput(false);
    } else {
      setShowAddSubInput(true);
    }
  };

  const handleRemoveSubActivity = (idx: number) => {
    setSubActivities((prev) => prev.filter((_, i) => i !== idx));
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
          {isViewOnly ? 'Activity Category Details' : isEditing ? 'Edit Activity Category' : 'Add Activity Category'}
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
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Section 1 · Category details</Text>

          <View style={styles.fieldCard}>
            {/* Activity Type Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Activity Type *</Text>
              <TouchableOpacity
                style={[styles.dropdownBtn, isViewOnly && styles.readOnlyInput]}
                onPress={() =>
                  !isViewOnly &&
                  setActiveModal({
                    key: 'activityType',
                    title: 'Select Activity Type',
                    options: ACTIVITY_TYPE_OPTIONS,
                  })
                }
                activeOpacity={0.7}
                disabled={isViewOnly}
              >
                <Text style={styles.dropdownBtnText}>{activityType}</Text>
                <ChevronDownIcon size={18} color={isViewOnly ? adminColors.muted : adminColors.brand} />
              </TouchableOpacity>
            </View>

            {/* Category Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity
                style={[styles.dropdownBtn, isViewOnly && styles.readOnlyInput]}
                onPress={() =>
                  !isViewOnly &&
                  setActiveModal({
                    key: 'category',
                    title: 'Select Category',
                    options: CATEGORY_OPTIONS,
                  })
                }
                activeOpacity={0.7}
                disabled={isViewOnly}
              >
                <Text style={styles.dropdownBtnText}>{category}</Text>
                <ChevronDownIcon size={18} color={isViewOnly ? adminColors.muted : adminColors.brand} />
              </TouchableOpacity>
            </View>

            {/* Activity crop Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Activity crop *</Text>
              <TouchableOpacity
                style={[styles.dropdownBtn, isViewOnly && styles.readOnlyInput]}
                onPress={() =>
                  !isViewOnly &&
                  setActiveModal({
                    key: 'activityCrop',
                    title: 'Select Activity Crop',
                    options: ACTIVITY_CROP_OPTIONS,
                  })
                }
                activeOpacity={0.7}
                disabled={isViewOnly}
              >
                <Text style={styles.dropdownBtnText}>{activityCrop}</Text>
                <ChevronDownIcon size={18} color={isViewOnly ? adminColors.muted : adminColors.brand} />
              </TouchableOpacity>
            </View>

            {/* Method Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Method *</Text>
              <TouchableOpacity
                style={[styles.dropdownBtn, isViewOnly && styles.readOnlyInput]}
                onPress={() =>
                  !isViewOnly &&
                  setActiveModal({
                    key: 'method',
                    title: 'Select Method',
                    options: METHOD_OPTIONS,
                  })
                }
                activeOpacity={0.7}
                disabled={isViewOnly}
              >
                <Text style={styles.dropdownBtnText}>{method}</Text>
                <ChevronDownIcon size={18} color={isViewOnly ? adminColors.muted : adminColors.brand} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.textArea, isViewOnly && styles.readOnlyInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter category description..."
                placeholderTextColor={adminColors.placeholder}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isViewOnly}
              />
            </View>

            {/* Sub activities preview */}
            {subActivities.length > 0 && (
              <View style={styles.subActivitiesList}>
                <Text style={styles.subActivitiesTitle}>
                  Configured Sub-Activities ({subActivities.length})
                </Text>
                {subActivities.map((sub, idx) => (
                  <View key={`sub-${idx}`} style={styles.subActivityItem}>
                    <Text style={styles.subActivityNum}>{idx + 1}.</Text>
                    <Text style={styles.subActivityName}>{sub}</Text>
                    {!isViewOnly && (
                      <TouchableOpacity
                        onPress={() => handleRemoveSubActivity(idx)}
                        style={styles.removeSubBtn}
                        activeOpacity={0.7}
                        accessibilityLabel={`Remove ${sub}`}
                      >
                        <CloseIcon size={14} color={adminColors.danger.text} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Inline add sub-activity input or button */}
            {!isViewOnly && showAddSubInput && (
              <View style={styles.inlineAddSubRow}>
                <TextInput
                  style={styles.inlineSubInput}
                  value={newSubText}
                  onChangeText={setNewSubText}
                  placeholder="Enter sub-activity name..."
                  placeholderTextColor={adminColors.placeholder}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.inlineSubAddBtn}
                  onPress={handleAddSubActivity}
                  activeOpacity={0.7}
                >
                  <Text style={styles.inlineSubAddBtnText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inlineSubCancelBtn}
                  onPress={() => {
                    setNewSubText('');
                    setShowAddSubInput(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.inlineSubCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isViewOnly && !showAddSubInput && (
              <TouchableOpacity
                style={styles.addSubActivityDashedBtn}
                onPress={() => setShowAddSubInput(true)}
                activeOpacity={0.7}
              >
                <PlusIcon size={16} color={adminColors.brand} />
                <Text style={styles.addSubActivityDashedBtnText}>Add Sub-Activity</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Button Bar */}
      <View style={styles.bottomBar}>
        {isViewOnly ? (
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Close</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>
                {isEditing ? 'Save Changes' : 'Save Activity'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onBack}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Dropdown Options Modal */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeModal?.title}</Text>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close picker"
              >
                <CloseIcon size={20} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {activeModal?.options.map((opt) => {
                const isSelected = opt === getSelectedValueForActiveModal();
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.modalOptionRow, isSelected && styles.modalOptionRowSelected]}
                    onPress={() => handleSelectOption(opt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                    {isSelected && <CheckmarkIcon size={16} color={adminColors.brand} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontWeight: '700',
    marginBottom: adminSpacing.sm,
  },
  fieldCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.md,
  },
  fieldGroup: {
    gap: adminSpacing.xs,
  },
  label: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
  },
  dropdownBtn: {
    height: 48,
    backgroundColor: '#F7F5EE',
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: '#E8E3D9',
    paddingHorizontal: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownBtnText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    paddingBottom: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  modalTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '700',
  },
  modalScroll: {
    maxHeight: 340,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm + 2,
    paddingHorizontal: adminSpacing.sm,
    borderRadius: adminRadius.sm,
    marginVertical: 2,
  },
  modalOptionRowSelected: {
    backgroundColor: adminColors.brandTint,
  },
  modalOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  modalOptionTextSelected: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  inputWithBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  textInput: {
    flex: 1,
    height: 46,
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
    color: adminColors.muted,
  },
  fieldActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    height: 46,
    backgroundColor: adminColors.card,
  },
  fieldActionBtnText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },
  textArea: {
    height: 96,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
  },
  subActivitiesList: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: adminSpacing.sm,
    gap: 6,
  },
  subActivitiesTitle: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '700',
    marginBottom: 4,
  },
  subActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subActivityNum: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
    width: 18,
  },
  subActivityName: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
  },
  removeSubBtn: {
    padding: 4,
  },
  inlineAddSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginTop: adminSpacing.xs,
  },
  inlineSubInput: {
    flex: 1,
    height: 42,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.brand,
    paddingHorizontal: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
  },
  inlineSubAddBtn: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.sm,
    height: 42,
    borderRadius: adminRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineSubAddBtnText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  inlineSubCancelBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    height: 42,
    borderRadius: adminRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineSubCancelBtnText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
  },
  addSubActivityDashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm,
    backgroundColor: adminColors.brandTint,
    marginTop: adminSpacing.xs,
  },
  addSubActivityDashedBtnText: {
    ...adminType.rowTitle,
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
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.md,
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
  },
});

