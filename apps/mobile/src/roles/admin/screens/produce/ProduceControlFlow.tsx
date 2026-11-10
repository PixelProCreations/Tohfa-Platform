import React, { useState } from 'react';
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
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import type { Can } from '../../permissions/can';
import {
  BackArrowIcon,
  ChevronDownIcon,
  CloseIcon,
  DatabaseCylinderIcon,
  FilterSlidersIcon,
  HistoryClockIcon,
  LeafIcon,
  SearchIcon,
  TractorIcon,
  TrendChartIcon,
} from '../../components/AdminIcons';
import { AdminStatusBadge } from '../../components/AdminStatusBadge';
import { CropDataScreen, type CropTypeItem } from './CropDataScreen';
import { AddCropTypeScreen } from './AddCropTypeScreen';
import { AddActivityCategoryScreen } from './AddActivityCategoryScreen';
import { CreateEventScreen } from './CreateEventScreen';
import {
  CropHistoryRecordsScreen,
  CropRecordDetailScreen,
  ExportCropRecordsModal,
  HarvestForecastInsightsScreen,
  ZoneCropBreakdownScreen,
} from '../dashboard/TohfaAdminDashboardScreen';

export type ProduceControlSubScreen =
  | 'calendar'
  | 'cropData'
  | 'addCropType'
  | 'addActivity'
  | 'createEvent'
  | 'zoneBreakdown'
  | 'cropDetail'
  | 'harvestForecast'
  | 'cropHistory';

export interface ProduceControlFlowProps {
  can?: Can | undefined;
  role?: string | undefined;
  initialScreen?: ProduceControlSubScreen | undefined;
  onBack: () => void;
  onOpenFarmerProfile?: ((farmerId?: string) => void) | undefined;
}

/**
 * ProduceControlFlow
 *
 * Shared screen flow for Produce Calendar & Overview (M4-S01),
 * Filters Modal (M4-S01-1), Crop Data (M4-S28a,b,c),
 * Add Activity Category (M3-S28b), and Create Event.
 *
 * Gated cleanly via RBAC `can()`:
 * - `produce.calendar.view_consolidated`
 * - `admin.crop_taxonomy.manage`
 * - `admin.diary_taxonomy.manage`
 * - `platform.event.manage`
 */
