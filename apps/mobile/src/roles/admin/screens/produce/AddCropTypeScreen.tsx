/**
 * Add / Edit Crop Type (M4-S28a inner screen), admin.crop_taxonomy.manage.
 *
 * Sends what crop_master stores: code (slug, create only), common name, Tamil
 * name and category (POST / PATCH /admin/crop-master). Grade system, planting
 * season, growth duration, storage and description are drawn as designed but
 * crop_master has no column for them, so they are not sent.
 */
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
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import type { Can } from '../../permissions/can';
import { t, type TranslationKey } from '../../i18n';
import { adminErrorKey } from '../../api/errors';
import { CROP_SLUG_RE } from '../../api/produce';
import { useCatalogCategories, useCreateCropMaster, useUpdateCropMaster } from '../../api/produceHooks';
import { BackArrowIcon, CheckmarkIcon } from './produceIcons';
import type { CropTypeItem } from './CropDataScreen';
import { CATEGORY_SLUG, DESIGN_CROP_CATEGORIES, cropSlugFrom, type DesignCropCategory } from './produceLogic';

export interface AddCropTypeScreenProps {
  can: Can;
  crop?: CropTypeItem | undefined;
  onBack: () => void;
  onSuccess?: (() => void) | undefined;
}

const CATEGORY_LABEL: Record<DesignCropCategory, TranslationKey> = {
  Vegetable: 'produce.category.Vegetable',
  Fruit: 'produce.category.Fruit',
  Spice: 'produce.category.Spice',
};

const GRADE_SYSTEMS: readonly TranslationKey[] = [
  'produce.addCrop.grade.numbered',
  'produce.addCrop.grade.lettered',
  'produce.addCrop.grade.standard',
];

const SEASONS: readonly TranslationKey[] = [
  'produce.addCrop.season.yearRound',
  'produce.addCrop.season.kharif',
  'produce.addCrop.season.rabi',
  'produce.addCrop.season.zaid',
];

