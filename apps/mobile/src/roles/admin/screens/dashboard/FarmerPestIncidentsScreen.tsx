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

          <Text style={styles.headerTitle}>{t('farmerPestIncidents.title')}</Text>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.8}
            accessibilityLabel="Filter pest incidents"
          >
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          {t('farmerPestIncidents.subtitle')}
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
              placeholder={t('farmerPestIncidents.search.placeholder')}
              placeholderTextColor={adminColors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        {/* ─── Incident Cards List ─── */}
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
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    ...adminType.caption,
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
    backgroundColor: adminColors.info.bg,
  },
  badgeTextOngoing: {
    color: adminColors.info.text,
  },
  badgeResolved: {
    backgroundColor: adminColors.success.bg,
  },
  badgeTextResolved: {
    color: adminColors.success.text,
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