export function ProduceControlFlow({
  can,
  role = 'SUPER_ADMIN',
  initialScreen = 'calendar',
  onBack,
  onOpenFarmerProfile,
}: ProduceControlFlowProps): React.JSX.Element {
  const [activeSubScreen, setActiveSubScreen] = useState<ProduceControlSubScreen>(initialScreen);
  const [selectedCropItem, setSelectedCropItem] = useState<CropTypeItem | undefined>(undefined);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [searchTxt, setSearchTxt] = useState('');

  // Filter values
  const [selectedFarmer, setSelectedFarmer] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedGrowthStage, setSelectedGrowthStage] = useState('All');

  // Month cells definition for October 2026 matching Image 1
  const calendarCells = [
    { day: null },
    { day: 1, border: adminColors.brand, dots: [adminColors.info.text, adminColors.brandDeep] },
    { day: 2 },
    { day: 3, dots: [adminColors.brandDeep] },
    { day: 4 },
    { day: 5 },
    { day: 6, dots: [adminColors.info.text, adminColors.brandDeep] },
    { day: 7, dots: [adminColors.brandDeep] },
    { day: 8 },
    { day: 9, dots: [adminColors.brandDeep] },
    { day: 10 },
    { day: 11 },
    { day: 12 },
    { day: 13 },
    { day: 14, border: adminColors.brandDeep, dots: [adminColors.brandDeep] },
    { day: 15 },
    { day: 16 },
    { day: 17 },
    { day: 18 },
    { day: 19 },
    { day: 20, ring: true },
    { day: 21, ring: true },
    { day: 22 },
    { day: 23 },
    { day: 24 },
    { day: 25 },
    { day: 26 },
    { day: 27 },
    { day: 28 },
    { day: 29 },
    { day: 30 },
    { day: 31, ring: true },
    { day: null },
    { day: null },
    { day: null },
  ];

  // Sub-screens dispatch
  if (activeSubScreen === 'cropData') {
    return (
      <CropDataScreen
        can={can}
        role={role}
        onBack={() => setActiveSubScreen('calendar')}
        onNavigateToAddCropType={(crop) => {
          setSelectedCropItem(crop);
          setActiveSubScreen('addCropType');
        }}
        onNavigateToAddActivity={() => setActiveSubScreen('addActivity')}
        onNavigateToCreateEvent={() => setActiveSubScreen('createEvent')}
      />
    );
  }

  if (activeSubScreen === 'addCropType') {
    return (
      <AddCropTypeScreen
        crop={selectedCropItem}
        onBack={() => {
          setSelectedCropItem(undefined);
          setActiveSubScreen('cropData');
        }}
        onSuccess={() => {
          setSelectedCropItem(undefined);
          setActiveSubScreen('cropData');
        }}
      />
    );
  }

  if (activeSubScreen === 'addActivity') {
    return (
      <AddActivityCategoryScreen
        onBack={() => setActiveSubScreen('cropData')}
        onSuccess={() => setActiveSubScreen('cropData')}
      />
    );
  }

  if (activeSubScreen === 'createEvent') {
    return (
      <CreateEventScreen
        onBack={() => setActiveSubScreen('cropData')}
        onSuccess={() => setActiveSubScreen('cropData')}
      />
    );
  }

  if (activeSubScreen === 'zoneBreakdown') {
    return (
      <ZoneCropBreakdownScreen
        onBack={() => setActiveSubScreen('calendar')}
        onOpenFilters={() => setShowFiltersModal(true)}
        onSelectCropRecord={() => setActiveSubScreen('cropDetail')}
      />
    );
  }

  if (activeSubScreen === 'cropDetail') {
    return (
      <CropRecordDetailScreen
        onBack={() => setActiveSubScreen('zoneBreakdown')}
        onOpenFarmerProfile={() => {
          if (onOpenFarmerProfile) onOpenFarmerProfile();
          else onBack();
        }}
      />
    );
  }

  if (activeSubScreen === 'harvestForecast') {
    return (
      <HarvestForecastInsightsScreen
        onBack={() => setActiveSubScreen('calendar')}
        onOpenExportModal={() => setShowExportModal(true)}
        onOpenFilters={() => setShowFiltersModal(true)}
      />
    );
  }

  if (activeSubScreen === 'cropHistory') {
    return (
      <CropHistoryRecordsScreen
        onBack={() => setActiveSubScreen('calendar')}
        onOpenCompareModal={() => { }}
        onSelectCropRecord={() => setActiveSubScreen('cropDetail')}
        onOpenFilters={() => setShowFiltersModal(true)}
        selectedCompareIds={[]}
        onToggleCompare={() => { }}
      />
    );
  }

  // ─── Main Produce Calendar & Overview (M4-S01 / Images 1 & 2) ───
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <TractorIcon size={24} color={adminColors.onBrand} />
          <Text style={styles.headerTitle}>Produce Calendar</Text>
        </View>
        <Text style={styles.headerSubtitle}>October 2026 · 43 crop records</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Overview</Text>

          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Crop records in view</Text>
            <Text style={styles.overviewValue}>43</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Expected harvests this month (forecast)</Text>
            <Text style={styles.overviewValue}>3</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Records missing a planting date</Text>
            <Text style={styles.overviewValue}>3</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Records needing an update</Text>
            <Text style={styles.overviewValue}>Rule not defined</Text>
          </View>
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNavRow}>
          <TouchableOpacity
            style={styles.monthNavBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Previous Month', 'Showing September 2026')}
          >
            <Text style={styles.monthNavArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthNavTitle}>October 2026</Text>
          <TouchableOpacity
            style={styles.monthNavBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Next Month', 'Showing November 2026')}
          >
            <Text style={styles.monthNavArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          <View style={styles.weekHeadersRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayChar, dIndex) => (
              <Text key={`head-${dIndex}`} style={styles.weekHeaderCell}>
                {dayChar}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarCells.map((cell, cIdx) => {
              if (cell.day === null) {
                return <View key={`empty-${cIdx}`} style={styles.calendarEmptyCell} />;
              }

              const isSelected = selectedDay === cell.day;
              return (
                <TouchableOpacity
                  key={`day-${cell.day}-${cIdx}`}
                  style={[
                    styles.calendarDayCell,
                    isSelected && styles.calendarDayCellSelected,
                    cell.border
                      ? { borderWidth: 1.5, borderColor: cell.border }
                      : undefined,
                  ]}
                  onPress={() => cell.day && setSelectedDay(cell.day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.calendarDayNumber,
                      isSelected && styles.calendarDayNumberSelected,
                    ]}
                  >
                    {cell.day}
                  </Text>
                  <View style={styles.dayDotsRow}>
                    {cell.dots &&
                      cell.dots.map((dColor, dIdx) => (
                        <View
                          key={`dot-${dIdx}`}
                          style={[styles.calendarDot, { backgroundColor: dColor }]}
                        />
                      ))}
                    {cell.ring && <View style={styles.calendarRing} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: adminColors.info.text }]} />
            <Text style={styles.legendText}>Planting</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: adminColors.brandDeep }]} />
            <Text style={styles.legendText}>Growth stage</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendRing} />
            <Text style={styles.legendText}>Expected harvest</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: adminColors.success.text }]} />
            <Text style={styles.legendText}>Past harvest</Text>
          </View>
        </View>

        {/* Search Bar + Filter Icon */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor={adminColors.placeholder}
            value={searchTxt}
            onChangeText={setSearchTxt}
          />
          <TouchableOpacity
            style={styles.filterTouchBtn}
            onPress={() => setShowFiltersModal(true)}
            activeOpacity={0.7}
            accessibilityLabel="Filters"
          >
            <FilterSlidersIcon size={20} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Date Section Header */}
        <Text style={styles.dateSectionHeader}>{selectedDay} Oct 2026</Text>

        {/* Card 1: Crop development */}
        <View style={styles.activityCard}>
          <View style={styles.activityTopRow}>
            <View style={styles.activityTitleWrap}>
              <View
                style={[styles.activityDot, { backgroundColor: adminColors.brandDeep }]}
              />
              <Text style={styles.activityTitle}>Crop development</Text>
            </View>
            <AdminStatusBadge status="ACTIVE" label="Recorded" tone="success" />
          </View>
          <Text style={styles.activityMeta}>Potato · Selvi · Coonoor · PLT-00131-1</Text>
          <Text style={styles.activityDate}>{selectedDay} Oct 2026</Text>
        </View>

        {/* Card 2: Planting */}
        <View style={styles.activityCard}>
          <View style={styles.activityTopRow}>
            <View style={styles.activityTitleWrap}>
              <View
                style={[styles.activityDot, { backgroundColor: adminColors.info.text }]}
              />
              <Text style={styles.activityTitle}>Planting</Text>
            </View>
            <AdminStatusBadge status="ACTIVE" label="Recorded" tone="success" />
          </View>
          <Text style={styles.activityMeta}>Cabbage · Arun · Ooty · PLT-00215-2</Text>
          <Text style={styles.activityDate}>{selectedDay} Oct 2026</Text>
        </View>

        {/* Explanatory Footnote */}
        <Text style={styles.explanatoryFootnote}>
          Planting and growth-stage dates are recorded. Expected harvest dates are forecasts and are never shown as a
          harvest. A forecast does not mean produce has been purchased or received.
        </Text>

        {/* ─── Quick actions 2x2 Grid matching Image 2 ─── */}
        <Text style={styles.quickActionsSectionHeader}>Quick actions</Text>
        <View style={styles.quickActionsGrid}>
          {/* Card 1: Zone & Crop Breakdown */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => setActiveSubScreen('zoneBreakdown')}
            activeOpacity={0.8}
          >
            <LeafIcon size={24} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>Zone & Crop Breakdown</Text>
          </TouchableOpacity>

          {/* Card 2: Harvest Forecast & Crop Insights */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => setActiveSubScreen('harvestForecast')}
            activeOpacity={0.8}
          >
            <TrendChartIcon size={24} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>Harvest Forecast & Crop Insights</Text>
          </TouchableOpacity>

          {/* Card 3: Crop History & Records */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => setActiveSubScreen('cropHistory')}
            activeOpacity={0.8}
          >
            <HistoryClockIcon size={24} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>Crop History & Records</Text>
          </TouchableOpacity>

          {/* Card 4: Crop Data (M4-S28) */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => setActiveSubScreen('cropData')}
            activeOpacity={0.8}
          >
            <DatabaseCylinderIcon size={24} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>Crop Data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ─── Filters Popup (M4-S01-1 / Image 3 left) ─── */}
      <Modal
        visible={showFiltersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterCard}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFiltersModal(false)} activeOpacity={0.7}>
                <CloseIcon size={20} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            {/* 1. Farmer / farm */}
            <Text style={styles.filterFieldLabel}>Farmer / farm</Text>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setSelectedFarmer(selectedFarmer === 'All' ? 'Arun' : 'All')}
              activeOpacity={0.7}
            >
              <Text style={styles.filterDropdownValue}>{selectedFarmer}</Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>

            {/* 2. Zone */}
            <Text style={styles.filterFieldLabel}>Zone</Text>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setSelectedZone(selectedZone === 'All' ? 'Coonoor' : 'All')}
              activeOpacity={0.7}
            >
              <Text style={styles.filterDropdownValue}>{selectedZone}</Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>

            {/* 3. Crop */}
            <Text style={styles.filterFieldLabel}>Crop</Text>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setSelectedCrop(selectedCrop === 'All' ? 'Tomato' : 'All')}
              activeOpacity={0.7}
            >
              <Text style={styles.filterDropdownValue}>{selectedCrop}</Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>

            {/* 4. Season */}
            <Text style={styles.filterFieldLabel}>Season</Text>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setSelectedSeason(selectedSeason === 'All' ? 'Kharif' : 'All')}
              activeOpacity={0.7}
            >
              <Text style={styles.filterDropdownValue}>{selectedSeason}</Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>

            {/* 5. Growth stage */}
            <Text style={styles.filterFieldLabel}>Growth stage</Text>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() =>
                setSelectedGrowthStage(selectedGrowthStage === 'All' ? 'Flowering' : 'All')
              }
              activeOpacity={0.7}
            >
              <Text style={styles.filterDropdownValue}>{selectedGrowthStage}</Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>

            {/* Bottom Buttons: [Apply] [Reset] */}
            <View style={styles.filterButtonsRow}>
              <TouchableOpacity
                style={styles.filterApplyBtn}
                onPress={() => setShowFiltersModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterApplyBtnText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterResetBtn}
                onPress={() => {
                  setSelectedFarmer('All');
                  setSelectedZone('All');
                  setSelectedCrop('All');
                  setSelectedSeason('All');
                  setSelectedGrowthStage('All');
                  setShowFiltersModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.filterResetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Export Crop Records Modal */}
      <ExportCropRecordsModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        onDownloadCSV={() => setShowExportModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '800',
    fontSize: 20,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 13,
    marginTop: 4,
    paddingLeft: 34,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  overviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  overviewTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: adminSpacing.sm,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  overviewLabel: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13,
  },
  overviewValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '700',
    fontSize: 13,
  },
  dottedDivider: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
    paddingHorizontal: adminSpacing.xs,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  monthNavTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontWeight: '800',
    fontSize: 16,
  },
  calendarContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
  },
  weekHeadersRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekHeaderCell: {
    flex: 1,
    textAlign: 'center',
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '800',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarEmptyCell: {
    width: '14.28%',
    height: 44,
  },
  calendarDayCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  calendarDayCellSelected: {
    backgroundColor: adminColors.brandTint,
  },
  calendarDayNumber: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
    fontSize: 12,
  },
  calendarDayNumberSelected: {
    color: adminColors.brand,
    fontWeight: '800',
  },
  dayDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
    minHeight: 6,
  },
  calendarDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  calendarRing: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: adminColors.success.text,
    backgroundColor: 'transparent',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: adminColors.success.text,
    backgroundColor: 'transparent',
  },
  legendText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 10.5,
    fontWeight: '500',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    height: 46,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
  },
  filterTouchBtn: {
    padding: adminSpacing.xs,
  },
  dateSectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontWeight: '800',
    fontSize: 15,
    marginBottom: adminSpacing.sm,
  },
  activityCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
  },
  activityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontWeight: '700',
    fontSize: 14,
  },
  activityMeta: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12,
    marginBottom: 2,
  },
  activityDate: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
  },
  explanatoryFootnote: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginVertical: adminSpacing.md,
  },
  quickActionsSectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontWeight: '800',
    fontSize: 15,
    marginBottom: adminSpacing.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  quickActionTile: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    minHeight: 100,
    ...adminShadow.sm,
  },
  quickActionLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 70,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  filterCard: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    maxHeight: '82%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  filterModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontWeight: '800',
    fontSize: 17,
  },
  filterFieldLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '700',
    marginTop: adminSpacing.sm,
    marginBottom: 4,
  },
  filterDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  filterDropdownValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
  },
  filterButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  filterApplyBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  filterResetBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
  },
});
