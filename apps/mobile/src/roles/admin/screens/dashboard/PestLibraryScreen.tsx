import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#8C7E74' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.5" fill={color} stroke={adminColors.card} strokeWidth="1.5" />
      <Circle cx="9" cy="12" r="2.5" fill={color} stroke={adminColors.card} strokeWidth="1.5" />
      <Circle cx="16" cy="18" r="2.5" fill={color} stroke={adminColors.card} strokeWidth="1.5" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

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
}

export function PestLibraryScreen({
  onBack,
  onAddNewPest,
  onSelectPest,
}: PestLibraryScreenProps) {
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
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header Banner (Image 1) ─── */}
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

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Search Bar with Filter Sliders Icon (Image 1) ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#8C7E74" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor="#8C7E74"
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

        {/* ─── Records Count (Image 1) ─── */}
        <Text style={styles.recordsCount}>{filteredPests.length} records</Text>

        {/* ─── Pest / Disease Cards List (Image 1) ─── */}
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
              {/* Header Row: Title & Status Badge */}
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

              {/* Line 1: Scientific name */}
              {item.scientificName ? (
                <Text style={styles.scientificName}>{item.scientificName}</Text>
              ) : null}

              {/* Line 2: Meta info */}
              <Text style={styles.cardLineMeta}>
                {item.metaLine ||
                  `${item.type || 'Pest'} · ${item.crops || 'Tomato'} · ${item.riskPeriod || ''} · Updated ${item.updatedDate}`}
              </Text>

              {/* Actions Row: View · Edit · History (Image 1) */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => onSelectPest && onSelectPest(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionLink}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onAddNewPest && onAddNewPest()}
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

      {/* ─── Filters Sheet Modal ─── */}
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

// ─── Add New Pest/Disease Screen (Images 2, 3, 4, 5) ──────────────────────────

export interface AddNewPestScreenProps {
  onBack: () => void;
  onSave?: (newPest: Partial<PestItem>) => void;
}

