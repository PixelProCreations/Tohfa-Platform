import React, { useState } from 'react';
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
import type { AddRecordTab } from './AdminAddFarmRecordScreen';
import type { EditFarmRecordData } from './AdminEditFarmRecordScreen';

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
  status: 'Planned' | 'Growing' | 'Harvested';
  stageIndex: number;
  notes: string;
  hasPhoto: boolean;
}

interface LivestockRecordItem {
  id: string;
  title: string;
  species: 'Cow' | 'Hen';
  tag: string;
  code: string;
  acquiredDate: string;
  breed: string;
  productionLogs: number;
  latestProduction: string;
  source: string;
  plot: string;
  subCategory: string;
  notes: string;
  productOptions: string[];
  endedOutcome?: 'Sold' | 'Transferred' | 'Culled' | 'Deceased' | undefined;
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
  status: 'Active' | 'Retired';
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

export interface FarmRecordsSectionProps {
  farmerName?: string | undefined;
  farmerCode?: string | undefined;
  zone?: string | undefined;
  onAddRecord?: (tab: AddRecordTab) => void;
  onEditDiary?: (entry: any) => void;
  onEditRecord?: (record: EditFarmRecordData) => void;
}

export function FarmRecordsSection({
  farmerName = 'Ramesh Kumar',
  farmerCode = 'FMR-00101',
  zone = 'Coonoor',
  onAddRecord,
  onEditDiary,
  onEditRecord,
}: FarmRecordsSectionProps): React.JSX.Element {
  const [activeSubTab, setActiveSubTab] = useState<FarmRecordSubTab>('Diary');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCropId, setExpandedCropId] = useState<string | null>('crp-2');

  const [crops, setCrops] = useState<CropRecordItem[]>([
    {
      id: 'crp-1',
      title: 'Tomato',
      shortName: 'Tomato',
      code: 'CRP-0000',
      plotName: `${zone}, plot 1`,
      plotDetail: `${zone}, plot 1`,
      plantedDate: '15 Jul 2026',
      expectedHarvest: '13 Oct 2026',
      seedSource: 'Nursery seedlings',
      grade: 'Grade 1',
      harvestStatus: 'Not harvested',
      status: 'Planned',
      stageIndex: 4,
      notes: 'Planned tomato crop on Coonoor plot 1.',
      hasPhoto: true,
    },
    {
      id: 'crp-2',
      title: 'Carrot · Nantes',
      shortName: 'Carrot',
      code: 'CRP-0001',
      plotName: 'Plot A',
      plotDetail: 'Plot A (1.0 acre)',
      plantedDate: '18 Sep 2026',
      expectedHarvest: '27 Nov 2026',
      seedSource: 'Own saved seed',
      grade: 'Grade 1',
      harvestStatus: 'Not harvested',
      status: 'Growing',
      stageIndex: 2,
      notes: 'Vegetative growth stage, own saved seed.',
      hasPhoto: true,
    },
    {
      id: 'crp-3',
      title: 'Carrot',
      shortName: 'Carrot',
      code: 'CRP-0002',
      plotName: `${zone}, plot 2`,
      plotDetail: `${zone}, plot 2`,
      plantedDate: '02 Jul 2026',
      expectedHarvest: '10 Oct 2026',
      seedSource: 'Own saved seed',
      grade: 'Grade 1',
      harvestStatus: 'Not harvested',
      status: 'Growing',
      stageIndex: 4,
      notes: 'Carrot crop on Coonoor plot 2.',
      hasPhoto: false,
    },
  ]);

  const [livestockList, setLivestockList] = useState<LivestockRecordItem[]>([
    {
      id: 'anm-1',
      title: 'Cow · COW-01 · Lakshmi',
      species: 'Cow',
      tag: 'COW-01',
      code: 'ANM-0001',
      acquiredDate: '23 Sep 2025',
      breed: 'Jersey',
      productionLogs: 2,
      latestProduction: '12 litres of milk, 27 Oct 2026',
      source: 'Added by the farmer',
      plot: 'Main Barn / Shed 1',
      subCategory: 'COW-01 · Lakshmi',
      notes: 'Production logs: 2. Added by the farmer.',
      productOptions: ['milk (litres)', 'curd (kg)', 'paneer (kg)'],
    },
    {
      id: 'anm-2',
      title: 'Hen · HEN-07',
      species: 'Hen',
      tag: 'HEN-07',
      code: 'ANM-0002',
      acquiredDate: '11 Apr 2026',
      breed: 'Country',
      productionLogs: 1,
      latestProduction: '6 eggs of egg, 27 Oct 2026',
      source: 'Added by the farmer',
      plot: 'Poultry Coop',
      subCategory: 'HEN-07',
      notes: 'Production logs: 1. Added by the farmer.',
      productOptions: ['eggs (pcs)', 'manure (kg)'],
    },
  ]);

