import React, { useState, useMemo } from 'react';
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// ── Inline Vector Icons ──────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloudOutlineIcon({ size = 22, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 19a4.5 4.5 0 0 1-.4-8.98A7.002 7.002 0 0 1 19.5 12a4.5 4.5 0 0 1-2 8.5H6.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BarChartIcon({ size = 20, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarMiniIcon({ size = 12, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Types & Data ─────────────────────────────────────────────────────────────

export interface PestLibraryEntry {
  id: string;
  name: string;
  scientificName: string;
  type: 'Disease' | 'Pest' | 'Weed';
  riskLevel: 'High' | 'Medium' | 'Low';
  crops: string[];
  season: string;
  symptoms: string[];
  organicTreatments: string[];
  prevention: string[];
}

export interface PestLibraryScreenProps {
  onBack?: () => void;
  onNavigateToSchedule?: (pestName?: string) => void;
}

const CROP_FILTER_OPTIONS = [
  'All crops',
  'Tomato',
  'Potato',
  'Cabbage',
  'Carrot',
  'Beetroot',
] as const;

const PEST_LIBRARY_DATA: PestLibraryEntry[] = [
  {
    id: 'lib-1',
    name: 'Early Blight',
    scientificName: 'Alternaria solani',
    type: 'Disease',
    riskLevel: 'High',
    crops: ['Tomato', 'Potato'],
    season: 'Jul–Sep',
    symptoms: [
      'Concentric dark rings ("target board" pattern) on older leaves',
      'Yellow chlorotic halos surrounding lesions',
      'Premature leaf yellowing, drying, and defoliation',
      'Dark sunken leathery lesions at stem base and fruit calyx',
    ],
    organicTreatments: [
      'Trichoderma viride bio-fungicide foliar spray (5g/L)',
      'Copper hydroxide or Bordeaux mixture (1%) preventive application',
      'Baking soda solution (5g/L) with horticultural oil sticker',
    ],
    prevention: [
      'Maintain minimum 60cm spacing between rows for ventilation',
      'Apply organic straw mulch to prevent soil-splash onto lower leaves',
      'Strict drip irrigation to avoid wet foliage overnight',
      'Minimum 2-year Solanaceae crop rotation schedule',
    ],
  },
  {
    id: 'lib-2',
    name: 'Diamondback Moth',
    scientificName: 'Plutella xylostella',
    type: 'Pest',
    riskLevel: 'High',
    crops: ['Cabbage'],
    season: 'Jul–Sep',
    symptoms: [
      'Clear "windowpane" holes where caterpillars consume lower leaf surface',
      'Extensive skeletonization of young wrapper leaves',
      'Caterpillar frass and silken webs inside developing cabbage heads',
      'Stunted head formation and unmarketable heads',
    ],
    organicTreatments: [
      'Bacillus thuringiensis kurstaki (Bt) foliar spray (1.5–2g/L)',
      '5% Neem Seed Kernel Extract (NSKE) applied at 7-day intervals',
      'Pheromone trap installation (12 traps/acre for mating disruption)',
    ],
    prevention: [
      'Mustard trap cropping: plant 2 border rows to attract moths away',
      'Fine 50-mesh nylon netting over seedling nursery beds',
      'Conservation of natural parasitoid wasps (Diadegma insulare)',
    ],
  },
  {
    id: 'lib-3',
    name: 'Aphid',
    scientificName: 'Aphis gossypii',
    type: 'Pest',
    riskLevel: 'Medium',
    crops: ['Carrot', 'Tomato', 'Cabbage'],
    season: 'Jun–Aug',
    symptoms: [
      'Distorted, crumpled, and curled tender new growth',
      'Sticky honeydew secretions coating foliage and fruit',
      'Black sooty mold fungi colonizing honeydew-coated leaves',
      'Vectoring of viral diseases (e.g. cucumber mosaic virus)',
    ],
    organicTreatments: [
      'Cold-pressed Neem Oil spray (3–5ml/L) with natural emulsifier soap',
      'Potassium salt insecticidal soap solution',
      'Release of beneficial predators: Ladybird beetles & Green lacewings',
    ],
    prevention: [
      'Companion planting with marigolds, dill, fennel, and coriander',
      'Avoid high-dose synthetic or uncomposted nitrogen applications',
      'Reflective silver mulch to deter incoming winged aphids',
    ],
  },
  {
    id: 'lib-4',
    name: 'Carrot Rust Fly',
    scientificName: 'Psila rosae',
    type: 'Pest',
    riskLevel: 'Medium',
    crops: ['Carrot'],
    season: 'May–Jul',
    symptoms: [
      'Rusty-red or dark brown larval mine tunnels inside root flesh',
      'Stunted, purplish-bronze foliage that wilts in warm daylight',
      'Forked, unmarketable root tubers prone to secondary soft rot',
    ],
    organicTreatments: [
      'Entomopathogenic beneficial nematodes (Steinernema feltiae)',
      'Garlic and chili repellent foliar spray during flight periods',
      'Diatomaceous earth dusting along seed furrows',
    ],
    prevention: [
      'Floating horticultural fleece row covers installed immediately after seeding',
      'Interplanting with onions, leeks, or rosemary to mask root scents',
      'Delay seeding until after first spring flight period',
    ],
  },
  {
    id: 'lib-5',
    name: 'Damping-off',
    scientificName: 'Pythium spp.',
    type: 'Disease',
    riskLevel: 'Medium',
    crops: ['Cabbage', 'Tomato'],
    season: 'Monsoon',
    symptoms: [
      'Water-soaked stem lesions right at soil level line',
      'Sudden seedling collapse and toppling over in seedbeds',
      'Pre-emergence seed decay and poor nursery germination',
    ],
    organicTreatments: [
      'Trichoderma harzianum seed treatment (4g/kg seed)',
      'Pseudomonas fluorescens soil drench (10g/L water)',
      'Wood ash sprinkling around base of seedling trays',
    ],
    prevention: [
      'Utilize raised nursery beds with well-aerated sterile compost substrate',
      'Avoid excessive watering and shade in nursery tunnels',
      'Solarize nursery soil beds 4 weeks prior to monsoon sowing',
    ],
  },
  {
    id: 'lib-6',
    name: 'Powdery Mildew',
    scientificName: 'Erysiphales',
    type: 'Disease',
    riskLevel: 'Low',
    crops: ['Beetroot', 'Carrot'],
    season: 'Aug–Oct',
    symptoms: [
      'White circular talcum-like fungal powder spots on upper leaf surfaces',
      'Chlorosis and curling of older outer foliage',
      'Premature leaf senescence reducing photosynthesis and root bulking',
    ],
    organicTreatments: [
      'Raw cow milk spray diluted 1:9 with clean water',
      'Wettable sulfur (80% WP) at 2g/L (do not apply in extreme heat)',
      'Potassium bicarbonate spray (3g/L) for immediate pH shock to spores',
    ],
    prevention: [
      'Prune dense canopy to ensure air circulation through bed centers',
      'Plant disease-tolerant varieties adapted to humid hill climates',
      'Maintain balanced potassium fertilization for cell wall strength',
    ],
  },
];