export function AddCropTypeScreen({ can, crop, onBack, onSuccess }: AddCropTypeScreenProps): React.JSX.Element {
  const isEditing = Boolean(crop);
  const canManage = can('admin.crop_taxonomy.manage');

  const [code, setCode] = useState(crop?.code ?? '');
  const [name, setName] = useState(crop?.name ?? '');
  const [tamilName, setTamilName] = useState(crop?.tamilName ?? '');
  const [category, setCategory] = useState<DesignCropCategory | undefined>(crop ? crop.category : 'Vegetable');
  const [gradeSystem, setGradeSystem] = useState<TranslationKey | undefined>(undefined);
  const [season, setSeason] = useState<TranslationKey | undefined>(undefined);
  const [durationDays, setDurationDays] = useState('');
  const [storageTemp, setStorageTemp] = useState('');
  const [description, setDescription] = useState('');

  const categories = useCatalogCategories({ enabled: canManage });
  const createCrop = useCreateCropMaster();
  const updateCrop = useUpdateCropMaster();
  const isPending = createCrop.isPending || updateCrop.isPending;

  const finish = () => {
    const title = isEditing ? t('produce.addCrop.updated') : t('produce.addCrop.registered');
    Alert.alert(title, t('produce.addCrop.savedBody', { name: name.trim() }), [
      { text: t('produce.ok'), onPress: () => (onSuccess ? onSuccess() : onBack()) },
    ]);
  };
  const showError = (err: unknown) => Alert.alert(t('produce.error.title'), t(adminErrorKey(err)));

  const handleSave = () => {
    if (!canManage) {
      Alert.alert(t('produce.permissionDenied.title'), t('produce.permissionDenied.cropTaxonomy'));
      return;
    }
    if (!name.trim()) {
      Alert.alert(t('produce.required.title'), t('produce.required.cropName'));
      return;
    }
    if (!tamilName.trim()) {
      Alert.alert(t('produce.required.title'), t('produce.required.tamilName'));
      return;
    }
    const categoryId =
      category === undefined ? crop?.categoryId : categories.data?.items.find((c) => c.slug === CATEGORY_SLUG[category])?.id;
    if (categoryId === undefined) {
      Alert.alert(t('produce.error.title'), t('produce.error.categoryUnavailable'));
      return;
    }
    if (crop) {
      updateCrop.mutate(
        { id: crop.id, body: { name: name.trim(), nameTa: tamilName.trim(), categoryId } },
        { onSuccess: finish, onError: showError },
      );
      return;
    }
    const slug = cropSlugFrom(code);
    if (!CROP_SLUG_RE.test(slug)) {
      Alert.alert(t('produce.required.title'), t('produce.required.cropCode'));
      return;
    }
    createCrop.mutate({ slug, name: name.trim(), nameTa: tamilName.trim(), categoryId }, { onSuccess: finish, onError: showError });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

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
        <Text style={styles.headerTitle}>{isEditing ? t('produce.addCrop.titleEdit') : t('produce.addCrop.titleAdd')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardWrap}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>{t('produce.addCrop.section1')}</Text>

          <View style={styles.fieldCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('produce.addCrop.code')}</Text>
              <TextInput
                style={[styles.textInput, styles.readOnlyInput]}
                value={code}
                onChangeText={setCode}
                editable={!isEditing}
                placeholder={t('produce.addCrop.codePlaceholder')}
                placeholderTextColor={adminColors.placeholder}
                autoCapitalize="none"
              />
              <Text style={styles.fieldHint}>{t('produce.addCrop.codeHint')}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('produce.addCrop.name')}</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder={t('produce.addCrop.namePlaceholder')}
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('produce.addCrop.tamil')}</Text>
              <TextInput
                style={styles.textInput}
                value={tamilName}
                onChangeText={setTamilName}
                placeholder={t('produce.addCrop.tamilPlaceholder')}
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('produce.addCrop.category')}</Text>
              <View style={styles.segmentRow}>
                {DESIGN_CROP_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.segmentBtn, category === cat && styles.segmentBtnActive]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.segmentBtnText, category === cat && styles.segmentBtnTextActive]}>
                      {t(CATEGORY_LABEL[cat])}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('produce.addCrop.section2')}</Text>

          <View style={styles.fieldCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('produce.addCrop.gradeSystem')}</Text>
              <View style={styles.optionsWrap}>
                {GRADE_SYSTEMS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.optionChip, gradeSystem === item && styles.optionChipActive]}
                    onPress={() => setGradeSystem(item)}
                    activeOpacity={0.7}
                  >
                    {gradeSystem === item && <CheckmarkIcon size={14} color={adminColors.brand} />}
                    <Text style={[styles.optionChipText, gradeSystem === item && styles.optionChipTextActive]}>{t(item)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('produce.addCrop.season')}</Text>
              <View style={styles.optionsWrap}>
                {SEASONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.optionChip, season === item && styles.optionChipActive]}
                    onPress={() => setSeason(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionChipText, season === item && styles.optionChipTextActive]}>{t(item)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('produce.addCrop.duration')}</Text>
              <TextInput
                style={styles.textInput}
                value={durationDays}
                onChangeText={setDurationDays}
                placeholder={t('produce.addCrop.durationPlaceholder')}
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('produce.addCrop.storage')}</Text>
              <TextInput
                style={styles.textInput}
                value={storageTemp}
                onChangeText={setStorageTemp}
                placeholder={t('produce.addCrop.storagePlaceholder')}
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('produce.addCrop.description')}</Text>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder={t('produce.addCrop.descriptionPlaceholder')}
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

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8} disabled={isPending}>
          <Text style={styles.saveBtnText}>{isEditing ? t('produce.addCrop.update') : t('produce.addCrop.save')}</Text>
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
  keyboardWrap: { flex: 1 },
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
  sectionTitle: {
    ...adminType.sectionHead,
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
  fieldGroup: { gap: adminSpacing.xs },
  label: { ...adminType.caption, color: adminColors.ink },
  fieldHint: { ...adminType.rowMeta, color: adminColors.muted },
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
  readOnlyInput: { backgroundColor: adminColors.canvas, color: adminColors.ink, fontWeight: '600' },
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
    gap: adminSpacing.xs,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
  },
  segmentBtnActive: { backgroundColor: adminColors.brand },
  segmentBtnText: { ...adminType.caption, color: adminColors.muted },
  segmentBtnTextActive: { color: adminColors.onBrand },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.xs },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
  },
  optionChipActive: { borderColor: adminColors.brand, backgroundColor: adminColors.card },
  optionChipText: { ...adminType.caption, color: adminColors.ink },
  optionChipTextActive: { color: adminColors.brand },
  bottomSpacer: { height: 90 },
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
  saveBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
  cancelBtn: {
    backgroundColor: adminColors.card,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { ...adminType.rowTitle, color: adminColors.ink },
});
