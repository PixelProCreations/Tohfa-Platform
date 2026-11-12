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
import { AdminCalendarPickerModal } from '../../components/AdminCalendarPickerModal';

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
    id: '0',
    code: 'AUD-2026-0042',
    farmerName: 'Ramesh Kumar',
    farmLocation: 'Ooty Farm 01',
    zone: 'Zone B',
    type: 'Internal',
    dateStr: '15 Oct 2026',
    auditor: 'Assigned Auditor',
    status: 'In Progress',
  },
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

function CalendarIcon({ size = 17, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.9" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.9" />
    </Svg>
  );
}

function ChevronIcon({ isOpen, size = 16, color = adminColors.muted }: { isOpen?: boolean; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {isOpen ? (
        <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </Svg>
  );
}

const FARMER_OPTIONS = [
  'All',
  'FMR-00124 · Ramesh Kumar',
  'FMR-00131 · Selvi',
  'FMR-00177 · Meena',
  'FMR-00203 · Lakshmi',
  'FMR-00098 · Kumar',
  'FMR-00215 · Arun',
  'FMR-00152 · Vijay',
  'FMR-00221 · Priya',
  'FMR-00104 · Ganesan',
  'FMR-00118 · Kavitha',
  'FMR-00127 · Senthil',
  'FMR-00146 · Sundar',
];

const ZONE_OPTIONS = [
  'All',
  'Zone A',
  'Zone B',
  'Zone C',
  'Zone D',
];

const AUDIT_TYPE_OPTIONS = [
  'All',
  'Internal',
  'External',
  'Field Visit',
];

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

  // Filter States (M5-S05a)
  const [selectedFarmer, setSelectedFarmer] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedAuditType, setSelectedAuditType] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');

  // Temporary staging filter states inside modal
  const [tempFarmer, setTempFarmer] = useState(selectedFarmer);
  const [tempZone, setTempZone] = useState(selectedZone);
  const [tempType, setTempType] = useState(selectedAuditType);
  const [tempDateFrom, setTempDateFrom] = useState(dateFrom);
  const [tempDateTo, setTempDateTo] = useState(dateTo);
  const [tempMinScore, setTempMinScore] = useState(minScore);
  const [tempMaxScore, setTempMaxScore] = useState(maxScore);
  const [openDropdown, setOpenDropdown] = useState<'farmer' | 'zone' | 'auditType' | null>(null);
  const [calendarTarget, setCalendarTarget] = useState<'from' | 'to' | null>(null);

  const openFilterModal = () => {
    setTempFarmer(selectedFarmer);
    setTempZone(selectedZone);
    setTempType(selectedAuditType);
    setTempDateFrom(dateFrom);
    setTempDateTo(dateTo);
    setTempMinScore(minScore);
    setTempMaxScore(maxScore);
    setOpenDropdown(null);
    setIsFilterModalVisible(true);
  };

  const applyFilters = () => {
    setSelectedFarmer(tempFarmer);
    setSelectedZone(tempZone);
    setSelectedAuditType(tempType);
    setDateFrom(tempDateFrom);
    setDateTo(tempDateTo);
    setMinScore(tempMinScore);
    setMaxScore(tempMaxScore);
    setIsFilterModalVisible(false);
  };

  const resetFilters = () => {
    setTempFarmer('All');
    setTempZone('All');
    setTempType('All');
    setTempDateFrom('');
    setTempDateTo('');
    setTempMinScore('');
    setTempMaxScore('');
    setOpenDropdown(null);
  };

  const clearAppliedFilters = () => {
    setSelectedFarmer('All');
    setSelectedZone('All');
    setSelectedAuditType('All');
    setDateFrom('');
    setDateTo('');
    setMinScore('');
    setMaxScore('');
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

      // Farmer filter
      if (selectedFarmer !== 'All') {
        const fName = selectedFarmer.includes('·') ? selectedFarmer.split('·')[1].trim().toLowerCase() : selectedFarmer.toLowerCase();
        if (!item.farmerName.toLowerCase().includes(fName)) return false;
      }

      // Zone filter
      if (selectedZone !== 'All' && item.zone !== selectedZone) {
        return false;
      }

      // Type filter
      if (selectedAuditType !== 'All' && item.type !== selectedAuditType) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedFarmer, selectedZone, selectedAuditType]);

  const isAnyFilterActive =
    selectedFarmer !== 'All' ||
    selectedZone !== 'All' ||
    selectedAuditType !== 'All' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    minScore !== '' ||
    maxScore !== '';

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
              onPress={clearAppliedFilters}
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
              <TouchableOpacity key={schedule.id} style={styles.scheduleCard} activeOpacity={0.85} onPress={() => onViewSchedule?.(schedule)}>
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
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ── M5-S05a: Filters Popup Modal ── */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="slide"
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
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                onPress={() => setIsFilterModalVisible(false)}
                activeOpacity={0.7}
                style={styles.closeBtn}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {/* Field 1: Farmer */}
              <Text style={styles.fieldLabel}>Farmer</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setOpenDropdown(openDropdown === 'farmer' ? null : 'farmer')}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{tempFarmer}</Text>
                <ChevronIcon isOpen={openDropdown === 'farmer'} />
              </TouchableOpacity>
              {openDropdown === 'farmer' && (
                <View style={styles.dropdownMenu}>
                  <ScrollView
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={true}
                  >
                    {FARMER_OPTIONS.map((opt, idx) => {
                      const isSelected = tempFarmer === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemActive,
                            idx === FARMER_OPTIONS.length - 1 && styles.dropdownItemLast,
                          ]}
                          onPress={() => {
                            setTempFarmer(opt);
                            setOpenDropdown(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Field 2: Zone */}
              <Text style={styles.fieldLabel}>Zone</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setOpenDropdown(openDropdown === 'zone' ? null : 'zone')}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{tempZone}</Text>
                <ChevronIcon isOpen={openDropdown === 'zone'} />
              </TouchableOpacity>
              {openDropdown === 'zone' && (
                <View style={styles.dropdownMenu}>
                  <ScrollView
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={true}
                  >
                    {ZONE_OPTIONS.map((opt, idx) => {
                      const isSelected = tempZone === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemActive,
                            idx === ZONE_OPTIONS.length - 1 && styles.dropdownItemLast,
                          ]}
                          onPress={() => {
                            setTempZone(opt);
                            setOpenDropdown(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Field 3: Audit type */}
              <Text style={styles.fieldLabel}>Audit type</Text>
              <TouchableOpacity
                style={styles.dropdownField}
                onPress={() => setOpenDropdown(openDropdown === 'auditType' ? null : 'auditType')}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownValue}>{tempType}</Text>
                <ChevronIcon isOpen={openDropdown === 'auditType'} />
              </TouchableOpacity>
              {openDropdown === 'auditType' && (
                <View style={styles.dropdownMenu}>
                  <ScrollView
                    style={styles.dropdownScrollView}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={true}
                  >
                    {AUDIT_TYPE_OPTIONS.map((opt, idx) => {
                      const isSelected = tempType === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemActive,
                            idx === AUDIT_TYPE_OPTIONS.length - 1 && styles.dropdownItemLast,
                          ]}
                          onPress={() => {
                            setTempType(opt);
                            setOpenDropdown(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Field 4: Audit date from */}
              <Text style={styles.fieldLabel}>Audit date from</Text>
              <View style={styles.dateInputField}>
                <TextInput
                  style={styles.dateInputText}
                  placeholder="dd-mm-yyyy"
                  placeholderTextColor={adminColors.placeholder}
                  value={tempDateFrom}
                  onChangeText={setTempDateFrom}
                />
                <TouchableOpacity
                  onPress={() => setCalendarTarget('from')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Pick start date"
                >
                  <CalendarIcon />
                </TouchableOpacity>
              </View>

              {/* Field 5: Audit date to */}
              <Text style={styles.fieldLabel}>Audit date to</Text>
              <View style={styles.dateInputField}>
                <TextInput
                  style={styles.dateInputText}
                  placeholder="dd-mm-yyyy"
                  placeholderTextColor={adminColors.placeholder}
                  value={tempDateTo}
                  onChangeText={setTempDateTo}
                />
                <TouchableOpacity
                  onPress={() => setCalendarTarget('to')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Pick end date"
                >
                  <CalendarIcon />
                </TouchableOpacity>
              </View>

              {/* Field 6: Minimum score */}
              <Text style={styles.fieldLabel}>Minimum score</Text>
              <TextInput
                style={styles.numericInput}
                keyboardType="numeric"
                value={tempMinScore}
                onChangeText={setTempMinScore}
              />

              {/* Field 7: Maximum score */}
              <Text style={styles.fieldLabel}>Maximum score</Text>
              <TextInput
                style={styles.numericInput}
                keyboardType="numeric"
                value={tempMaxScore}
                onChangeText={setTempMaxScore}
              />
            </ScrollView>

            {/* Bottom Modal Actions */}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={applyFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={resetFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.modalResetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AdminCalendarPickerModal
        visible={calendarTarget !== null}
        value={calendarTarget === 'from' ? tempDateFrom : tempDateTo}
        onSelect={(d) => {
          if (calendarTarget === 'from') setTempDateFrom(d);
          else setTempDateTo(d);
        }}
        onClose={() => setCalendarTarget(null)}
      />
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
  fieldLabel: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
    marginTop: 8,
  },
  dropdownField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    marginBottom: adminSpacing.xs,
  },
  dropdownValue: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    marginTop: 2,
    marginBottom: adminSpacing.sm,
    maxHeight: 200,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: adminSpacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminColors.border,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemActive: {
    backgroundColor: adminColors.muted,
  },
  dropdownItemText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  dropdownItemTextActive: {
    color: adminColors.onBrand,
    fontWeight: '600',
  },
  dateInputField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    marginBottom: adminSpacing.xs,
  },
  dateInputText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    flex: 1,
  },
  numericInput: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    marginBottom: adminSpacing.xs,
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  modalButtonRow: {
    flexDirection: 'row',
    columnGap: 10,
    marginTop: 6,
  },
  modalApplyBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  modalResetBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