  // Modal state: Update growth stage
  const [stageModalCrop, setStageModalCrop] = useState<CropRecordItem | null>(null);
  const [selectedNextStage, setSelectedNextStage] = useState<string>('Flowering');
  const [stagePickerOpen, setStagePickerOpen] = useState(false);

  // Modal state: Record harvest
  const [harvestModalCrop, setHarvestModalCrop] = useState<CropRecordItem | null>(null);
  const [harvestDateInput, setHarvestDateInput] = useState('28-10-2026');
  const [harvestQtyInput, setHarvestQtyInput] = useState('');

  // Modal state: Log production (Livestock)
  const [logProdAnimal, setLogProdAnimal] = useState<LivestockRecordItem | null>(null);
  const [selectedProdProduct, setSelectedProdProduct] = useState('milk (litres)');
  const [prodPickerOpen, setProdPickerOpen] = useState(false);
  const [prodDateInput, setProdDateInput] = useState('28-10-2026');
  const [prodQtyInput, setProdQtyInput] = useState('');

  // Modal state: End animal record (Livestock)
  const [endRecordAnimal, setEndRecordAnimal] = useState<LivestockRecordItem | null>(null);
  const [endOutcome, setEndOutcome] = useState<(typeof ANIMAL_END_OUTCOMES)[number]>('Sold');
  const [endOutcomePickerOpen, setEndOutcomePickerOpen] = useState(false);
  const [endDateInput, setEndDateInput] = useState('28-10-2026');
  const [endReasonInput, setEndReasonInput] = useState('');

  // Assets state & modals
  const [assetsList, setAssetsList] = useState<AssetRecordItem[]>([
    {
      id: 'ast-1',
      name: 'Power tiller',
      code: 'AST-0001',
      category: 'Machinery',
      plot: 'Machinery Shed',
      purchasedDate: '27 Nov 2024',
      lastService: '11 Apr 2026',
      serviceInterval: '180 days',
      nextServiceDue: '8 Oct 2026',
      source: 'Added by the farmer',
      serviceOverdue: true,
      status: 'Active',
      notes: 'Service overdue. Added by the farmer.',
    },
    {
      id: 'ast-2',
      name: 'Sprayer',
      code: 'AST-0002',
      category: 'Equipment',
      plot: 'Equipment Locker',
      purchasedDate: '1 Jan 2026',
      lastService: '28 Sep 2026',
      serviceInterval: '90 days',
      nextServiceDue: '27 Dec 2026',
      status: 'Active',
      notes: 'Regular equipment maintenance.',
    },
  ]);
  const [serviceModalAsset, setServiceModalAsset] = useState<AssetRecordItem | null>(null);
  const [serviceDateInput, setServiceDateInput] = useState('28-10-2026');
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
          <Text style={styles.resultsCount}>2 diary</Text>

