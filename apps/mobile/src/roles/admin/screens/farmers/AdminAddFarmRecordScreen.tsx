import React, { useState, useMemo } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowWhiteIcon,
  CalendarIcon,
  ChevronDownIcon,
  ImageIcon,
  UploadIcon,
} from '../../components/AdminIcons';
import { AdminCalendarPickerModal } from '../../components/AdminCalendarPickerModal';
import type { EditFarmRecordData } from './AdminEditFarmRecordScreen';

export type AddRecordTab = 'Diary' | 'Plant' | 'Crops' | 'Livestock' | 'Assets';

export interface AdminAddFarmRecordScreenProps {
  initialTab?: AddRecordTab;
  farmerName?: string;
  farmerId?: string;
  allowAddOptions?: boolean;
  mode?: 'add' | 'edit';
  initialRecord?: EditFarmRecordData;
  onBack: () => void;
  onSave?: (tab: AddRecordTab, data: any) => void;
}

const DEFAULT_FIELD_OPTIONS: Record<string, string[]> = {
  diaryPlot: ['Plot A', 'Plot B', 'Plot 1 (1.8 acre)', 'Plot 2 (1.2 acre)'],
  diaryCategory: ['Land prep', 'Sowing', 'Nutrient', 'Water', 'Weed'],
  diaryActivity: ['Ploughing', 'Bed Marking', 'Compost application', 'Hand weeding', 'Drip irrigation'],
  diaryLinkedCrop: ['Tomato (Plot 1)', 'Beans (Plot 2)', 'Carrot (Plot 1)', 'Cabbage (Plot 2)'],
  plantType: ['Banana Tree', 'Coconut tree', 'Tomato', 'Beans', 'Carrot', 'Pepper'],
  plantVariant: ['Nendran', 'Grand Naine', 'Dwarf Green', 'Hybrid F1', 'Country'],
  plantArea: ['0.5', '1.0', '1.5', '2.0', '2.5'],
  plantGrade: ['Grade (G1)', 'Grade (G2)', 'Grade (G3)', 'Not Mentions'],
  cropCategory: ['Vegetable', 'Fruit', 'Spice', 'Others'],
  scientificName: ['Daucus carota', 'Solanum lycopersicum', 'Phaseolus vulgaris', 'Brassica oleracea'],
  cropFamily: ['Apiaceae', 'Solanaceae', 'Fabaceae', 'Brassicaceae'],
  cropClassification: ['Root Crop', 'Fruiting Vegetable', 'Legume', 'Leafy Vegetable'],
  speciesVariety: ['Ooty Carrot', 'Nantes', 'Pusa Kesar', 'Roma'],
  suitableSeason: ['Kharif', 'Rabi', 'Zaid', 'All Seasons'],
  suitableZone: ['Coonoor', 'Ooty', 'Kotagiri', 'Nilgiris'],
  suitableSoil: ['Coonoor', 'Ooty', 'Red Loam', 'Black Clay', 'Forest Loam'],
  gradeSupported: ['Grade (G1)', 'Grade (G2)', 'Grade (G3)', 'Not Mentions'],
  livestockType: ['Cattle', 'Poultry', 'Goat', 'Sheep'],
  livestockId: ['COW-01', 'COW-02', 'GOAT-01', 'CHK-01'],
  livestockSpecies: ['Cow', 'Buffalo', 'Goat', 'Hen'],
  livestockGender: ['Female', 'Male'],
  sourceFarm: ['Coonoor Dairy Farm', 'Ooty Livestock Co-op', 'Own Farm Born'],
  organicStatus: ['Certified Organic', 'In Conversion', 'Conventional'],
  feedPlan: ['Morning fodder + mineral mix', 'Twice daily silage', 'Free range + grain'],
  feedType: ['Green Napier Grass', 'Dry Hay', 'Silage', 'Concentrate Feed'],
  feedSource: ['On-farm grown', 'Local Co-op', 'Organic Supplier'],
  prodType: ['Milk', 'Eggs', 'Manure', 'Wool'],
  prodSection: ['Morning Yield', 'Evening Yield', 'Daily Collection'],
  prodGenderUnit: ['lt', 'kg', 'pcs'],
  prodFat: ['3.8', '4.2', '4.5', '5.0'],
  qualityGrade: ['A+', 'A', 'B'],
  appearanceType: ['Normal', 'Rich Cream', 'Standard'],
  breedType: ['Jersey', 'HF Cross', 'Sahiwal', 'Gir', 'Malabari'],
  sireBull: ['Sire-IND-01', 'Sire-JRS-04', 'AI Center Coonoor'],
  breedingMethod: ['Artificial Insemination', 'Natural Service'],
  breedColor: ['Brown & White', 'Black & White', 'Dark Red'],
  inseminationType: ['Fresh Semen', 'Frozen Straws', 'Sorted Semen'],
  pregnancyCheckType: ['Palpation', 'Ultrasound', 'Milk Progesterone'],
  pregnancyResult: ['Positive', 'Negative', 'Pending Re-check'],
  examinationMethod: ['Rectal Examination', 'Ultrasound Scan'],
  calving: ['Normal', 'Assisted'],
  calvingOutcome: ['Live Calf', 'Twins', 'Stillborn'],
  deliveryType: ['Normal', 'C-Section', 'Assisted'],
  checkupType: ['Routine Checkup', 'Vaccination', 'Deworming', 'Emergency'],
  healthStatus: ['Healthy', 'Under Treatment', 'Recovering', 'Quarantine'],
  treatmentType: ['Preventive', 'Antibiotic', 'Deworming', 'Topical'],
  medicineType: ['Vaccine', 'Oral Suspension', 'Injectable', 'Herbal Supplement'],
  frequency: ['Once', 'Daily', 'Twice Daily', 'Weekly', 'Monthly'],
  symptomsObservations: ['None / Normal', 'Mild Fever', 'Reduced Appetite', 'Skin Rash'],
  examinationFindings: ['Normal Vitals', 'Elevated Temp', 'Dehydration'],
  diagnosis: ['Healthy', 'Seasonal Fever', 'Parasite Infection', 'Nutritional Deficiency'],
  treatmentRequired: ['No', 'Yes - Medication', 'Yes - Observation'],
  targetParasite: ['None', 'Ticks & Mites', 'Internal Worms', 'Liver Fluke'],
  administrationRoute: ['Oral', 'Intramuscular', 'Subcutaneous', 'Topical'],
  assetsType: ['Power Tiller', 'Sprayer', 'Tractor', 'Water Pump', 'Chaff Cutter'],
  assetCategory: ['Machinery', 'Equipment', 'Irrigation', 'Storage'],
  assetSources: ['Added by Farmer', 'Purchased New', 'Co-op Grant', 'Leased'],
};

