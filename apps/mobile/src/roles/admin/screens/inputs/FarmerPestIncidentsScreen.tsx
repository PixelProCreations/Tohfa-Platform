import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';

import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { AdminEmptyState } from '../warehouse/shared/AsyncStates';
import {
  BackArrowIcon,
  FilterSlidersIcon,
  SearchIcon,
} from './inputsIcons';

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

export type PestIncidentItem = IncidentItem;

/**
 * There is no admin pest-incident endpoint (pest detections exist only under
 * the farmer's own /farms/{farmId}/plots/{plotId}/pest-detections), so this
 * list shows the "not available" state, never sample incidents.
 */
export interface FarmerPestIncidentsScreenProps {
  onBack: () => void;
  onSelectIncident: (incident: IncidentItem) => void;
  initialShowFilters?: boolean;
}

export function FarmerPestIncidentsScreen({
  onBack,
  onSelectIncident,
  initialShowFilters = false,
}: FarmerPestIncidentsScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(initialShowFilters);

  useEffect(() => {
    setShowFilters(initialShowFilters);
  }, [initialShowFilters]);

  const [selectedCrop, setSelectedCrop] = useState<'All' | 'Carrot' | 'Cabbage'>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Resolved' | 'Ongoing'>('All');

  // No source yet (see above): the filters narrow nothing until one exists.
  const incidents: IncidentItem[] = [];
  const filteredIncidents = incidents.filter((item) => {
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
    <View style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
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
          {ADMIN_NO_VALUE}
        </Text>
      </View>

      {/* Scroll Container */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Section */}
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

        {/* Search Bar */}
        {!showFilters && (
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
              onPress={() => setShowFilters(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FilterSlidersIcon size={20} color={adminColors.brand} />
            </TouchableOpacity>
          </View>
        )}

        {/* Records Count */}
        {!showFilters && (
          <Text style={styles.recordsCountText}>{ADMIN_NO_VALUE}</Text>
        )}
        {!showFilters && (
          <AdminEmptyState
            title={t('wiringFarmers.incidents.unavailable')}
            subtitle={t('wiringFarmers.incidents.unavailableSub')}
          />
        )}

        {/* Incident Cards List */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
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
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
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
    ...adminType.rowMeta,
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
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 6,
  },
  cardActionLinkText: {
    ...adminType.rowTitle,
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
    backgroundColor: adminColors.warning.bg,
  },
  badgeTextOngoing: {
    color: adminColors.warning.text,
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
  },
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
    fontWeight: '700',
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
    ...adminType.rowTitle,
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
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
