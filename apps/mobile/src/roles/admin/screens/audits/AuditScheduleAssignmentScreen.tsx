import React, { useState, useMemo } from 'react';
import {
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
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export interface AuditScheduleItem {
  id: string;
  code: string;
  farmerName: string;
  farmLocation: string;
  zone: 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D';
  type: 'Internal' | 'External' | 'Field Visit';
  dateStr: string;
  auditor: string;
  updatedStr?: string;
  status: 'Scheduled' | 'Completed' | 'In Progress' | 'Past scheduled date';
  viewOnlyNote?: string;
}

const INITIAL_SCHEDULES: AuditScheduleItem[] = [
  {
    id: '1',
    code: 'AUD-2026-0053',
    farmerName: 'Selvi village farm',
    farmLocation: 'Coonoor',
    zone: 'Zone A',
    type: 'Internal',
    dateStr: '15 Oct 2026',
    auditor: 'Auditor S. Mohan',
    updatedStr: 'Updated 2 Oct 2026',
    status: 'Scheduled',
  },
  {
    id: '2',
    code: 'AUD-2026-0049',
    farmerName: 'Meena',
    farmLocation: 'Coonoor',
    zone: 'Zone A',
    type: 'Internal',
    dateStr: '24 Sep 2026',
    auditor: 'Auditor S. Mohan',
    status: 'Completed',
    viewOnlyNote: 'View only · completed audits are never rescheduled or overwritten',
  },
  {
    id: '3',
    code: 'AUD-2026-0052',
    farmerName: 'Vijay Anand',
    farmLocation: 'Kotagiri farm',
    zone: 'Zone C',
    type: 'External',
    dateStr: '8 Oct 2026, 09:30',
    auditor: 'Auditor: External agency',
    status: 'Past scheduled date',
  },
  {
    id: '4',
    code: 'AUD-2026-0050',
    farmerName: 'Arumugam C.',
    farmLocation: 'Gudalur valley farm',
    zone: 'Zone D',
    type: 'External',
    dateStr: '12 Oct 2026, 11:00',
    auditor: 'Auditor: AgriCert Co.',
    status: 'In Progress',
  },
  {
    id: '5',
    code: 'AUD-2026-0051',
    farmerName: 'Ramesh Kumar',
    farmLocation: 'Ooty highlands',
    zone: 'Zone B',
    type: 'Internal',
    dateStr: '18 Oct 2026, 14:00',
    auditor: 'Auditor Ravi K.',
    updatedStr: 'Updated 5 Oct 2026',
    status: 'Scheduled',
  },
  {
    id: '6',
    code: 'AUD-2026-0048',
    farmerName: 'Lakshmi Devi',
    farmLocation: 'Kotagiri',
    zone: 'Zone C',
    type: 'Field Visit',
    dateStr: '18 Sep 2026',
    auditor: 'Auditor Meena P.',
    status: 'Completed',
    viewOnlyNote: 'View only · completed audits are never rescheduled or overwritten',
  },
  {
    id: '7',
    code: 'AUD-2026-0047',
    farmerName: 'Palanisamy K.',
    farmLocation: 'Coonoor south',
    zone: 'Zone A',
    type: 'Internal',
    dateStr: '22 Oct 2026, 10:30',
    auditor: 'Auditor S. Mohan',
    status: 'Scheduled',
  },
];

// ─── Header & Utility Icons ───────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top slider bar with vertical pip */}
      <Line x1="3.5" y1="8" x2="20.5" y2="8" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="16" y1="4.5" x2="16" y2="11.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* Bottom slider bar with vertical pip */}
      <Line x1="3.5" y1="16" x2="20.5" y2="16" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="8" y1="12.5" x2="8" y2="19.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface AuditScheduleAssignmentScreenProps {
  onBack: () => void;
  onViewSchedule?: (schedule: AuditScheduleItem) => void;
  onEditSchedule?: (schedule: AuditScheduleItem) => void;
  onReschedule?: (schedule: AuditScheduleItem) => void;
  onCancelSchedule?: (schedule: AuditScheduleItem) => void;
}