export function AddNewPestScreen({ onBack, onSave }: AddNewPestScreenProps) {
  // Section 1: Identification (Image 2)
  const [commonName, setCommonName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [pestOrDisease, setPestOrDisease] = useState('');
  const [descriptionNotes, setDescriptionNotes] = useState('');
  const [verificationSource, setVerificationSource] = useState('');

  // Section 2: Crops & symptoms (Images 2 & 3)
  const [applicableCrops, setApplicableCrops] = useState('');
  const [affectedPlantParts, setAffectedPlantParts] = useState('');
  const [visibleSymptoms, setVisibleSymptoms] = useState('');
  const [identificationIndicators, setIdentificationIndicators] = useState('');
  const [similarConditions, setSimilarConditions] = useState('');

  // Section 3: Seasonal risk (Images 3 & 4)
  const [knownRiskPeriod, setKnownRiskPeriod] = useState('');
  const [growingConditions, setGrowingConditions] = useState('');
  const [weatherRiskInfo, setWeatherRiskInfo] = useState('');
  const [severityGuidance, setSeverityGuidance] = useState('');

  // Section 4: Prevention & management (Images 4 & 5)
  const [preventivePractices, setPreventivePractices] = useState('');
  const [linkedOrganicTreatment, setLinkedOrganicTreatment] = useState('');
  const [applicationGuide, setApplicationGuide] = useState('');
  const [safetyPrecautions, setSafetyPrecautions] = useState('');

  // Dropdown Picker Modal
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
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header Banner (Images 2, 3, 4, 5) ─── */}
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
          <Text style={addStyles.headerTitle}>Add New Pest/Disease</Text>
        </View>
      </View>

      {/* ─── Scroll Form Container ─── */}
      <ScrollView
        style={addStyles.scroll}
        contentContainerStyle={addStyles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Section 1: Identification (Image 2) ─── */}
        <Text style={addStyles.sectionTitle}>Identification</Text>
        <View style={addStyles.cardContainer}>
          {/* Common name * */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Common name <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={addStyles.textInput}
              value={commonName}
              onChangeText={setCommonName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Scientific name (only when verified) */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Scientific name (only when verified)</Text>
            <TextInput
              style={addStyles.textInput}
              value={scientificName}
              onChangeText={setScientificName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Pest or disease * */}
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
              <ChevronDownIcon size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Description and identification notes * */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Description and identification notes <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={addStyles.textInput}
              value={descriptionNotes}
              onChangeText={setDescriptionNotes}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Verification source * */}
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
              placeholderTextColor="#9CA3AF"
            />
            <Text style={addStyles.subtextNote}>
              Reference images and the approved documentation the entry comes from.
            </Text>
          </View>
        </View>

        {/* ─── Section 2: Crops & symptoms (Images 2 & 3) ─── */}
        <Text style={addStyles.sectionTitle}>Crops & symptoms</Text>
        <View style={addStyles.cardContainer}>
          {/* Applicable crops */}
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
              <ChevronDownIcon size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Affected plant parts */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Affected plant parts</Text>
            <TextInput
              style={addStyles.textInput}
              value={affectedPlantParts}
              onChangeText={setAffectedPlantParts}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Visible symptoms * */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Visible symptoms <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={addStyles.textInput}
              value={visibleSymptoms}
              onChangeText={setVisibleSymptoms}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Identification indicators */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Identification indicators</Text>
            <TextInput
              style={addStyles.textInput}
              value={identificationIndicators}
              onChangeText={setIdentificationIndicators}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Similar conditions or lookalikes (when verified) */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Similar conditions or lookalikes (when verified)</Text>
            <TextInput
              style={addStyles.textInput}
              value={similarConditions}
              onChangeText={setSimilarConditions}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* ─── Section 3: Seasonal risk (Images 3 & 4) ─── */}
        <Text style={addStyles.sectionTitle}>Seasonal risk</Text>
        <View style={addStyles.cardContainer}>
          {/* Known seasonal risk period */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Known seasonal risk period</Text>
            <TextInput
              style={addStyles.textInput}
              value={knownRiskPeriod}
              onChangeText={setKnownRiskPeriod}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Relevant growing conditions */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Relevant growing conditions</Text>
            <TextInput
              style={addStyles.textInput}
              value={growingConditions}
              onChangeText={setGrowingConditions}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Weather-based risk information (only from a verified source) */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Weather-based risk information (only from a verified source)</Text>
            <TextInput
              style={addStyles.textInput}
              value={weatherRiskInfo}
              onChangeText={setWeatherRiskInfo}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Severity guidance */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Severity guidance</Text>
            <TextInput
              style={addStyles.textInput}
              value={severityGuidance}
              onChangeText={setSeverityGuidance}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* ─── Section 4: Prevention & management (Images 4 & 5) ─── */}
        <Text style={addStyles.sectionTitle}>Prevention & management</Text>
        <View style={addStyles.cardContainer}>
          {/* Preventive practices */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Preventive practices</Text>
            <TextInput
              style={addStyles.textInput}
              value={preventivePractices}
              onChangeText={setPreventivePractices}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Linked approved organic treatment */}
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
              <ChevronDownIcon size={16} color="#6B7280" />
            </TouchableOpacity>
            <Text style={addStyles.subtextNote}>Only approved inputs are offered.</Text>
          </View>

          {/* Relevant application guide */}
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
              <ChevronDownIcon size={16} color="#6B7280" />
            </TouchableOpacity>
            <Text style={addStyles.subtextNote}>Only published guides are offered.</Text>
          </View>

          {/* Safety precautions and follow-up */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Safety precautions and follow-up</Text>
            <TextInput
              style={[addStyles.textInput, addStyles.multilineInput]}
              value={safetyPrecautions}
              onChangeText={setSafetyPrecautions}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Space for bottom fixed save bar */}
        <View style={{ height: 85 }} />
      </ScrollView>

      {/* ─── Fixed Bottom Save Button (Images 2, 3, 4, 5) ─── */}
      <View style={addStyles.bottomBar}>
        <TouchableOpacity
          style={addStyles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={addStyles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Picker Sheet Modal ─── */}
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

// ─── Styles Strictly Derived from Admin Theme ─────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header Banner (Image 1)
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
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
    flex: 1,
    marginLeft: adminSpacing.xs,
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: adminSpacing.xs,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  filterBtn: {
    padding: adminSpacing.xs,
  },

  // Records Count
  recordsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.ink,
    marginHorizontal: 4,
    marginVertical: adminSpacing.sm,
  },

  // Pest Card Structure (Image 1)
  pestCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
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
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  scientificName: {
    fontSize: 12.5,
    fontStyle: 'italic',
    color: adminColors.muted,
    marginBottom: 4,
  },
  cardLineMeta: {
    fontSize: 12.5,
    color: adminColors.muted,
    lineHeight: 18,
    marginBottom: 8,
  },

  // Badges
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
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

  // Actions Row (View · Edit · History)
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    marginTop: 6,
  },
  actionLink: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Modal / Bottom Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: adminSpacing.xl,
    paddingTop: adminSpacing.xl,
    paddingBottom: adminSpacing.xl + 20,
  },
  filtersModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  filterFieldLabel: {
    fontSize: 14,
    fontWeight: '700',
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
    borderRadius: 10,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: '#EDE7E1',
  },
  statusChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.ink,
  },
  statusChipTextActive: {
    color: adminColors.onBrand,
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
    borderRadius: 12,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  modalResetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C8BFB5',
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
});

// ─── Styles for Add New Pest/Disease (Images 2, 3, 4, 5) ──────────────────────

const addStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header Banner
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
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    paddingHorizontal: 2,
  },

  // Card Container
  cardContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },

  // Field Group
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  multilineInput: {
    height: 76,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  subtextNote: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 6,
    lineHeight: 16,
  },

  // Dropdown Select Box
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    height: 44,
  },
  selectText: {
    fontSize: 13.5,
    color: adminColors.ink,
    fontWeight: '500',
  },
  selectPlaceholder: {
    color: '#6B7280',
  },

  // Fixed Bottom Bar (Images 2, 3, 4, 5)
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#EDE7E1',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm + 2,
    paddingBottom: adminSpacing.lg + 4,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EA7C24',
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modal / Picker
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: adminSpacing.xl,
    paddingTop: adminSpacing.xl,
    paddingBottom: adminSpacing.xl + 20,
  },
  pickerSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  pickerOptionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerOptionText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
});