          {/* Card 1 */}
          <View style={styles.recordCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>Nutrient · Compost application</Text>
              <View style={styles.onBehalfBadge}>
                <Text style={styles.onBehalfBadgeText}>Added on behalf</Text>
              </View>
            </View>
            <Text style={styles.cardMetaText}>
              26 Oct 2026 · Plot 2 (1.2 acre) · 90 minutes · Linked crop: Tomato
            </Text>
            <Text style={styles.cardMetaText}>Workforce: 2 workers, 4 hrs each · 2 photos</Text>
            <Text style={styles.cardAddedByText}>Added by Demo Super Admin on behalf</Text>

            <TouchableOpacity
              style={styles.outlineActionBtn}
              onPress={() => {
                const data: EditFarmRecordData = {
                  id: 'd1',
                  type: 'diary',
                  headerTitle: 'Edit Diary Entry',
                  date: '26 Oct 2026',
                  plot: 'Plot 2 (1.2 acre)',
                  category: 'Nutrient',
                  subCategory: 'Compost application',
                  timeSpent: '90',
                  linkedCrop: 'Tomato (same plot)',
                  workforce: [
                    { id: 'w1', name: 'Worker 1', hours: '4', wage: '350' },
                    { id: 'w2', name: 'Worker 2', hours: '4', wage: '350' },
                  ],
                  notes: 'Applied compost before the next rain.',
                  hasPhoto: true,
                };
                if (onEditRecord) onEditRecord(data);
                else onEditDiary?.(data);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.outlineActionBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Card 2 */}
          <View style={styles.recordCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>Weed · Hand weeding</Text>
              <View style={styles.farmersOwnBadge}>
                <Text style={styles.farmersOwnBadgeText}>Farmer's own</Text>
              </View>
            </View>
            <Text style={styles.cardMetaText}>
              24 Oct 2026 · Plot 1 (1.8 acre) · 120 minutes · No linked crop
            </Text>
            <Text style={styles.cardMetaText}>No workforce logged · 0 photos</Text>
            <Text style={styles.cardAddedByText}>Added by {farmerName}</Text>

            <TouchableOpacity
              style={styles.outlineActionBtn}
              onPress={() => {
                const data: EditFarmRecordData = {
                  id: 'd2',
                  type: 'diary',
                  headerTitle: 'Edit Diary Entry',
                  date: '24 Oct 2026',
                  plot: 'Plot 1 (1.8 acre)',
                  category: 'Weed',
                  subCategory: 'Hand weeding',
                  timeSpent: '120',
                  linkedCrop: 'No linked crop',
                  workforce: [],
                  notes: 'Hand weeding along rows.',
                  hasPhoto: false,
                };
                if (onEditRecord) onEditRecord(data);
                else onEditDiary?.(data);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.outlineActionBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.primarySolidBtn}
            onPress={() => onAddRecord?.('Diary')}
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
          <Text style={styles.resultsCount}>{crops.length} crops</Text>

          {crops.map((crop) => {
            const isExpanded = expandedCropId === crop.id;
            const currentStageName = CROP_GROWTH_STAGES[crop.stageIndex] ?? 'Vegetative';
            const badgeStyle =
              crop.status === 'Planned' ? styles.blueBadge : styles.greenBadge;
            const badgeTextStyle =
              crop.status === 'Planned' ? styles.blueBadgeText : styles.greenBadgeText;

            const handleOpenUpdateStage = () => {
              const forward = CROP_GROWTH_STAGES.slice(crop.stageIndex + 1);
              if (forward.length === 0) {
                Alert.alert('Final Stage', `${crop.shortName} is already at Harvest stage.`);
                return;
              }
              setSelectedNextStage(forward[0] ?? 'Harvest');
              setStagePickerOpen(false);
              setStageModalCrop(crop);
            };

            const handleOpenRecordHarvest = () => {
              if (crop.status === 'Harvested') {
                Alert.alert(
                  'Closed Record',
                  'This crop is already Harvested and cannot be edited afterwards.',
                );
                return;
              }
              setHarvestDateInput('28-10-2026');
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
                    <Text style={badgeTextStyle}>{crop.status}</Text>
                  </View>
                </TouchableOpacity>

                {crop.id === 'crp-2' ? (
                  <Text style={styles.cropPlotCode}>
                    {crop.code} · {crop.plotDetail}
                  </Text>
                ) : (
                  <Text style={styles.cardMetaText}>
                    {crop.plotName} · Planted {crop.plantedDate} · Stage {crop.stageIndex + 1} of 7 (
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
                        idx < crop.stageIndex
                          ? { backgroundColor: adminColors.success.text }
                          : idx === crop.stageIndex
                            ? { backgroundColor: adminColors.brand }
                            : { backgroundColor: adminColors.border },
                      ]}
                    />
                  ))}
                </View>

                {crop.id !== 'crp-2' || !isExpanded ? (
                  <Text style={styles.calcHarvestText}>
                    Expected harvest: {crop.expectedHarvest} (calculated)
                  </Text>
                ) : null}

                {isExpanded && (
                  <>
                    {crop.id === 'crp-2' ? (
                      <View style={styles.infoTwoColGrid}>
                        <View style={styles.infoGridCol}>
                          <Text style={styles.infoLabel}>Growth stage</Text>
                          <Text style={styles.infoValue}>{currentStageName}</Text>

                          <Text style={styles.infoLabel}>Expected harvest</Text>
                          <Text style={styles.infoValue}>{crop.expectedHarvest}</Text>

                          <Text style={styles.infoLabel}>Grade</Text>
                          <Text style={styles.infoValue}>{crop.grade}</Text>

                          <Text style={styles.infoLabel}>Source</Text>
                          <Text style={styles.infoValue}>Added by the farmer</Text>
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
                        style={styles.outlineActionBtnFlex}
                        onPress={() => {
                          onEditRecord?.({
                            id: crop.id,
                            type: 'crop',
                            headerTitle: 'Edit Crop Type',
                            date: crop.plantedDate,
                            plot: crop.plotDetail,
                            category: 'Vegetable',
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
                        style={styles.outlineActionBtnFlex}
                        onPress={handleOpenUpdateStage}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.outlineActionBtnText}>Update stage</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
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
          })}

          <TouchableOpacity
            style={styles.primarySolidBtn}
            onPress={() => onAddRecord?.('Plant')}
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
          <Text style={styles.resultsCount}>{livestockList.length} livestock</Text>

          {livestockList.map((animal) => {
            const isEnded = Boolean(animal.endedOutcome);
            return (
              <View key={animal.id} style={styles.recordCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardHeaderTitle}>{animal.title}</Text>
                  <View style={isEnded ? styles.redBadge : styles.greenBadge}>
                    <Text style={isEnded ? styles.redBadgeText : styles.greenBadgeText}>
                      {isEnded ? animal.endedOutcome : 'Active'}
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
                    style={styles.outlineActionBtnFlex}
                    onPress={() => {
                      if (isEnded) {
                        Alert.alert(
                          'Record Ended',
                          'This animal record has ended and no more production can be logged.',
                        );
                        return;
                      }
                      setSelectedProdProduct(animal.productOptions[0] ?? 'milk (litres)');
                      setProdPickerOpen(false);
                      setProdDateInput('28-10-2026');
                      setProdQtyInput('');
                      setLogProdAnimal(animal);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.outlineActionBtnText}>Log production</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.outlineActionBtnFlex}
                    onPress={() => {
                      onEditRecord?.({
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
                    style={styles.dangerOutlineBtnFlex}
                    onPress={() => {
                      if (isEnded) {
                        Alert.alert('Record Ended', `This record is already marked ${animal.endedOutcome}.`);
                        return;
                      }
                      setEndOutcome('Sold');
                      setEndOutcomePickerOpen(false);
                      setEndDateInput('28-10-2026');
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
          })}

          <TouchableOpacity
            style={styles.primarySolidBtn}
            onPress={() => onAddRecord?.('Livestock')}
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
          <Text style={styles.resultsCount}>{assetsList.length} assets</Text>

          {assetsList.map((asset) => {
            const isRetired = asset.status === 'Retired';
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
                    style={styles.outlineActionBtnFlex}
                    onPress={() => {
                      if (isRetired) {
                        Alert.alert(
                          'Asset Retired',
                          'The asset is kept in the history and can no longer be serviced.',
                        );
                        return;
                      }
                      setServiceDateInput('28-10-2026');
                      setServiceNoteInput('');
                      setServiceModalAsset(asset);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.outlineActionBtnText}>Record service</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.outlineActionBtnFlex}
                    onPress={() => {
                      if (isRetired) {
                        Alert.alert(
                          'Asset Retired',
                          'The asset is kept in the history and can no longer be edited.',
                        );
                        return;
                      }
                      onEditRecord?.({
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
                    style={styles.dangerOutlineBtnFlex}
                    onPress={() => {
                      if (isRetired) {
                        Alert.alert('Already Retired', `${asset.name} is already retired.`);
                        return;
                      }
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
          })}

          <TouchableOpacity
            style={styles.primarySolidBtn}
            onPress={() => onAddRecord?.('Assets')}
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
                  {stageModalCrop ? CROP_GROWTH_STAGES[stageModalCrop.stageIndex] : ''}
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
                {CROP_GROWTH_STAGES.slice(stageModalCrop.stageIndex + 1).map((stage) => {
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
                style={styles.sheetPrimaryBtn}
                onPress={() => {
                  if (!stageModalCrop) return;
                  const nextIdx = CROP_GROWTH_STAGES.indexOf(
                    selectedNextStage as (typeof CROP_GROWTH_STAGES)[number],
                  );
                  if (nextIdx <= stageModalCrop.stageIndex) {
                    Alert.alert('Invalid Stage', 'A stage can only move forward.');
                    return;
                  }
                  const targetId = stageModalCrop.id;
                  const targetName = stageModalCrop.shortName;
                  setCrops((prev) =>
                    prev.map((item) =>
                      item.id === targetId
                        ? {
                            ...item,
                            stageIndex: nextIdx,
                            status: nextIdx === CROP_GROWTH_STAGES.length - 1 ? 'Harvested' : 'Growing',
                          }
                        : item,
                    ),
                  );
                  setStageModalCrop(null);
                  Alert.alert('Stage Updated', `${targetName} moved forward to ${selectedNextStage}.`);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetPrimaryBtnText}>Update</Text>
              </TouchableOpacity>
            </View>
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
                style={styles.sheetPrimaryBtn}
                onPress={() => {
                  const qty = parseInt(harvestQtyInput.trim(), 10);
                  if (!harvestDateInput.trim() || !Number.isFinite(qty) || qty <= 0) {
                    Alert.alert('Required', 'Please enter harvest date and whole kg quantity.');
                    return;
                  }
                  if (!harvestModalCrop) return;
                  const targetId = harvestModalCrop.id;
                  setCrops((prev) =>
                    prev.map((item) =>
                      item.id === targetId
                        ? {
                            ...item,
                            status: 'Harvested',
                            stageIndex: CROP_GROWTH_STAGES.length - 1,
                            harvestStatus: `${qty} kg (${harvestDateInput.trim()})`,
                          }
                        : item,
                    ),
                  );
                  setHarvestModalCrop(null);
                  Alert.alert('Harvest Recorded', `Recorded ${qty} kg on ${harvestDateInput.trim()}.`);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetPrimaryBtnText}>Record harvest</Text>
              </TouchableOpacity>
            </View>
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
              <Text style={styles.sheetDropdownValue}>{selectedProdProduct}</Text>
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
                style={styles.sheetPrimaryBtn}
                onPress={() => {
                  const qty = parseInt(prodQtyInput.trim(), 10);
                  if (!prodDateInput.trim() || !Number.isFinite(qty) || qty <= 0) {
                    Alert.alert('Required', 'Please enter a valid date and whole number quantity.');
                    return;
                  }
                  if (!logProdAnimal) return;
                  const targetId = logProdAnimal.id;
                  setLivestockList((prev) =>
                    prev.map((item) =>
                      item.id === targetId
                        ? {
                            ...item,
                            productionLogs: item.productionLogs + 1,
                            latestProduction: `${qty} ${selectedProdProduct}, ${prodDateInput.trim()}`,
                          }
                        : item,
                    ),
                  );
                  setLogProdAnimal(null);
                  Alert.alert(
                    'Production Logged',
                    `Logged ${qty} ${selectedProdProduct} for ${logProdAnimal.tag}.`,
                  );
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetPrimaryBtnText}>Log</Text>
              </TouchableOpacity>
            </View>
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
                style={styles.sheetDangerOutlineBtn}
                onPress={() => {
                  if (!endDateInput.trim() || !endReasonInput.trim()) {
                    Alert.alert('Required', 'Please enter a valid date and reason.');
                    return;
                  }
                  if (!endRecordAnimal) return;
                  const targetId = endRecordAnimal.id;
                  const targetTag = endRecordAnimal.tag;
                  setLivestockList((prev) =>
                    prev.map((item) =>
                      item.id === targetId ? { ...item, endedOutcome: endOutcome } : item,
                    ),
                  );
                  setEndRecordAnimal(null);
                  Alert.alert('Record Ended', `${targetTag} has been marked ${endOutcome}.`);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetDangerOutlineBtnText}>End record</Text>
              </TouchableOpacity>
            </View>
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
                style={styles.sheetPrimaryBtn}
                onPress={() => {
                  if (!serviceDateInput.trim()) {
                    Alert.alert('Required', 'Please enter a valid service date.');
                    return;
                  }
                  if (!serviceModalAsset) return;
                  const targetId = serviceModalAsset.id;
                  const targetName = serviceModalAsset.name;
                  setAssetsList((prev) =>
                    prev.map((item) =>
                      item.id === targetId
                        ? {
                            ...item,
                            lastService: serviceDateInput.trim(),
                            serviceOverdue: false,
                            notes: serviceNoteInput.trim() || item.notes,
                          }
                        : item,
                    ),
                  );
                  setServiceModalAsset(null);
                  Alert.alert(
                    'Service Recorded',
                    `Recorded service for ${targetName} on ${serviceDateInput.trim()}.`,
                  );
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetPrimaryBtnText}>Record</Text>
              </TouchableOpacity>
            </View>
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
                style={styles.sheetDangerOutlineBtn}
                onPress={() => {
                  if (!retireReasonInput.trim()) {
                    Alert.alert('Required', 'Please enter a reason to retire this asset.');
                    return;
                  }
                  if (!retireModalAsset) return;
                  const targetId = retireModalAsset.id;
                  const targetName = retireModalAsset.name;
                  setAssetsList((prev) =>
                    prev.map((item) =>
                      item.id === targetId
                        ? {
                            ...item,
                            status: 'Retired',
                            serviceOverdue: false,
                            notes: retireReasonInput.trim(),
                          }
                        : item,
                    ),
                  );
                  setRetireModalAsset(null);
                  Alert.alert('Asset Retired', `${targetName} has been retired.`);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetDangerOutlineBtnText}>Retire</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
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
});

