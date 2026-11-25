/**
 * M3-S28b Add Activity Category, admin.diary_taxonomy.manage (BR-45).
 *
 * Save is POST /admin/diary/categories (name = Activity Type, key derived from
 * it), then one POST .../sub-activities per configured sub-activity, in order.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import type { Can } from '../../permissions/can';
import { t } from '../../i18n';
import { adminErrorKey } from '../../api/errors';
import { useCreateDiaryCategory } from '../../api/produceHooks';
import { BackArrowIcon, PlusIcon } from './produceIcons';
import { taxonomyKeyFrom } from './produceLogic';

export interface AddActivityCategoryScreenProps {
  can: Can;
  onBack: () => void;
  onSuccess?: (() => void) | undefined;
}

export function AddActivityCategoryScreen({ can, onBack, onSuccess }: AddActivityCategoryScreenProps): React.JSX.Element {
  const canManage = can('admin.diary_taxonomy.manage');
  const [activityType, setActivityType] = useState('');
  const [category, setCategory] = useState('');
  const [activityCrop, setActivityCrop] = useState('');
  const [method, setMethod] = useState('');
  const [description, setDescription] = useState('');
  const [subActivities, setSubActivities] = useState<string[]>([]);
  const createCategory = useCreateDiaryCategory();

  const handleSave = () => {
    if (!canManage) {
      Alert.alert(t('produce.permissionDenied.title'), t('produce.permissionDenied.diaryTaxonomy'));
      return;
    }
    if (!activityType.trim() || !category.trim()) {
      Alert.alert(t('produce.required.title'), t('produce.required.activity'));
      return;
    }
    const key = taxonomyKeyFrom(activityType);
    if (key === '') {
      Alert.alert(t('produce.required.title'), t('produce.required.activity'));
      return;
    }
    createCategory.mutate(
      {
        category: { key, name: activityType.trim(), sortOrder: 0 },
        subActivities: subActivities.map((sub, idx) => ({
          key: `${key}.${taxonomyKeyFrom(sub) || String(idx + 1)}`,
          name: sub,
          sortOrder: idx,
        })),
      },
      {
        onSuccess: () =>
          Alert.alert(t('produce.activity.savedTitle'), t('produce.activity.savedBody'), [
            { text: t('produce.ok'), onPress: () => (onSuccess ? onSuccess() : onBack()) },
          ]),
        onError: (err) => Alert.alert(t('produce.error.title'), t(adminErrorKey(err))),
      },
    );
  };

  const handleAddSubActivity = () => {
    if (Alert.prompt) {
      Alert.prompt(t('produce.activity.addSubTitle'), t('produce.activity.addSubBody'), (text) => {
        if (text?.trim()) setSubActivities((prev) => [...prev, text.trim()]);
      });
    } else {
      setSubActivities((prev) => [...prev, t('produce.activity.subDefault', { n: prev.length + 1 })]);
    }
  };

  const inputWithAdd = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <View style={styles.inputWithBtnRow}>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={adminColors.placeholder}
      />
      <TouchableOpacity style={styles.fieldActionBtn} activeOpacity={0.7}>
        <PlusIcon size={14} color={adminColors.brand} />
        <Text style={styles.fieldActionBtnText}>{t('produce.add')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('produce.back')}
        >
          <BackArrowIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('produce.activity.title')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('produce.activity.section1')}</Text>

        <View style={styles.fieldCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.activity.type')}</Text>
            {inputWithAdd(activityType, setActivityType, t('produce.activity.typePlaceholder'))}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.activity.category')}</Text>
            {inputWithAdd(category, setCategory, t('produce.activity.categoryPlaceholder'))}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.activity.crop')}</Text>
            {inputWithAdd(activityCrop, setActivityCrop, t('produce.activity.cropPlaceholder'))}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.activity.method')}</Text>
            {inputWithAdd(method, setMethod, t('produce.activity.methodPlaceholder'))}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.activity.description')}</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder={t('produce.activity.descriptionPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {subActivities.length > 0 && (
            <View style={styles.subActivitiesList}>
              <Text style={styles.subActivitiesTitle}>{t('produce.activity.configured', { count: subActivities.length })}</Text>
              {subActivities.map((sub, idx) => (
                <View key={`sub-${idx}`} style={styles.subActivityItem}>
                  <Text style={styles.subActivityNum}>{`${idx + 1}.`}</Text>
                  <Text style={styles.subActivityName}>{sub}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.addSubActivityDashedBtn} onPress={handleAddSubActivity} activeOpacity={0.7}>
            <PlusIcon size={16} color={adminColors.brand} />
            <Text style={styles.addSubActivityDashedBtnText}>{t('produce.activity.addSub')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8} disabled={createCategory.isPending}>
          <Text style={styles.saveBtnText}>{t('produce.activity.save')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>{t('produce.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backBtn: { padding: adminSpacing.xs },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  scroll: { flex: 1 },
  scrollContent: { padding: adminSpacing.md },
  sectionTitle: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.sm },
  fieldCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.md,
  },
  fieldGroup: { gap: adminSpacing.xs },
  label: { ...adminType.rowTitle, color: adminColors.ink },
  inputWithBtnRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
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
  fieldActionBtnText: { ...adminType.caption, color: adminColors.brand },
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
  subActivitiesList: { backgroundColor: adminColors.canvas, borderRadius: adminRadius.md, padding: adminSpacing.sm, gap: adminSpacing.xs },
  subActivitiesTitle: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.xs },
  subActivityItem: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xsSm },
  subActivityNum: { ...adminType.caption, color: adminColors.brand, width: 18 },
  subActivityName: { ...adminType.body, color: adminColors.ink },
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
  addSubActivityDashedBtnText: { ...adminType.rowTitle, color: adminColors.brand },
  bottomSpacer: { height: 90 },
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
  saveBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
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
  cancelBtnText: { ...adminType.rowTitle, color: adminColors.ink },
});
