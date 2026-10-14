import React, { useState } from 'react';
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

import { adminColors, adminRadius, adminSpacing } from '../../theme';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand,
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink,
  muted: adminColors.muted,

  // Status Badges
  mediumBadgeBg: '#FEF3C7',
  mediumBadgeText: '#B45309',
  highBadgeBg: '#FEE2E2',
  highBadgeText: '#DC2626',
  lowBadgeBg: '#DCFCE7',
  lowBadgeText: '#15803D',
  ongoingBadgeBg: '#E0F2FE',
  ongoingBadgeText: '#0284C7',
  resolvedBadgeBg: '#DCFCE7',
  resolvedBadgeText: '#15803D',

  // Accent & Action
  orangeBtn: adminColors.brand,
};

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

// Sliders / Tune Filter Icon (Exact Material Symbols tune)
function FilterSlidersIcon({ size = 20, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="12" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="18" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
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
  farmer: string;
  farmerId: string;
  farm: string;
  zone: string;
  crop: 'Carrot' | 'Cabbage' | 'Tomato';
  variety: string;
  farmZone: string;
  cropStage: string;
  pest: string;
  scientificName: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Ongoing' | 'Resolved';
  detectedDate: string;
  farmerNotes: string;
  photos: string;
  treatmentName: string;
  treatmentDate: string;
  treatmentStatus: string;
  treatmentNotes: string;
}

export const SAMPLE_INCIDENTS: IncidentItem[] = [
  {
    id: 'PEST-00421',
    farmer: 'Ramesh Kumar',
    farmerId: 'FR-00241',
    farm: 'Ooty Farm 01',
    zone: 'Ooty',
    crop: 'Carrot',
    variety: 'Nantes',
    farmZone: 'Plot 2',
    cropStage: 'Vegetative',
    pest: 'Aphid',
    scientificName: 'Aphidoidea',
    severity: 'Medium',
    status: 'Ongoing',
    detectedDate: '28 Sep 2026',
    farmerNotes: 'Noticed on underside of leaves, spreading slowly.',
    photos: '2 attached',
    treatmentName: 'Neem-oil foliar spray',
    treatmentDate: '29 Sep 2026',
    treatmentStatus: 'Applied',
    treatmentNotes: 'First application complete, monitoring for improvement.',
  },
  {
    id: 'PEST-00398',
    farmer: 'Selvi',
    farmerId: 'FR-00189',
    farm: 'Kotagiri Farm 03',
    zone: 'Kotagiri',
    crop: 'Cabbage',
    variety: 'Golden Acre',
    farmZone: 'Plot 1',
    cropStage: 'Head Formation',
    pest: 'Cabbage Worm',
    scientificName: 'Pieris rapae',
    severity: 'High',
    status: 'Resolved',
    detectedDate: '15 Sep 2026',
    farmerNotes: 'Holes in outer leaves detected during morning check.',
    photos: '1 attached',
    treatmentName: 'Bt biological spray',
    treatmentDate: '16 Sep 2026',
    treatmentStatus: 'Applied',
    treatmentNotes: 'Larval feeding stopped within 48 hours.',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerPestIncidentsScreenProps {
  onBack: () => void;
  onSelectIncident: (incident: IncidentItem) => void;
}

export function FarmerPestIncidentsScreen({
  onBack,
  onSelectIncident,
}: FarmerPestIncidentsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Matching Screenshot 2 & 3 ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Farmer Pest Incidents</Text>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.8}
            accessibilityLabel="Filter pest incidents"
          >
            <FilterSlidersIcon size={20} color={THEME.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          Monitor pest incidents reported by TOHFA farmers
        </Text>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Filter Section (Screenshot 3) ─── */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeaderRow}>
              <FilterSlidersIcon size={18} color={THEME.titleRustDark} />
              <Text style={styles.filtersHeaderTitle}>Filters</Text>
            </View>

            {/* 1. Crop */}
            <Text style={styles.filterGroupLabel}>Crop</Text>
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
                      {crop}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Severity */}
            <Text style={styles.filterGroupLabel}>Severity</Text>
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
                      {sev}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Resolution Status */}
            <Text style={styles.filterGroupLabel}>Resolution Status</Text>
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
                      {status}
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
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Search Bar (Screenshot 2) ─── */}
        {!showFilters && (
          <View style={styles.searchBar}>
            <SearchIcon size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Incident ID, Farmer, Farmer ID, Crop, Pest"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        {/* ─── Incident Cards List (Screenshot 2) ─── */}
        {!showFilters && (
          <View style={styles.listContainer}>
            {filteredIncidents.map((incident) => {
              const isMedium = incident.severity === 'Medium';
              const isHigh = incident.severity === 'High';
              const isOngoing = incident.status === 'Ongoing';

              return (
                <TouchableOpacity
                  key={incident.id}
                  style={styles.incidentCard}
                  onPress={() => onSelectIncident(incident)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.incidentIdText}>{incident.id}</Text>
                  <Text style={styles.incidentSubline}>
                    {incident.farmer} · {incident.crop} · {incident.pest}
                  </Text>

                  {/* Badges Row */}
                  <View style={styles.badgesRow}>
                    <View
                      style={[
                        styles.severityBadge,
                        isMedium && styles.badgeMedium,
                        isHigh && styles.badgeHigh,
                        !isMedium && !isHigh && styles.badgeLow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isMedium && styles.badgeTextMedium,
                          isHigh && styles.badgeTextHigh,
                          !isMedium && !isHigh && styles.badgeTextLow,
                        ]}
                      >
                        {incident.severity}
                      </Text>
                    </View>

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

                  {/* Detected Date */}
                  <Text style={styles.detectedDateText}>
                    Detected {incident.detectedDate}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  // Header
  header: {
    backgroundColor: THEME.headerBg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: {
    paddingRight: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
    marginLeft: 6,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
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
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md, // 12px
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: adminSpacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.ink,
    padding: 0,
  },

  // Incident Cards List
  listContainer: {
    gap: adminSpacing.md,
  },
  incidentCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl, // 16px
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  incidentIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.ink,
    marginBottom: 4,
  },
  incidentSubline: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  severityBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeMedium: {
    backgroundColor: THEME.mediumBadgeBg,
  },
  badgeTextMedium: {
    color: THEME.mediumBadgeText,
  },
  badgeHigh: {
    backgroundColor: THEME.highBadgeBg,
  },
  badgeTextHigh: {
    color: THEME.highBadgeText,
  },
  badgeLow: {
    backgroundColor: THEME.lowBadgeBg,
  },
  badgeTextLow: {
    color: THEME.lowBadgeText,
  },
  badgeOngoing: {
    backgroundColor: THEME.ongoingBadgeBg,
  },
  badgeTextOngoing: {
    color: THEME.ongoingBadgeText,
  },
  badgeResolved: {
    backgroundColor: THEME.resolvedBadgeBg,
  },
  badgeTextResolved: {
    color: THEME.resolvedBadgeText,
  },
  detectedDateText: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '500',
  },

  // Filters Section (Screenshot 3)
  filtersContainer: {
    paddingTop: 4,
    marginBottom: 20,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  filtersHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },
  filterGroupLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.ink,
    marginTop: 8,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: THEME.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: THEME.orangeBtn,
    borderColor: THEME.orangeBtn,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.ink,
  },
  filterChipTextActive: {
    color: THEME.white,
    fontWeight: '700',
  },
  filterActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.orangeBtn,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.ink,
  },
});