export function AdminAddFarmRecordScreen({
  initialTab = 'Diary',
  farmerName = 'Ramesh Kumar',
  farmerId = 'FMR-00124',
  allowAddOptions = true,
  mode = 'add',
  initialRecord,
  onBack,
  onSave,
}: AdminAddFarmRecordScreenProps): React.JSX.Element {
  const isEditMode = mode === 'edit';
  const rawCropParts = (initialRecord?.subCategory ?? '')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);
  const rawPlotAreaMatch = (initialRecord?.plot ?? '').match(/(\d+(?:\.\d+)?)\s*acre/i);
  const rawAssetParts = (initialRecord?.subCategory ?? '').split('(')[0]?.trim() ?? '';
  const initialLivestockSubParts = (initialRecord?.subCategory ?? '')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);

  const [activeTab, setActiveTab] = useState<AddRecordTab>(initialTab);
  const [fieldOptions, setFieldOptions] = useState<Record<string, string[]>>(DEFAULT_FIELD_OPTIONS);
  const [activePicker, setActivePicker] = useState<{
    key: string;
    label: string;
    selectedValue: string;
    onSelect: (val: string) => void;
  } | null>(null);
  const [addOptionPrompt, setAddOptionPrompt] = useState<{
    key: string;
    label: string;
    onApply: (val: string) => void;
  } | null>(null);
  const [newOptionText, setNewOptionText] = useState('');
  const [calendarTarget, setCalendarTarget] = useState<'diary' | 'acquired' | null>(null);

  // ─── DIARY FORM STATE ───
  const [diaryDate, setDiaryDate] = useState(initialRecord?.date ?? '28-10-2026');
  const [diaryPlot, setDiaryPlot] = useState(isEditMode ? (initialRecord?.plot ?? '') : '');
  const [diaryPlotTags, setDiaryPlotTags] = useState(['Plot A', 'Plot B']);
  const [diaryCategory, setDiaryCategory] = useState(
    isEditMode ? (initialRecord?.category ?? 'Land prep') : 'Land prep',
  );
  const [diaryCategoryTags, setDiaryCategoryTags] = useState(['Sowing', 'Nutrient', 'Water', 'Weed']);
  const [diaryActivity, setDiaryActivity] = useState(
    isEditMode ? (initialRecord?.subCategory ?? 'Ploughing') : 'Ploughing',
  );
  const [diaryActivityTags, setDiaryActivityTags] = useState(['Bed Marking']);
  const [timeSpent, setTimeSpent] = useState(isEditMode ? (initialRecord?.timeSpent ?? '0') : '0');
  const [linkedCrop, setLinkedCrop] = useState(isEditMode ? (initialRecord?.linkedCrop ?? '') : '');
  const [diaryNotes, setDiaryNotes] = useState(
    isEditMode ? (initialRecord?.notes ?? '') : 'Applied compost before the next rain.',
  );
  const [workers, setWorkers] = useState([{ name: 'Worker 1', hours: '4', wage: '350' }]);

  // ─── PLANT FORM STATE ───
  const [plantType, setPlantType] = useState(
    isEditMode && initialRecord?.type === 'crop' ? (rawCropParts[0] ?? 'Tomato') : '',
  );
  const [plantTypeTags, setPlantTypeTags] = useState(['Banana Tree', 'Coconut tree']);
  const [plantVariant, setPlantVariant] = useState(
    isEditMode && initialRecord?.type === 'crop' ? (rawCropParts[1] ?? 'Nantes') : '',
  );
  const [plantArea, setPlantArea] = useState(
    isEditMode && initialRecord?.type === 'crop' ? (rawPlotAreaMatch?.[1] ?? '1.0') : '',
  );
  const [plantGrade, setPlantGrade] = useState(
    isEditMode && initialRecord?.type === 'crop'
      ? initialRecord.grade === 'Grade 1'
        ? 'Grade (G1)'
        : (initialRecord.grade ?? 'Grade (G1)')
      : '',
  );
  const [plantExpectedHarvestDays, setPlantExpectedHarvestDays] = useState(
    isEditMode && initialRecord?.type === 'crop' ? '90' : '',
  );
  const [plantNotes, setPlantNotes] = useState(
    isEditMode && initialRecord?.type === 'crop' ? (initialRecord.notes ?? '') : '',
  );

  // ─── CROPS FORM STATE ───
  const [cropName, setCropName] = useState(
    isEditMode && initialRecord?.type === 'crop' ? (initialRecord.subCategory ?? '') : '',
  );
  const [cropCode, setCropCode] = useState(
    isEditMode && initialRecord?.type === 'crop' ? (initialRecord.id ?? 'CAR003').toUpperCase() : 'CAR003',
  );
  const [cropCategory, setCropCategory] = useState(
    isEditMode && initialRecord?.type === 'crop' ? (initialRecord.category ?? '') : '',
  );
  const [cropCategoryTags, setCropCategoryTags] = useState(['Vegetable', 'Fruit', 'Spice', 'Others']);
  const [localAltName, setLocalAltName] = useState('');
  const [cropDesc, setCropDesc] = useState(
    isEditMode && initialRecord?.type === 'crop' ? (initialRecord.notes ?? '') : '',
  );
  const [scientificName, setScientificName] = useState('');
  const [cropFamily, setCropFamily] = useState('');
  const [cropClassification, setCropClassification] = useState('');
  const [speciesVariety, setSpeciesVariety] = useState('');
  const [suitableSeason, setSuitableSeason] = useState('');
  const [suitableZone, setSuitableZone] = useState('Nilgiris');
  const [suitableZoneTags, setSuitableZoneTags] = useState(['Coonoor', 'Ooty']);
  const [suitableSoil, setSuitableSoil] = useState('Nilgiris');
  const [suitableSoilTags, setSuitableSoilTags] = useState(['Coonoor', 'Ooty']);
  const [examHarvestDays, setExamHarvestDays] = useState('');
  const [gradeSupported, setGradeSupported] = useState('Grade (G3)');
  const [gradeTags, setGradeTags] = useState(['Grade (G2)', 'Grade (G1)', 'Not Mentions']);
  const [growthStages, setGrowthStages] = useState({
    seeding: '0',
    germination: '0',
    vegetative: '0',
    flowering: '0',
    fruitSetting: '0',
    ripening: '0',
    harvest: '0',
  });
  const [cropNotes, setCropNotes] = useState('');

  const totalCropGrowthDays = useMemo(() => {
    return Object.values(growthStages).reduce((acc, curr) => acc + (parseInt(curr, 10) || 0), 0);
  }, [growthStages]);

  // ─── LIVESTOCK FORM STATE (5 Steps) ───
  const [livestockStep, setLivestockStep] = useState<number>(1);
  const [livestockType, setLivestockType] = useState(
    isEditMode && initialRecord?.type === 'livestock'
      ? initialRecord.category === 'Hen'
        ? 'Poultry'
        : 'Cattle'
      : '',
  );
  const [livestockId, setLivestockId] = useState(
    isEditMode && initialRecord?.type === 'livestock'
      ? (initialLivestockSubParts[0] ?? 'COW-01')
      : '',
  );
  const [livestockSpecies, setLivestockSpecies] = useState(
    isEditMode && initialRecord?.type === 'livestock' ? (initialRecord.category ?? 'Cow') : '',
  );
  const [livestockGender, setLivestockGender] = useState(
    isEditMode && initialRecord?.type === 'livestock' ? 'Female' : '',
  );
  const [sourceFarm, setSourceFarm] = useState(
    isEditMode && initialRecord?.type === 'livestock' ? 'Own Farm Born' : '',
  );
  const [organicStatus, setOrganicStatus] = useState(
    isEditMode && initialRecord?.type === 'livestock' ? 'Certified Organic' : '',
  );
  const [livestockTag, setLivestockTag] = useState(
    isEditMode && initialRecord?.type === 'livestock'
      ? (initialLivestockSubParts[0] ?? 'COW-01')
      : '',
  );
  const [livestockName, setLivestockName] = useState(
    isEditMode && initialRecord?.type === 'livestock' ? (initialLivestockSubParts[1] ?? '') : '',
  );
  const [acquiredOn, setAcquiredOn] = useState(
    isEditMode && initialRecord?.type === 'livestock'
      ? (initialRecord.date ?? '28-10-2026')
      : '28-10-2026',
  );
  const [livestockNotes, setLivestockNotes] = useState(
    isEditMode && initialRecord?.type === 'livestock' ? (initialRecord.notes ?? '') : '',
  );

  // Step 2 Feed
  const [feedPlan, setFeedPlan] = useState('');
  const [feedType, setFeedType] = useState('');
  const [feedSource, setFeedSource] = useState('');
  const [feedNotes, setFeedNotes] = useState('');

  // Step 3 Production
  const [prodType, setProdType] = useState('');
  const [prodSection, setProdSection] = useState('');
  const [prodQty, setProdQty] = useState('');
  const [prodGenderUnit, setProdGenderUnit] = useState('lt');
  const [prodFat, setProdFat] = useState('');
  const [qualityGrade, setQualityGrade] = useState('');
  const [appearanceType, setAppearanceType] = useState('');
  const [prodNotes, setProdNotes] = useState('');

  // Step 4 Breeding Record (Images 1 & 2)
  const [breedType, setBreedType] = useState(
    isEditMode && initialRecord?.type === 'livestock' ? (initialRecord.breed ?? 'Jersey') : '',
  );
  const [sireBull, setSireBull] = useState('');
  const [breedingMethod, setBreedingMethod] = useState('');
  const [breedColor, setBreedColor] = useState('');
  const [inseminationType, setInseminationType] = useState('');
  const [pregnancyCheckType, setPregnancyCheckType] = useState('');
  const [pregnancyResult, setPregnancyResult] = useState('');
  const [examinationMethod, setExaminationMethod] = useState('');
  const [calving, setCalving] = useState('');
  const [calvingOutcome, setCalvingOutcome] = useState('');
  const [deliveryType, setDeliveryType] = useState('');
  const [expectedDeliveryDay, setExpectedDeliveryDay] = useState('');
  const [breedingNotes, setBreedingNotes] = useState('');

  // Step 5 Health Record (Images 3 & 4)
  const [checkupType, setCheckupType] = useState('');
  const [healthStatus, setHealthStatus] = useState('');
  const [treatmentType, setTreatmentType] = useState('');
  const [medicineType, setMedicineType] = useState('');
  const [frequency, setFrequency] = useState('');
  const [symptomsObservations, setSymptomsObservations] = useState('');
  const [examinationFindings, setExaminationFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentRequired, setTreatmentRequired] = useState('');
  const [targetParasite, setTargetParasite] = useState('');
  const [administrationRoute, setAdministrationRoute] = useState('');
  const [healthNotes, setHealthNotes] = useState('');

  // Assets Form State (Image 5)
  const [assetsType, setAssetsType] = useState(
    isEditMode && initialRecord?.type === 'asset'
      ? rawAssetParts.toLowerCase().includes('tiller')
        ? 'Power Tiller'
        : (rawAssetParts || 'Sprayer')
      : '',
  );
  const [assetCategory, setAssetCategory] = useState(
    isEditMode && initialRecord?.type === 'asset' ? (initialRecord.category ?? '') : '',
  );
  const [assetSources, setAssetSources] = useState(
    isEditMode && initialRecord?.type === 'asset' ? 'Added by Farmer' : '',
  );
  const [purchaseDate, setPurchaseDate] = useState(
    isEditMode && initialRecord?.type === 'asset'
      ? (initialRecord.date ?? '28-10-2026')
      : '28-10-2026',
  );
  const [serviceEveryDays, setServiceEveryDays] = useState(
    isEditMode && initialRecord?.type === 'asset' ? (initialRecord.serviceInterval ?? '180') : '180',
  );
  const [assetNotes, setAssetNotes] = useState(
    isEditMode && initialRecord?.type === 'asset' ? (initialRecord.notes ?? '') : '',
  );

  const tabs: AddRecordTab[] = ['Diary', 'Plant', 'Crops', 'Livestock', 'Assets'];

  const removeTag = (list: string[], setList: (val: string[]) => void, itemToRemove: string) => {
    setList(list.filter((x) => x !== itemToRemove));
  };

  const renderSelectOrAddField = ({
    label,
    required = false,
    optionKey,
    value,
    placeholder,
    onChange,
    tags,
    setTags,
    showAddControl = true,
  }: {
    label: string;
    required?: boolean;
    optionKey: string;
    value: string;
    placeholder: string;
    onChange: (val: string) => void;
    tags?: string[];
    setTags?: (val: string[]) => void;
    showAddControl?: boolean;
  }) => {
    const pickerTitle = label.replace(/\s*\*\s*$/, '');
    return (
      <>
        <Text style={styles.fieldLabel}>
          {label}
          {required ? ' *' : ''}
        </Text>
        <View style={styles.dropdownAddRow}>
          <TouchableOpacity
            style={styles.dropdownBox}
            onPress={() =>
              setActivePicker({
                key: optionKey,
                label: pickerTitle,
                selectedValue: value,
                onSelect: onChange,
              })
            }
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={pickerTitle}
          >
            <Text
              style={value ? styles.dropdownValue : styles.dropdownPlaceholder}
              numberOfLines={1}
            >
              {value || placeholder}
            </Text>
            <ChevronDownIcon size={16} color={adminColors.muted} />
          </TouchableOpacity>
          {allowAddOptions && showAddControl ? (
            <TouchableOpacity
              style={styles.addOutlineBtn}
              onPress={() => {
                setNewOptionText('');
                setAddOptionPrompt({
                  key: optionKey,
                  label: pickerTitle,
                  onApply: (added) => {
                    setFieldOptions((prev) => {
                      const existing = prev[optionKey] ?? [];
                      return existing.includes(added)
                        ? prev
                        : { ...prev, [optionKey]: [...existing, added] };
                    });
                    onChange(added);
                    if (tags && setTags && !tags.includes(added)) {
                      setTags([...tags, added]);
                    }
                  },
                });
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Add ${pickerTitle}`}
            >
              <Text style={styles.addOutlineBtnText}>+ Add</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {allowAddOptions && tags && setTags && tags.length > 0 ? (
          <View style={styles.tagsWrap}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.removableTag}
                onPress={() => removeTag(tags, setTags, tag)}
              >
                <Text style={styles.removableTagText}>{tag}</Text>
                <Text style={styles.removableTagClose}>✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Top App Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Records' : activeTab === 'Assets' ? 'Register assets' : 'Add Records'}
        </Text>
      </View>

      {/* Top 5 Horizontal Tabs (Hidden for standalone Assets screen) */}
      {activeTab !== 'Assets' && (
        <View style={styles.tabsContainer}>
          <View style={styles.tabsRow}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => {
                    setActiveTab(tab);
                    if (tab === 'Livestock') setLivestockStep(1);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}
                    numberOfLines={1}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ═══════════════════════════════════════════════════
            1. DIARY RECORDS FORM
        ═════════════════════════════════════════════════════ */}
        {activeTab === 'Diary' && (
          <View>
            <Text style={styles.sectionHeading}>Diary Records</Text>

            <View style={styles.formCard}>
              {/* Date */}
              <Text style={styles.fieldLabel}>Date *</Text>
              <View style={styles.inputWithIconWrap}>
                <TextInput
                  style={styles.inputWithIcon}
                  value={diaryDate}
                  onChangeText={setDiaryDate}
                  placeholder="Select Date"
                  placeholderTextColor={adminColors.placeholder}
                />
                <TouchableOpacity
                  onPress={() => setCalendarTarget('diary')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Pick date"
                >
                  <CalendarIcon size={18} color={adminColors.muted} />
                </TouchableOpacity>
              </View>

              {renderSelectOrAddField({
                label: 'Plot',
                required: true,
                optionKey: 'diaryPlot',
                value: diaryPlot,
                placeholder: 'Select Plot',
                onChange: setDiaryPlot,
                tags: diaryPlotTags,
                setTags: setDiaryPlotTags,
              })}

              {renderSelectOrAddField({
                label: 'Activity Category',
                required: true,
                optionKey: 'diaryCategory',
                value: diaryCategory,
                placeholder: 'Select Category',
                onChange: setDiaryCategory,
                tags: diaryCategoryTags,
                setTags: setDiaryCategoryTags,
              })}

              {renderSelectOrAddField({
                label: 'Activity',
                required: true,
                optionKey: 'diaryActivity',
                value: diaryActivity,
                placeholder: 'Select Activity',
                onChange: setDiaryActivity,
                tags: diaryActivityTags,
                setTags: setDiaryActivityTags,
              })}

              {/* Time spent */}
              <Text style={styles.fieldLabel}>Time spent (minutes) (required) *</Text>
              <View style={styles.spinnerInputWrap}>
                <TextInput
                  style={styles.spinnerInput}
                  value={timeSpent}
                  onChangeText={setTimeSpent}
                  keyboardType="numeric"
                />
                <View style={styles.spinnerArrows}>
                  <TouchableOpacity
                    onPress={() => setTimeSpent((prev) => String((parseInt(prev, 10) || 0) + 15))}
                  >
                    <Text style={styles.spinnerArrowText}>▲</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTimeSpent((prev) => String(Math.max(0, (parseInt(prev, 10) || 0) - 15)))}
                  >
                    <Text style={styles.spinnerArrowText}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {renderSelectOrAddField({
                label: 'Linked crop (optional)',
                optionKey: 'diaryLinkedCrop',
                value: linkedCrop,
                placeholder: 'Select Crop link',
                onChange: setLinkedCrop,
                showAddControl: false,
              })}

              {/* Notes */}
              <Text style={styles.fieldLabel}>Notes (up to 500 characters)</Text>
              <TextInput
                style={styles.textArea}
                value={diaryNotes}
                onChangeText={setDiaryNotes}
                multiline
                numberOfLines={3}
                placeholder="Applied compost before the next rain."
                placeholderTextColor={adminColors.placeholder}
              />

              {/* Workforce lines */}
              <View style={styles.subHeadingRow}>
                <Text style={styles.fieldLabel}>Workforce lines (optional)</Text>
                <TouchableOpacity
                  onPress={() =>
                    setWorkers((prev) => [
                      ...prev,
                      { name: `Worker ${prev.length + 1}`, hours: '4', wage: '350' },
                    ])
                  }
                >
                  <Text style={styles.addInlineText}>Add +</Text>
                </TouchableOpacity>
              </View>

              {workers.map((w, idx) => (
                <View key={idx} style={styles.workerRow}>
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.tableHeaderSmall}>{w.name}</Text>
                    <TextInput
                      style={styles.compactInput}
                      value={w.name}
                      onChangeText={(val) => {
                        setWorkers((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, name: val } : item)),
                        );
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tableHeaderSmall}>Hours</Text>
                    <TextInput
                      style={styles.compactInput}
                      value={w.hours}
                      keyboardType="numeric"
                      onChangeText={(val) => {
                        setWorkers((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, hours: val } : item)),
                        );
                      }}
                    />
                  </View>
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.tableHeaderSmall}>Wage (₹)</Text>
                    <TextInput
                      style={styles.compactInput}
                      value={w.wage}
                      keyboardType="numeric"
                      onChangeText={(val) => {
                        setWorkers((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, wage: val } : item)),
                        );
                      }}
                    />
                  </View>
                </View>
              ))}

              {/* Photos */}
              <Text style={styles.fieldLabel}>Photos (up to 5)</Text>
              <TouchableOpacity style={styles.photoUploadDashed} activeOpacity={0.7}>
                <ImageIcon size={24} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            {/* Bottom Button */}
            <TouchableOpacity
              style={styles.primarySolidBtn}
              onPress={() => onSave?.('Diary', { diaryDate, diaryNotes })}
              activeOpacity={0.8}
            >
              <Text style={styles.primarySolidBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════
            2. PLANT RECORDS FORM (SA-M3-S20)
        ═════════════════════════════════════════════════════ */}
        {activeTab === 'Plant' && (
          <View>
            <Text style={styles.sectionHeading}>Plant Records</Text>

            <View style={styles.formCard}>
              {renderSelectOrAddField({
                label: 'Plant Type',
                required: true,
                optionKey: 'plantType',
                value: plantType,
                placeholder: 'Select Plant Type',
                onChange: setPlantType,
                tags: plantTypeTags,
                setTags: setPlantTypeTags,
              })}

              {renderSelectOrAddField({
                label: 'Plant Variant',
                required: true,
                optionKey: 'plantVariant',
                value: plantVariant,
                placeholder: 'Select Plant Variant',
                onChange: setPlantVariant,
              })}

              {renderSelectOrAddField({
                label: 'Area (Acres, one decimal)',
                required: true,
                optionKey: 'plantArea',
                value: plantArea,
                placeholder: 'Select Area',
                onChange: setPlantArea,
              })}

              {renderSelectOrAddField({
                label: 'Grade',
                required: true,
                optionKey: 'plantGrade',
                value: plantGrade,
                placeholder: 'Select Grade',
                onChange: setPlantGrade,
              })}

              {/* Expected harvest days */}
              <Text style={styles.fieldLabel}>Expected harvest days *</Text>
              <TextInput
                style={styles.textInput}
                value={plantExpectedHarvestDays}
                onChangeText={setPlantExpectedHarvestDays}
                placeholder="e.g. 90"
                placeholderTextColor={adminColors.placeholder}
                keyboardType="numeric"
              />

              {/* Notes */}
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={styles.textArea}
                value={plantNotes}
                onChangeText={setPlantNotes}
                multiline
                numberOfLines={3}
                placeholder="Additional notes about planting"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            <TouchableOpacity
              style={styles.primarySolidBtn}
              onPress={() => onSave?.('Plant', { plantTypeTags, plantNotes })}
              activeOpacity={0.8}
            >
              <Text style={styles.primarySolidBtnText}>Save Plant</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════
            3. CROPS RECORDS FORM
        ═════════════════════════════════════════════════════ */}
        {activeTab === 'Crops' && (
          <View>
            <Text style={styles.sectionHeading}>Crops Records</Text>

            {/* Section 1 · Basic crop information */}
            <Text style={styles.subSectionTitle}>Section 1 · Basic crop information</Text>
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Crop Name *</Text>
              <TextInput
                style={styles.textInput}
                value={cropName}
                onChangeText={setCropName}
                placeholder="e.g. Carrot"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={styles.fieldLabel}>Crop Code *</Text>
              <View style={styles.codeGenerateRow}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={cropCode}
                  onChangeText={setCropCode}
                />
                <TouchableOpacity
                  style={styles.generateBtn}
                  onPress={() => setCropCode(`CAR${Math.floor(100 + Math.random() * 900)}`)}
                >
                  <Text style={styles.generateBtnText}>Generate</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                The code is a permanent identifier and cannot be changed.
              </Text>

              {renderSelectOrAddField({
                label: 'Crop category',
                required: true,
                optionKey: 'cropCategory',
                value: cropCategory,
                placeholder: 'Select Category',
                onChange: setCropCategory,
                tags: cropCategoryTags,
                setTags: setCropCategoryTags,
              })}

              <Text style={styles.fieldLabel}>Local / Alternative Name</Text>
              <TextInput
                style={styles.textInput}
                value={localAltName}
                onChangeText={setLocalAltName}
              />

              <Text style={styles.fieldLabel}>Crop Description</Text>
              <TextInput
                style={styles.textArea}
                value={cropDesc}
                onChangeText={setCropDesc}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Upload Crop Image */}
            <Text style={styles.subSectionTitle}>Upload Crop Image</Text>
            <View style={styles.dashedUploadBox}>
              <UploadIcon size={24} color={adminColors.brand} />
              <TouchableOpacity style={styles.uploadInnerBtn}>
                <Text style={styles.uploadInnerBtnText}>Upload</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              JPG, PNG or PDF, up to 5 MB. Replacing a verified document creates a new version; the previous version stays in history.
            </Text>

            {/* Section 2 · Botanical & classification */}
            <Text style={styles.subSectionTitle}>Section 2 · Botanical & classification</Text>
            <View style={styles.formCard}>
              {renderSelectOrAddField({
                label: 'Scientific Name',
                required: true,
                optionKey: 'scientificName',
                value: scientificName,
                placeholder: 'Select Scientific Name',
                onChange: setScientificName,
              })}

              {renderSelectOrAddField({
                label: 'Crop Family',
                required: true,
                optionKey: 'cropFamily',
                value: cropFamily,
                placeholder: 'Select Crop Family',
                onChange: setCropFamily,
              })}

              {renderSelectOrAddField({
                label: 'Crop type / Classification',
                required: true,
                optionKey: 'cropClassification',
                value: cropClassification,
                placeholder: 'Select Classification',
                onChange: setCropClassification,
              })}

              {renderSelectOrAddField({
                label: 'Species / Variety',
                required: true,
                optionKey: 'speciesVariety',
                value: speciesVariety,
                placeholder: 'Select Variety',
                onChange: setSpeciesVariety,
              })}
            </View>

            {/* Section 3 · Growing information */}
            <Text style={styles.subSectionTitle}>Section 3 · Growing information</Text>
            <View style={styles.formCard}>
              {renderSelectOrAddField({
                label: 'Suitable Season',
                required: true,
                optionKey: 'suitableSeason',
                value: suitableSeason,
                placeholder: 'Select Season',
                onChange: setSuitableSeason,
              })}

              {renderSelectOrAddField({
                label: 'Suitable zone',
                optionKey: 'suitableZone',
                value: suitableZone,
                placeholder: 'Select Zone',
                onChange: setSuitableZone,
                tags: suitableZoneTags,
                setTags: setSuitableZoneTags,
              })}

              {renderSelectOrAddField({
                label: 'Suitable soil',
                optionKey: 'suitableSoil',
                value: suitableSoil,
                placeholder: 'Select Soil',
                onChange: setSuitableSoil,
                tags: suitableSoilTags,
                setTags: setSuitableSoilTags,
              })}

              <Text style={styles.fieldLabel}>Examination harvest days</Text>
              <TextInput
                style={styles.textInput}
                value={examHarvestDays}
                onChangeText={setExamHarvestDays}
                placeholder="e.g. 90"
                keyboardType="numeric"
              />

              {renderSelectOrAddField({
                label: 'Grades supported',
                optionKey: 'gradeSupported',
                value: gradeSupported,
                placeholder: 'Select Grade',
                onChange: setGradeSupported,
                tags: gradeTags,
                setTags: setGradeTags,
              })}
            </View>

            {/* Section 4 · Growth stages */}
            <Text style={styles.subSectionTitle}>Section 4 · Growth stages</Text>
            <Text style={styles.helperText}>Typical days spent in each of the 7 stages. All optional.</Text>
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>1. Seeding (days)</Text>
              <TextInput
                style={styles.textInput}
                value={growthStages.seeding}
                onChangeText={(val) => setGrowthStages((p) => ({ ...p, seeding: val }))}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>2. Germination (days)</Text>
              <TextInput
                style={styles.textInput}
                value={growthStages.germination}
                onChangeText={(val) => setGrowthStages((p) => ({ ...p, germination: val }))}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>3. Vegetative (days)</Text>
              <TextInput
                style={styles.textInput}
                value={growthStages.vegetative}
                onChangeText={(val) => setGrowthStages((p) => ({ ...p, vegetative: val }))}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>4. Flowering (days)</Text>
              <TextInput
                style={styles.textInput}
                value={growthStages.flowering}
                onChangeText={(val) => setGrowthStages((p) => ({ ...p, flowering: val }))}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>5. Fruit-setting (days)</Text>
              <TextInput
                style={styles.textInput}
                value={growthStages.fruitSetting}
                onChangeText={(val) => setGrowthStages((p) => ({ ...p, fruitSetting: val }))}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>6. Ripening (days)</Text>
              <TextInput
                style={styles.textInput}
                value={growthStages.ripening}
                onChangeText={(val) => setGrowthStages((p) => ({ ...p, ripening: val }))}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>7. Harvest (days)</Text>
              <TextInput
                style={styles.textInput}
                value={growthStages.harvest}
                onChangeText={(val) => setGrowthStages((p) => ({ ...p, harvest: val }))}
                keyboardType="numeric"
              />

              {/* Total Banner */}
              <View style={styles.totalDaysBanner}>
                <Text style={styles.totalDaysText}>Total: {totalCropGrowthDays} days</Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={styles.textArea}
                value={cropNotes}
                onChangeText={setCropNotes}
                multiline
                numberOfLines={3}
                placeholder="Up to 300 characters."
                placeholderTextColor={adminColors.placeholder}
              />

              <View style={styles.uploadRow}>
                <TouchableOpacity style={styles.uploadDashedBtn} activeOpacity={0.7}>
                  <UploadIcon size={16} color={adminColors.brand} />
                  <Text style={styles.uploadDashedBtnText}>Upload Crop image</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.uploadDashedBtn} activeOpacity={0.7}>
                  <UploadIcon size={16} color={adminColors.brand} />
                  <Text style={styles.uploadDashedBtnText}>Upload Crop Document</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.primarySolidBtn, { flex: 1 }]}
                onPress={() => onSave?.('Crops', { cropName, cropCode, growthStages })}
              >
                <Text style={styles.primarySolidBtnText}>Save Crop</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { flex: 1 }]} onPress={onBack}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════
            4. LIVESTOCK RECORDS FORM (5 Steps Exact UI)
        ═════════════════════════════════════════════════════ */}
        {activeTab === 'Livestock' && (
          <View>
            <Text style={styles.sectionHeading}>Livestock Records</Text>

            {/* Step fraction & Segmented Progress Bar */}
            <Text style={styles.stepFractionText}>{livestockStep}/5</Text>
            <View style={styles.progressSegmentsBar}>
              {[1, 2, 3, 4, 5].map((seg) => (
                <View
                  key={seg}
                  style={[
                    styles.segmentDash,
                    seg <= livestockStep ? styles.segmentDashActive : styles.segmentDashInactive,
                  ]}
                />
              ))}
            </View>

            {/* STEP 1: Basic Information */}
            {livestockStep === 1 && (
              <View>
                <Text style={styles.stepTitle}>Step 1: Basic Information</Text>

                <View style={styles.avatarPhotoContainer}>
                  <View style={styles.avatarCirclePhoto}>
                    <Svg width={36} height={36} viewBox="0 0 24 24" fill={adminColors.brand}>
                      <Circle cx="12" cy="14" r="4" />
                      <Circle cx="6.5" cy="8.5" r="2.2" />
                      <Circle cx="17.5" cy="8.5" r="2.2" />
                      <Circle cx="9" cy="5" r="1.8" />
                      <Circle cx="15" cy="5" r="1.8" />
                    </Svg>
                    <View style={styles.cameraIconBadge}>
                      <ImageIcon size={12} color={adminColors.onBrand} />
                    </View>
                  </View>
                  <Text style={styles.avatarPhotoLabel}>Add photo (optional)</Text>
                </View>

                <View style={styles.formCard}>
                  {renderSelectOrAddField({
                    label: 'Livestock Type',
                    required: true,
                    optionKey: 'livestockType',
                    value: livestockType,
                    placeholder: 'Select Livestock Type',
                    onChange: setLivestockType,
                  })}

                  {renderSelectOrAddField({
                    label: 'Livestock ID',
                    required: true,
                    optionKey: 'livestockId',
                    value: livestockId,
                    placeholder: 'Select Livestock ID',
                    onChange: setLivestockId,
                  })}

                  {renderSelectOrAddField({
                    label: 'Species',
                    required: true,
                    optionKey: 'livestockSpecies',
                    value: livestockSpecies,
                    placeholder: 'Select Species',
                    onChange: setLivestockSpecies,
                  })}

                  {renderSelectOrAddField({
                    label: 'Gender',
                    required: true,
                    optionKey: 'livestockGender',
                    value: livestockGender,
                    placeholder: 'Select Gender',
                    onChange: setLivestockGender,
                  })}

                  {renderSelectOrAddField({
                    label: 'Source Farm',
                    required: true,
                    optionKey: 'sourceFarm',
                    value: sourceFarm,
                    placeholder: 'Select Source Farm',
                    onChange: setSourceFarm,
                  })}

                  {renderSelectOrAddField({
                    label: 'Organic status',
                    required: true,
                    optionKey: 'organicStatus',
                    value: organicStatus,
                    placeholder: 'Select Organic status',
                    onChange: setOrganicStatus,
                  })}

                  <Text style={styles.fieldLabel}>Tag (required)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={livestockTag}
                    onChangeText={setLivestockTag}
                    placeholder="Unique per farmer in any case"
                    placeholderTextColor={adminColors.placeholder}
                  />

                  <Text style={styles.fieldLabel}>Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={livestockName}
                    onChangeText={setLivestockName}
                    placeholder="Optional"
                    placeholderTextColor={adminColors.placeholder}
                  />

                  <Text style={styles.fieldLabel}>Acquired on (required)</Text>
                  <View style={styles.inputWithIconWrap}>
                    <TextInput
                      style={styles.inputWithIcon}
                      value={acquiredOn}
                      onChangeText={setAcquiredOn}
                      placeholder="28-10-2026"
                      placeholderTextColor={adminColors.placeholder}
                    />
                    <TouchableOpacity
                      onPress={() => setCalendarTarget('acquired')}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Pick acquired date"
                    >
                      <CalendarIcon size={18} color={adminColors.muted} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={styles.textArea}
                    value={livestockNotes}
                    onChangeText={setLivestockNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity
                  style={styles.primarySolidBtn}
                  onPress={() => setLivestockStep(2)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primarySolidBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: Feed Record */}
            {livestockStep === 2 && (
              <View>
                <Text style={styles.stepTitle}>Step 2: Feed Record</Text>
                <View style={styles.formCard}>
                  {renderSelectOrAddField({
                    label: 'Feed Plan',
                    required: true,
                    optionKey: 'feedPlan',
                    value: feedPlan,
                    placeholder: 'Select Feed Plan',
                    onChange: setFeedPlan,
                  })}

                  {renderSelectOrAddField({
                    label: 'Feed Type',
                    required: true,
                    optionKey: 'feedType',
                    value: feedType,
                    placeholder: 'Select Feed Type',
                    onChange: setFeedType,
                  })}

                  {renderSelectOrAddField({
                    label: 'Source',
                    required: true,
                    optionKey: 'feedSource',
                    value: feedSource,
                    placeholder: 'Select Source',
                    onChange: setFeedSource,
                  })}

                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={styles.textArea}
                    value={feedNotes}
                    onChangeText={setFeedNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { flex: 1 }]}
                    onPress={() => setLivestockStep(1)}
                  >
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primarySolidBtn, { flex: 1 }]}
                    onPress={() => setLivestockStep(3)}
                  >
                    <Text style={styles.primarySolidBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 3: Production Record */}
            {livestockStep === 3 && (
              <View>
                <Text style={styles.stepTitle}>Step 3: Production Record</Text>
                <View style={styles.formCard}>
                  {renderSelectOrAddField({
                    label: 'Production Type',
                    required: true,
                    optionKey: 'prodType',
                    value: prodType,
                    placeholder: 'Select Production Type',
                    onChange: setProdType,
                  })}

                  {renderSelectOrAddField({
                    label: 'Production section',
                    required: true,
                    optionKey: 'prodSection',
                    value: prodSection,
                    placeholder: 'Select Production section',
                    onChange: setProdSection,
                  })}

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.fieldLabel}>Production Quantity *</Text>
                      <TextInput
                        style={styles.textInput}
                        value={prodQty}
                        onChangeText={setProdQty}
                        placeholder="12"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      {renderSelectOrAddField({
                        label: 'Unit',
                        optionKey: 'prodGenderUnit',
                        value: prodGenderUnit,
                        placeholder: 'Unit',
                        onChange: setProdGenderUnit,
                        showAddControl: false,
                      })}
                    </View>
                  </View>

                  {renderSelectOrAddField({
                    label: 'Fat %',
                    required: true,
                    optionKey: 'prodFat',
                    value: prodFat,
                    placeholder: 'Select Fat %',
                    onChange: setProdFat,
                  })}

                  {renderSelectOrAddField({
                    label: 'Quality grade',
                    required: true,
                    optionKey: 'qualityGrade',
                    value: qualityGrade,
                    placeholder: 'Select Quality grade',
                    onChange: setQualityGrade,
                  })}

                  {renderSelectOrAddField({
                    label: 'Appearance type',
                    required: true,
                    optionKey: 'appearanceType',
                    value: appearanceType,
                    placeholder: 'Select Appearance type',
                    onChange: setAppearanceType,
                  })}

                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={styles.textArea}
                    value={prodNotes}
                    onChangeText={setProdNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { flex: 1 }]}
                    onPress={() => setLivestockStep(2)}
                  >
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primarySolidBtn, { flex: 1 }]}
                    onPress={() => setLivestockStep(4)}
                  >
                    <Text style={styles.primarySolidBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 4: Breeding Record (Images 1 & 2) */}
            {livestockStep === 4 && (
              <View>
                <Text style={styles.stepTitle}>Step 4: Breeding Record</Text>
                <View style={styles.formCard}>
                  {renderSelectOrAddField({
                    label: 'Breed Type',
                    required: true,
                    optionKey: 'breedType',
                    value: breedType,
                    placeholder: 'Select Breed Type',
                    onChange: setBreedType,
                  })}

                  {renderSelectOrAddField({
                    label: 'Sire / Bull',
                    required: true,
                    optionKey: 'sireBull',
                    value: sireBull,
                    placeholder: 'Select Sire / Bull',
                    onChange: setSireBull,
                  })}

                  {renderSelectOrAddField({
                    label: 'Breeding Method',
                    required: true,
                    optionKey: 'breedingMethod',
                    value: breedingMethod,
                    placeholder: 'Select Breeding Method',
                    onChange: setBreedingMethod,
                  })}

                  {renderSelectOrAddField({
                    label: 'Breed color',
                    required: true,
                    optionKey: 'breedColor',
                    value: breedColor,
                    placeholder: 'Select Breed color',
                    onChange: setBreedColor,
                  })}

                  {renderSelectOrAddField({
                    label: 'Insemination type',
                    required: true,
                    optionKey: 'inseminationType',
                    value: inseminationType,
                    placeholder: 'Select Insemination type',
                    onChange: setInseminationType,
                  })}

                  {renderSelectOrAddField({
                    label: 'Pregnancy check Type',
                    required: true,
                    optionKey: 'pregnancyCheckType',
                    value: pregnancyCheckType,
                    placeholder: 'Select Check Type',
                    onChange: setPregnancyCheckType,
                  })}

                  {renderSelectOrAddField({
                    label: 'Pregnancy Result',
                    required: true,
                    optionKey: 'pregnancyResult',
                    value: pregnancyResult,
                    placeholder: 'Select Pregnancy Result',
                    onChange: setPregnancyResult,
                  })}

                  {renderSelectOrAddField({
                    label: 'Examination method',
                    required: true,
                    optionKey: 'examinationMethod',
                    value: examinationMethod,
                    placeholder: 'Select Examination method',
                    onChange: setExaminationMethod,
                  })}

                  {renderSelectOrAddField({
                    label: 'Calving',
                    required: true,
                    optionKey: 'calving',
                    value: calving,
                    placeholder: 'Select Calving',
                    onChange: setCalving,
                  })}

                  {renderSelectOrAddField({
                    label: 'Calving Outcome',
                    required: true,
                    optionKey: 'calvingOutcome',
                    value: calvingOutcome,
                    placeholder: 'Select Calving Outcome',
                    onChange: setCalvingOutcome,
                  })}

                  {renderSelectOrAddField({
                    label: 'Delivery type',
                    required: true,
                    optionKey: 'deliveryType',
                    value: deliveryType,
                    placeholder: 'Select Delivery type',
                    onChange: setDeliveryType,
                  })}

                  <Text style={styles.fieldLabel}>Expected Delivery Day *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={expectedDeliveryDay}
                    onChangeText={setExpectedDeliveryDay}
                    placeholder="e.g. 15-11-2026"
                    placeholderTextColor={adminColors.placeholder}
                  />

                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={styles.textArea}
                    value={breedingNotes}
                    onChangeText={setBreedingNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { flex: 1 }]}
                    onPress={() => setLivestockStep(3)}
                  >
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primarySolidBtn, { flex: 1 }]}
                    onPress={() => setLivestockStep(5)}
                  >
                    <Text style={styles.primarySolidBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 5: Health Record (Images 3 & 4) */}
            {livestockStep === 5 && (
              <View>
                <Text style={styles.stepTitle}>Step 5: Health Record</Text>
                <View style={styles.formCard}>
                  {renderSelectOrAddField({
                    label: 'Checkup Type',
                    required: true,
                    optionKey: 'checkupType',
                    value: checkupType,
                    placeholder: 'Select Checkup Type',
                    onChange: setCheckupType,
                  })}

                  {renderSelectOrAddField({
                    label: 'Health status',
                    required: true,
                    optionKey: 'healthStatus',
                    value: healthStatus,
                    placeholder: 'Select Health status',
                    onChange: setHealthStatus,
                  })}

                  {renderSelectOrAddField({
                    label: 'Treatment type',
                    required: true,
                    optionKey: 'treatmentType',
                    value: treatmentType,
                    placeholder: 'Select Treatment type',
                    onChange: setTreatmentType,
                  })}

                  {renderSelectOrAddField({
                    label: 'Medicine type',
                    required: true,
                    optionKey: 'medicineType',
                    value: medicineType,
                    placeholder: 'Select Medicine type',
                    onChange: setMedicineType,
                  })}

                  {renderSelectOrAddField({
                    label: 'Frequency',
                    required: true,
                    optionKey: 'frequency',
                    value: frequency,
                    placeholder: 'Select Frequency',
                    onChange: setFrequency,
                  })}

                  {renderSelectOrAddField({
                    label: 'Symptoms / Observations',
                    required: true,
                    optionKey: 'symptomsObservations',
                    value: symptomsObservations,
                    placeholder: 'Select Symptoms / Observations',
                    onChange: setSymptomsObservations,
                  })}

                  {renderSelectOrAddField({
                    label: 'Examination findings',
                    required: true,
                    optionKey: 'examinationFindings',
                    value: examinationFindings,
                    placeholder: 'Select Examination findings',
                    onChange: setExaminationFindings,
                  })}

                  {renderSelectOrAddField({
                    label: 'Diagnosis',
                    required: true,
                    optionKey: 'diagnosis',
                    value: diagnosis,
                    placeholder: 'Select Diagnosis',
                    onChange: setDiagnosis,
                  })}

                  {renderSelectOrAddField({
                    label: 'Treatment required',
                    required: true,
                    optionKey: 'treatmentRequired',
                    value: treatmentRequired,
                    placeholder: 'Select Treatment required',
                    onChange: setTreatmentRequired,
                  })}

                  {renderSelectOrAddField({
                    label: 'Target parasite',
                    required: true,
                    optionKey: 'targetParasite',
                    value: targetParasite,
                    placeholder: 'Select Target parasite',
                    onChange: setTargetParasite,
                  })}

                  {renderSelectOrAddField({
                    label: 'Administration route',
                    required: true,
                    optionKey: 'administrationRoute',
                    value: administrationRoute,
                    placeholder: 'Select Administration route',
                    onChange: setAdministrationRoute,
                  })}

                  <Text style={styles.fieldLabel}>Notes</Text>
                  <TextInput
                    style={styles.textArea}
                    value={healthNotes}
                    onChangeText={setHealthNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { flex: 1 }]}
                    onPress={() => setLivestockStep(4)}
                  >
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primarySolidBtn, { flex: 1 }]}
                    onPress={() =>
                      onSave?.('Livestock', {
                        livestockType,
                        livestockId,
                        livestockName,
                        livestockTag,
                        breedType,
                        healthStatus,
                      })
                    }
                  >
                    <Text style={styles.primarySolidBtnText}>Save Livestock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ═══════════════════════════════════════════════════
            5. ASSETS RECORDS FORM (Image 5: Register assets)
        ═════════════════════════════════════════════════════ */}
        {activeTab === 'Assets' && (
          <View>
            <View style={styles.formCard}>
              {renderSelectOrAddField({
                label: 'Assets Type',
                required: true,
                optionKey: 'assetsType',
                value: assetsType,
                placeholder: 'Select Assets Type',
                onChange: setAssetsType,
              })}

              {renderSelectOrAddField({
                label: 'Category',
                required: true,
                optionKey: 'assetCategory',
                value: assetCategory,
                placeholder: 'Select Category',
                onChange: setAssetCategory,
              })}

              {renderSelectOrAddField({
                label: 'Sources',
                required: true,
                optionKey: 'assetSources',
                value: assetSources,
                placeholder: 'Select Sources',
                onChange: setAssetSources,
              })}
            </View>

            <TouchableOpacity
              style={styles.primarySolidBtn}
              onPress={() => {
                if (isEditMode) {
                  Alert.alert('Saved', 'Asset record updated successfully.');
                }
                onSave?.('Assets', { assetsType, assetCategory, assetSources, purchaseDate, serviceEveryDays, assetNotes });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primarySolidBtnText}>
                {isEditMode ? 'Save Changes' : 'Save Assets'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Shared Dropdown Picker Modal */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} onPress={() => setActivePicker(null)} />
          <View style={styles.pickerModalCard}>
            <Text style={styles.pickerModalTitle}>{activePicker?.label ?? 'Select option'}</Text>
            <ScrollView style={styles.pickerListScroll} showsVerticalScrollIndicator={false}>
              {(activePicker ? fieldOptions[activePicker.key] ?? [] : []).map((opt) => {
                const selected = activePicker?.selectedValue === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pickerOptionRow, selected && styles.pickerOptionRowActive]}
                    onPress={() => {
                      activePicker?.onSelect(opt);
                      setActivePicker(null);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.pickerOptionRowText,
                        selected && styles.pickerOptionRowTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Shared + Add Option Prompt Modal */}
      <Modal
        visible={addOptionPrompt !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAddOptionPrompt(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} onPress={() => setAddOptionPrompt(null)} />
          <View style={styles.pickerModalCard}>
            <Text style={styles.pickerModalTitle}>Add {addOptionPrompt?.label ?? 'Option'}</Text>
            <TextInput
              style={styles.textInput}
              value={newOptionText}
              onChangeText={setNewOptionText}
              placeholder={`Enter ${addOptionPrompt?.label ?? 'option'}`}
              placeholderTextColor={adminColors.placeholder}
              autoFocus
            />
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { flex: 1 }]}
                onPress={() => setAddOptionPrompt(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primarySolidBtn, { flex: 1 }]}
                onPress={() => {
                  const trimmed = newOptionText.trim();
                  if (!trimmed) return;
                  addOptionPrompt?.onApply(trimmed);
                  setAddOptionPrompt(null);
                }}
              >
                <Text style={styles.primarySolidBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AdminCalendarPickerModal
        visible={calendarTarget !== null}
        value={calendarTarget === 'diary' ? diaryDate : acquiredOn}
        onSelect={(d) => {
          if (calendarTarget === 'diary') setDiaryDate(d);
          else setAcquiredOn(d);
        }}
        onClose={() => setCalendarTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  backBtn: {
    padding: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '700',
  },
  tabsContainer: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  tabButtonActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabButtonText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  tabButtonTextActive: {
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  subSectionTitle: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  formCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  fieldLabel: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
    marginBottom: 4,
    marginTop: adminSpacing.xs,
  },
  textInput: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 8,
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  inputWithIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    height: 42,
  },
  inputWithIcon: {
    flex: 1,
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  dropdownAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  dropdownBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    height: 42,
  },
  dropdownPlaceholder: {
    ...adminType.caption,
    fontSize: 13,
    color: adminColors.placeholder,
  },
  dropdownValue: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  addOutlineBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOutlineBtnText: {
    ...adminType.caption,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brand,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.xs,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.xs,
  },
  removableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
  },
  removableTagText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.brandDeep,
    fontWeight: '500',
  },
  removableTagClose: {
    fontSize: 11,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  spinnerInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    height: 42,
  },
  spinnerInput: {
    flex: 1,
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  spinnerArrows: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  spinnerArrowText: {
    fontSize: 10,
    color: adminColors.muted,
  },
  textArea: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 8,
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  subHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.xs,
  },
  addInlineText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
    fontSize: 13,
  },
  workerRow: {
    flexDirection: 'row',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.xs,
  },
  tableHeaderSmall: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 2,
  },
  compactInput: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 4,
    ...adminType.body,
    fontSize: 12,
    color: adminColors.ink,
  },
  photoUploadDashed: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    height: 60,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.canvas,
    marginTop: 4,
  },
  primarySolidBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  primarySolidBtnText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '700',
    fontSize: 15,
  },
  codeGenerateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  generateBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brand,
  },
  helperText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
    marginBottom: adminSpacing.xs,
  },
  dashedUploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    padding: adminSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    marginVertical: adminSpacing.xs,
  },
  uploadInnerBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 4,
  },
  uploadInnerBtnText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  totalDaysBanner: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  totalDaysText: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  uploadDashedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 8,
    backgroundColor: adminColors.card,
  },
  uploadDashedBtnText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '600',
    color: adminColors.brandDeep,
  },
  btnRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  cancelBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
    fontSize: 14,
  },
  stepFractionText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 4,
  },
  progressSegmentsBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: adminSpacing.md,
  },
  segmentDash: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  segmentDashActive: {
    backgroundColor: adminColors.brand,
  },
  segmentDashInactive: {
    backgroundColor: adminColors.border,
  },
  stepTitle: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  avatarPhotoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: adminSpacing.sm,
  },
  avatarCirclePhoto: {
    width: 64,
    height: 64,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: adminColors.brand,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: adminColors.card,
  },
  avatarPhotoLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 4,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  reviewSummaryCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  reviewSummaryTitle: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 4,
  },
  reviewSummaryRow: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.lg,
  },
  modalDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerModalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    gap: adminSpacing.sm,
    ...adminShadow.lg,
  },
  pickerModalTitle: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.ink,
  },
  pickerListScroll: {
    maxHeight: 280,
  },
  pickerOptionRow: {
    paddingVertical: adminSpacing.sm + 2,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.md,
  },
  pickerOptionRowActive: {
    backgroundColor: adminColors.brandTint,
  },
  pickerOptionRowText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  pickerOptionRowTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
});

