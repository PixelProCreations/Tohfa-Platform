/**
 * Crop Data (M4-S28a Crop Types, M4-S28b Diary Activity, M4-S28c Platform Events).
 *
 * Data:
 *  - Crop types: GET /admin/crop-master (admin.crop_taxonomy.manage), category
 *    names from GET /catalog/categories; Activate / Deactivate is PATCH isActive.
 *  - Diary activity: the server has no admin list of diary categories, so the
 *    KPIs and list draw dashes; Add Activity Category writes for real.
 *  - Platform events: GET /admin/platform-events (platform.event.manage);
 *    Remove is DELETE.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
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
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import type { Can } from '../../permissions/can';
import { t, type TranslationKey } from '../../i18n';
import { adminErrorKey } from '../../api/errors';
import { todayInIndia } from '../../api/pricingMappers';
import type { PlatformEventAudience, PlatformEventDto, PlatformEventType } from '../../api/produce';
import {
  useCatalogCategories,
  useCreateCropMaster,
  useCropMasterList,
  useDeletePlatformEvent,
  usePlatformEventList,
  useUpdateCropMaster,
} from '../../api/produceHooks';
import { OverviewCardsGrid, OverviewDashboardCard } from '../../components/OverviewDashboardCard';
import { BackArrowIcon, CloseIcon, FilterSlidersIcon, SearchIcon } from './produceIcons';
import { ProduceStatusBadge, formatProduceDate } from './produceParts';
import {
  CATEGORY_SLUG,
  DESIGN_CROP_CATEGORIES,
  PRODUCE_DASH,
  countText,
  cropKpis,
  cropSlugFrom,
  designCategoryForSlug,
  eventKpis,
  matchesSearch,
  type DesignCropCategory,
} from './produceLogic';

export type CropDataSegment = 'crop_types' | 'diary_activity' | 'platform_events';

/** One crop_master row as the crop screens show it. */
export interface CropTypeItem {
  id: string;
  /** crop_master.slug, the permanent identifier. */
  code: string;
  name: string;
  tamilName: string | null;
  categoryId: string;
  /** Category name from the catalog; undefined until it loads. */
  categoryName: string | undefined;
  category: DesignCropCategory | undefined;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CropDataScreenProps {
  can: Can;
  initialSegment?: CropDataSegment | undefined;
  onSegmentChange?: ((segment: CropDataSegment) => void) | undefined;
  onBack: () => void;
  onNavigateToAddCropType?: ((crop?: CropTypeItem) => void) | undefined;
  onNavigateToAddActivity: () => void;
  onNavigateToCreateEvent: () => void;
}

type CategoryFilter = 'All' | DesignCropCategory;

const CATEGORY_LABEL: Record<DesignCropCategory, TranslationKey> = {
  Vegetable: 'produce.category.Vegetable',
  Fruit: 'produce.category.Fruit',
  Spice: 'produce.category.Spice',
};

export const EVENT_TYPE_LABEL: Record<PlatformEventType, TranslationKey> = {
  WORKSHOP: 'produce.eventType.WORKSHOP',
  TRAINING: 'produce.eventType.TRAINING',
  COMMUNITY_MEET: 'produce.eventType.COMMUNITY_MEET',
  MARKET_DAY: 'produce.eventType.MARKET_DAY',
  OTHER: 'produce.eventType.OTHER',
};

export const AUDIENCE_LABEL: Record<PlatformEventAudience, TranslationKey> = {
  ALL: 'produce.audience.ALL',
  FARMER: 'produce.audience.FARMER',
  CUSTOMER: 'produce.audience.CUSTOMER',
};

function eventWhen(e: PlatformEventDto, time: string | null): string {
  const date = formatProduceDate(e.eventDate);
  return time === null ? date : `${date}, ${time}`;
}

export function CropDataScreen({
  can,
  initialSegment = 'crop_types',
  onSegmentChange,
  onBack,
  onNavigateToAddCropType,
  onNavigateToAddActivity,
  onNavigateToCreateEvent,
}: CropDataScreenProps): React.JSX.Element {
  const [selectedSegment, setSelectedSegmentState] = useState<CropDataSegment>(initialSegment);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [newCropTamil, setNewCropTamil] = useState('');
  const [newCropCategory, setNewCropCategory] = useState<DesignCropCategory>('Vegetable');

  const canManageCropTaxonomy = can('admin.crop_taxonomy.manage');
  const canManageDiaryTaxonomy = can('admin.diary_taxonomy.manage');
  const canManagePlatformEvents = can('platform.event.manage');

  const crops = useCropMasterList({ enabled: canManageCropTaxonomy });
  const categories = useCatalogCategories({ enabled: canManageCropTaxonomy });
  const events = usePlatformEventList({ enabled: canManagePlatformEvents });
  const updateCrop = useUpdateCropMaster();
  const createCrop = useCreateCropMaster();
  const deleteEvent = useDeletePlatformEvent();
  const today = useMemo(() => todayInIndia(), []);

  const setSelectedSegment = (segment: CropDataSegment) => {
    setSelectedSegmentState(segment);
    onSegmentChange?.(segment);
  };

  const cropTypes: CropTypeItem[] = useMemo(() => {
    const byId = new Map((categories.data?.items ?? []).map((c) => [c.id, c]));
    return (crops.data?.items ?? []).map((c) => {
      const cat = byId.get(c.categoryId);
      return {
        id: c.id,
        code: c.slug,
        name: c.name,
        tamilName: c.nameTa,
        categoryId: c.categoryId,
        categoryName: cat?.name,
        category: designCategoryForSlug(cat?.slug),
        status: c.isActive ? 'ACTIVE' : 'INACTIVE',
      };
    });
  }, [crops.data, categories.data]);

  const cropCounts = crops.data ? cropKpis(crops.data.items) : undefined;
  const eventCounts = events.data ? eventKpis(events.data, today) : undefined;

  const showError = (err: unknown) => Alert.alert(t('produce.error.title'), t(adminErrorKey(err)));

  const handleToggleCropStatus = (item: CropTypeItem) => {
    if (!canManageCropTaxonomy) {
      Alert.alert(t('produce.permissionDenied.title'), t('produce.permissionDenied.cropTaxonomy'));
      return;
    }
    updateCrop.mutate({ id: item.id, body: { isActive: item.status !== 'ACTIVE' } }, { onError: showError });
  };

  const handleRetireActivity = () => {
    if (!canManageDiaryTaxonomy) {
      Alert.alert(t('produce.permissionDenied.title'), t('produce.permissionDenied.diaryTaxonomy'));
    }
  };

  const handleRemoveEvent = (id: string) => {
    if (!canManagePlatformEvents) {
      Alert.alert(t('produce.permissionDenied.title'), t('produce.permissionDenied.platformEvents'));
      return;
    }
    Alert.alert(t('produce.event.removeTitle'), t('produce.event.removeBody'), [
      { text: t('produce.cancel'), style: 'cancel' },
      {
        text: t('produce.event.remove'),
        style: 'destructive',
        onPress: () => deleteEvent.mutate(id, { onError: showError }),
      },
    ]);
  };

  const handleSaveCropType = () => {
    const name = newCropName.trim();
    if (!name) {
      Alert.alert(t('produce.required.title'), t('produce.required.cropName'));
      return;
    }
    const categoryId = categories.data?.items.find((c) => c.slug === CATEGORY_SLUG[newCropCategory])?.id;
    if (categoryId === undefined) {
      Alert.alert(t('produce.error.title'), t('produce.error.categoryUnavailable'));
      return;
    }
    createCrop.mutate(
      { slug: cropSlugFrom(name), name, nameTa: newCropTamil.trim(), categoryId },
      {
        onSuccess: () => {
          setShowAddCropModal(false);
          setNewCropName('');
          setNewCropTamil('');
        },
        onError: showError,
      },
    );
  };

  const filteredCrops = cropTypes.filter(
    (c) =>
      (selectedCategoryFilter === 'All' || c.category === selectedCategoryFilter) &&
      matchesSearch(searchQuery, c.name, c.code),
  );
  const filteredEvents = (events.data?.items ?? []).filter((e) => matchesSearch(searchQuery, e.title, e.id));

  const heading: TranslationKey =
    selectedSegment === 'crop_types'
      ? 'produce.cropData.heading.cropTypes'
      : selectedSegment === 'diary_activity'
        ? 'produce.cropData.heading.diary'
        : 'produce.cropData.heading.events';

  const countLabel =
    selectedSegment === 'crop_types'
      ? t('produce.cropData.count.types', { count: crops.data ? filteredCrops.length : PRODUCE_DASH })
      : selectedSegment === 'diary_activity'
        ? t('produce.cropData.count.categories', { count: PRODUCE_DASH })
        : t('produce.cropData.count.events', { count: events.data ? filteredEvents.length : PRODUCE_DASH });

  const segmentButton = (segment: CropDataSegment, label: TranslationKey) => (
    <TouchableOpacity
      style={[styles.segmentBtn, selectedSegment === segment && styles.segmentBtnActive]}
      onPress={() => setSelectedSegment(segment)}
      activeOpacity={0.7}
    >
      <Text style={[styles.segmentBtnText, selectedSegment === segment && styles.segmentBtnTextActive]}>{t(label)}</Text>
    </TouchableOpacity>
  );

  const fieldRow = (label: TranslationKey, value: string, bold = false) => (
    <View style={styles.activityCardFieldRow}>
      <Text style={styles.activityFieldLabel}>{t(label)}</Text>
      <Text style={bold ? styles.activityFieldValueBold : styles.activityFieldValue}>{value}</Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>{t('produce.cropData.title')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.tabSectionHeading}>{t(heading)}</Text>

        {selectedSegment === 'crop_types' && (
          <OverviewCardsGrid style={styles.kpiGrid}>
            <OverviewDashboardCard title={t('produce.kpi.crop.total')} value={countText(cropCounts?.total)} titlePosition="top" />
            <OverviewDashboardCard
              title={t('produce.kpi.crop.active')}
              value={countText(cropCounts?.active)}
              titlePosition="top"
              tone="success"
            />
            <OverviewDashboardCard title={t('produce.kpi.crop.inactive')} value={countText(cropCounts?.inactive)} titlePosition="top" />
            <OverviewDashboardCard title={t('produce.kpi.crop.recent')} value={PRODUCE_DASH} titlePosition="top" />
          </OverviewCardsGrid>
        )}

        {selectedSegment === 'diary_activity' && (
          <OverviewCardsGrid style={styles.kpiGrid}>
            <OverviewDashboardCard title={t('produce.kpi.diary.total')} value={PRODUCE_DASH} titlePosition="top" />
            <OverviewDashboardCard title={t('produce.kpi.diary.active')} value={PRODUCE_DASH} titlePosition="top" tone="success" />
            <OverviewDashboardCard title={t('produce.kpi.diary.subActivities')} value={PRODUCE_DASH} titlePosition="top" />
            <OverviewDashboardCard title={t('produce.kpi.diary.retired')} value={PRODUCE_DASH} titlePosition="top" />
          </OverviewCardsGrid>
        )}

        {selectedSegment === 'platform_events' && (
          <OverviewCardsGrid style={styles.kpiGrid}>
            <OverviewDashboardCard title={t('produce.kpi.event.total')} value={countText(eventCounts?.total)} titlePosition="top" />
            <OverviewDashboardCard
              title={t('produce.kpi.event.upcoming')}
              value={countText(eventCounts?.upcoming)}
              titlePosition="top"
              tone="success"
            />
            <OverviewDashboardCard title={t('produce.kpi.event.published')} value={countText(eventCounts?.published)} titlePosition="top" />
            <OverviewDashboardCard title={t('produce.kpi.event.draft')} value={countText(eventCounts?.draft)} titlePosition="top" />
          </OverviewCardsGrid>
        )}

        <View style={styles.segmentRow}>
          {segmentButton('crop_types', 'produce.cropData.segment.cropTypes')}
          {segmentButton('diary_activity', 'produce.cropData.segment.diary')}
          {segmentButton('platform_events', 'produce.cropData.segment.events')}
        </View>

        {selectedSegment === 'crop_types' && (
          <View style={styles.chipsRow}>
            {(['All', ...DESIGN_CROP_CATEGORIES] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, selectedCategoryFilter === cat && styles.filterChipActive]}
                onPress={() => setSelectedCategoryFilter(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, selectedCategoryFilter === cat && styles.filterChipTextActive]}>
                  {cat === 'All' ? t('produce.filters.all') : t(CATEGORY_LABEL[cat])}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('produce.cropData.searchPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FilterSlidersIcon size={18} color={adminColors.brand} />
        </View>

        <Text style={styles.countLabel}>{countLabel}</Text>

        {selectedSegment === 'crop_types' && (
          <View style={styles.listContainer}>
            {filteredCrops.map((item) => (
              <View key={item.id} style={styles.cardItem}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardItemTitle}>
                    {item.code} {'·'} {item.name}
                  </Text>
                  <ProduceStatusBadge
                    label={item.status === 'ACTIVE' ? t('produce.status.active') : t('produce.status.inactive')}
                    tone={item.status === 'ACTIVE' ? 'success' : 'default'}
                  />
                </View>

                <Text style={styles.cardItemSubtitle}>
                  {item.tamilName ?? PRODUCE_DASH} {'·'} {item.categoryName ?? PRODUCE_DASH}
                </Text>
                <Text style={styles.cardItemMeta}>
                  {t('produce.cropData.createdUpdated', { creator: PRODUCE_DASH, updated: PRODUCE_DASH })}
                </Text>

                {item.status === 'INACTIVE' && (
                  <Text style={styles.deactivationReasonText}>{t('produce.cropData.reason', { reason: PRODUCE_DASH })}</Text>
                )}

                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      if (onNavigateToAddCropType) onNavigateToAddCropType(item);
                      else Alert.alert(t('produce.cropData.detailTitle'), `${item.code} · ${item.name}`);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionLinkText}>{t('produce.action.view')}</Text>
                  </TouchableOpacity>

                  {canManageCropTaxonomy && (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          if (onNavigateToAddCropType) onNavigateToAddCropType(item);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.actionLinkText}>{t('produce.action.edit')}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => handleToggleCropStatus(item)} activeOpacity={0.7} disabled={updateCrop.isPending}>
                        <Text
                          style={[
                            styles.actionLinkText,
                            item.status === 'ACTIVE' ? styles.actionDangerText : styles.actionSuccessText,
                          ]}
                        >
                          {item.status === 'ACTIVE' ? t('produce.action.deactivate') : t('produce.action.activate')}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedSegment === 'diary_activity' && (
          <View style={styles.listContainer}>
            <View style={styles.cardItem}>
              {fieldRow('produce.diary.code', PRODUCE_DASH, true)}
              {fieldRow('produce.diary.name', PRODUCE_DASH, true)}
              {fieldRow('produce.diary.subCount', PRODUCE_DASH)}
              {fieldRow('produce.diary.description', PRODUCE_DASH)}
              {fieldRow('produce.field.status', PRODUCE_DASH)}
              {fieldRow('produce.field.createdBy', PRODUCE_DASH)}
              {fieldRow('produce.field.lastUpdated', PRODUCE_DASH)}

              <View style={styles.activityButtonsRow}>
                <TouchableOpacity style={styles.pillButton} activeOpacity={0.7}>
                  <Text style={styles.pillButtonText}>{t('produce.action.view')}</Text>
                </TouchableOpacity>
                {canManageDiaryTaxonomy && (
                  <>
                    <TouchableOpacity style={styles.pillButton} activeOpacity={0.7}>
                      <Text style={styles.pillButtonText}>{t('produce.action.edit')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.pillButton, styles.pillButtonDanger]} onPress={handleRetireActivity} activeOpacity={0.7}>
                      <Text style={styles.pillButtonDangerText}>{t('produce.action.retire')}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {selectedSegment === 'platform_events' && (
          <View style={styles.listContainer}>
            {filteredEvents.map((item) => (
              <View key={item.id} style={styles.cardItem}>
                {fieldRow('produce.event.id', item.id, true)}
                {fieldRow('produce.event.title', item.title, true)}
                {fieldRow('produce.event.type', t(EVENT_TYPE_LABEL[item.eventType]))}
                {fieldRow('produce.event.start', eventWhen(item, item.startTime))}
                {fieldRow('produce.event.end', eventWhen(item, item.endTime))}
                {fieldRow('produce.event.audience', t(AUDIENCE_LABEL[item.targetAudience]), true)}

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>{t('produce.field.status')}</Text>
                  <ProduceStatusBadge
                    label={item.isPublished ? t('produce.status.published') : t('produce.status.draft')}
                    tone={item.isPublished ? 'success' : 'warning'}
                  />
                </View>

                {fieldRow('produce.field.createdBy', PRODUCE_DASH)}
                {fieldRow('produce.field.lastUpdated', formatProduceDate(item.updatedAt ?? item.createdAt))}

                <View style={styles.activityButtonsRow}>
                  <TouchableOpacity
                    style={styles.pillButton}
                    onPress={() => Alert.alert(t('produce.event.detailTitle'), item.title)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pillButtonText}>{t('produce.action.view')}</Text>
                  </TouchableOpacity>

                  {canManagePlatformEvents && (
                    <>
                      <TouchableOpacity style={styles.pillButton} activeOpacity={0.7}>
                        <Text style={styles.pillButtonText}>{t('produce.action.edit')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.pillButton, styles.pillButtonDanger]}
                        onPress={() => handleRemoveEvent(item.id)}
                        activeOpacity={0.7}
                        disabled={deleteEvent.isPending}
                      >
                        <Text style={styles.pillButtonDangerText}>{t('produce.event.remove')}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomBar}>
        {selectedSegment === 'crop_types' && canManageCropTaxonomy && (
          <TouchableOpacity
            style={styles.ctaPrimaryBtn}
            onPress={() => {
              if (onNavigateToAddCropType) onNavigateToAddCropType();
              else setShowAddCropModal(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaPrimaryBtnText}>{t('produce.cta.addCropType')}</Text>
          </TouchableOpacity>
        )}

        {selectedSegment === 'diary_activity' && canManageDiaryTaxonomy && (
          <TouchableOpacity style={styles.ctaPrimaryBtn} onPress={onNavigateToAddActivity} activeOpacity={0.8}>
            <Text style={styles.ctaPrimaryBtnText}>{t('produce.cta.addActivity')}</Text>
          </TouchableOpacity>
        )}

        {selectedSegment === 'platform_events' && canManagePlatformEvents && (
          <TouchableOpacity style={styles.ctaPrimaryBtn} onPress={onNavigateToCreateEvent} activeOpacity={0.8}>
            <Text style={styles.ctaPrimaryBtnText}>{t('produce.cta.createEvent')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showAddCropModal} transparent animationType="fade" onRequestClose={() => setShowAddCropModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('produce.addCrop.titleAdd')}</Text>
              <TouchableOpacity onPress={() => setShowAddCropModal(false)} activeOpacity={0.7} accessibilityLabel={t('produce.close')}>
                <CloseIcon size={20} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>{t('produce.cropModal.name')}</Text>
              <TextInput
                style={styles.modalInput}
                value={newCropName}
                onChangeText={setNewCropName}
                placeholder={t('produce.cropModal.namePlaceholder')}
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={styles.fieldLabel}>{t('produce.cropModal.tamil')}</Text>
              <TextInput
                style={styles.modalInput}
                value={newCropTamil}
                onChangeText={setNewCropTamil}
                placeholder={t('produce.cropModal.tamilPlaceholder')}
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={styles.fieldLabel}>{t('produce.addCrop.category')}</Text>
              <View style={styles.modalChipsRow}>
                {DESIGN_CROP_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.modalChip, newCropCategory === cat && styles.modalChipActive]}
                    onPress={() => setNewCropCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalChipText, newCropCategory === cat && styles.modalChipTextActive]}>
                      {t(CATEGORY_LABEL[cat])}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddCropModal(false)} activeOpacity={0.8}>
                <Text style={styles.modalCancelBtnText}>{t('produce.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveCropType}
                activeOpacity={0.8}
                disabled={createCrop.isPending}
              >
                <Text style={styles.modalSaveBtnText}>{t('produce.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  kpiGrid: { marginBottom: adminSpacing.md },
  tabSectionHeading: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.sm },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: 3,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: adminSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
  },
  segmentBtnActive: { backgroundColor: adminColors.brand },
  segmentBtnText: { ...adminType.caption, color: adminColors.ink },
  segmentBtnTextActive: { color: adminColors.onBrand },
  chipsRow: { flexDirection: 'row', gap: adminSpacing.xs, marginBottom: adminSpacing.md },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChipActive: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  filterChipText: { ...adminType.caption, color: adminColors.ink },
  filterChipTextActive: { color: adminColors.onBrand },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    height: 44,
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.xs,
  },
  searchInput: { flex: 1, ...adminType.body, color: adminColors.ink, height: 44 },
  countLabel: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.sm },
  listContainer: { gap: adminSpacing.sm },
  cardItem: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.xs },
  cardItemTitle: { ...adminType.sectionHead, color: adminColors.ink, flexShrink: 1 },
  cardItemSubtitle: { ...adminType.body, color: adminColors.muted, marginBottom: 2 },
  cardItemMeta: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.xs },
  deactivationReasonText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontStyle: 'italic',
    marginBottom: adminSpacing.xs,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.lg,
    marginTop: adminSpacing.xs,
    paddingTop: adminSpacing.xs,
    borderTopWidth: 1,
    borderTopColor: adminColors.canvas,
  },
  actionLinkText: { ...adminType.rowTitle, color: adminColors.brandDeep },
  actionDangerText: { color: adminColors.danger.text },
  actionSuccessText: { color: adminColors.success.text },
  activityCardFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  activityFieldLabel: { ...adminType.caption, color: adminColors.muted, width: 130 },
  activityFieldValue: { ...adminType.rowMeta, color: adminColors.ink, flex: 1, textAlign: 'right' },
  activityFieldValueBold: { ...adminType.caption, color: adminColors.ink, flex: 1, textAlign: 'right' },
  activityButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.sm,
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  pillButton: {
    flex: 1,
    height: 36,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillButtonText: { ...adminType.caption, color: adminColors.ink },
  pillButtonDanger: { borderColor: adminColors.danger.border },
  pillButtonDangerText: { ...adminType.caption, color: adminColors.danger.text },
  bottomSpacer: { height: 80 },
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
  },
  ctaPrimaryBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
  },
  ctaPrimaryBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.md },
  modalTitle: { ...adminType.sectionHead, color: adminColors.ink },
  modalBody: { gap: adminSpacing.xs, marginBottom: adminSpacing.md },
  fieldLabel: { ...adminType.caption, color: adminColors.ink, marginTop: adminSpacing.xs },
  modalInput: {
    height: 44,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
  },
  modalChipsRow: { flexDirection: 'row', gap: adminSpacing.xs, marginTop: adminSpacing.xs },
  modalChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalChipActive: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  modalChipText: { ...adminType.caption, color: adminColors.ink },
  modalChipTextActive: { color: adminColors.onBrand },
  modalFooter: { flexDirection: 'row', gap: adminSpacing.md },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: { ...adminType.rowTitle, color: adminColors.ink },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
});
