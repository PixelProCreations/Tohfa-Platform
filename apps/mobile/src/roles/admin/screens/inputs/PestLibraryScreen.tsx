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
  BackArrowIcon,
  PlusIcon,
  SearchIcon,
  FilterSlidersIcon,
  ChevronDownIcon,
} from './inputsIcons';

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface PestItem {
  id: string;
  name: string;
  scientificName?: string | undefined;
  type?: 'Pest' | 'Disease' | string | undefined;
  crop?: string | undefined;
  crops?: string | undefined;
  severity?: 'Low' | 'Medium' | 'High' | string | undefined;
  status: 'Published' | 'Draft' | string;
  riskPeriod?: string | undefined;
  updatedDate: string;
  metaLine?: string | undefined;
  symptoms?: string | undefined;
  treatment?: string | undefined;
}

export const SAMPLE_PESTS: PestItem[] = [
  {
    id: 'PEST-001',
    name: 'Late Blight',
    scientificName: 'Phytophthora infestans',
    type: 'Disease',
    crop: 'Tomato',
    crops: 'Tomato, Potato',
    severity: 'High',
    status: 'Published',
    riskPeriod: 'Jun-Sep (high humidity)',
    updatedDate: '9 Oct 2026',
    metaLine: 'Disease · Tomato, Potato · Risk: Jun-Sep (high humidity) · Updated 9 Oct 2026',
    symptoms: 'Water-soaked spots on leaves that turn brown, white fungal growth on underside',
    treatment: 'Neem Oil Concentrate, Trichoderma Viride spray, copper hydroxide',
  },
  {
    id: 'PEST-002',
    name: 'Aphid Infestation',
    scientificName: 'Aphidoidea spp.',
    type: 'Pest',
    crop: 'Cabbage',
    crops: 'Cabbage, Beans',
    severity: 'Medium',
    status: 'Draft',
    riskPeriod: 'Seasonal risk not yet verified',
    updatedDate: '7 Oct 2026',
    metaLine: 'Pest · Cabbage, Beans · Seasonal risk not yet verified · Updated 7 Oct 2026',
    symptoms: 'Curled leaves, yellowing foliage, sticky honeydew secretion and sooty mould',
    treatment: 'Neem oil 1500ppm spray, introducing ladybird beetles, soap water solution',
  },
  {
    id: 'PEST-003',
    name: 'Powdery Mildew',
    scientificName: 'Erysiphe cichoracearum',
    type: 'Disease',
    crop: 'Cucumber',
    crops: 'Cucumber, Tomato',
    severity: 'Medium',
    status: 'Published',
    riskPeriod: 'Warm dry days, cool humid nights',
    updatedDate: '5 Oct 2026',
    metaLine: 'Disease · Cucumber, Tomato · Risk: Warm dry days, cool humid nights · Updated 5 Oct 2026',
    symptoms: 'White powdery fungal spots on upper leaf surfaces and stems',
    treatment: 'Potassium bicarbonate spray, wettable sulfur, bio-fungicides',
  },
  {
    id: 'PEST-004',
    name: 'Tomato Fruit Borer',
    scientificName: 'Helicoverpa armigera',
    type: 'Pest',
    crop: 'Tomato',
    crops: 'Tomato, Chickpea',
    severity: 'High',
    status: 'Published',
    riskPeriod: 'Flowering to fruiting stage',
    updatedDate: '1 Oct 2026',
    metaLine: 'Pest · Tomato, Chickpea · Risk: Flowering to fruiting stage · Updated 1 Oct 2026',
    symptoms: 'Circular bore holes in fruits, larval excreta around entry points',
    treatment: 'Pheromone traps, Trichogramma wasps, Bacillus thuringiensis (Bt)',
  },
  {
    id: 'PEST-005',
    name: 'Early Blight',
    scientificName: 'Alternaria solani',
    type: 'Disease',
    crop: 'Potato',
    crops: 'Potato, Tomato',
    severity: 'Medium',
    status: 'Published',
    riskPeriod: 'Warm temperatures and prolonged leaf wetness',
    updatedDate: '28 Sep 2026',
    metaLine: 'Disease · Potato, Tomato · Risk: Warm temperatures & prolonged wetness · Updated 28 Sep 2026',
    symptoms: 'Concentric ring target-like spots on older lower leaves',
    treatment: 'Crop rotation, copper fungicides, Pseudomonas fluorescens spray',
  },
  {
    id: 'PEST-006',
    name: 'Whitefly Vector',
    scientificName: 'Bemisia tabaci',
    type: 'Pest',
    crop: 'Cotton',
    crops: 'Cotton, Tomato, Okra',
    severity: 'High',
    status: 'Published',
    riskPeriod: 'Hot and dry weather',
    updatedDate: '22 Sep 2026',
    metaLine: 'Pest · Cotton, Tomato, Okra · Risk: Hot and dry weather · Updated 22 Sep 2026',
    symptoms: 'Leaf curl virus transmission, chlorotic spots, stunted plant growth',
    treatment: 'Yellow sticky traps, Beauveria bassiana, neem seed kernel extract',
  },
  {
    id: 'PEST-007',
    name: 'Root Knot Nematode',
    scientificName: 'Meloidogyne spp.',
    type: 'Pest',
    crop: 'Vegetables',
    crops: 'Polyhouse vegetables',
    severity: 'High',
    status: 'Draft',
    riskPeriod: 'Year-round in sandy soils',
    updatedDate: '18 Sep 2026',
    metaLine: 'Pest · Polyhouse vegetables · Risk: Year-round in sandy soils · Updated 18 Sep 2026',
    symptoms: 'Galls / swelling on roots, wilting during midday heat despite wet soil',
    treatment: 'Karanj cake application, bio-nematicides (Paecilomyces lilacinus), solarization',
  },
  {
    id: 'PEST-008',
    name: 'Anthracnose',
    scientificName: 'Colletotrichum gloeosporioides',
    type: 'Disease',
    crop: 'Chilli',
    crops: 'Mango, Chilli',
    severity: 'Medium',
    status: 'Published',
    riskPeriod: 'High humidity rainy weather',
    updatedDate: '14 Sep 2026',
    metaLine: 'Disease · Mango, Chilli · Risk: High humidity rainy weather · Updated 14 Sep 2026',
    symptoms: 'Sunken circular dark lesions with salmon-pink spore masses in moist weather',
    treatment: 'Seed treatment, Trichoderma viride, balanced nutrition',
  },
  {
    id: 'PEST-009',
    name: 'Diamondback Moth',
    scientificName: 'Plutella xylostella',
    type: 'Pest',
    crop: 'Cabbage',
    crops: 'Cabbage, Cauliflower',
    severity: 'High',
    status: 'Published',
    riskPeriod: 'Post-monsoon dry season',
    updatedDate: '10 Sep 2026',
    metaLine: 'Pest · Cabbage, Cauliflower · Risk: Post-monsoon dry season · Updated 10 Sep 2026',
    symptoms: 'Windowing of leaves caused by larvae feeding on underside',
    treatment: 'Mustard trap crop, Bacillus thuringiensis, botanical sprays',
  },
  {
    id: 'PEST-010',
    name: 'Downy Mildew',
    scientificName: 'Pseudoperonospora cubensis',
    type: 'Disease',
    crop: 'Cucurbits',
    crops: 'Cucurbits',
    severity: 'Medium',
    status: 'Published',
    riskPeriod: 'Cool, wet conditions',
    updatedDate: '5 Sep 2026',
    metaLine: 'Disease · Cucurbits · Risk: Cool, wet conditions · Updated 5 Sep 2026',
    symptoms: 'Angular chlorotic yellow lesions bounded by leaf veins',
    treatment: 'Drip irrigation (avoid overhead watering), copper spray, systemic bio-agents',
  },
  {
    id: 'PEST-011',
    name: 'Damping Off',
    scientificName: 'Pythium aphanidermatum',
    type: 'Disease',
    crop: 'Seedlings',
    crops: 'Nursery seedlings',
    severity: 'High',
    status: 'Published',
    riskPeriod: 'Overcrowded seedlings, excess moisture',
    updatedDate: '1 Sep 2026',
    metaLine: 'Disease · Nursery seedlings · Risk: Overcrowded seedlings, excess moisture · Updated 1 Sep 2026',
    symptoms: 'Stem water-soaking and collapse at soil line before or after emergence',
    treatment: 'Raised seedling nursery beds, Trichoderma enriched FYM, seed biopriming',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface PestLibraryScreenProps {
  onBack: () => void;
  onAddNewPest?: () => void;
  onSelectPest?: (pest: PestItem) => void;
  onEditPest?: (pest: PestItem) => void;
}

export function PestLibraryScreen({
  onBack,
  onAddNewPest,
  onSelectPest,
  onEditPest,
}: PestLibraryScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft'>('All');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const filteredPests = SAMPLE_PESTS.filter((pest) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      pest.name.toLowerCase().includes(q) ||
      (pest.scientificName && pest.scientificName.toLowerCase().includes(q)) ||
      (pest.crops && pest.crops.toLowerCase().includes(q)) ||
      (pest.type && pest.type.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'All' || pest.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Pest & Disease Library</Text>

          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={onAddNewPest}
            activeOpacity={0.8}
            accessibilityLabel="Add new pest or disease"
          >
            <PlusIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scroll Container */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar with Filter Sliders Icon */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
            accessibilityLabel="Filter records"
          >
            <FilterSlidersIcon size={20} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Records Count */}
        <Text style={styles.recordsCount}>{filteredPests.length} records</Text>

        {/* Pest / Disease Cards List */}
        {filteredPests.map((item) => {
          const isPublished = item.status === 'Published';
          const isDraft = item.status === 'Draft';

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.pestCard}
              onPress={() => onSelectPest && onSelectPest(item)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View
                  style={[
                    styles.badge,
                    isPublished && styles.badgePublished,
                    isDraft && styles.badgeDraft,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isPublished && styles.badgeTextPublished,
                      isDraft && styles.badgeTextDraft,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {item.scientificName ? (
                <Text style={styles.scientificName}>{item.scientificName}</Text>
              ) : null}

              <Text style={styles.cardLineMeta}>
                {item.metaLine ||
                  `${item.type || 'Pest'} · ${item.crops || 'Tomato'} · ${item.riskPeriod || ''} · Updated ${item.updatedDate}`}
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => onSelectPest && onSelectPest(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionLink}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (onEditPest) {
                      onEditPest(item);
                    } else if (onAddNewPest) {
                      onAddNewPest();
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionLink}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      `${item.name} History`,
                      `Record ID: ${item.id}\nUpdated on ${item.updatedDate} by Agronomy Team.`
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionLink}>History</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Filters Sheet Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={() => setShowFilterModal(false)} />
          <View style={styles.bottomSheet}>
            <Text style={styles.filtersModalTitle}>Filter Library</Text>

            <Text style={styles.filterFieldLabel}>Status</Text>
            <View style={styles.statusChipsRow}>
              {(['All', 'Published', 'Draft'] as const).map((st) => {
                const isActive = statusFilter === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusChip, isActive && styles.statusChipActive]}
                    onPress={() => setStatusFilter(st)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.statusChipText, isActive && styles.statusChipTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalApplyBtnText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={() => {
                  setStatusFilter('All');
                  setSearchQuery('');
                  setShowFilterModal(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalResetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Add New Pest Screen ────────────────────────────────────────────────────

export interface AddNewPestScreenProps {
  onBack: () => void;
  onSave?: (pest: Partial<PestItem>) => void;
  initialPest?: PestItem | null | undefined;
  isEditing?: boolean;
}

export function AddNewPestScreen({
  onBack,
  onSave,
  initialPest,
  isEditing = false,
}: AddNewPestScreenProps): React.JSX.Element {
  const [commonName, setCommonName] = useState(initialPest?.name || '');
  const [scientificName, setScientificName] = useState(initialPest?.scientificName || '');
  const [pestOrDisease, setPestOrDisease] = useState(initialPest?.type || '');
  const [descriptionNotes, setDescriptionNotes] = useState(initialPest?.symptoms || '');
  const [verificationSource, setVerificationSource] = useState('Agronomy Field Survey');

  const [applicableCrops, setApplicableCrops] = useState(initialPest?.crops || initialPest?.crop || '');
  const [affectedPlantParts, setAffectedPlantParts] = useState('Leaves, Stems & Fruits');
  const [visibleSymptoms, setVisibleSymptoms] = useState(initialPest?.symptoms || '');
  const [identificationIndicators, setIdentificationIndicators] = useState('');
  const [similarConditions, setSimilarConditions] = useState('');

  const [knownRiskPeriod, setKnownRiskPeriod] = useState(initialPest?.riskPeriod || '');
  const [growingConditions, setGrowingConditions] = useState('High humidity, cool nights');
  const [weatherRiskInfo, setWeatherRiskInfo] = useState('');
  const [severityGuidance, setSeverityGuidance] = useState(initialPest?.severity || 'Medium');

  const [preventivePractices, setPreventivePractices] = useState('Crop rotation, balanced irrigation');
  const [linkedOrganicTreatment, setLinkedOrganicTreatment] = useState(initialPest?.treatment || '');
  const [applicationGuide, setApplicationGuide] = useState('');
  const [safetyPrecautions, setSafetyPrecautions] = useState('Wear protective gear during spray application');

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
    const trimmedName = commonName.trim() || 'New Pest/Disease Record';
    const trimmedSci = scientificName.trim() || 'Species undetermined';
    const trimmedType = pestOrDisease || 'Disease';
    const trimmedCrops = applicableCrops || 'Tomato, Potato';
    const trimmedRisk = knownRiskPeriod.trim() || 'Seasonal verification pending';

    if (isEditing && initialPest) {
      initialPest.name = trimmedName;
      initialPest.scientificName = trimmedSci;
      initialPest.type = trimmedType;
      initialPest.crop = trimmedCrops.split(',')[0]?.trim() || initialPest.crop;
      initialPest.crops = trimmedCrops;
      initialPest.severity = severityGuidance || initialPest.severity;
      initialPest.riskPeriod = trimmedRisk;
      initialPest.updatedDate = 'Just now';
      initialPest.metaLine = `${trimmedType} · ${trimmedCrops} · Risk: ${trimmedRisk} · Updated Just now`;
      initialPest.symptoms = visibleSymptoms || descriptionNotes || initialPest.symptoms;
      initialPest.treatment = linkedOrganicTreatment || initialPest.treatment;

      const idx = SAMPLE_PESTS.findIndex((p) => p.id === initialPest.id);
      if (idx !== -1) {
        SAMPLE_PESTS[idx] = { ...initialPest };
      }
      if (onSave) {
        onSave(initialPest);
      } else {
        onBack();
      }
      return;
    }

    const newPest: PestItem = {
      id: `PEST-${Math.floor(100 + Math.random() * 900)}`,
      name: trimmedName,
      scientificName: trimmedSci,
      type: trimmedType,
      crop: trimmedCrops.split(',')[0]?.trim() || 'All crops',
      crops: trimmedCrops,
      severity: 'Medium',
      status: 'Draft',
      riskPeriod: trimmedRisk,
      updatedDate: 'Just now',
      metaLine: `${trimmedType} · ${trimmedCrops} · Risk: ${trimmedRisk} · Updated Just now`,
      symptoms: visibleSymptoms || descriptionNotes,
      treatment: linkedOrganicTreatment || 'Neem oil concentrate spray',
    };

    SAMPLE_PESTS.unshift(newPest);

    if (onSave) {
      onSave(newPest);
    } else {
      onBack();
    }
  };

  return (
    <View style={addStyles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={addStyles.header}>
        <View style={addStyles.headerRow}>
          <TouchableOpacity
            style={addStyles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={addStyles.headerTitle}>{isEditing ? 'Edit Pest/Disease' : 'Add New Pest/Disease'}</Text>
        </View>
      </View>

      {/* Scroll Form Container */}
      <ScrollView
        style={addStyles.scroll}
        contentContainerStyle={addStyles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Identification */}
        <Text style={addStyles.sectionTitle}>Identification</Text>
        <View style={addStyles.cardContainer}>
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Common name <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={addStyles.textInput}
              value={commonName}
              onChangeText={setCommonName}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Scientific name (only when verified)</Text>
            <TextInput
              style={addStyles.textInput}
              value={scientificName}
              onChangeText={setScientificName}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Pest or disease <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={addStyles.selectBox}
              onPress={() => openSelect('Pest or Disease', ['Disease', 'Pest', 'Nematode', 'Weed'], setPestOrDisease)}
              activeOpacity={0.8}
            >
              <Text style={[addStyles.selectText, !pestOrDisease && addStyles.selectPlaceholder]}>
                {pestOrDisease || 'Select...'}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Description and identification notes <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={addStyles.textInput}
              value={descriptionNotes}
              onChangeText={setDescriptionNotes}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Verification source <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[addStyles.textInput, addStyles.multilineInput]}
              value={verificationSource}
              onChangeText={setVerificationSource}
              multiline
              numberOfLines={3}
              placeholderTextColor={adminColors.placeholder}
            />
            <Text style={addStyles.subtextNote}>
              Reference images and the approved documentation the entry comes from.
            </Text>
          </View>
        </View>

        {/* Section 2: Crops & symptoms */}
        <Text style={addStyles.sectionTitle}>Crops & symptoms</Text>
        <View style={addStyles.cardContainer}>
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Applicable crops</Text>
            <TouchableOpacity
              style={addStyles.selectBox}
              onPress={() =>
                openSelect(
                  'Applicable Crops',
                  ['Tomato, Potato', 'Cabbage, Beans', 'Cucumber, Tomato', 'Polyhouse vegetables', 'Root crops', 'All vegetables'],
                  setApplicableCrops
                )
              }
              activeOpacity={0.8}
            >
              <Text style={[addStyles.selectText, !applicableCrops && addStyles.selectPlaceholder]}>
                {applicableCrops || 'Select...'}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Affected plant parts</Text>
            <TextInput
              style={addStyles.textInput}
              value={affectedPlantParts}
              onChangeText={setAffectedPlantParts}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Visible symptoms <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={addStyles.textInput}
              value={visibleSymptoms}
              onChangeText={setVisibleSymptoms}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Identification indicators</Text>
            <TextInput
              style={addStyles.textInput}
              value={identificationIndicators}
              onChangeText={setIdentificationIndicators}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Similar conditions or lookalikes (when verified)</Text>
            <TextInput
              style={addStyles.textInput}
              value={similarConditions}
              onChangeText={setSimilarConditions}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>
        </View>

        {/* Section 3: Seasonal risk */}
        <Text style={addStyles.sectionTitle}>Seasonal risk</Text>
        <View style={addStyles.cardContainer}>
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Known seasonal risk period</Text>
            <TextInput
              style={addStyles.textInput}
              value={knownRiskPeriod}
              onChangeText={setKnownRiskPeriod}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Relevant growing conditions</Text>
            <TextInput
              style={addStyles.textInput}
              value={growingConditions}
              onChangeText={setGrowingConditions}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Weather-based risk information (only from a verified source)</Text>
            <TextInput
              style={addStyles.textInput}
              value={weatherRiskInfo}
              onChangeText={setWeatherRiskInfo}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Severity guidance</Text>
            <TextInput
              style={addStyles.textInput}
              value={severityGuidance}
              onChangeText={setSeverityGuidance}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>
        </View>

        {/* Section 4: Prevention & management */}
        <Text style={addStyles.sectionTitle}>Prevention & management</Text>
        <View style={addStyles.cardContainer}>
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Preventive practices</Text>
            <TextInput
              style={addStyles.textInput}
              value={preventivePractices}
              onChangeText={setPreventivePractices}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Linked approved organic treatment</Text>
            <TouchableOpacity
              style={addStyles.selectBox}
              onPress={() =>
                openSelect(
                  'Organic Treatment',
                  [
                    'Neem Oil Concentrate',
                    'Trichoderma Viride',
                    'Pseudomonas Fluorescens',
                    'Beauveria Bassiana',
                    'Agniastra Herbal Decoction',
                  ],
                  setLinkedOrganicTreatment
                )
              }
              activeOpacity={0.8}
            >
              <Text style={[addStyles.selectText, !linkedOrganicTreatment && addStyles.selectPlaceholder]}>
                {linkedOrganicTreatment || 'Select'}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>
            <Text style={addStyles.subtextNote}>Only approved inputs are offered.</Text>
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Relevant application guide</Text>
            <TouchableOpacity
              style={addStyles.selectBox}
              onPress={() =>
                openSelect(
                  'Application Guide',
                  [
                    'Late Blight Management Guide',
                    'Organic Sucking Pest Protocol',
                    'Bio-fungicide Spray Schedule',
                    'Damping-off Nursery Guide',
                  ],
                  setApplicationGuide
                )
              }
              activeOpacity={0.8}
            >
              <Text style={[addStyles.selectText, !applicationGuide && addStyles.selectPlaceholder]}>
                {applicationGuide || 'Select'}
              </Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>
            <Text style={addStyles.subtextNote}>Only published guides are offered.</Text>
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Safety precautions and follow-up</Text>
            <TextInput
              style={[addStyles.textInput, addStyles.multilineInput]}
              value={safetyPrecautions}
              onChangeText={setSafetyPrecautions}
              multiline
              numberOfLines={3}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>
        </View>

        <View style={{ height: 85 }} />
      </ScrollView>

      {/* Fixed Bottom Save Button */}
      <View style={addStyles.bottomBar}>
        <TouchableOpacity
          style={addStyles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={addStyles.saveBtnText}>{isEditing ? 'Save Changes' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      {/* Picker Sheet Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={addStyles.modalBackdrop}>
          <Pressable style={addStyles.modalDismissArea} onPress={() => setShowPicker(false)} />
          <View style={addStyles.modalSheet}>
            <Text style={addStyles.pickerSheetTitle}>{pickerTitle}</Text>
            {pickerOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={addStyles.pickerOptionRow}
                onPress={() => {
                  pickerOnSelect(opt);
                  setShowPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={addStyles.pickerOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function EditPestScreen(props: AddNewPestScreenProps): React.JSX.Element {
  return <AddNewPestScreen {...props} isEditing={true} />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
    justifyContent: 'space-between',
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
    flex: 1,
    marginLeft: adminSpacing.xs,
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: adminSpacing.xs,
    ...adminType.body,
    color: adminColors.ink,
  },
  filterBtn: {
    padding: adminSpacing.xs,
  },
  recordsCount: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    marginHorizontal: 4,
    marginVertical: adminSpacing.sm,
  },
  pestCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  scientificName: {
    ...adminType.caption,
    fontStyle: 'italic',
    color: adminColors.muted,
    marginBottom: 4,
  },
  cardLineMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    lineHeight: 18,
    marginBottom: 8,
  },
  badge: {
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.xsSm,
    paddingVertical: 3,
  },
  badgeText: {
    ...adminType.caption,
  },
  badgePublished: {
    backgroundColor: adminColors.success.bg,
  },
  badgeTextPublished: {
    color: adminColors.success.text,
  },
  badgeDraft: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeTextDraft: {
    color: adminColors.warning.text,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    marginTop: 6,
  },
  actionLink: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.xl,
    paddingTop: adminSpacing.xl,
    paddingBottom: adminSpacing.xl + 20,
  },
  filtersModalTitle: {
    ...adminType.title,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  filterFieldLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: adminSpacing.lg,
  },
  statusChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  statusChipActive: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  statusChipText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  statusChipTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  modalApplyBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  modalResetBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
});

const addStyles = StyleSheet.create({
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
  subtextNote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 6,
    lineHeight: 16,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm + 2,
    paddingBottom: adminSpacing.lg + 4,
  },
  saveBtn: {
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  saveBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.xl,
    paddingTop: adminSpacing.xl,
    paddingBottom: adminSpacing.xl + 20,
  },
  pickerSheetTitle: {
    ...adminType.title,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  pickerOptionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  pickerOptionText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
});
