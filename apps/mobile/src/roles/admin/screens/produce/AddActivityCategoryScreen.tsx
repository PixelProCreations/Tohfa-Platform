import React, { useState } from 'react';
import {
  Alert,
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
import { BackArrowIcon, PlusIcon } from '../../components/AdminIcons';

export interface AddActivityCategoryScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

/**
 * M3-S28b · Add Activity Category screen
 * Matching exact reference mockup: Image 5 left
 */
export function AddActivityCategoryScreen({
  onBack,
  onSuccess,
}: AddActivityCategoryScreenProps): React.JSX.Element {
  const [activityType, setActivityType] = useState('Land Prep');
  const [category, setCategory] = useState('Soil Management');
  const [activityCrop, setActivityCrop] = useState('All Crops');
  const [method, setMethod] = useState('Manual / Tiller');
  const [description, setDescription] = useState('');
  const [subActivities, setSubActivities] = useState<string[]>([
    'Primary Tillage',
    'Bed Preparation',
    'Basal Fertilizer Application',
  ]);

  const handleSave = () => {
    if (!activityType.trim() || !category.trim()) {
      Alert.alert('Required Fields', 'Please complete Activity Type and Category.');
      return;
    }
    Alert.alert(
      'Activity Saved',
      'The activity category has been registered in the farm diary taxonomy.',
      [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.();
            onBack();
          },
        },
      ]
    );
  };

  const handleAddSubActivity = () => {
    Alert.prompt
      ? Alert.prompt('Add Sub-Activity', 'Enter sub-activity name:', text => {
          if (text?.trim()) setSubActivities(prev => [...prev, text.trim()]);
        })
      : setSubActivities(prev => [...prev, `Sub-Activity ${prev.length + 1}`]);
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
        <Text style={styles.headerTitle}>Add Activity Category</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Section 1 · Category details</Text>

        <View style={styles.fieldCard}>
          {/* Activity Type */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Activity Type *</Text>
            <View style={styles.inputWithBtnRow}>
              <TextInput
                style={styles.textInput}
                value={activityType}
                onChangeText={setActivityType}
                placeholder="e.g. Land Prep"
                placeholderTextColor={adminColors.placeholder}
              />
              <TouchableOpacity style={styles.fieldActionBtn} activeOpacity={0.7}>
                <PlusIcon size={14} color={adminColors.brand} />
                <Text style={styles.fieldActionBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.inputWithBtnRow}>
              <TextInput
                style={styles.textInput}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g. Soil Management"
                placeholderTextColor={adminColors.placeholder}
              />
              <TouchableOpacity style={styles.fieldActionBtn} activeOpacity={0.7}>
                <PlusIcon size={14} color={adminColors.brand} />
                <Text style={styles.fieldActionBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Activity crop */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Activity crop *</Text>
            <View style={styles.inputWithBtnRow}>
              <TextInput
                style={styles.textInput}
                value={activityCrop}
                onChangeText={setActivityCrop}
                placeholder="e.g. All Crops"
                placeholderTextColor={adminColors.placeholder}
              />
              <TouchableOpacity style={styles.fieldActionBtn} activeOpacity={0.7}>
                <PlusIcon size={14} color={adminColors.brand} />
                <Text style={styles.fieldActionBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Method */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Method *</Text>
            <View style={styles.inputWithBtnRow}>
              <TextInput
                style={styles.textInput}
                value={method}
                onChangeText={setMethod}
                placeholder="e.g. Manual / Tiller"
                placeholderTextColor={adminColors.placeholder}
              />
              <TouchableOpacity style={styles.fieldActionBtn} activeOpacity={0.7}>
                <PlusIcon size={14} color={adminColors.brand} />
                <Text style={styles.fieldActionBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter category description..."
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Sub activities preview */}
          {subActivities.length > 0 && (
            <View style={styles.subActivitiesList}>
              <Text style={styles.subActivitiesTitle}>Configured Sub-Activities ({subActivities.length})</Text>
              {subActivities.map((sub, idx) => (
                <View key={`sub-${idx}`} style={styles.subActivityItem}>
                  <Text style={styles.subActivityNum}>{idx + 1}.</Text>
                  <Text style={styles.subActivityName}>{sub}</Text>
                </View>
              ))}
            </View>
          )}

          {/* + Add Sub-Activity button */}
          <TouchableOpacity
            style={styles.addSubActivityDashedBtn}
            onPress={handleAddSubActivity}
            activeOpacity={0.7}
          >
            <PlusIcon size={16} color={adminColors.brand} />
            <Text style={styles.addSubActivityDashedBtnText}>Add Sub-Activity</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Button Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>Save Activity</Text>
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
    gap: 4,
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
    ...adminType.body,
    color: adminColors.ink,
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

