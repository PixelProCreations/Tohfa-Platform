import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

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

function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="12" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="18" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface IncidentItem {
  id: string;
  displayId?: string;
  displayReportId?: string;
  farmer: string;
  farmerId: string;
  farm: string;
  zone: string;
  crop: 'Carrot' | 'Cabbage' | 'Tomato';
  variety: string;
  farmZone: string;
  plot?: string;
  cropStage: string;
  pest: string;
  scientificName: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Ongoing' | 'Resolved';
  detectedDate: string;
  reportedDate?: string;
  resolvedDate?: string;
  farmerNotes: string;
  photos: string;
  photosCount?: string;
  treatmentName: string;
  treatmentDate: string;
  treatmentStatus: string;
  treatmentNotes: string;
  layoutType?: 'top-details' | 'top-id';
  actions?: string[];
}

export const SAMPLE_INCIDENTS: IncidentItem[] = [
  {
    id: 'PI-0101',
    displayId: 'PI-2026-0007',
    displayReportId: 'INC-2026-0007',
    farmer: 'Ramesh Kumar',
    farmerId: 'FR-00241',
    farm: 'Coonoor Farm 01',
    zone: 'Coonoor',
    crop: 'Tomato',
    variety: 'Roma',
    farmZone: 'plot 1',
    plot: 'Coonoor, plot 1',
    cropStage: 'Vegetative',
    pest: 'Late Blight',
    scientificName: 'Phytophthora infestans',
    severity: 'High',
    status: 'Ongoing',
    detectedDate: '12 Oct 2026',
    reportedDate: '12 Oct 2026',
    farmerNotes: 'Demo farmer report (placeholder).',
    photos: 'none uploaded',
    photosCount: '2 photos',
    treatmentName: 'None linked',
    treatmentDate: '',
    treatmentStatus: 'Pending',
    treatmentNotes: '',
    layoutType: 'top-details',
    actions: ['Review Treatment', 'View Incident'],
  },
  {
    id: 'PI-0097',
    displayId: 'PI-0097',
    displayReportId: 'INC-2026-0005',
    farmer: 'Selvi',
    farmerId: 'FR-00189',
    farm: 'Coonoor Farm 02',
    zone: 'Coonoor',
    crop: 'Cabbage',
    variety: 'Golden Acre',
    farmZone: 'plot 2',
    plot: 'Coonoor, plot 2',
    cropStage: 'Head Formation',
    pest: 'Aphid Infestation',
    scientificName: 'Aphidoidea',
    severity: 'Medium',
    status: 'Resolved',
    detectedDate: '3 Oct 2026',
    reportedDate: '3 Oct 2026',
    resolvedDate: '9 Oct 2026',
    farmerNotes: 'Infestation controlled after treatment.',
    photos: '1 photo',
    photosCount: '1 photo',
    treatmentName: 'Neem-oil foliar spray',
    treatmentDate: '4 Oct 2026',
    treatmentStatus: 'Completed',
    treatmentNotes: 'Resolved successfully.',
    layoutType: 'top-id',
    actions: ['View Incident', 'History'],
  },
  {
    id: 'PI-0095',
    displayId: 'PI-0095',
    displayReportId: 'INC-2026-0004',
    farmer: 'Murugan',
    farmerId: 'FR-00112',
    farm: 'Ooty Farm 04',
    zone: 'Ooty',
    crop: 'Carrot',
    variety: 'Kuroda',
    farmZone: 'plot 1',
    plot: 'Ooty, plot 1',
    cropStage: 'Root Bulking',
    pest: 'Root Knot Nematode',
    scientificName: 'Meloidogyne spp.',
    severity: 'Medium',
    status: 'Ongoing',
    detectedDate: '1 Oct 2026',
    reportedDate: '1 Oct 2026',
    farmerNotes: 'Stunted root growth observed.',
    photos: 'none uploaded',
    photosCount: '0 photos',
    treatmentName: 'Trichoderma soil drench',
    treatmentDate: '2 Oct 2026',
    treatmentStatus: 'In Progress',
    treatmentNotes: 'Bio-agent applied.',
    layoutType: 'top-details',
    actions: ['Review Treatment', 'View Incident'],
  },
  {
    id: 'PI-0092',
    displayId: 'PI-0092',
    displayReportId: 'INC-2026-0003',
    farmer: 'Anand',
    farmerId: 'FR-00305',
    farm: 'Kotagiri Farm 01',
    zone: 'Kotagiri',
    crop: 'Tomato',
    variety: 'Arka Rakshak',
    farmZone: 'plot 3',
    plot: 'Kotagiri, plot 3',
    cropStage: 'Flowering',
    pest: 'Whitefly',
    scientificName: 'Bemisia tabaci',
    severity: 'Low',
    status: 'Resolved',
    detectedDate: '28 Sep 2026',
    reportedDate: '28 Sep 2026',
    resolvedDate: '5 Oct 2026',
    farmerNotes: 'Yellow sticky traps installed.',
    photos: '1 photo',
    photosCount: '1 photo',
    treatmentName: 'Yellow Sticky Traps',
    treatmentDate: '29 Sep 2026',
    treatmentStatus: 'Completed',
    treatmentNotes: 'Trap count normalized.',
    layoutType: 'top-id',
    actions: ['View Incident', 'History'],
  },
  {
    id: 'PI-0089',
    displayId: 'PI-0089',
    displayReportId: 'INC-2026-0002',
    farmer: 'Kavitha',
    farmerId: 'FR-00142',
    farm: 'Coonoor Farm 03',
    zone: 'Coonoor',
    crop: 'Cabbage',
    variety: 'Sugarloaf',
    farmZone: 'plot 1',
    plot: 'Coonoor, plot 1',
    cropStage: 'Vegetative',
    pest: 'Diamondback Moth',
    scientificName: 'Plutella xylostella',
    severity: 'High',
    status: 'Ongoing',
    detectedDate: '25 Sep 2026',
    reportedDate: '25 Sep 2026',
    farmerNotes: 'Larval holes seen on leaves.',
    photos: '2 photos',
    photosCount: '2 photos',
    treatmentName: 'Bt spray',
    treatmentDate: '26 Sep 2026',
    treatmentStatus: 'In Progress',
    treatmentNotes: 'Second application scheduled.',
    layoutType: 'top-details',
    actions: ['Review Treatment', 'View Incident'],
  },
  {
    id: 'PI-0086',
    displayId: 'PI-0086',
    displayReportId: 'INC-2026-0001',
    farmer: 'Ramesh Kumar',
    farmerId: 'FR-00241',
    farm: 'Coonoor Farm 01',
    zone: 'Coonoor',
    crop: 'Tomato',
    variety: 'Roma',
    farmZone: 'plot 2',
    plot: 'Coonoor, plot 2',
    cropStage: 'Seedling',
    pest: 'Damping Off',
    scientificName: 'Pythium spp.',
    severity: 'Medium',
    status: 'Ongoing',
    detectedDate: '22 Sep 2026',
    reportedDate: '22 Sep 2026',
    farmerNotes: 'Seedling collar rot noticed.',
    photos: '1 photo',
    photosCount: '1 photo',
    treatmentName: 'Copper Oxychloride drench',
    treatmentDate: '23 Sep 2026',
    treatmentStatus: 'In Progress',
    treatmentNotes: 'Drenching applied.',
    layoutType: 'top-details',
    actions: ['Review Treatment', 'View Incident'],
  },
  {
    id: 'PI-0083',
    displayId: 'PI-0083',
    displayReportId: 'INC-2026-0000',
    farmer: 'Suresh',
    farmerId: 'FR-00201',
    farm: 'Ooty Farm 02',
    zone: 'Ooty',
    crop: 'Carrot',
    variety: 'Nantes',
    farmZone: 'plot 4',
    plot: 'Ooty, plot 4',
    cropStage: 'Vegetative',
    pest: 'Leaf Blight',
    scientificName: 'Alternaria dauci',
    severity: 'Low',
    status: 'Resolved',
    detectedDate: '18 Sep 2026',
    reportedDate: '18 Sep 2026',
    resolvedDate: '24 Sep 2026',
    farmerNotes: 'Spots cleared after spray.',
    photos: 'none uploaded',
    photosCount: '0 photos',
    treatmentName: 'Mancozeb foliar spray',
    treatmentDate: '19 Sep 2026',
    treatmentStatus: 'Completed',
    treatmentNotes: 'Foliage healthy.',
    layoutType: 'top-id',
    actions: ['View Incident', 'History'],
  },
  {
    id: 'PI-0080',
    displayId: 'PI-0080',
    displayReportId: 'INC-2025-0999',
    farmer: 'Priya',
    farmerId: 'FR-00088',
    farm: 'Kotagiri Farm 02',
    zone: 'Kotagiri',
    crop: 'Tomato',
    variety: 'Pusa Ruby',
    farmZone: 'plot 1',
    plot: 'Kotagiri, plot 1',
    cropStage: 'Fruiting',
    pest: 'Fruit Borer',
    scientificName: 'Helicoverpa armigera',
    severity: 'High',
    status: 'Resolved',
    detectedDate: '12 Sep 2026',
    reportedDate: '12 Sep 2026',
    resolvedDate: '19 Sep 2026',
    farmerNotes: 'Borer larvae removed and pheromone traps placed.',
    photos: '2 photos',
    photosCount: '2 photos',
    treatmentName: 'Pheromone traps & Neem spray',
    treatmentDate: '13 Sep 2026',
    treatmentStatus: 'Completed',
    treatmentNotes: 'Infestation arrested.',
    layoutType: 'top-id',
    actions: ['View Incident', 'History'],
  },
  {
    id: 'PI-0077',
    displayId: 'PI-0077',
    displayReportId: 'INC-2025-0998',
    farmer: 'Dhanapal',
    farmerId: 'FR-00177',
    farm: 'Ooty Farm 05',
    zone: 'Ooty',
    crop: 'Cabbage',
    variety: 'Golden Acre',
    farmZone: 'plot 3',
    plot: 'Ooty, plot 3',
    cropStage: 'Head Formation',
    pest: 'Black Rot',
    scientificName: 'Xanthomonas campestris',
    severity: 'Medium',
    status: 'Resolved',
    detectedDate: '5 Sep 2026',
    reportedDate: '5 Sep 2026',
    resolvedDate: '14 Sep 2026',
    farmerNotes: 'V-shaped lesions treated early.',
    photos: '1 photo',
    photosCount: '1 photo',
    treatmentName: 'Streptocycline spray',
    treatmentDate: '6 Sep 2026',
    treatmentStatus: 'Completed',
    treatmentNotes: 'Leaves normalized.',
    layoutType: 'top-id',
    actions: ['View Incident', 'History'],
  },
  {
    id: 'PI-0074',
    displayId: 'PI-0074',
    displayReportId: 'INC-2025-0997',
    farmer: 'Mani',
    farmerId: 'FR-00219',
    farm: 'Coonoor Farm 04',
    zone: 'Coonoor',
    crop: 'Tomato',
    variety: 'Roma',
    farmZone: 'plot 2',
    plot: 'Coonoor, plot 2',
    cropStage: 'Vegetative',
    pest: 'Early Blight',
    scientificName: 'Alternaria solani',
    severity: 'Low',
    status: 'Resolved',
    detectedDate: '1 Sep 2026',
    reportedDate: '1 Sep 2026',
    resolvedDate: '7 Sep 2026',
    farmerNotes: 'Concentric rings spotted on lower leaves.',
    photos: '1 photo',
    photosCount: '1 photo',
    treatmentName: 'Copper spray',
    treatmentDate: '2 Sep 2026',
    treatmentStatus: 'Completed',
    treatmentNotes: 'Spread arrested.',
    layoutType: 'top-id',
    actions: ['View Incident', 'History'],
  },
  {
    id: 'PI-0071',
    displayId: 'PI-0071',
    displayReportId: 'INC-2025-0996',
    farmer: 'Revathi',
    farmerId: 'FR-00163',
    farm: 'Kotagiri Farm 04',
    zone: 'Kotagiri',
    crop: 'Carrot',
    variety: 'Nantes',
    farmZone: 'plot 2',
    plot: 'Kotagiri, plot 2',
    cropStage: 'Seedling',
    pest: 'Cutworm',
    scientificName: 'Agrotis ipsilon',
    severity: 'Low',
    status: 'Resolved',
    detectedDate: '25 Aug 2026',
    reportedDate: '25 Aug 2026',
    resolvedDate: '30 Aug 2026',
    farmerNotes: 'Seedling cutting prevented.',
    photos: 'none uploaded',
    photosCount: '0 photos',
    treatmentName: 'Neem cake application',
    treatmentDate: '26 Aug 2026',
    treatmentStatus: 'Completed',
    treatmentNotes: 'Soil treated.',
    layoutType: 'top-id',
    actions: ['View Incident', 'History'],
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerPestIncidentsScreenProps {
  onBack: () => void;
  onSelectIncident: (incident: IncidentItem) => void;
  initialShowFilters?: boolean;
}

export function FarmerPestIncidentsScreen({
  onBack,
  onSelectIncident,
  initialShowFilters = false,
}: FarmerPestIncidentsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(initialShowFilters);

  useEffect(() => {
    setShowFilters(initialShowFilters);
  }, [initialShowFilters]);

  // Filter States
  const [selectedCrop, setSelectedCrop] = useState<'All' | 'Carrot' | 'Cabbage'>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Resolved' | 'Ongoing'>('All');

  // Filtered List
  const filteredIncidents = SAMPLE_INCIDENTS.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.id.toLowerCase().includes(q) ||
      item.farmer.toLowerCase().includes(q) ||
      item.farmerId.toLowerCase().includes(q) ||
      item.crop.toLowerCase().includes(q) ||
      item.pest.toLowerCase().includes(q);

    const matchesCrop = selectedCrop === 'All' || item.crop === selectedCrop;
    const matchesSeverity = selectedSeverity === 'All' || item.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;

    return matchesSearch && matchesCrop && matchesSeverity && matchesStatus;
  });

  const handleClearFilters = () => {
    setSelectedCrop('All');
    setSelectedSeverity('All');
    setSelectedStatus('All');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
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

          <Text style={styles.headerTitle}>Pest Incidents & Treatment</Text>
        </View>

        <Text style={styles.headerSubtitle}>
          14 incidents · 4 ongoing
        </Text>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Filter Section ─── */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeaderRow}>
              <FilterSlidersIcon size={18} color={adminColors.brandDeep} />
              <Text style={styles.filtersHeaderTitle}>{t('farmerPestIncidents.filters.title')}</Text>
            </View>

            {/* 1. Crop */}
            <Text style={styles.filterGroupLabel}>{t('farmerPestIncidents.filter.crop')}</Text>
            <View style={styles.chipRow}>
              {(['All', 'Carrot', 'Cabbage'] as const).map((crop) => {
                const isActive = selectedCrop === crop;
                return (
                  <TouchableOpacity
                    key={crop}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedCrop(crop)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {crop === 'All' ? t('farmerPestIncidents.filter.all') : crop}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Severity */}
            <Text style={styles.filterGroupLabel}>{t('farmerPestIncidents.filter.severity')}</Text>
            <View style={styles.chipRow}>
              {(['All', 'Low', 'Medium', 'High'] as const).map((sev) => {
                const isActive = selectedSeverity === sev;
                return (
                  <TouchableOpacity
                    key={sev}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedSeverity(sev)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {sev === 'All'
                        ? t('farmerPestIncidents.filter.all')
                        : sev === 'Low'
                        ? t('farmerPestIncidents.filter.low')
                        : sev === 'Medium'
                        ? t('farmerPestIncidents.filter.medium')
                        : t('farmerPestIncidents.filter.high')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Resolution Status */}
            <Text style={styles.filterGroupLabel}>{t('farmerPestIncidents.filter.status')}</Text>
            <View style={styles.chipRow}>
              {(['All', 'Resolved', 'Ongoing'] as const).map((status) => {
                const isActive = selectedStatus === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedStatus(status)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {status === 'All'
                        ? t('farmerPestIncidents.filter.all')
                        : status === 'Ongoing'
                        ? t('farmerPestIncidents.filter.ongoing')
                        : t('farmerPestIncidents.filter.resolved')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Buttons: Apply & Clear */}
            <View style={styles.filterActionRow}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilters(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>{t('farmerPestIncidents.filter.apply')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.clearBtnText}>{t('farmerPestIncidents.filter.clear')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Search Bar ─── */}
        {!showFilters && (
          <View style={styles.searchBar}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search common or scientific name"
              placeholderTextColor={adminColors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FilterSlidersIcon size={20} color={adminColors.brand} />
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Records Count ─── */}
        {!showFilters && (
          <Text style={styles.recordsCountText}>
            {filteredIncidents.length} records
          </Text>
        )}

        {/* ─── Incident Cards List ─── */}
        {!showFilters && (
          <View style={styles.listContainer}>
            {filteredIncidents.map((incident) => {
              const isOngoing = incident.status === 'Ongoing';

              return (
                <TouchableOpacity
                  key={incident.id}
                  style={styles.incidentCard}
                  onPress={() => onSelectIncident(incident)}
                  activeOpacity={0.85}
                >
                  {incident.layoutType === 'top-details' ? (
                    <>
                      <Text style={styles.cardMutedMeta}>
                        {incident.crop} · {incident.plot ?? 'Coonoor, plot 1'} · {incident.pest} · Severity: {incident.severity} · {incident.photosCount ?? '2 photos'}
                      </Text>
                      <Text style={[styles.cardMutedMeta, { marginTop: 2, marginBottom: 8 }]}>
                        Reported {incident.reportedDate ?? incident.detectedDate}
                      </Text>
                      <View style={styles.cardIdRow}>
                        <Text style={styles.cardIdTitle}>
                          {incident.id} · {incident.farmer}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            isOngoing ? styles.badgeOngoing : styles.badgeResolved,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              isOngoing ? styles.badgeTextOngoing : styles.badgeTextResolved,
                            ]}
                          >
                            {incident.status}
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.cardIdRow}>
                        <Text style={styles.cardIdTitle}>
                          {incident.id} · {incident.farmer}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            isOngoing ? styles.badgeOngoing : styles.badgeResolved,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              isOngoing ? styles.badgeTextOngoing : styles.badgeTextResolved,
                            ]}
                          >
                            {incident.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.cardMutedMeta, { marginTop: 4 }]}>
                        {incident.crop} · {incident.plot ?? 'Coonoor, plot 2'} · {incident.pest} · Severity: {incident.severity} · {incident.photosCount ?? '1 photo'}
                      </Text>
                      <Text style={[styles.cardMutedMeta, { marginTop: 2, marginBottom: 8 }]}>
                        Reported {incident.reportedDate ?? incident.detectedDate}
                        {incident.resolvedDate ? ` · Resolved ${incident.resolvedDate}` : ''}
                      </Text>
                    </>
                  )}

                  {/* Bottom Action Links */}
                  <View style={styles.cardActionsRow}>
                    {(incident.actions ?? ['View Incident']).map((actionText, aIdx) => (
                      <TouchableOpacity
                        key={aIdx}
                        onPress={() => onSelectIncident(incident)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cardActionLinkText}>{actionText}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  backBtn: {
    paddingRight: 6,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
    marginLeft: 6,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.brandTint,
    marginTop: adminSpacing.xs,
    fontWeight: '500',
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
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },

  recordsCountText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },

  // Incident Cards List
  listContainer: {
    gap: adminSpacing.md,
  },
  incidentCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  cardMutedMeta: {
    ...adminType.caption,
    fontSize: 12.5,
    color: adminColors.muted,
    lineHeight: 18,
  },
  cardIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 6,
  },
  cardIdTitle: {
    ...adminType.rowTitle,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 6,
  },
  cardActionLinkText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brand,
  },
  incidentIdText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  incidentSubline: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  severityBadge: {
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
  },
  statusBadge: {
    borderRadius: adminRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeMedium: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeTextMedium: {
    color: adminColors.warning.text,
  },
  badgeHigh: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeTextHigh: {
    color: adminColors.danger.text,
  },
  badgeLow: {
    backgroundColor: adminColors.success.bg,
  },
  badgeTextLow: {
    color: adminColors.success.text,
  },
  badgeOngoing: {
    backgroundColor: '#FEF3E2',
  },
  badgeTextOngoing: {
    color: '#B25E00',
  },
  badgeResolved: {
    backgroundColor: '#EAF5EE',
  },
  badgeTextResolved: {
    color: '#1E7F43',
  },
  detectedDateText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '500',
  },

  // Filters Section
  filtersContainer: {
    paddingTop: adminSpacing.xs,
    marginBottom: adminSpacing.xl,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  filtersHeaderTitle: {
    ...adminType.title,
    color: adminColors.brandDeep,
  },
  filterGroupLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  filterChip: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  filterActionRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.lg,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brand,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