// ── Screen Component ─────────────────────────────────────────────────────────

export function PestLibraryScreen({
  onBack,
  onNavigateToSchedule,
}: PestLibraryScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string>('All crops');
  const [isCropPickerOpen, setIsCropPickerOpen] = useState(false);
  const [selectedPestDetail, setSelectedPestDetail] = useState<PestLibraryEntry | null>(null);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  const filteredEntries = useMemo(() => {
    return PEST_LIBRARY_DATA.filter((entry) => {
      // Crop filter
      if (selectedCrop !== 'All crops') {
        const cropMatch = entry.crops.some((c) =>
          c.toLowerCase().includes(selectedCrop.toLowerCase()),
        );
        if (!cropMatch) return false;
      }

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = entry.name.toLowerCase().includes(q);
        const matchesSci = entry.scientificName.toLowerCase().includes(q);
        const matchesType = entry.type.toLowerCase().includes(q);
        const matchesCrops = entry.crops.some((c) => c.toLowerCase().includes(q));
        return matchesName || matchesSci || matchesType || matchesCrops;
      }

      return true;
    });
  }, [searchQuery, selectedCrop]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerCodeBadge}>FR-F07</Text>
            <Text style={styles.headerMainTitle}>Pest Library</Text>
            <Text style={styles.headerSubtitle}>Common pests, diseases & weeds</Text>
          </View>
        </View>

        {/* ── Search Input ── */}
        <View style={styles.searchBarBox}>
          <SearchIcon size={18} color={P.twGray400} />
          <TextInput
            style={styles.searchBarInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by common or scientific name..."
            placeholderTextColor={P.twGray400}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ── Crop Dropdown Selector ── */}
        <TouchableOpacity
          style={styles.cropDropdownSelector}
          activeOpacity={0.8}
          onPress={() => setIsCropPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Filter by crop"
        >
          <Text style={styles.cropDropdownText}>{selectedCrop}</Text>
          <ChevronDownIcon size={16} color={P.twGray500} />
        </TouchableOpacity>

        {/* ── Weather-based Risk Banner ── */}
        <View style={styles.riskBannerCard}>
          <View style={styles.riskBannerIconBox}>
            <CloudOutlineIcon size={20} color={P.twAmber800} />
          </View>
          <Text style={styles.riskBannerText}>
            <Text style={styles.riskBannerBold}>Weather-based risk: </Text>
            High humidity forecast this week — elevated fungal risk for your Cabbage zone.
          </Text>
        </View>

        {/* ── Pest Analytics Card ── */}
        <TouchableOpacity
          style={styles.analyticsCard}
          activeOpacity={0.85}
          onPress={() => setIsAnalyticsModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open Pest Analytics"
        >
          <View style={styles.analyticsIconBox}>
            <BarChartIcon size={20} color={P.twGray700} />
          </View>
          <View style={styles.analyticsTextCol}>
            <Text style={styles.analyticsTitle}>Pest Analytics</Text>
            <Text style={styles.analyticsSubtitle}>
              Frequency by season, most affected crops, treatment effectiveness
            </Text>
          </View>
          <ChevronRightIcon size={18} color={P.twGray400} />
        </TouchableOpacity>

        {/* ── Pest / Disease List ── */}
        <View style={styles.libraryList}>
          {filteredEntries.length > 0 ? (
            filteredEntries.map((item) => {
              const isDisease = item.type === 'Disease';
              const isPest = item.type === 'Pest';
              const isHighRisk = item.riskLevel === 'High';
              const isMedRisk = item.riskLevel === 'Medium';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.pestCard}
                  activeOpacity={0.85}
                  onPress={() => setSelectedPestDetail(item)}
                >
                  {/* Top Row: Dot + Title + Category Pill */}
                  <View style={styles.pestCardTopRow}>
                    <View style={styles.pestCardTitleGroup}>
                      <View
                        style={[
                          styles.statusDot,
                          isHighRisk && styles.statusDotHigh,
                          isMedRisk && styles.statusDotMed,
                          !isHighRisk && !isMedRisk && styles.statusDotLow,
                        ]}
                      />
                      <Text style={styles.pestNameText}>{item.name}</Text>
                    </View>

                    <View
                      style={[
                        styles.categoryPill,
                        isDisease && styles.categoryPillDisease,
                        isPest && styles.categoryPillPest,
                        !isDisease && !isPest && styles.categoryPillWeed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryPillText,
                          isDisease && styles.categoryPillTextDisease,
                          isPest && styles.categoryPillTextPest,
                          !isDisease && !isPest && styles.categoryPillTextWeed,
                        ]}
                      >
                        {item.type}
                      </Text>
                    </View>
                  </View>

                  {/* Scientific Name */}
                  <Text style={styles.scientificNameText}>{item.scientificName}</Text>

                  {/* Tags Row */}
                  <View style={styles.tagsRow}>
                    <View style={styles.tagPill}>
                      <Text style={styles.tagPillText}>{item.crops.join(', ')}</Text>
                    </View>

                    <View style={[styles.tagPill, styles.tagPillWithIcon]}>
                      <CalendarMiniIcon size={12} color={P.twGray500} />
                      <Text style={styles.tagPillText}>{item.season}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No matching pests or diseases</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search term or selecting "All crops"
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Crop Picker Modal ── */}
      <Modal
        visible={isCropPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCropPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsCropPickerOpen(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <Text style={styles.modalCardTitle}>Filter by Crop</Text>
              <TouchableOpacity onPress={() => setIsCropPickerOpen(false)}>
                <CloseIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
            </View>

            {CROP_FILTER_OPTIONS.map((opt) => {
              const isSelected = selectedCrop === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.modalCardOption, isSelected && styles.modalCardOptionSelected]}
                  onPress={() => {
                    setSelectedCrop(opt);
                    setIsCropPickerOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalCardOptionText,
                      isSelected && styles.modalCardOptionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                  {isSelected && <CheckIcon size={18} color={P.twGreen700} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* ── Pest Detail Modal ── */}
      <Modal
        visible={selectedPestDetail !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPestDetail(null)}
      >
        {selectedPestDetail && (
          <SafeAreaView style={styles.detailModalSafeArea}>
            <View style={styles.detailModalHeader}>
              <TouchableOpacity
                style={styles.detailModalCloseBtn}
                onPress={() => setSelectedPestDetail(null)}
              >
                <CloseIcon size={20} color={P.twGray700} />
              </TouchableOpacity>
              <View style={styles.detailModalHeaderTitleCol}>
                <Text style={styles.detailModalMainTitle}>{selectedPestDetail.name}</Text>
                <Text style={styles.detailModalSubTitle}>{selectedPestDetail.scientificName}</Text>
              </View>
              <View
                style={[
                  styles.categoryPill,
                  selectedPestDetail.type === 'Disease'
                    ? styles.categoryPillDisease
                    : styles.categoryPillPest,
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    selectedPestDetail.type === 'Disease'
                      ? styles.categoryPillTextDisease
                      : styles.categoryPillTextPest,
                  ]}
                >
                  {selectedPestDetail.type}
                </Text>
              </View>
            </View>

            <ScrollView
              style={styles.detailModalScroll}
              contentContainerStyle={styles.detailModalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Quick Summary Badges */}
              <View style={styles.detailSummaryRow}>
                <View style={styles.summaryBadgeItem}>
                  <Text style={styles.summaryBadgeLabel}>RISK LEVEL</Text>
                  <Text
                    style={[
                      styles.summaryBadgeVal,
                      selectedPestDetail.riskLevel === 'High' && { color: P.red600 },
                      selectedPestDetail.riskLevel === 'Medium' && { color: P.amber600 },
                      selectedPestDetail.riskLevel === 'Low' && { color: colors.brandGreen },
                    ]}
                  >
                    {selectedPestDetail.riskLevel}
                  </Text>
                </View>
                <View style={styles.summaryBadgeItem}>
                  <Text style={styles.summaryBadgeLabel}>ACTIVE SEASON</Text>
                  <Text style={styles.summaryBadgeVal}>{selectedPestDetail.season}</Text>
                </View>
                <View style={styles.summaryBadgeItem}>
                  <Text style={styles.summaryBadgeLabel}>HOST CROPS</Text>
                  <Text style={styles.summaryBadgeVal}>{selectedPestDetail.crops.join(', ')}</Text>
                </View>
              </View>

              {/* Symptoms Section */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionHeading}>KEY SYMPTOMS</Text>
                {selectedPestDetail.symptoms.map((sym, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{sym}</Text>
                  </View>
                ))}
              </View>

              {/* Organic Treatments */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionHeading}>ORGANIC & BIOLOGICAL TREATMENTS</Text>
                {selectedPestDetail.organicTreatments.map((tr, idx) => (
                  <View key={idx} style={styles.treatmentItemCard}>
                    <Text style={styles.treatmentItemNumber}>0{idx + 1}</Text>
                    <Text style={styles.treatmentItemText}>{tr}</Text>
                  </View>
                ))}
              </View>

              {/* Preventive Measures */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionHeading}>PREVENTIVE MEASURES</Text>
                {selectedPestDetail.prevention.map((pr, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, { backgroundColor: colors.brandGreen }]} />
                    <Text style={styles.bulletText}>{pr}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.detailModalFooter}>
              <TouchableOpacity
                style={styles.detailCloseBtn}
                onPress={() => setSelectedPestDetail(null)}
              >
                <Text style={styles.detailCloseBtnText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailScheduleBtn}
                activeOpacity={0.85}
                onPress={() => {
                  const pestName = selectedPestDetail.name;
                  setSelectedPestDetail(null);
                  if (onNavigateToSchedule) {
                    onNavigateToSchedule(pestName);
                  } else {
                    Alert.alert(
                      'Schedule Treatment',
                      `Treatment reminder for ${pestName} logged to schedule.`,
                    );
                  }
                }}
              >
                <CalendarMiniIcon size={16} color={P.white} />
                <Text style={styles.detailScheduleBtnText}>Log Treatment</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>

      {/* ── Pest Analytics Modal ── */}
      <Modal
        visible={isAnalyticsModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAnalyticsModalOpen(false)}
      >
        <SafeAreaView style={styles.detailModalSafeArea}>
          <View style={styles.detailModalHeader}>
            <TouchableOpacity
              style={styles.detailModalCloseBtn}
              onPress={() => setIsAnalyticsModalOpen(false)}
            >
              <CloseIcon size={20} color={P.twGray700} />
            </TouchableOpacity>
            <View style={styles.detailModalHeaderTitleCol}>
              <Text style={styles.detailModalMainTitle}>Pest Analytics</Text>
              <Text style={styles.detailModalSubTitle}>Frequency & efficacy patterns</Text>
            </View>
          </View>

          <ScrollView
            style={styles.detailModalScroll}
            contentContainerStyle={styles.detailModalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Seasonal Distribution */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionHeading}>SEASONAL INCIDENCE</Text>
              <View style={styles.analyticsBarRow}>
                <Text style={styles.analyticsBarLabel}>Monsoon (Jul–Sep)</Text>
                <View style={styles.analyticsBarTrack}>
                  <View style={[styles.analyticsBarFill, { width: '68%', backgroundColor: P.twRed600 }]} />
                </View>
                <Text style={styles.analyticsBarValue}>68%</Text>
              </View>

              <View style={styles.analyticsBarRow}>
                <Text style={styles.analyticsBarLabel}>Summer (Apr–Jun)</Text>
                <View style={styles.analyticsBarTrack}>
                  <View style={[styles.analyticsBarFill, { width: '42%', backgroundColor: P.amber600 }]} />
                </View>
                <Text style={styles.analyticsBarValue}>42%</Text>
              </View>

              <View style={styles.analyticsBarRow}>
                <Text style={styles.analyticsBarLabel}>Winter (Nov–Feb)</Text>
                <View style={styles.analyticsBarTrack}>
                  <View style={[styles.analyticsBarFill, { width: '18%', backgroundColor: colors.brandGreen }]} />
                </View>
                <Text style={styles.analyticsBarValue}>18%</Text>
              </View>
            </View>

            {/* Most Impacted Crops */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionHeading}>MOST IMPACTED CROPS</Text>
              <View style={styles.impactCard}>
                <Text style={styles.impactCardTitle}>Cabbage (Brassica)</Text>
                <Text style={styles.impactCardDesc}>
                  Diamondback Moth & Cabbage Looper account for 54% of hill-farm pressure.
                </Text>
              </View>

              <View style={styles.impactCard}>
                <Text style={styles.impactCardTitle}>Tomato & Potato</Text>
                <Text style={styles.impactCardDesc}>
                  Early Blight recurrence increases by 3.2x during consecutive days with &gt;85% relative humidity.
                </Text>
              </View>
            </View>

            {/* Treatment Efficacy */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionHeading}>ORGANIC EFFICACY BENCHMARKS</Text>
              <View style={styles.efficacyRow}>
                <Text style={styles.efficacyName}>Bacillus thuringiensis (Bt)</Text>
                <Text style={styles.efficacyPercent}>92% Success</Text>
              </View>
              <View style={styles.efficacyRow}>
                <Text style={styles.efficacyName}>Trichoderma viride Bio-fungicide</Text>
                <Text style={styles.efficacyPercent}>89% Success</Text>
              </View>
              <View style={styles.efficacyRow}>
                <Text style={styles.efficacyName}>Cold-Pressed Neem Oil (3ml/L)</Text>
                <Text style={styles.efficacyPercent}>84% Success</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.detailModalFooter}>
            <TouchableOpacity
              style={[styles.detailCloseBtn, { flex: 1 }]}
              onPress={() => setIsAnalyticsModalOpen(false)}
            >
              <Text style={styles.detailCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleCol: {
    marginLeft: 14,
  },
  headerCodeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray400,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.deepGreen,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: P.twGray500,
    marginTop: 2,
  },

  // Search
  searchBarBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 10,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: P.nearBlack,
  },

  // Dropdown
  cropDropdownSelector: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  cropDropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: P.nearBlack,
  },

  // Weather Risk Banner
  riskBannerCard: {
    backgroundColor: P.twAmber50,
    borderWidth: 1,
    borderColor: P.twAmber200,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  riskBannerIconBox: {
    marginTop: 2,
  },
  riskBannerText: {
    flex: 1,
    fontSize: 13,
    color: P.twAmber800,
    lineHeight: 18,
  },
  riskBannerBold: {
    fontWeight: '800',
    color: P.twAmber800,
  },

  // Analytics Card
  analyticsCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: P.twGray100,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  analyticsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  analyticsTextCol: {
    flex: 1,
  },
  analyticsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.nearBlack,
  },
  analyticsSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
    lineHeight: 16,
  },

  // Pest Library Cards List
  libraryList: {
    gap: 12,
  },
  pestCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  pestCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pestCardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotHigh: {
    backgroundColor: P.red600,
  },
  statusDotMed: {
    backgroundColor: P.amber600,
  },
  statusDotLow: {
    backgroundColor: colors.brandGreen,
  },
  pestNameText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.nearBlack,
  },
  categoryPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  categoryPillDisease: {
    backgroundColor: P.twRed100,
  },
  categoryPillPest: {
    backgroundColor: P.twPurple100,
  },
  categoryPillWeed: {
    backgroundColor: P.twGreen100,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryPillTextDisease: {
    color: P.red700,
  },
  categoryPillTextPest: {
    color: P.twPurple600,
  },
  categoryPillTextWeed: {
    color: P.twGreen800,
  },
  scientificNameText: {
    fontSize: 12.5,
    fontStyle: 'italic',
    color: P.twGray500,
    marginTop: 2,
    marginBottom: 10,
    paddingLeft: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 16,
  },
  tagPill: {
    backgroundColor: P.twGray100,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  tagPillWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tagPillText: {
    fontSize: 11.5,
    color: P.twGray700,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray700,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: P.twGray400,
    textAlign: 'center',
  },

  // Modal Common
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: P.nearBlack,
  },
  modalCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  modalCardOptionSelected: {
    backgroundColor: P.twGreen50,
  },
  modalCardOptionText: {
    fontSize: 14.5,
    color: P.twGray700,
    fontWeight: '500',
  },
  modalCardOptionTextSelected: {
    fontWeight: '700',
    color: P.deepGreen,
  },

  // Detail Modal
  detailModalSafeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  detailModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailModalHeaderTitleCol: {
    flex: 1,
  },
  detailModalMainTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: P.deepGreen,
  },
  detailModalSubTitle: {
    fontSize: 12,
    fontStyle: 'italic',
    color: P.twGray500,
    marginTop: 2,
  },
  detailModalScroll: {
    flex: 1,
  },
  detailModalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 18,
  },
  detailSummaryRow: {
    flexDirection: 'row',
    backgroundColor: P.twGray100,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  summaryBadgeItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryBadgeLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: P.twGray500,
    marginBottom: 4,
  },
  summaryBadgeVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: P.nearBlack,
    textAlign: 'center',
  },
  detailSection: {
    gap: 8,
  },
  detailSectionHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.red600,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: P.twGray700,
    lineHeight: 18,
  },
  treatmentItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twGreen50,
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  treatmentItemNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: P.twGreen700,
  },
  treatmentItemText: {
    flex: 1,
    fontSize: 13,
    color: P.twGreen900,
    lineHeight: 18,
    fontWeight: '600',
  },
  detailModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    gap: 12,
    backgroundColor: P.white,
  },
  detailCloseBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCloseBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: P.twGray700,
  },
  detailScheduleBtn: {
    flex: 1.4,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.deepGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailScheduleBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.white,
  },

  // Analytics Modal Elements
  analyticsBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  analyticsBarLabel: {
    width: 130,
    fontSize: 12,
    color: P.twGray700,
    fontWeight: '600',
  },
  analyticsBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: P.twGray200,
    borderRadius: 5,
    overflow: 'hidden',
  },
  analyticsBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  analyticsBarValue: {
    width: 36,
    fontSize: 12,
    fontWeight: '700',
    color: P.nearBlack,
    textAlign: 'right',
  },
  impactCard: {
    backgroundColor: P.twGray100,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  impactCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 2,
  },
  impactCardDesc: {
    fontSize: 12,
    color: P.twGray600,
    lineHeight: 16,
  },
  efficacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  efficacyName: {
    fontSize: 13,
    color: P.twGray700,
    fontWeight: '500',
  },
  efficacyPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandGreen,
  },
});
