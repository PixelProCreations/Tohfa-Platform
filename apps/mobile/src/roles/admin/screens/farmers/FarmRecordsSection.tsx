import React, { useMemo, useState } from 'react';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  CalendarIcon,
  ChevronDownIcon,
  CloseIcon,
  FilterSlidersIcon,
  SearchIcon,
  UserPlusIcon,
} from '../../components/AdminIcons';
import { AdminCalendarPickerModal } from '../../components/AdminCalendarPickerModal';
import { AdminAddFarmRecordScreen, type AddRecordTab } from './AdminAddFarmRecordScreen';
import { AdminEditFarmRecordScreen, type EditFarmRecordData } from './AdminEditFarmRecordScreen';
import type { Can } from '../../permissions/can';
import { useProduceRecordList } from '../../api/produceHooks';
import type { ProduceRecordStatus, ProduceRecordSummaryDto } from '../../api/w5ProduceRecords';
import { useAdminFarmerAnimals, useAdminFarmerAssets, type AnimalDto, type FarmAssetDto } from '../../api/w5FarmRecords';
import { formatAdminDay } from '../../utils/datetime';
import { t } from '../../i18n';
import { AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

export type FarmRecordSubTab = 'Diary' | 'Plant & Crops' | 'Livestock' | 'Assets';

export const CROP_GROWTH_STAGES = [
  'Seeding',
  'Germination',
  'Vegetative',
  'Flowering',
  'Fruit-setting',
  'Ripening',
  'Harvest',
] as const;

interface CropRecordItem {
  id: string;
  title: string;
  shortName: string;
  code: string;
  plotName: string;
  plotDetail: string;
  plantedDate: string;
  expectedHarvest: string;
  seedSource: string;
  grade: string;
  harvestStatus: string;
  status: ProduceRecordStatus;
  /** The record list carries no growth stage: null draws an empty stage bar. */
  stageIndex: number | null;
  notes: string;
  hasPhoto: boolean;
}

interface LivestockRecordItem {
  id: string;
  title: string;
  species: string;
  tag: string;
  code: string;
  acquiredDate: string;
  breed: string;
  productionLogs: string;
  latestProduction: string;
  source: string;
  plot: string;
  subCategory: string;
  notes: string;
  productOptions: string[];
  /** The server's terminal lifecycle status, when the animal is no longer active. */
  endedOutcome?: string | undefined;
}

interface AssetRecordItem {
  id: string;
  name: string;
  code: string;
  category: string;
  plot: string;
  purchasedDate: string;
  lastService: string;
  serviceInterval: string;
  nextServiceDue: string;
  source?: string | undefined;
  serviceOverdue?: boolean | undefined;
  /** No lifecycle (active / retired) is sent for an asset. */
  status: string;
  notes: string;
}

const ANIMAL_END_OUTCOMES = ['Sold', 'Transferred', 'Culled', 'Deceased'] as const;

function PencilMiniIcon({ size = 14, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const dayOrDash = (iso: string | null): string => (iso === null ? ADMIN_NO_VALUE : formatAdminDay(iso) || ADMIN_NO_VALUE);

/** A crop record (openapi CropRecordSummary) as a card; no field is invented. */
function toCropItem(r: ProduceRecordSummaryDto): CropRecordItem {
  return {
    id: r.id,
    title: r.crop.name,
    shortName: r.crop.name,
    code: ADMIN_NO_VALUE,
    plotName: r.plot.name,
    plotDetail: r.plot.name,
    plantedDate: dayOrDash(r.plantedOn),
    expectedHarvest: dayOrDash(r.expectedHarvestOn),
    seedSource: ADMIN_NO_VALUE,
    grade: ADMIN_NO_VALUE,
    harvestStatus:
      r.actualYieldKg === null
        ? dayOrDash(r.actualHarvestOn)
        : t('wiringFarmers.records.harvestKg', { kg: r.actualYieldKg, date: dayOrDash(r.actualHarvestOn) }),
    status: r.status,
    stageIndex: null,
    notes: ADMIN_NO_VALUE,
    hasPhoto: false,
  };
}

/** An animal (openapi Animal) as a card. Production logs are not in the admin read. */
function toLivestockItem(a: AnimalDto): LivestockRecordItem {
  return {
    id: a.id,
    title: a.name ?? a.tag,
    species: t(`wiringFarmers.records.species.${a.species}`),
    tag: a.tag,
    code: a.tag,
    acquiredDate: dayOrDash(a.purchasedOn ?? a.dateOfBirth),
    breed: a.breed ?? ADMIN_NO_VALUE,
    productionLogs: ADMIN_NO_VALUE,
    latestProduction: ADMIN_NO_VALUE,
    source: t(`wiringFarmers.records.source.${a.source}`),
    plot: ADMIN_NO_VALUE,
    subCategory: a.breed ?? ADMIN_NO_VALUE,
    notes: a.notes ?? ADMIN_NO_VALUE,
    productOptions: [],
    ...(a.lifecycleStatus === 'ACTIVE' ? {} : { endedOutcome: t(`wiringFarmers.records.lifecycle.${a.lifecycleStatus}`) }),
  };
}

/** A farm asset (openapi FarmAsset) as a card. The asset has no code and no lifecycle status. */
function toAssetItem(a: FarmAssetDto): AssetRecordItem {
  return {
    id: a.id,
    name: a.name,
    code: ADMIN_NO_VALUE,
    category: t(`wiringFarmers.records.assetCategory.${a.category}`),
    plot: ADMIN_NO_VALUE,
    purchasedDate: dayOrDash(a.purchasedOn),
    lastService: dayOrDash(a.lastServicedOn),
    serviceInterval:
      a.serviceIntervalDays === null ? ADMIN_NO_VALUE : t('wiringFarmers.records.days', { count: a.serviceIntervalDays }),
    nextServiceDue: dayOrDash(a.nextServiceDueOn),
    serviceOverdue: a.status === 'OVERDUE',
    status: ADMIN_NO_VALUE,
    notes: a.notes ?? ADMIN_NO_VALUE,
  };
}

export interface FarmRecordsSectionProps {
  /** The farmer's UUID; without it nothing is fetched and every tab says "not loaded". */
  farmerId?: string | undefined;
  can?: Can | undefined;
  farmerName?: string | undefined;
  farmerCode?: string | undefined;
  zone?: string | undefined;
  onAddRecord?: (tab: AddRecordTab) => void;
  onEditDiary?: (entry: any) => void;
  onEditRecord?: (record: EditFarmRecordData) => void;
}

/**
 * A farmer's farm records, read-only from the API:
 *   - Plant & Crops: GET /admin/produce/records?farmerId= (produce.calendar.view_consolidated)
 *   - Livestock:     GET /admin/farmers/{id}/livestock/animals (admin.livestock.view_all)
 *   - Assets:        GET /admin/farmers/{id}/farm-assets (admin.assets.view_all)
 *   - Diary:         no admin endpoint exists, so the tab says "not loaded", never "none".
 * No admin write exists for any of them. The stage / harvest / production /
 * end-of-life / service / retire sheets and the Add / Edit screens open exactly
 * as the design draws them; only each one's final confirm is disabled (R3), with
 * a "saving isn't available yet" note, and nothing reports a save.
 */
export function FarmRecordsSection({
  farmerId,
  can,
  farmerName = ADMIN_NO_VALUE,
  farmerCode = ADMIN_NO_VALUE,
  zone: _zone,
  onAddRecord,
  onEditDiary,
  onEditRecord,
}: FarmRecordsSectionProps): React.JSX.Element {
  const [activeSubTab, setActiveSubTab] = useState<FarmRecordSubTab>('Diary');
  // The design's farmer detail opens Add / Edit as full screens. A host that routes
  // them passes onAddRecord / onEditRecord; without one they open here, full screen.
  const [ownAddTab, setOwnAddTab] = useState<AddRecordTab | null>(null);
  const [ownEditRecord, setOwnEditRecord] = useState<EditFarmRecordData | null>(null);
  const openAdd = (tab: AddRecordTab) => (onAddRecord ? onAddRecord(tab) : setOwnAddTab(tab));
  const openEdit = (record: EditFarmRecordData) => {
    if (onEditRecord) onEditRecord(record);
    else if (record.type === 'diary' && onEditDiary) onEditDiary(record);
    else setOwnEditRecord(record);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCropId, setExpandedCropId] = useState<string | null>(null);

  const canCrops = can?.('produce.calendar.view_consolidated') ?? false;
  const canLivestock = can?.('admin.livestock.view_all') ?? false;
  const canAssets = can?.('admin.assets.view_all') ?? false;
  const cropQuery = useProduceRecordList({ farmerId }, { enabled: farmerId !== undefined && canCrops });
  const animalQuery = useAdminFarmerAnimals(farmerId, { enabled: canLivestock });
  const assetQuery = useAdminFarmerAssets(farmerId, { enabled: canAssets });

  const crops = useMemo(() => cropQuery.items.map(toCropItem), [cropQuery.items]);
  const livestockList = useMemo(() => (animalQuery.animals ?? []).map(toLivestockItem), [animalQuery.animals]);
  const assetsList = useMemo(() => assetQuery.items.map(toAssetItem), [assetQuery.items]);
  // No admin diary endpoint exists.
  const diaryList: EditFarmRecordData[] = [];

  /** Loading / error / not-loaded for a tab; null when its rows can be drawn. */
  const tabState = (q: { isLoading: boolean; error: unknown; refresh: () => void }, allowed: boolean) => {
    if (farmerId === undefined || !allowed) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{t('wiringFarmers.records.notLoaded')}</Text>
        </View>
      );
    }
    if (q.isLoading) return <AdminLoadingState />;
    if (q.error) return <AdminErrorState error={q.error} onRetry={q.refresh} />;
    return null;
  };
  const cropTotal = cropQuery.firstPage?.page.total;

  // Modal state: Update growth stage
  const [stageModalCrop, setStageModalCrop] = useState<CropRecordItem | null>(null);
  const [selectedNextStage, setSelectedNextStage] = useState<string>('Flowering');
  const [stagePickerOpen, setStagePickerOpen] = useState(false);

  // Modal state: Record harvest
  const [harvestModalCrop, setHarvestModalCrop] = useState<CropRecordItem | null>(null);
  const [harvestDateInput, setHarvestDateInput] = useState('');
  const [harvestQtyInput, setHarvestQtyInput] = useState('');

  // Modal state: Log production (Livestock)
  const [logProdAnimal, setLogProdAnimal] = useState<LivestockRecordItem | null>(null);
  const [selectedProdProduct, setSelectedProdProduct] = useState('milk (litres)');
  const [prodPickerOpen, setProdPickerOpen] = useState(false);
  const [prodDateInput, setProdDateInput] = useState('');
  const [prodQtyInput, setProdQtyInput] = useState('');

  // Modal state: End animal record (Livestock)
  const [endRecordAnimal, setEndRecordAnimal] = useState<LivestockRecordItem | null>(null);
  const [endOutcome, setEndOutcome] = useState<(typeof ANIMAL_END_OUTCOMES)[number]>('Sold');
  const [endOutcomePickerOpen, setEndOutcomePickerOpen] = useState(false);
  const [endDateInput, setEndDateInput] = useState('');
  const [endReasonInput, setEndReasonInput] = useState('');

  // Assets state & modals
  const [serviceModalAsset, setServiceModalAsset] = useState<AssetRecordItem | null>(null);
  const [serviceDateInput, setServiceDateInput] = useState('');
  const [serviceNoteInput, setServiceNoteInput] = useState('');
  const [retireModalAsset, setRetireModalAsset] = useState<AssetRecordItem | null>(null);
  const [retireReasonInput, setRetireReasonInput] = useState('');
  const [calendarTarget, setCalendarTarget] = useState<
    'harvest' | 'prod' | 'end' | 'service' | null
  >(null);

  const subTabs: FarmRecordSubTab[] = ['Diary', 'Plant & Crops', 'Livestock', 'Assets'];

  return (
    <View style={styles.container}>
      {/* 4 Secondary Sub-Tabs (Increased Size & Pill Styling) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.subTabBar}
      >
        {subTabs.map((tab) => {
          const isActive = activeSubTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.subTabItem, isActive && styles.subTabItemActive]}
              onPress={() => setActiveSubTab(tab)}
              activeOpacity={0.75}
            >
              <Text style={[styles.subTabItemText, isActive && styles.subTabItemTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <SearchIcon size={16} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
          <FilterSlidersIcon size={16} color={adminColors.brand} />
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════
          1. DIARY TAB (Image 1)
      ═════════════════════════════════════════════════════ */}
      {activeSubTab === 'Diary' && (
        <View style={styles.tabContent}>
          <Text style={styles.resultsCount}>{ADMIN_NO_VALUE}</Text>

          {diaryList.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>{t('wiringFarmers.records.diaryUnavailable')}</Text>
            </View>
          ) : (
            diaryList.map((entry) => (
              <View key={entry.id} style={styles.recordCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderTitle}>{entry.category} · {entry.subCategory}</Text>
                </View>
                <Text style={styles.cardMetaText}>
                  {entry.date} · {entry.plot} · {entry.timeSpent} minutes
                </Text>
                <Text style={styles.cardAddedByText}>Added by {farmerName}</Text>
                <TouchableOpacity
                  style={styles.outlineActionBtn}
                  onPress={() => openEdit(entry)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlineActionBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity
            testID="farmrec.add.diary"
            style={styles.primarySolidBtn}
            onPress={() => openAdd('Diary')}
            activeOpacity={0.8}
          >
            <Text style={styles.primarySolidBtnText}>+ Add Diary Entry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════
          2. PLANT & CROPS TAB (Image 2)
      ═════════════════════════════════════════════════════ */}
      {activeSubTab === 'Plant & Crops' && (
        <View style={styles.tabContent}>
          <Text style={styles.resultsCount}>
            {cropTotal === undefined ? ADMIN_NO_VALUE : t('wiringFarmers.records.cropCount', { count: cropTotal })}
          </Text>

          {tabState(cropQuery, canCrops) ?? (crops.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No crops registered</Text>
              <Text style={styles.emptySubtitle}>Crop cycles recorded for this farm will appear here.</Text>
            </View>
          ) : (
            crops.map((crop) => {
            const isExpanded = expandedCropId === crop.id;
            const stageIndex = crop.stageIndex;
            const currentStageName =
              stageIndex === null ? ADMIN_NO_VALUE : CROP_GROWTH_STAGES[stageIndex] ?? ADMIN_NO_VALUE;
            const stageNumber = stageIndex === null ? ADMIN_NO_VALUE : String(stageIndex + 1);
            const badgeStyle =
              crop.status === 'PLANNED' ? styles.blueBadge : styles.greenBadge;
            const badgeTextStyle =
              crop.status === 'PLANNED' ? styles.blueBadgeText : styles.greenBadgeText;

            // The design's sheets open as drawn; only their final confirm is disabled (R3).
            const handleOpenUpdateStage = () => {
              const forward = CROP_GROWTH_STAGES.slice((stageIndex ?? -1) + 1);
              if (forward.length === 0) {
                Alert.alert(
                  t('wiringFarmers.records.guard.finalStage.title'),
                  t('wiringFarmers.records.guard.finalStage.message', { crop: crop.shortName }),
                );
                return;
              }
              setSelectedNextStage(forward[0] ?? '');
              setStagePickerOpen(false);
              setStageModalCrop(crop);
            };

            const handleOpenRecordHarvest = () => {
              if (crop.status === 'HARVESTED') {
                Alert.alert(
                  t('wiringFarmers.records.guard.closed.title'),
                  t('wiringFarmers.records.guard.closed.message'),
                );
                return;
              }
              setHarvestDateInput('');
              setHarvestQtyInput('');
              setHarvestModalCrop(crop);
            };

            return (
              <View key={crop.id} style={styles.recordCard}>
                <TouchableOpacity
                  style={styles.cardHeaderRow}
                  onPress={() => setExpandedCropId(isExpanded ? null : crop.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.accordionTitleWrap}>
                    <Text style={styles.accordionArrow}>{isExpanded ? '∨' : '∧'}</Text>
                    <Text style={styles.cardHeaderTitle}>{crop.title}</Text>
                  </View>
                  <View style={badgeStyle}>
                    <Text style={badgeTextStyle}>{t(`wiringFarmers.produce.status.${crop.status}`)}</Text>
                  </View>
                </TouchableOpacity>

                {isExpanded ? (
                  <Text style={styles.cropPlotCode}>
                    {crop.code} · {crop.plotDetail}
                  </Text>
                ) : (
                  <Text style={styles.cardMetaText}>
                    {crop.plotName} · Planted {crop.plantedDate} · Stage {stageNumber} of 7 (
                    {currentStageName})
                  </Text>
                )}

                {/* 7 Segmented progress */}
                <View style={styles.progressSevenBar}>
                  {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.progressSevenSeg,
                        stageIndex !== null && idx < stageIndex
                          ? { backgroundColor: adminColors.success.text }
                          : idx === stageIndex
                            ? { backgroundColor: adminColors.brand }
                            : { backgroundColor: adminColors.border },
                      ]}
                    />
                  ))}
                </View>

                {!isExpanded ? (
                  <Text style={styles.calcHarvestText}>
                    Expected harvest: {crop.expectedHarvest} (calculated)
                  </Text>
                ) : null}

                {isExpanded && (
                  <>
                    {isExpanded ? (
                      <View style={styles.infoTwoColGrid}>
                        <View style={styles.infoGridCol}>
                          <Text style={styles.infoLabel}>Growth stage</Text>
                          <Text style={styles.infoValue}>{currentStageName}</Text>

                          <Text style={styles.infoLabel}>Expected harvest</Text>
                          <Text style={styles.infoValue}>{crop.expectedHarvest}</Text>

                          <Text style={styles.infoLabel}>Grade</Text>
                          <Text style={styles.infoValue}>{crop.grade}</Text>

                          <Text style={styles.infoLabel}>Source</Text>
                          {/* The crop record read carries no source. */}
                          <Text style={styles.infoValue}>{ADMIN_NO_VALUE}</Text>
                        </View>

                        <View style={styles.infoGridCol}>
                          <Text style={styles.infoLabel}>Planted</Text>
                          <Text style={styles.infoValue}>{crop.plantedDate}</Text>

                          <Text style={styles.infoLabel}>Seed source</Text>
                          <Text style={styles.infoValue}>{crop.seedSource}</Text>

                          <Text style={styles.infoLabel}>Harvest</Text>
                          <Text style={styles.infoValue}>{crop.harvestStatus}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={[styles.calcHarvestText, { marginTop: 4 }]}>
                        Growth stage: {currentStageName} · Harvest: {crop.harvestStatus}
                      </Text>
                    )}

                    <View style={[styles.threeBtnsRow, { marginTop: adminSpacing.sm }]}>
                      <TouchableOpacity
                        testID="farmrec.crop.edit"
                        style={styles.outlineActionBtnFlex}
                        onPress={() => {
                          openEdit({
                            id: crop.id,
                            type: 'crop',
                            headerTitle: 'Edit Crop Type',
                            date: crop.plantedDate,
                            plot: crop.plotDetail,
                            subCategory: crop.title,
                            growthStage: currentStageName,
                            expectedHarvest: crop.expectedHarvest,
                            seedSource: crop.seedSource,
                            grade: crop.grade,
                            notes: crop.notes,
                            hasPhoto: crop.hasPhoto,
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.outlineActionBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="farmrec.crop.updateStage"
                        style={styles.outlineActionBtnFlex}
                        onPress={handleOpenUpdateStage}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.outlineActionBtnText}>Update stage</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="farmrec.crop.recordHarvest"
                        style={styles.outlineActionBtnFlex}
                        onPress={handleOpenRecordHarvest}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.outlineActionBtnText}>Record harvest</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          })))}

          <TouchableOpacity
            testID="farmrec.add.plant"
            style={styles.primarySolidBtn}
            onPress={() => openAdd('Plant')}
            activeOpacity={0.8}
          >
            <Text style={styles.primarySolidBtnText}>+ Plant a crop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════
          3. LIVESTOCK TAB (Image 3)
      ═════════════════════════════════════════════════════ */}
      {activeSubTab === 'Livestock' && (
        <View style={styles.tabContent}>
          {/* The herd read returns every animal, so its length is the farmer's real count. */}
          <Text style={styles.resultsCount}>
            {animalQuery.animals === undefined ? ADMIN_NO_VALUE : t('wiringFarmers.records.livestockCount', { count: livestockList.length })}
          </Text>

          {tabState(animalQuery, canLivestock) ?? (livestockList.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No livestock records</Text>
              <Text style={styles.emptySubtitle}>Animals and production records will appear here.</Text>
            </View>
          ) : (
            livestockList.map((animal) => {
            const isEnded = Boolean(animal.endedOutcome);
            return (
              <View key={animal.id} style={styles.recordCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderTitle}>{animal.title}</Text>
                  <View style={isEnded ? styles.redBadge : styles.greenBadge}>
                    <Text style={isEnded ? styles.redBadgeText : styles.greenBadgeText}>
                      {isEnded ? animal.endedOutcome : t('wiringFarmers.records.lifecycle.ACTIVE')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cropPlotCode}>
                  {animal.code} · acquired {animal.acquiredDate}
                </Text>

                <View style={styles.infoTwoColGrid}>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoLabel}>Breed</Text>
                    <Text style={styles.infoValue}>{animal.breed}</Text>

                    <Text style={styles.infoLabel}>Latest</Text>
                    <Text style={styles.infoValue}>{animal.latestProduction}</Text>
                  </View>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoLabel}>Production logs</Text>
                    <Text style={styles.infoValue}>{animal.productionLogs}</Text>

                    <Text style={styles.infoLabel}>Source</Text>
                    <Text style={styles.infoValue}>{animal.source}</Text>
                  </View>
                </View>

                <View style={styles.threeBtnsRow}>
                  <TouchableOpacity
                    testID="farmrec.livestock.logProduction"
                    style={styles.outlineActionBtnFlex}
                    onPress={() => {
                      if (isEnded) {
                        Alert.alert(
                          t('wiringFarmers.records.guard.ended.title'),
                          t('wiringFarmers.records.guard.ended.noProduction'),
                        );
                        return;
                      }
                      setSelectedProdProduct(animal.productOptions[0] ?? '');
                      setProdPickerOpen(false);
                      setProdDateInput('');
                      setProdQtyInput('');
                      setLogProdAnimal(animal);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.outlineActionBtnText}>Log production</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="farmrec.livestock.edit"
                    style={styles.outlineActionBtnFlex}
                    onPress={() => {
                      openEdit({
                        id: animal.id,
                        type: 'livestock',
                        headerTitle: 'Edit Livestock',
                        date: animal.acquiredDate,
                        plot: animal.plot,
                        category: animal.species,
                        subCategory: animal.subCategory,
                        breed: animal.breed,
                        latestProduction: animal.latestProduction,
                        notes: animal.notes,
                        hasPhoto: false,
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.outlineActionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="farmrec.livestock.endRecord"
                    style={styles.dangerOutlineBtnFlex}
                    onPress={() => {
                      if (isEnded) {
                        Alert.alert(
                          t('wiringFarmers.records.guard.ended.title'),
                          t('wiringFarmers.records.guard.ended.already', { outcome: animal.endedOutcome ?? ADMIN_NO_VALUE }),
                        );
                        return;
                      }
                      setEndOutcome('Sold');
                      setEndOutcomePickerOpen(false);
                      setEndDateInput('');
                      setEndReasonInput('');
                      setEndRecordAnimal(animal);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dangerOutlineBtnText}>End record</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })))}

          <TouchableOpacity
            testID="farmrec.add.livestock"
            style={styles.primarySolidBtn}
            onPress={() => openAdd('Livestock')}
            activeOpacity={0.8}
          >
            <Text style={styles.primarySolidBtnText}>+ Register animal</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════
          4. ASSETS TAB (Image 4)
      ═════════════════════════════════════════════════════ */}
      {activeSubTab === 'Assets' && (
        <View style={styles.tabContent}>
          {/* Paged and with no server total: a count is shown only once every page is loaded. */}
          <Text style={styles.resultsCount}>
            {assetQuery.firstPage === undefined || assetQuery.hasMore
              ? ADMIN_NO_VALUE
              : t('wiringFarmers.records.assetCount', { count: assetsList.length })}
          </Text>

          {tabState(assetQuery, canAssets) ?? (assetsList.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No farm assets</Text>
              <Text style={styles.emptySubtitle}>Equipment and machinery records will appear here.</Text>
            </View>
          ) : (
            assetsList.map((asset) => {
            const isRetired = false;
            return (
              <View key={asset.id} style={styles.recordCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderTitle}>{asset.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <View style={isRetired ? styles.farmersOwnBadge : styles.greenBadge}>
                      <Text style={isRetired ? styles.farmersOwnBadgeText : styles.greenBadgeText}>
                        {asset.status}
                      </Text>
                    </View>
                    {!isRetired && asset.serviceOverdue ? (
                      <View style={styles.redBadge}>
                        <Text style={styles.redBadgeText}>Service overdue</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Text style={styles.cropPlotCode}>
                  {asset.code} · {asset.category}
                </Text>

                <View style={styles.infoTwoColGrid}>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoLabel}>Purchased</Text>
                    <Text style={styles.infoValue}>{asset.purchasedDate}</Text>

                    <Text style={styles.infoLabel}>Service every</Text>
                    <Text style={styles.infoValue}>{asset.serviceInterval}</Text>

                    {asset.source ? (
                      <>
                        <Text style={styles.infoLabel}>Source</Text>
                        <Text style={styles.infoValue}>{asset.source}</Text>
                      </>
                    ) : null}
                  </View>
                  <View style={styles.infoGridCol}>
                    <Text style={styles.infoLabel}>Last service</Text>
                    <Text style={styles.infoValue}>{asset.lastService}</Text>

                    <Text style={styles.infoLabel}>Next service due</Text>
                    <Text style={styles.infoValue}>{asset.nextServiceDue}</Text>
                  </View>
                </View>

                <View style={styles.threeBtnsRow}>
                  <TouchableOpacity
                    testID="farmrec.asset.recordService"
                    style={styles.outlineActionBtnFlex}
                    onPress={() => {
                      setServiceDateInput('');
                      setServiceNoteInput('');
                      setServiceModalAsset(asset);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.outlineActionBtnText}>Record service</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="farmrec.asset.edit"
                    style={styles.outlineActionBtnFlex}
                    onPress={() => {
                      openEdit({
                        id: asset.id,
                        type: 'asset',
                        headerTitle: 'Edit Asset',
                        date: asset.purchasedDate,
                        plot: asset.plot,
                        category: asset.category,
                        subCategory: `${asset.name} (${asset.code})`,
                        serviceInterval: asset.serviceInterval,
                        lastService: asset.lastService,
                        nextServiceDue: asset.nextServiceDue,
                        notes: asset.notes,
                        hasPhoto: false,
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.outlineActionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="farmrec.asset.retire"
                    style={styles.dangerOutlineBtnFlex}
                    onPress={() => {
                      setRetireReasonInput('');
                      setRetireModalAsset(asset);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dangerOutlineBtnText}>Retire</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })))}

          <TouchableOpacity
            testID="farmrec.add.assets"
            style={styles.primarySolidBtn}
            onPress={() => openAdd('Assets')}
            activeOpacity={0.8}
          >
            <Text style={styles.primarySolidBtnText}>+ Register asset</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── MODAL 1: UPDATE GROWTH STAGE (Admin Theme) ─── */}
      <Modal
        visible={stageModalCrop !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setStageModalCrop(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropTouch} onPress={() => setStageModalCrop(null)} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Update growth stage</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setStageModalCrop(null)}
                activeOpacity={0.7}
              >
                <CloseIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.contextBanner}>
              <PencilMiniIcon size={14} color={adminColors.onBrand} />
              <Text style={styles.contextBannerText}>
                Editing for {farmerName} ({farmerCode})
              </Text>
            </View>

            <View style={styles.summaryPairCard}>
              <View style={styles.summaryPairCol}>
                <Text style={styles.summaryPairLabel}>Crop</Text>
                <Text style={styles.summaryPairValue}>
                  {stageModalCrop ? `${stageModalCrop.shortName} on ${stageModalCrop.plotName}` : ''}
                </Text>
              </View>
              <View style={styles.summaryPairCol}>
                <Text style={styles.summaryPairLabel}>Now</Text>
                <Text style={styles.summaryPairValue}>
                  {stageModalCrop !== null && stageModalCrop.stageIndex !== null
                    ? CROP_GROWTH_STAGES[stageModalCrop.stageIndex] ?? ADMIN_NO_VALUE
                    : ADMIN_NO_VALUE}
                </Text>
              </View>
            </View>

            <Text style={styles.sheetFieldLabel}>New stage</Text>
            <TouchableOpacity
              style={[styles.sheetDropdownBox, stagePickerOpen && styles.sheetDropdownBoxActive]}
              onPress={() => setStagePickerOpen((prev) => !prev)}
              activeOpacity={0.75}
            >
              <Text style={styles.sheetDropdownValue}>{selectedNextStage}</Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>

            {stagePickerOpen && stageModalCrop ? (
              <View style={styles.inlineDropdownMenu}>
                {CROP_GROWTH_STAGES.slice((stageModalCrop.stageIndex ?? -1) + 1).map((stage) => {
                  const active = selectedNextStage === stage;
                  return (
                    <TouchableOpacity
                      key={stage}
                      style={[
                        styles.inlineDropdownItem,
                        active && styles.inlineDropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedNextStage(stage);
                        setStagePickerOpen(false);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.inlineDropdownItemText,
                          active && styles.inlineDropdownItemTextActive,
                        ]}
                      >
                        {stage}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.sheetHintBanner}>
              <Text style={styles.sheetHintText}>A stage can only move forward.</Text>
            </View>

            <View style={styles.sheetActionRow}>
              <TouchableOpacity
                style={styles.sheetCancelBtn}
                onPress={() => setStageModalCrop(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="farmrec.stage.confirm"
                style={[styles.sheetPrimaryBtn, styles.actionUnavailable]}
                disabled
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetPrimaryBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.unavailableNote}>{t('wiringFarmers.records.saveUnavailable')}</Text>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: RECORD HARVEST (Admin Theme) ─── */}
      <Modal
        visible={harvestModalCrop !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setHarvestModalCrop(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropTouch} onPress={() => setHarvestModalCrop(null)} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Record harvest</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setHarvestModalCrop(null)}
                activeOpacity={0.7}
              >
                <CloseIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.contextBanner}>
              <PencilMiniIcon size={14} color={adminColors.onBrand} />
              <Text style={styles.contextBannerText}>
                Editing for {farmerName} ({farmerCode})
              </Text>
            </View>

            <View style={styles.summaryPairCard}>
              <View style={styles.summaryPairCol}>
                <Text style={styles.summaryPairLabel}>Crop</Text>
                <Text style={styles.summaryPairValue}>
                  {harvestModalCrop ? `${harvestModalCrop.shortName} on ${harvestModalCrop.plotName}` : ''}
                </Text>
              </View>
              <View style={styles.summaryPairCol}>
                <Text style={styles.summaryPairLabel}>Planted</Text>
                <Text style={styles.summaryPairValue}>{harvestModalCrop?.plantedDate ?? ''}</Text>
              </View>
            </View>

            <Text style={styles.sheetFieldLabel}>Harvest date (required)</Text>
            <View style={[styles.sheetDropdownBox, styles.sheetDropdownBoxActive]}>
              <TextInput
                style={styles.sheetTextInputFlex}
                value={harvestDateInput}
                onChangeText={setHarvestDateInput}
                placeholder="dd-mm-yyyy"
                placeholderTextColor={adminColors.placeholder}
              />
              <TouchableOpacity
                onPress={() => setCalendarTarget('harvest')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Pick harvest date"
              >
                <CalendarIcon size={18} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sheetFieldLabel, { marginTop: adminSpacing.sm }]}>
              Quantity (whole kg) (required)
            </Text>
            <TextInput
              style={styles.sheetTextInput}
              value={harvestQtyInput}
              onChangeText={setHarvestQtyInput}
              keyboardType="numeric"
              placeholder="e.g. 250"
              placeholderTextColor={adminColors.placeholder}
            />

            <View style={styles.sheetHintBanner}>
              <Text style={styles.sheetHintText}>
                The crop becomes a closed Harvested record and cannot be edited afterwards.
              </Text>
            </View>

            <View style={styles.sheetActionRow}>
              <TouchableOpacity
                style={styles.sheetCancelBtn}
                onPress={() => setHarvestModalCrop(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="farmrec.harvest.confirm"
                style={[styles.sheetPrimaryBtn, styles.actionUnavailable]}
                disabled
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetPrimaryBtnText}>Record harvest</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.unavailableNote}>{t('wiringFarmers.records.saveUnavailable')}</Text>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 3: LOG PRODUCTION (LIVESTOCK - Admin Theme) ─── */}
      <Modal
        visible={logProdAnimal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLogProdAnimal(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropTouch} onPress={() => setLogProdAnimal(null)} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Log production</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setLogProdAnimal(null)}
                activeOpacity={0.7}
              >
                <CloseIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.contextBanner}>
              <UserPlusIcon size={15} color={adminColors.onBrand} />
              <Text style={styles.contextBannerText}>
                Adding for {farmerName} ({farmerCode})
              </Text>
            </View>

            <View style={styles.summaryPairCard}>
              <View style={styles.summaryPairCol}>
                <Text style={styles.summaryPairLabel}>Animal</Text>
                <Text style={styles.summaryPairValue}>
                  {logProdAnimal ? `${logProdAnimal.species} ${logProdAnimal.tag}` : ''}
                </Text>
              </View>
            </View>

            <Text style={styles.sheetFieldLabel}>Product</Text>
            <TouchableOpacity
              style={[styles.sheetDropdownBox, prodPickerOpen && styles.sheetDropdownBoxActive]}
              onPress={() => setProdPickerOpen((prev) => !prev)}
              activeOpacity={0.75}
            >
              <Text style={styles.sheetDropdownValue}>{selectedProdProduct || ADMIN_NO_VALUE}</Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>

            {prodPickerOpen && logProdAnimal ? (
              <View style={styles.inlineDropdownMenu}>
                {logProdAnimal.productOptions.map((opt) => {
                  const active = selectedProdProduct === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.inlineDropdownItem,
                        active && styles.inlineDropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedProdProduct(opt);
                        setProdPickerOpen(false);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.inlineDropdownItemText,
                          active && styles.inlineDropdownItemTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            <Text style={[styles.sheetFieldLabel, { marginTop: adminSpacing.sm }]}>
              Date (required)
            </Text>
            <View style={styles.sheetDropdownBox}>
              <TextInput
                style={styles.sheetTextInputFlex}
                value={prodDateInput}
                onChangeText={setProdDateInput}
                placeholder="dd-mm-yyyy"
                placeholderTextColor={adminColors.placeholder}
              />
              <TouchableOpacity
                onPress={() => setCalendarTarget('prod')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Pick production date"
              >
                <CalendarIcon size={18} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sheetFieldLabel, { marginTop: adminSpacing.sm }]}>
              Quantity (whole number) (required)
            </Text>
            <TextInput
              style={styles.sheetTextInput}
              value={prodQtyInput}
              onChangeText={setProdQtyInput}
              keyboardType="numeric"
              placeholder="e.g. 12"
              placeholderTextColor={adminColors.placeholder}
            />

            <View style={[styles.sheetActionRow, { marginTop: adminSpacing.lg }]}>
              <TouchableOpacity
                style={styles.sheetCancelBtn}
                onPress={() => setLogProdAnimal(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="farmrec.production.confirm"
                style={[styles.sheetPrimaryBtn, styles.actionUnavailable]}
                disabled
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetPrimaryBtnText}>Log</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.unavailableNote}>{t('wiringFarmers.records.saveUnavailable')}</Text>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 4: END ANIMAL RECORD (LIVESTOCK - Admin Theme) ─── */}
      <Modal
        visible={endRecordAnimal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEndRecordAnimal(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropTouch} onPress={() => setEndRecordAnimal(null)} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>End this animal's record?</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setEndRecordAnimal(null)}
                activeOpacity={0.7}
              >
                <CloseIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.contextBanner}>
              <PencilMiniIcon size={14} color={adminColors.onBrand} />
              <Text style={styles.contextBannerText}>
                Editing for {farmerName} ({farmerCode})
              </Text>
            </View>

            <View style={styles.summaryPairCard}>
              <View style={styles.summaryPairCol}>
                <Text style={styles.summaryPairLabel}>Animal</Text>
                <Text style={styles.summaryPairValue}>
                  {endRecordAnimal ? `${endRecordAnimal.species} ${endRecordAnimal.tag}` : ''}
                </Text>
              </View>
            </View>

            <Text style={styles.sheetFieldLabel}>What happened</Text>
            <TouchableOpacity
              style={[styles.sheetDropdownBox, endOutcomePickerOpen && styles.sheetDropdownBoxActive]}
              onPress={() => setEndOutcomePickerOpen((prev) => !prev)}
              activeOpacity={0.75}
            >
              <Text style={styles.sheetDropdownValue}>{endOutcome}</Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>

            {endOutcomePickerOpen ? (
              <View style={styles.inlineDropdownMenu}>
                {ANIMAL_END_OUTCOMES.map((opt) => {
                  const active = endOutcome === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.inlineDropdownItem,
                        active && styles.inlineDropdownItemActive,
                      ]}
                      onPress={() => {
                        setEndOutcome(opt);
                        setEndOutcomePickerOpen(false);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.inlineDropdownItemText,
                          active && styles.inlineDropdownItemTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            <Text style={[styles.sheetFieldLabel, { marginTop: adminSpacing.sm }]}>
              Date (required)
            </Text>
            <View style={styles.sheetDropdownBox}>
              <TextInput
                style={styles.sheetTextInputFlex}
                value={endDateInput}
                onChangeText={setEndDateInput}
                placeholder="dd-mm-yyyy"
                placeholderTextColor={adminColors.placeholder}
              />
              <TouchableOpacity
                onPress={() => setCalendarTarget('end')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Pick end date"
              >
                <CalendarIcon size={18} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sheetFieldLabel, { marginTop: adminSpacing.sm }]}>
              Reason (required)
            </Text>
            <TextInput
              style={styles.sheetTextArea}
              value={endReasonInput}
              onChangeText={setEndReasonInput}
              multiline
              numberOfLines={3}
              placeholder="Enter reason..."
              placeholderTextColor={adminColors.placeholder}
            />

            <View style={styles.sheetHintBanner}>
              <Text style={styles.sheetHintText}>
                This ends the animal’s active life. It cannot be undone, and no more production can be logged.
              </Text>
            </View>

            <View style={styles.sheetActionRow}>
              <TouchableOpacity
                style={styles.sheetCancelBtn}
                onPress={() => setEndRecordAnimal(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="farmrec.endRecord.confirm"
                style={[styles.sheetDangerOutlineBtn, styles.actionUnavailable]}
                disabled
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetDangerOutlineBtnText}>End record</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.unavailableNote}>{t('wiringFarmers.records.saveUnavailable')}</Text>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 5: RECORD SERVICE (ASSETS - Admin Theme) ─── */}
      <Modal
        visible={serviceModalAsset !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setServiceModalAsset(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropTouch} onPress={() => setServiceModalAsset(null)} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Record service</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setServiceModalAsset(null)}
                activeOpacity={0.7}
              >
                <CloseIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.contextBanner}>
              <UserPlusIcon size={15} color={adminColors.onBrand} />
              <Text style={styles.contextBannerText}>
                Adding for {farmerName} ({farmerCode})
              </Text>
            </View>

            <View style={styles.summaryPairCard}>
              <View style={styles.summaryPairCol}>
                <Text style={styles.summaryPairLabel}>Asset</Text>
                <Text style={styles.summaryPairValue}>{serviceModalAsset?.name ?? ''}</Text>
              </View>
            </View>

            <Text style={styles.sheetFieldLabel}>Service date (required)</Text>
            <View style={[styles.sheetDropdownBox, styles.sheetDropdownBoxActive]}>
              <TextInput
                style={styles.sheetTextInputFlex}
                value={serviceDateInput}
                onChangeText={setServiceDateInput}
                placeholder="dd-mm-yyyy"
                placeholderTextColor={adminColors.placeholder}
              />
              <TouchableOpacity
                onPress={() => setCalendarTarget('service')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Pick service date"
              >
                <CalendarIcon size={18} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sheetFieldLabel, { marginTop: adminSpacing.sm }]}>Note</Text>
            <TextInput
              style={styles.sheetTextArea}
              value={serviceNoteInput}
              onChangeText={setServiceNoteInput}
              multiline
              numberOfLines={3}
              placeholder="Optional service notes..."
              placeholderTextColor={adminColors.placeholder}
            />

            <View style={[styles.sheetActionRow, { marginTop: adminSpacing.lg }]}>
              <TouchableOpacity
                style={styles.sheetCancelBtn}
                onPress={() => setServiceModalAsset(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="farmrec.service.confirm"
                style={[styles.sheetPrimaryBtn, styles.actionUnavailable]}
                disabled
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetPrimaryBtnText}>Record</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.unavailableNote}>{t('wiringFarmers.records.saveUnavailable')}</Text>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 6: RETIRE ASSET (ASSETS - Admin Theme) ─── */}
      <Modal
        visible={retireModalAsset !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRetireModalAsset(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropTouch} onPress={() => setRetireModalAsset(null)} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>
                Retire {retireModalAsset?.name ?? 'Asset'}?
              </Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setRetireModalAsset(null)}
                activeOpacity={0.7}
              >
                <CloseIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.contextBanner}>
              <PencilMiniIcon size={14} color={adminColors.onBrand} />
              <Text style={styles.contextBannerText}>
                Editing for {farmerName} ({farmerCode})
              </Text>
            </View>

            <Text style={styles.sheetFieldLabel}>Reason (required)</Text>
            <TextInput
              style={styles.sheetTextArea}
              value={retireReasonInput}
              onChangeText={setRetireReasonInput}
              multiline
              numberOfLines={3}
              placeholder="Enter reason for retiring this asset..."
              placeholderTextColor={adminColors.placeholder}
            />

            <View style={styles.sheetHintBanner}>
              <Text style={styles.sheetHintText}>
                The asset is kept in the history but can no longer be edited or serviced.
              </Text>
            </View>

            <View style={styles.sheetActionRow}>
              <TouchableOpacity
                style={styles.sheetCancelBtn}
                onPress={() => setRetireModalAsset(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="farmrec.retire.confirm"
                style={[styles.sheetDangerOutlineBtn, styles.actionUnavailable]}
                disabled
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetDangerOutlineBtnText}>Retire</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.unavailableNote}>{t('wiringFarmers.records.saveUnavailable')}</Text>
          </View>
        </View>
      </Modal>

      <AdminCalendarPickerModal
        visible={calendarTarget !== null}
        value={
          calendarTarget === 'harvest'
            ? harvestDateInput
            : calendarTarget === 'prod'
            ? prodDateInput
            : calendarTarget === 'end'
            ? endDateInput
            : serviceDateInput
        }
        onSelect={(d) => {
          if (calendarTarget === 'harvest') setHarvestDateInput(d);
          else if (calendarTarget === 'prod') setProdDateInput(d);
          else if (calendarTarget === 'end') setEndDateInput(d);
          else if (calendarTarget === 'service') setServiceDateInput(d);
        }}
        onClose={() => setCalendarTarget(null)}
      />

      {/* The design's Add / Edit record screens, full screen, when no host routes them.
          Routed as the design's farmer detail does: a diary entry opens the Edit screen;
          a crop, animal or asset opens the Add screen in edit mode. Both screens' saves
          are disabled until an admin write endpoint exists. */}
      {ownAddTab !== null ? (
        <Modal visible animationType="slide" onRequestClose={() => setOwnAddTab(null)}>
          <AdminAddFarmRecordScreen
            initialTab={ownAddTab}
            farmerName={farmerName}
            farmerId={farmerCode}
            allowAddOptions={false}
            onBack={() => setOwnAddTab(null)}
          />
        </Modal>
      ) : null}
      {ownEditRecord !== null ? (
        <Modal visible animationType="slide" onRequestClose={() => setOwnEditRecord(null)}>
          {ownEditRecord.type === 'diary' ? (
            <AdminEditFarmRecordScreen record={ownEditRecord} onBack={() => setOwnEditRecord(null)} />
          ) : (
            <AdminAddFarmRecordScreen
              initialTab={
                ownEditRecord.type === 'crop' ? 'Plant' : ownEditRecord.type === 'livestock' ? 'Livestock' : 'Assets'
              }
              mode="edit"
              initialRecord={ownEditRecord}
              farmerName={farmerName}
              farmerId={farmerCode}
              allowAddOptions={false}
              onBack={() => setOwnEditRecord(null)}
            />
          )}
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: adminSpacing.xs,
  },
  subTabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
  },
  subTabItem: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  subTabItemActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  subTabItemText: {
    ...adminType.caption,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  subTabItemTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.xs,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    height: 40,
    gap: adminSpacing.xs,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    marginTop: adminSpacing.xs,
  },
  resultsCount: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  recordCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardHeaderTitle: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    flex: 1,
  },
  onBehalfBadge: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.brand,
  },
  onBehalfBadgeText: {
    ...adminType.caption,
    fontSize: 10,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  farmersOwnBadge: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  farmersOwnBadgeText: {
    ...adminType.caption,
    fontSize: 10,
    fontWeight: '600',
    color: adminColors.muted,
  },
  blueBadge: {
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.info.border,
  },
  blueBadgeText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.info.text,
  },
  greenBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.success.border,
  },
  greenBadgeText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  redBadge: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
  },
  redBadgeText: {
    ...adminType.caption,
    fontSize: 10,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  cardMetaText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.ink,
    marginTop: 2,
  },
  cardAddedByText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  cropPlotCode: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  outlineActionBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  outlineActionBtnText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
  },
  accordionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  accordionArrow: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  progressSevenBar: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: adminSpacing.xs,
  },
  progressSevenSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  calcHarvestText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
  },
  infoTwoColGrid: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginVertical: adminSpacing.xs,
  },
  infoGridCol: {
    flex: 1,
  },
  infoLabel: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
  },
  infoValue: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 1,
  },
  threeBtnsRow: {
    flexDirection: 'row',
    gap: adminSpacing.xs,
    marginTop: adminSpacing.sm,
  },
  outlineActionBtnFlex: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerOutlineBtnFlex: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerOutlineBtnText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.danger.text,
  },
  primarySolidBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  primarySolidBtnText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: adminColors.canvas,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    ...adminShadow.lg,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  sheetTitle: {
    ...adminType.title,
    fontSize: 17,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  sheetCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm + 2,
    marginBottom: adminSpacing.md,
  },
  contextBannerText: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  summaryPairCard: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  summaryPairCol: {
    flex: 1,
  },
  summaryPairLabel: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: 2,
  },
  summaryPairValue: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  sheetFieldLabel: {
    ...adminType.caption,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  sheetDropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    height: 46,
  },
  sheetDropdownBoxActive: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  sheetDropdownValue: {
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
    fontWeight: '500',
  },
  sheetTextInput: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    height: 46,
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
  },
  sheetTextInputFlex: {
    flex: 1,
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  inlineDropdownMenu: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    marginTop: 4,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  inlineDropdownItem: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  inlineDropdownItemActive: {
    backgroundColor: adminColors.brandTint,
  },
  inlineDropdownItemText: {
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  inlineDropdownItemTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  sheetHintBanner: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm + 2,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  sheetHintText: {
    ...adminType.caption,
    fontSize: 12.5,
    color: adminColors.brandDeep,
    fontWeight: '500',
  },
  sheetActionRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  sheetCancelBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brand,
  },
  sheetPrimaryBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPrimaryBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  sheetTextArea: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    minHeight: 88,
    textAlignVertical: 'top',
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
  },
  sheetDangerOutlineBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDangerOutlineBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  emptyWrap: {
    paddingVertical: adminSpacing.xl,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
  },
  emptyTitle: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  emptySubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'center',
  },
  actionUnavailable: {
    opacity: 0.5,
  },
  unavailableNote: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.xs,
  },
});