export function AuditScheduleAssignmentScreen({
  onBack,
  onViewSchedule,
  onEditSchedule,
  onReschedule,
  onCancelSchedule,
}: AuditScheduleAssignmentScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Filter States
  const [statusFilter, setStatusFilter] = useState<'All' | 'Scheduled' | 'Completed' | 'In Progress' | 'Past scheduled date'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Internal' | 'External' | 'Field Visit'>('All');
  const [zoneFilter, setZoneFilter] = useState<'All' | 'Zone A' | 'Zone B' | 'Zone C' | 'Zone D'>('All');

  // Temporary staging filter states inside modal
  const [tempStatus, setTempStatus] = useState(statusFilter);
  const [tempType, setTempType] = useState(typeFilter);
  const [tempZone, setTempZone] = useState(zoneFilter);

  const openFilterModal = () => {
    setTempStatus(statusFilter);
    setTempType(typeFilter);
    setTempZone(zoneFilter);
    setIsFilterModalVisible(true);
  };

  const applyFilters = () => {
    setStatusFilter(tempStatus);
    setTypeFilter(tempType);
    setZoneFilter(tempZone);
    setIsFilterModalVisible(false);
  };

  const resetFilters = () => {
    setTempStatus('All');
    setTempType('All');
    setTempZone('All');
  };

  // Filtered schedule list
  const filteredSchedules = useMemo(() => {
    return INITIAL_SCHEDULES.filter((item) => {
      // Search query filter (matches code, farmer name, farm location, auditor)
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          item.code.toLowerCase().includes(q) ||
          item.farmerName.toLowerCase().includes(q) ||
          item.farmLocation.toLowerCase().includes(q) ||
          item.auditor.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Status filter
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'All' && item.type !== typeFilter) {
        return false;
      }

      // Zone filter
      if (zoneFilter !== 'All' && item.zone !== zoneFilter) {
        return false;
      }

      return true;
    });
  }, [searchQuery, statusFilter, typeFilter, zoneFilter]);

  const isAnyFilterActive = statusFilter !== 'All' || typeFilter !== 'All' || zoneFilter !== 'All';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header Matching Reference Image 3 ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.7} accessibilityRole="button">
          <BackArrowIcon />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Audit Schedule & Assignment
        </Text>

        <TouchableOpacity
          style={[styles.headerFilterBtn, isAnyFilterActive && styles.headerFilterBtnActive]}
          onPress={openFilterModal}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <FilterSlidersIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search Input Box Matching Image 3 ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search audit or farmer"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* ── Active Schedules Count ── */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {filteredSchedules.length} active schedule{filteredSchedules.length === 1 ? '' : 's'}
          </Text>
          {isAnyFilterActive ? (
            <TouchableOpacity
              onPress={() => {
                setStatusFilter('All');
                setTypeFilter('All');
                setZoneFilter('All');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.clearFilterText}>Reset filter</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Schedules List ── */}
        <View style={styles.listContainer}>
          {filteredSchedules.map((schedule) => {
            const isCompleted = schedule.status === 'Completed';
            const isPastDue = schedule.status === 'Past scheduled date';
            const isScheduled = schedule.status === 'Scheduled';

            const badgeBg = isCompleted
              ? adminColors.success.bg
              : isPastDue
              ? adminColors.danger.bg
              : isScheduled
              ? adminColors.info.bg
              : adminColors.warning.bg;

            const badgeText = isCompleted
              ? adminColors.success.text
              : isPastDue
              ? adminColors.danger.text
              : isScheduled
              ? adminColors.info.text
              : adminColors.warning.text;

            return (
              <View key={schedule.id} style={styles.scheduleCard}>
                {/* Header Row: Title & Badge */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {schedule.code} · {schedule.farmerName}
                  </Text>
                  <View style={[styles.badgeContainer, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.badgeText, { color: badgeText }]}>{schedule.status}</Text>
                  </View>
                </View>

                {/* Subtitle / Details Line */}
                <Text style={styles.cardDetails}>
                  {schedule.farmLocation}, {schedule.zone} · {schedule.type} · {schedule.dateStr} · {schedule.auditor}
                  {schedule.updatedStr ? ` · ${schedule.updatedStr}` : ''}
                </Text>

                {/* Bottom Row: View only note OR Action Buttons (View, Edit, Reschedule, Cancel) */}
                {schedule.viewOnlyNote ? (
                  <Text style={styles.viewOnlyNote}>{schedule.viewOnlyNote}</Text>
                ) : (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => onViewSchedule?.(schedule)}
                      activeOpacity={0.7}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionLink}>View</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onEditSchedule?.(schedule)}
                      activeOpacity={0.7}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionLink}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onReschedule?.(schedule)}
                      activeOpacity={0.7}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionLink}>Reschedule</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onCancelSchedule?.(schedule)}
                      activeOpacity={0.7}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.cancelLink}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Filter Popup Modal (Matching requirements) ── */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsFilterModalVisible(false)}
          />

          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Audit Schedules</Text>
              <TouchableOpacity
                onPress={() => setIsFilterModalVisible(false)}
                activeOpacity={0.7}
                style={styles.closeBtn}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Category 1: Status */}
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.chipRow}>
                {(['All', 'Scheduled', 'Completed', 'In Progress', 'Past scheduled date'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.filterChip, tempStatus === st && styles.filterChipActive]}
                    onPress={() => setTempStatus(st)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, tempStatus === st && styles.filterChipTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category 2: Audit Type */}
              <Text style={styles.filterSectionTitle}>Audit Type</Text>
              <View style={styles.chipRow}>
                {(['All', 'Internal', 'External', 'Field Visit'] as const).map((tp) => (
                  <TouchableOpacity
                    key={tp}
                    style={[styles.filterChip, tempType === tp && styles.filterChipActive]}
                    onPress={() => setTempType(tp)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, tempType === tp && styles.filterChipTextActive]}>
                      {tp}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category 3: Zone */}
              <Text style={styles.filterSectionTitle}>Zone / Location</Text>
              <View style={styles.chipRow}>
                {(['All', 'Zone A', 'Zone B', 'Zone C', 'Zone D'] as const).map((zn) => (
                  <TouchableOpacity
                    key={zn}
                    style={[styles.filterChip, tempZone === zn && styles.filterChipActive]}
                    onPress={() => setTempZone(zn)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, tempZone === zn && styles.filterChipTextActive]}>
                      {zn === 'Zone A' ? 'Zone A (Coonoor)' : zn === 'Zone B' ? 'Zone B (Ooty)' : zn === 'Zone C' ? 'Zone C (Kotagiri)' : zn === 'Zone D' ? 'Zone D (Gudalur)' : 'All Zones'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Modal Bottom Buttons */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={resetFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.modalResetBtnText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={applyFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: adminColors.onBrand,
    flex: 1,
    marginLeft: 6,
  },
  headerFilterBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerFilterBtnActive: {
    borderWidth: 1.5,
    borderColor: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 46,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: adminSpacing.sm,
    fontSize: 13.5,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  countText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },
  clearFilterText: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  listContainer: {
    rowGap: adminSpacing.md,
  },
  scheduleCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  badgeContainer: {
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    ...adminType.caption,
    fontSize: 10.5,
    fontWeight: '700',
  },
  cardDetails: {
    ...adminType.rowMeta,
    fontSize: 11,
    lineHeight: 15,
    color: adminColors.muted,
    marginBottom: 10,
  },
  viewOnlyNote: {
    ...adminType.rowMeta,
    fontSize: 11,
    lineHeight: 15,
    color: adminColors.muted,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: adminSpacing.md,
  },
  actionBtn: {
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  actionLink: {
    ...adminType.caption,
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  cancelLink: {
    ...adminType.caption,
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.danger.text,
  },

  // Modal Sheet Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: adminOverlay.scrim,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  modalTitle: {
    ...adminType.sectionHead,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    marginBottom: adminSpacing.md,
  },
  filterSectionTitle: {
    ...adminType.caption,
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  filterChipActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  filterChipText: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
  modalButtonRow: {
    flexDirection: 'row',
    columnGap: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  modalResetBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  modalResetBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.muted,
  },
  modalApplyBtn: {
    flex: 2,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
});
