import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from "../../theme";

function ProduceCalendarHeaderIcon({ size = 24, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2.2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="3" y1="9.5" x2="21" y2="9.5" stroke={color} strokeWidth="2" />
      <Circle cx="8" cy="13.5" r="1.2" fill={color} />
      <Circle cx="12" cy="13.5" r="1.2" fill={color} />
      <Circle cx="16" cy="13.5" r="1.2" fill={color} />
      <Circle cx="8" cy="17.5" r="1.2" fill={color} />
      <Circle cx="12" cy="17.5" r="1.2" fill={color} />
      <Circle cx="16" cy="17.5" r="1.2" fill={color} />
    </Svg>
  );
}

function ProduceBackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceNavChevronLeft({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceNavChevronRight({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceSearchIcon({ size = 18, color = '#8C7E74' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ProduceFilterSlidersIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6.5" x2="20" y2="6.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="17.5" x2="20" y2="17.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="6.5" r="2.5" fill={adminColors.card} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="17.5" r="2.5" fill={adminColors.card} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ProduceLeafIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="16" y1="8" x2="2" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ProduceTrendChartIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 17l6-6 4 4 8-8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="3" cy="17" r="2" fill={color} />
      <Circle cx="9" cy="11" r="2" fill={color} />
      <Circle cx="13" cy="15" r="2" fill={color} />
      <Circle cx="21" cy="7" r="2" fill={color} />
    </Svg>
  );
}

function ProduceHistoryIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ProduceGrid4Icon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ProduceChevronDown({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceCheckCircleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#2E7D32" strokeWidth="2" fill="#E8F5E9" />
      <Path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#2E7D32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceCurrentStageIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#E67E22" strokeWidth="2" fill="#FFF3E0" />
      <Circle cx="12" cy="12" r="4" fill="#E67E22" />
    </Svg>
  );
}

function ProduceDownloadIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 4v10M8 10l4 4 4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProduceMoneyNotAvailableIcon({ size = 32, color = '#5A6065' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M6 6v12M18 6v12" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
    </Svg>
  );
}

function ProduceCompareIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="7" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Rect x="14" y="4" width="7" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M10 8h4M10 12h4M10 16h4" stroke={color} strokeWidth="1.5" strokeDasharray="1 1" />
    </Svg>
  );
}

// ─── Screen 1 & 2: Produce Control (Calendar) ──────────────────────────────────

export interface ProduceControlCalendarScreenProps {
  onBack?: () => void;
  onOpenFilters: () => void;
  onNavigateToZoneBreakdown: () => void;
  onNavigateToHarvestForecast: () => void;
  onNavigateToCropHistory: () => void;
}

export function ProduceControlCalendarScreen({
  onBack,
  onOpenFilters,
  onNavigateToZoneBreakdown,
  onNavigateToHarvestForecast,
  onNavigateToCropHistory,
}: ProduceControlCalendarScreenProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [searchTxt, setSearchTxt] = useState('');

  // Month cells definition for October 2026 matching Image 5:
  // Week 1: [null, 1, 2, 3, 4, 5, 6]
  // Week 2: [7, 8, 9, 10, 11, 12, 13]
  // Week 3: [14, 15, 16, 17, 18, 19, 20]
  // Week 4: [21, 22, 23, 24, 25, 26, 27]
  // Week 5: [28, 29, 30, 31, null, null, null]
  const calendarCells = [
    { day: null },
    { day: 1, border: 'orange', dots: ['#1E56A0', '#E07A28'] },
    { day: 2 },
    { day: 3, dots: ['#E07A28'] },
    { day: 4 },
    { day: 5 },
    { day: 6, dots: ['#1E56A0', '#E07A28'] },
    { day: 7, dots: ['#E07A28'] },
    { day: 8 },
    { day: 9, dots: ['#E07A28'] },
    { day: 10 },
    { day: 11 },
    { day: 12 },
    { day: 13 },
    { day: 14, border: 'brown', dots: ['#E07A28'] },
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

  return (
    <View style={produceStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Orange Terracotta Header Banner ─── */}
      <View style={produceStyles.headerBanner}>
        <View style={produceStyles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={produceStyles.backBtnTouch}>
              <ProduceBackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
          )}
          <ProduceCalendarHeaderIcon size={26} color={adminColors.onBrand} />
          {/* Note: "Produce Control" as explicitly requested by user */}
          <Text style={produceStyles.headerTitle}>Produce Control</Text>
        </View>
        <Text style={produceStyles.headerSubtitle}>October 2026 · 43 crop records</Text>
      </View>

      {/* ─── Scrollable Body ─── */}
      <ScrollView
        style={produceStyles.scrollContainer}
        contentContainerStyle={produceStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Overview Card ─── */}
        <View style={produceStyles.overviewCard}>
          <Text style={produceStyles.overviewTitle}>Overview</Text>

          <View style={produceStyles.overviewRow}>
            <Text style={produceStyles.overviewLabel}>Crop records in view</Text>
            <Text style={produceStyles.overviewValue}>43</Text>
          </View>
          <View style={produceStyles.dottedDivider} />

          <View style={produceStyles.overviewRow}>
            <Text style={produceStyles.overviewLabel}>Expected harvests this month (forecast)</Text>
            <Text style={produceStyles.overviewValue}>3</Text>
          </View>
          <View style={produceStyles.dottedDivider} />

          <View style={produceStyles.overviewRow}>
            <Text style={produceStyles.overviewLabel}>Records missing a planting date</Text>
            <Text style={produceStyles.overviewValue}>3</Text>
          </View>
          <View style={produceStyles.dottedDivider} />

          <View style={produceStyles.overviewRow}>
            <Text style={produceStyles.overviewLabel}>Records needing an update</Text>
            <Text style={produceStyles.overviewValue}>Rule not defined</Text>
          </View>
        </View>

        {/* ─── Month Navigation ─── */}
        <View style={produceStyles.monthNavRow}>
          <TouchableOpacity style={produceStyles.monthNavBtn} activeOpacity={0.7}>
            <ProduceNavChevronLeft size={18} color={adminColors.brandDeep} />
          </TouchableOpacity>
          <Text style={produceStyles.monthNavTitle}>October 2026</Text>
          <TouchableOpacity style={produceStyles.monthNavBtn} activeOpacity={0.7}>
            <ProduceNavChevronRight size={18} color={adminColors.brandDeep} />
          </TouchableOpacity>
        </View>

        {/* ─── Calendar Grid ─── */}
        <View style={produceStyles.calendarContainer}>
          {/* Weekday Labels */}
          <View style={produceStyles.weekdaysRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayLetter, index) => (
              <View key={`wd-${index}`} style={produceStyles.weekdayCell}>
                <Text style={produceStyles.weekdayText}>{dayLetter}</Text>
              </View>
            ))}
          </View>

          {/* Day Cells Grid */}
          <View style={produceStyles.daysGrid}>
            {calendarCells.map((cell, idx) => {
              if (cell.day === null) {
                return <View key={`blank-${idx}`} style={produceStyles.dayCellEmpty} />;
              }

              const isSelected = selectedDay === cell.day;
              const hasOrangeBorder = cell.border === 'orange';
              const hasBrownBorder = cell.border === 'brown';

              return (
                <TouchableOpacity
                  key={`day-${cell.day}`}
                  style={[
                    produceStyles.dayCell,
                    hasOrangeBorder && produceStyles.dayCellOrangeBorder,
                    hasBrownBorder && produceStyles.dayCellBrownBorder,
                    isSelected && !hasOrangeBorder && !hasBrownBorder && produceStyles.dayCellSelected,
                  ]}
                  onPress={() => setSelectedDay(cell.day!)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      produceStyles.dayNumText,
                      (hasOrangeBorder || hasBrownBorder || isSelected) && produceStyles.dayNumTextBold,
                    ]}
                  >
                    {cell.day}
                  </Text>
                  {/* Indicators below date */}
                  <View style={produceStyles.dayDotsRow}>
                    {cell.dots &&
                      cell.dots.map((dColor, dIdx) => (
                        <View key={`dot-${dIdx}`} style={[produceStyles.calendarDot, { backgroundColor: dColor }]} />
                      ))}
                    {cell.ring && <View style={produceStyles.calendarRing} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Legend ─── */}
        <View style={produceStyles.legendRow}>
          <View style={produceStyles.legendItem}>
            <View style={[produceStyles.legendDot, { backgroundColor: '#1E56A0' }]} />
            <Text style={produceStyles.legendText}>Planting</Text>
          </View>
          <View style={produceStyles.legendItem}>
            <View style={[produceStyles.legendDot, { backgroundColor: '#E07A28' }]} />
            <Text style={produceStyles.legendText}>Growth stage</Text>
          </View>
          <View style={produceStyles.legendItem}>
            <View style={produceStyles.legendRing} />
            <Text style={produceStyles.legendText}>Expected harvest</Text>
          </View>
          <View style={produceStyles.legendItem}>
            <View style={[produceStyles.legendDot, { backgroundColor: '#1B5E20' }]} />
            <Text style={produceStyles.legendText}>Past harvest</Text>
          </View>
        </View>

        {/* ─── Search Bar with Filter Icon (Tap opens Screen 3) ─── */}
        <View style={produceStyles.searchBarContainer}>
          <ProduceSearchIcon size={18} color="#8C7E74" />
          <TextInput
            style={produceStyles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor="#8C7E74"
            value={searchTxt}
            onChangeText={setSearchTxt}
          />
          <TouchableOpacity
            style={produceStyles.filterTouchBtn}
            onPress={onOpenFilters}
            activeOpacity={0.7}
            accessibilityLabel="Filters"
          >
            <ProduceFilterSlidersIcon size={20} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ─── Date Section: 1 Oct 2026 (or selected date) ─── */}
        <Text style={produceStyles.dateSectionHeader}>{selectedDay} Oct 2026</Text>

        {/* Card 1: Crop development */}
        <View style={produceStyles.activityCard}>
          <View style={produceStyles.activityTopRow}>
            <View style={produceStyles.activityTitleWrap}>
              <View style={[produceStyles.activityDot, { backgroundColor: '#E07A28' }]} />
              <Text style={produceStyles.activityTitle}>Crop development</Text>
            </View>
            <View style={produceStyles.recordedBadge}>
              <Text style={produceStyles.recordedBadgeText}>Recorded</Text>
            </View>
          </View>
          <Text style={produceStyles.activityMeta}>Potato · Selvi · Coonoor · PLT-00131-1</Text>
          <Text style={produceStyles.activityDate}>{selectedDay} Oct 2026</Text>
        </View>

        {/* Card 2: Planting */}
        <View style={produceStyles.activityCard}>
          <View style={produceStyles.activityTopRow}>
            <View style={produceStyles.activityTitleWrap}>
              <View style={[produceStyles.activityDot, { backgroundColor: '#1E56A0' }]} />
              <Text style={produceStyles.activityTitle}>Planting</Text>
            </View>
            <View style={produceStyles.recordedBadge}>
              <Text style={produceStyles.recordedBadgeText}>Recorded</Text>
            </View>
          </View>
          <Text style={produceStyles.activityMeta}>Cabbage · Arun · Ooty · PLT-00215-2</Text>
          <Text style={produceStyles.activityDate}>{selectedDay} Oct 2026</Text>
        </View>

        {/* Explanatory Footnote */}
        <Text style={produceStyles.explanatoryFootnote}>
          Planting and growth-stage dates are recorded. Expected harvest dates are forecasts and are never shown as a
          harvest. A forecast does not mean produce has been purchased or received.
        </Text>

        {/* ─── Quick Actions Section ─── */}
        <Text style={produceStyles.quickActionsSectionHeader}>Quick actions</Text>

        <View style={produceStyles.quickActionsRow}>
          {/* Card 1: Zone & Crop Breakdown (Navigates to Screen 4) */}
          <TouchableOpacity
            style={produceStyles.quickActionCard}
            onPress={onNavigateToZoneBreakdown}
            activeOpacity={0.8}
          >
            <ProduceLeafIcon size={24} color={adminColors.brand} />
            <Text style={produceStyles.quickActionLabel}>Zone & Crop{'\n'}Breakdown</Text>
          </TouchableOpacity>

          {/* Card 2: Harvest Forecast & Crop Insights */}
          <TouchableOpacity
            style={produceStyles.quickActionCard}
            onPress={onNavigateToHarvestForecast}
            activeOpacity={0.8}
          >
            <ProduceTrendChartIcon size={24} color={adminColors.brand} />
            <Text style={produceStyles.quickActionLabel}>Harvest Forecast &{'\n'}Crop Insights</Text>
          </TouchableOpacity>

          {/* Card 3: Crop History & Records */}
          <TouchableOpacity
            style={produceStyles.quickActionCard}
            onPress={onNavigateToCropHistory}
            activeOpacity={0.8}
          >
            <ProduceHistoryIcon size={24} color={adminColors.brand} />
            <Text style={produceStyles.quickActionLabel}>Crop History &{'\n'}Records</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

// ─── Screen 3: Produce Control Filters Modal ────────────────────────────────────

export interface ProduceControlFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  selectedFarmer: string;
  onChangeFarmer: (v: string) => void;
  selectedZone: string;
  onChangeZone: (v: string) => void;
  selectedCrop: string;
  onChangeCrop: (v: string) => void;
  selectedSeason: string;
  onChangeSeason: (v: string) => void;
  selectedGrowthStage: string;
  onChangeGrowthStage: (v: string) => void;
}

export function ProduceControlFiltersModal({
  visible,
  onClose,
  selectedFarmer,
  onChangeFarmer,
  selectedZone,
  onChangeZone,
  selectedCrop,
  onChangeCrop,
  selectedSeason,
  onChangeSeason,
  selectedGrowthStage,
  onChangeGrowthStage,
}: ProduceControlFiltersModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={produceStyles.modalBackdrop}>
        <Pressable style={produceStyles.modalDismissArea} onPress={onClose} />
        <View style={produceStyles.bottomSheet}>
          <Text style={produceStyles.filtersModalTitle}>Filters</Text>

          {/* 1. Farmer / farm */}
          <Text style={produceStyles.filterFieldLabel}>Farmer / farm</Text>
          <TouchableOpacity
            style={produceStyles.filterDropdown}
            onPress={() => onChangeFarmer(selectedFarmer === 'All' ? 'Ramesh Kumar' : 'All')}
            activeOpacity={0.7}
          >
            <Text style={produceStyles.filterDropdownValue}>{selectedFarmer}</Text>
            <ProduceChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* 2. Zone */}
          <Text style={produceStyles.filterFieldLabel}>Zone</Text>
          <TouchableOpacity
            style={produceStyles.filterDropdown}
            onPress={() => onChangeZone(selectedZone === 'All' ? 'Coonoor' : 'All')}
            activeOpacity={0.7}
          >
            <Text style={produceStyles.filterDropdownValue}>{selectedZone}</Text>
            <ProduceChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* 3. Crop */}
          <Text style={produceStyles.filterFieldLabel}>Crop</Text>
          <TouchableOpacity
            style={produceStyles.filterDropdown}
            onPress={() => onChangeCrop(selectedCrop === 'All' ? 'Tomato' : 'All')}
            activeOpacity={0.7}
          >
            <Text style={produceStyles.filterDropdownValue}>{selectedCrop}</Text>
            <ProduceChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* 4. Season */}
          <Text style={produceStyles.filterFieldLabel}>Season</Text>
          <TouchableOpacity
            style={produceStyles.filterDropdown}
            onPress={() => onChangeSeason(selectedSeason === 'All' ? 'Kharif' : 'All')}
            activeOpacity={0.7}
          >
            <Text style={produceStyles.filterDropdownValue}>{selectedSeason}</Text>
            <ProduceChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* 5. Growth stage */}
          <Text style={produceStyles.filterFieldLabel}>Growth stage</Text>
          <TouchableOpacity
            style={produceStyles.filterDropdown}
            onPress={() => onChangeGrowthStage(selectedGrowthStage === 'All' ? 'Flowering' : 'All')}
            activeOpacity={0.7}
          >
            <Text style={produceStyles.filterDropdownValue}>{selectedGrowthStage}</Text>
            <ProduceChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>

          {/* Bottom Buttons Row: [Apply]  [Reset] */}
          <View style={produceStyles.filterButtonsRow}>
            <TouchableOpacity style={produceStyles.filterApplyBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={produceStyles.filterBtnText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={produceStyles.filterResetBtn}
              onPress={() => {
                onChangeFarmer('All');
                onChangeZone('All');
                onChangeCrop('All');
                onChangeSeason('All');
                onChangeGrowthStage('All');
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={produceStyles.filterBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen 4: Zone & Crop Breakdown ───────────────────────────────────────────

interface ZoneCropBreakdownScreenProps {
  onBack: () => void;
  onOpenFilters: () => void;
  onSelectCropRecord: (recordId: string) => void;
}

export function ZoneCropBreakdownScreen({
  onBack,
  onOpenFilters,
  onSelectCropRecord,
}: ZoneCropBreakdownScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState('Horticultural');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Vegetables');

  return (
    <View style={produceStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={produceStyles.headerBanner}>
        <View style={produceStyles.headerTopRowBetween}>
          <View style={produceStyles.headerTitleWrap}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={produceStyles.backBtnTouch}>
              <ProduceBackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <ProduceGrid4Icon size={20} color={adminColors.onBrand} />
            <Text style={produceStyles.headerTitle}>Zone & Crop Breakdown</Text>
          </View>

          <TouchableOpacity style={produceStyles.headerRightIconTouch} onPress={onOpenFilters} activeOpacity={0.8}>
            <ProduceFilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={produceStyles.scrollContainer}
        contentContainerStyle={produceStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2x2 Metric Cards Grid */}
        <View style={produceStyles.breakdownMetricGrid}>
          {/* Tile 1: Farms with crop records */}
          <View style={produceStyles.breakdownMetricCard}>
            <Text style={produceStyles.breakdownMetricValue}>18</Text>
            <Text style={produceStyles.breakdownMetricLabel}>Farms with crop records</Text>
          </View>

          {/* Tile 2: Zones with active plans */}
          <View style={produceStyles.breakdownMetricCard}>
            <Text style={produceStyles.breakdownMetricValue}>4</Text>
            <Text style={produceStyles.breakdownMetricLabel}>Zones with active plans</Text>
          </View>

          {/* Tile 3: Crops in growth stages */}
          <View style={produceStyles.breakdownMetricCard}>
            <Text style={produceStyles.breakdownMetricValue}>27</Text>
            <Text style={produceStyles.breakdownMetricLabel}>Crops in growth stages</Text>
          </View>

          {/* Tile 4: Expected harvests in 30 days */}
          <View style={produceStyles.breakdownMetricCard}>
            <Text style={produceStyles.breakdownMetricValue}>
              6 <Text style={produceStyles.breakdownMetricValueSub}>(2 excluded)</Text>
            </Text>
            <Text style={produceStyles.breakdownMetricLabel}>Expected harvests in 30 days</Text>
          </View>
        </View>

        {/* Footnote */}
        <Text style={produceStyles.breakdownFootnote}>
          2 open records excluded from the 30-day count: missing planting date or no duration rule for the crop.
        </Text>

        {/* ─── Crops category Section ─── */}
        <Text style={produceStyles.breakdownSectionHeader}>Crops category</Text>

        {/* Category Row 1 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={produceStyles.chipScrollRow}>
          {['Horticultural', 'Cash and Commercial', 'Oilseed', 'Pulses'].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[produceStyles.categoryChip, isSelected && produceStyles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[produceStyles.categoryChipText, isSelected && produceStyles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Category Row 2 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={produceStyles.chipScrollRow}>
          {['Vegetables', 'Fruits', 'Spices & Condiments'].map((sub) => {
            const isSelected = selectedSubCategory === sub;
            return (
              <TouchableOpacity
                key={sub}
                style={[produceStyles.categoryChip, isSelected && produceStyles.categoryChipActive]}
                onPress={() => setSelectedSubCategory(sub)}
                activeOpacity={0.8}
              >
                <Text style={[produceStyles.categoryChipText, isSelected && produceStyles.categoryChipTextActive]}>
                  {sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Coonoor — zone panel Section ─── */}
        <Text style={produceStyles.breakdownSectionHeader}>Coonoor — zone panel</Text>

        <View style={produceStyles.zonePanelCard}>
          <View style={produceStyles.zonePanelRow}>
            <Text style={produceStyles.zonePanelFarm}>Ramesh Kumar Farm</Text>
            <Text style={produceStyles.zonePanelDetail}>Red loam · Full sun · Drip</Text>
          </View>
          <View style={produceStyles.zonePanelDivider} />
          <View style={produceStyles.zonePanelRow}>
            <Text style={produceStyles.zonePanelFarm}>Selvi Farm</Text>
            <Text style={produceStyles.zonePanelDetail}>Not recorded</Text>
          </View>
        </View>

        {/* ─── Crop records Section ─── */}
        <Text style={produceStyles.breakdownSectionHeader}>Crop records</Text>

        {/* Card 1: Tomato · Ramesh Kumar Farm (Tapping redirects to Screen 5) */}
        <TouchableOpacity
          style={produceStyles.cropRecordCard}
          onPress={() => onSelectCropRecord('CR-2026-0017')}
          activeOpacity={0.8}
        >
          <View style={produceStyles.cropRecordTopRow}>
            <Text style={produceStyles.cropRecordName}>Tomato · Ramesh Kumar Farm</Text>
            <View style={produceStyles.growingBadge}>
              <Text style={produceStyles.growingBadgeText}>Growing</Text>
            </View>
          </View>
          <Text style={produceStyles.cropRecordSub}>
            Coonoor, plot 1 · Planted 15 Jul 2026 · Stage 5 of 7 (Flowering)
          </Text>

          {/* 7-Segment Progress Bar: 4 completed green, 1 active orange, 2 upcoming gray */}
          <View style={produceStyles.progressBarRow}>
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentOrange]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGray]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGray]} />
          </View>

          <Text style={produceStyles.cropRecordHarvest}>Expected harvest: 13 Oct 2026 (calculated)</Text>
        </TouchableOpacity>

        {/* Card 2: Carrot · Selvi */}
        <TouchableOpacity
          style={produceStyles.cropRecordCard}
          onPress={() => onSelectCropRecord('CR-2026-0018')}
          activeOpacity={0.8}
        >
          <View style={produceStyles.cropRecordTopRow}>
            <Text style={produceStyles.cropRecordName}>Carrot · Selvi</Text>
            <View style={produceStyles.growingBadge}>
              <Text style={produceStyles.growingBadgeText}>Growing</Text>
            </View>
          </View>
          <Text style={produceStyles.cropRecordSub}>
            Coonoor, plot 2 · Planted 02 Jul 2026 · Stage 5 of 7 (Flowering)
          </Text>

          {/* 7-Segment Progress Bar */}
          <View style={produceStyles.progressBarRow}>
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGreen]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentOrange]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGray]} />
            <View style={[produceStyles.progressSegment, produceStyles.segmentGray]} />
          </View>

          <Text style={produceStyles.cropRecordHarvest}>Expected harvest: 10 Oct 2026 (calculated)</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Screen 5: Crop Record Detail (Tomato · CR-2026-0017) ─────────────────────

export interface CropRecordDetailScreenProps {
  onBack: () => void;
  onOpenFarmerProfile?: () => void;
}

export function CropRecordDetailScreen({ onBack, onOpenFarmerProfile }: CropRecordDetailScreenProps) {
  const [activePillTab, setActivePillTab] = useState('Overview');

  return (
    <View style={produceStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={produceStyles.headerBanner}>
        <View style={produceStyles.headerTopRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={produceStyles.backBtnTouch}>
            <ProduceBackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={produceStyles.headerTitle}>Tomato · CR-2026-0017</Text>
        </View>
        <Text style={[produceStyles.headerSubtitle, { paddingLeft: 30 }]}>
          Ramesh Kumar Farm · Coonoor, plot 1
        </Text>
      </View>

      <ScrollView
        style={produceStyles.scrollContainer}
        contentContainerStyle={produceStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Key-Value Details */}
        <View style={produceStyles.detailCard}>
          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Crop record</Text>
            <Text style={produceStyles.detailRowValue}>CR-2025-0001</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Farmer / farm</Text>
            <Text style={produceStyles.detailRowValue}>FMR-00124 · Ramesh Kumar</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Crops Category</Text>
            <Text style={produceStyles.detailRowValue}>Horticultural - Vegetables</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Zone / plot</Text>
            <Text style={produceStyles.detailRowValue}>Coonoor · PLT-00124-1</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Planting date</Text>
            <Text style={produceStyles.detailRowValue}>5 Mar 2025</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Expected harvest</Text>
            <Text style={produceStyles.detailRowValue}>3 Jun 2025</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Current stage</Text>
            <Text style={produceStyles.detailRowValue}>Harvest (7 of 7)</Text>
          </View>
          <View style={produceStyles.detailDivider} />

          <View style={produceStyles.detailRow}>
            <Text style={produceStyles.detailRowLabel}>Last updated</Text>
            <Text style={produceStyles.detailRowValue}>3 Jun 2025, 08:00 · Farmer entry</Text>
          </View>

          <Text style={produceStyles.detailFootnote}>
            Calculated: planting date plus 90 days (crop duration, rule to confirm)
          </Text>

          <TouchableOpacity style={produceStyles.openFarmerProfileTouch} onPress={onOpenFarmerProfile} activeOpacity={0.7}>
            <Text style={produceStyles.openFarmerProfileText}>Open farmer profile</Text>
          </TouchableOpacity>
        </View>

        {/* Footnote */}
        <Text style={produceStyles.breakdownFootnote}>
          Stage names are proposed (the official seven are to be confirmed). A stage is shown as completed only when it was recorded.
        </Text>

        {/* ─── Growth stages Section ─── */}
        <Text style={produceStyles.breakdownSectionHeader}>Growth stages</Text>

        <View style={produceStyles.growthStagesCard}>
          {/* Stage 1 */}
          <View style={produceStyles.growthStageRow}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCheckCircleIcon size={18} />
              <Text style={produceStyles.stageNameText}>1 · Land preparation</Text>
            </View>
            <Text style={produceStyles.stageDateText}>26 Feb 2025</Text>
          </View>
          <View style={produceStyles.stageDottedDivider} />

          {/* Stage 2 */}
          <View style={produceStyles.growthStageRow}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCheckCircleIcon size={18} />
              <Text style={produceStyles.stageNameText}>2 · Planting</Text>
            </View>
            <Text style={produceStyles.stageDateText}>5 Mar 2025</Text>
          </View>
          <View style={produceStyles.stageDottedDivider} />

          {/* Stage 3 */}
          <View style={produceStyles.growthStageRow}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCheckCircleIcon size={18} />
              <Text style={produceStyles.stageNameText}>3 · Germination</Text>
            </View>
            <Text style={produceStyles.stageDateText}>23 Mar 2025</Text>
          </View>
          <View style={produceStyles.stageDottedDivider} />

          {/* Stage 4 */}
          <View style={produceStyles.growthStageRow}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCheckCircleIcon size={18} />
              <Text style={produceStyles.stageNameText}>4 · Vegetative growth</Text>
            </View>
            <Text style={produceStyles.stageDateText}>10 Apr 2025</Text>
          </View>
          <View style={produceStyles.stageDottedDivider} />

          {/* Stage 5 */}
          <View style={produceStyles.growthStageRow}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCheckCircleIcon size={18} />
              <Text style={produceStyles.stageNameText}>5 · Flowering</Text>
            </View>
            <Text style={produceStyles.stageDateText}>28 Apr 2025</Text>
          </View>
          <View style={produceStyles.stageDottedDivider} />

          {/* Stage 6 */}
          <View style={produceStyles.growthStageRow}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCheckCircleIcon size={18} />
              <Text style={produceStyles.stageNameText}>6 · Crop development</Text>
            </View>
            <Text style={produceStyles.stageDateText}>16 May 2025</Text>
          </View>
          <View style={produceStyles.stageDottedDivider} />

          {/* Stage 7: Harvest (current) */}
          <View style={[produceStyles.growthStageRow, produceStyles.stageRowCurrent]}>
            <View style={produceStyles.stageNameWrap}>
              <ProduceCurrentStageIcon size={18} />
              <Text style={[produceStyles.stageNameText, produceStyles.stageNameTextCurrent]}>
                7 · Harvest (current)
              </Text>
            </View>
            <Text style={[produceStyles.stageDateText, produceStyles.stageDateTextCurrent]}>3 Jun 2025</Text>
          </View>
        </View>

        {/* ─── Pill Tabs Row ─── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={produceStyles.chipScrollRow}>
          {['Overview', 'Schedule', 'Growth history', 'Nutrients', 'Harvest', 'Crop history', 'Related'].map((tab) => {
            const isSelected = activePillTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[produceStyles.categoryChip, isSelected && produceStyles.categoryChipActive]}
                onPress={() => setActivePillTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[produceStyles.categoryChipText, isSelected && produceStyles.categoryChipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activePillTab === 'Overview' && (
          <View style={produceStyles.breakdownCard}>
            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Crop</Text>
              <Text style={produceStyles.cropDetailValue}>Tomato · Local</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Farmer</Text>
              <Text style={produceStyles.cropDetailValue}>Ramesh Kumar</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Farm / zone</Text>
              <Text style={produceStyles.cropDetailValue}>Coonoor · PLT-00124-1</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Season</Text>
              <Text style={produceStyles.cropDetailValue}>Winter 2025</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Plan status (proposed)</Text>
              <Text style={produceStyles.cropDetailValue}>Harvested</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Area</Text>
              <Text style={produceStyles.cropDetailValue}>1 acre</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.cropDetailLabel}>Current stage</Text>
              <Text style={produceStyles.cropDetailValue}>Harvest (7 of 7)</Text>
            </View>
          </View>
        )}

        {/* ─── TAB 2: SCHEDULE ─── */}
        {activePillTab === 'Schedule' && (
          <View>
            <View style={produceStyles.breakdownCard}>
              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Planting date (recorded)</Text>
                <Text style={produceStyles.cropDetailValue}>5 Mar 2025</Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Expected harvest (forecast)</Text>
                <Text style={produceStyles.cropDetailValue}>3 Jun 2025</Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={[produceStyles.trendTableRow, { alignItems: 'flex-start' }]}>
                <Text style={produceStyles.cropDetailLabel}>Basis</Text>
                <Text style={[produceStyles.cropDetailValue, { flex: 1, textAlign: 'right' }]}>
                  Calculated: planting date plus 90 days (crop duration, rule to confirm)
                </Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Planting date used</Text>
                <Text style={produceStyles.cropDetailValue}>5 Mar 2025</Text>
              </View>
            </View>

            <Text style={[produceStyles.breakdownSectionHeader, { marginTop: 6 }]}>Recorded milestones</Text>

            <View style={produceStyles.breakdownCard}>
              {[
                { label: 'Land preparation', val: '26 Feb 2025' },
                { label: 'Planting', val: '5 Mar 2025' },
                { label: 'Germination', val: '23 Mar 2025' },
                { label: 'Vegetative growth', val: '10 Apr 2025' },
                { label: 'Flowering', val: '28 Apr 2025' },
                { label: 'Crop development', val: '16 May 2025' },
                { label: 'Harvest', val: '3 Jun 2025' },
                { label: 'Harvest (recorded)', val: '30 May 2025' },
              ].map((item, idx) => (
                <View key={idx}>
                  {idx > 0 && <View style={produceStyles.dottedDivider} />}
                  <View style={produceStyles.trendTableRow}>
                    <Text style={produceStyles.cropDetailLabel}>{item.label}</Text>
                    <Text style={produceStyles.cropDetailValue}>{item.val}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ─── TAB 3: GROWTH HISTORY ─── */}
        {activePillTab === 'Growth history' && (
          <View>
            {[
              { date: '3 Jun 2025 · Ramesh Kumar (Farmer)', stage: 'Harvest (previous: Crop development)', rec: 'Recorded 3 Jun 2025, 08:00' },
              { date: '16 May 2025 · Ramesh Kumar (Farmer)', stage: 'Crop development (previous: Flowering)', rec: 'Recorded 16 May 2025, 08:00' },
              { date: '28 Apr 2025 · Ramesh Kumar (Farmer)', stage: 'Flowering (previous: Vegetative growth)', rec: 'Recorded 28 Apr 2025, 08:00' },
              { date: '10 Apr 2025 · Ramesh Kumar (Farmer)', stage: 'Vegetative growth (previous: Germination)', rec: 'Recorded 10 Apr 2025, 08:00' },
              { date: '23 Mar 2025 · Ramesh Kumar (Farmer)', stage: 'Germination (previous: Planting)', rec: 'Recorded 23 Mar 2025, 08:00' },
              { date: '5 Mar 2025 · Ramesh Kumar (Farmer)', stage: 'Planting (previous: Land preparation)', rec: 'Recorded 5 Mar 2025, 08:00' },
              { date: '26 Feb 2025 · Ramesh Kumar (Farmer)', stage: 'Land preparation', rec: 'Recorded 26 Feb 2025, 08:00' },
            ].map((item, idx) => (
              <View key={idx} style={produceStyles.historyEventCard}>
                <Text style={produceStyles.historyEventSub}>{item.date}</Text>
                <Text style={produceStyles.historyEventTitle}>{item.stage}</Text>
                <Text style={produceStyles.historyEventRec}>{item.rec}</Text>
              </View>
            ))}

            <View style={produceStyles.historyLockedCard}>
              <Text style={produceStyles.historyLockedText}>🔒  The history is append-only.</Text>
            </View>
          </View>
        )}

        {/* ─── TAB 4: NUTRIENTS ─── */}
        {activePillTab === 'Nutrients' && (
          <View style={produceStyles.breakdownCard}>
            {[
              { label: 'Nitrogen (N)', val: '22' },
              { label: 'Phosphorus (P₂O₅)', val: '12' },
              { label: 'Potassium (K₂O)', val: '18' },
              { label: 'Magnesium (MgO)', val: '3' },
              { label: 'Sulphur (SO₄)', val: '4' },
            ].map((item, idx) => (
              <View key={idx}>
                {idx > 0 && <View style={produceStyles.dottedDivider} />}
                <View style={produceStyles.trendTableRow}>
                  <Text style={produceStyles.cropDetailLabel}>{item.label}</Text>
                  <Text style={produceStyles.cropDetailValue}>{item.val}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── TAB 5: HARVEST ─── */}
        {activePillTab === 'Harvest' && (
          <View>
            <View style={produceStyles.breakdownCard}>
              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Actual harvest date</Text>
                <Text style={produceStyles.cropDetailValue}>30 May 2025</Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Recorded quantity</Text>
                <Text style={produceStyles.cropDetailValue}>4,420 KG</Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Recorded by</Text>
                <Text style={produceStyles.cropDetailValue}>Ramesh Kumar</Text>
              </View>
            </View>

            <Text style={[produceStyles.breakdownFootnote, { marginHorizontal: 16 }]}>
              No expected quantity was entered. None is calculated.{'\n'}
              A recorded harvest is not a purchase or a receipt; those belong to Purchase and inventory.
            </Text>
          </View>
        )}

        {/* ─── TAB 6: CROP HISTORY ─── */}
        {activePillTab === 'Crop history' && (
          <View>
            <View style={produceStyles.historyEventCard}>
              <Text style={produceStyles.historyEventTitle}>Tomato · Winter 2026</Text>
              <Text style={produceStyles.historyEventRec}>CR-2026-0017 · Planted 6 Oct 2026</Text>
            </View>

            <View style={produceStyles.historyEventCard}>
              <Text style={produceStyles.historyEventTitle}>Tomato · Summer 2025</Text>
              <Text style={produceStyles.historyEventRec}>CR-2025-0013 · Planted 13 Sep 2025 · Harvested 15 Dec 2025</Text>
            </View>
          </View>
        )}

        {/* ─── TAB 7: RELATED ─── */}
        {activePillTab === 'Related' && (
          <View>
            <View style={produceStyles.breakdownCard}>
              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Farm diary</Text>
                <Text style={produceStyles.cropDetailValue}>Farm diary entry linked</Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Input log</Text>
                <Text style={produceStyles.cropDetailValue}>Input log entry linked</Text>
              </View>
              <View style={produceStyles.dottedDivider} />

              <View style={produceStyles.trendTableRow}>
                <Text style={produceStyles.cropDetailLabel}>Audit</Text>
                <Text style={produceStyles.cropDetailValue}>None linked</Text>
              </View>
            </View>

            <Text style={[produceStyles.breakdownFootnote, { marginHorizontal: 16 }]}>
              These records belong to other modules (Farm diary, Inputs & Pest Management, Audit Management). They are linked here, not duplicated.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Harvest Forecast & Insights Screen (Images 1, 2, 3, 4) ────────────────────

interface HarvestForecastInsightsScreenProps {
  onBack: () => void;
  onOpenExportModal: () => void;
  onOpenFilters?: () => void;
}

export function HarvestForecastInsightsScreen({
  onBack,
  onOpenExportModal,
  onOpenFilters,
}: HarvestForecastInsightsScreenProps) {
  const [activeTab, setActiveTab] = useState<'forecast' | 'insights'>('forecast');
  const [timeFilter, setTimeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={produceStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={produceStyles.headerBanner}>
        <View style={produceStyles.headerTopRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={produceStyles.backBtnTouch}>
            <ProduceBackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={produceStyles.headerTitle}>Harvest Forecast & Insights</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Top Pill Tabs: [ Forecast ]  [ Insights ] */}
        <View style={produceStyles.forecastTabsContainer}>
          <TouchableOpacity
            style={[
              produceStyles.forecastTabButton,
              activeTab === 'forecast' && produceStyles.forecastTabButtonActive,
            ]}
            onPress={() => setActiveTab('forecast')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                produceStyles.forecastTabText,
                activeTab === 'forecast' && produceStyles.forecastTabTextActive,
              ]}
            >
              Forecast
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              produceStyles.forecastTabButton,
              activeTab === 'insights' && produceStyles.forecastTabButtonActive,
            ]}
            onPress={() => setActiveTab('insights')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                produceStyles.forecastTabText,
                activeTab === 'insights' && produceStyles.forecastTabTextActive,
              ]}
            >
              Insights
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── TAB 1: FORECAST (5th Image) ─── */}
        {activeTab === 'forecast' ? (
          <View>
            {/* Time Filter Pills: [ Next 30 days ] [ Next 60 days ] [ Next 90 days ] [ All ] */}
            <View style={produceStyles.timeFilterRow}>
              {['Next 30 days', 'Next 60 days', 'Next 90 days', 'All'].map((item) => {
                const isSelected = timeFilter === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[produceStyles.timeFilterBtn, isSelected && produceStyles.timeFilterBtnActive]}
                    onPress={() => setTimeFilter(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={[produceStyles.timeFilterText, isSelected && produceStyles.timeFilterTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Search Bar with Filter Sliders Icon */}
            <View style={[produceStyles.searchBarContainer, { marginHorizontal: adminSpacing.md, marginTop: 4, marginBottom: 12 }]}>
              <ProduceSearchIcon size={18} color="#8C7E74" />
              <TextInput
                style={produceStyles.searchInput}
                placeholder="Search common or scientific name"
                placeholderTextColor="#8C7E74"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity
                style={produceStyles.filterTouchBtn}
                onPress={onOpenFilters}
                activeOpacity={0.8}
              >
                <ProduceFilterSlidersIcon size={20} color={adminColors.brand} />
              </TouchableOpacity>
            </View>

            {/* 43 crop records count */}
            <Text style={produceStyles.forecastRecordCountText}>43 crop records</Text>

            {/* Card 1: Tomato · Ramesh Kumar (Exact 5th Image Match) */}
            <View style={produceStyles.forecastCard}>
              <Text style={produceStyles.forecastCardTitle}>Tomato · Ramesh Kumar</Text>
              <Text style={produceStyles.forecastCardSub}>Coonoor · PLT-00124-1</Text>
              <Text style={produceStyles.forecastCardLine}>Planting 5 Mar 2025 · Harvest (7 of 7)</Text>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Expected harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>3 Jun 2025 (calculated)</Text>
              </View>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Actual harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>30 May 2025 (recorded)</Text>
              </View>
              <Text style={produceStyles.forecastCardFooter}>
                Expected quantity not entered · Updated 3 Jun 2025, 08:00
              </Text>
            </View>

            {/* Card 2: Carrot · Selvi */}
            <View style={produceStyles.forecastCard}>
              <Text style={produceStyles.forecastCardTitle}>Carrot · Selvi</Text>
              <Text style={produceStyles.forecastCardSub}>Coonoor · PLT-00131-1</Text>
              <Text style={produceStyles.forecastCardLine}>Planting 21 Mar 2025 · Harvest (7 of 7)</Text>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Expected harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>29 Jun 2025 (calculated)</Text>
              </View>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Actual harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>2 Jul 2025 (recorded)</Text>
              </View>
              <Text style={produceStyles.forecastCardFooter}>
                Expected quantity 6,483 KG (farmer-entered) · Updated 29 Jun 2025, 08:00
              </Text>
            </View>

            {/* Card 3: Cabbage · Meena */}
            <View style={produceStyles.forecastCard}>
              <Text style={produceStyles.forecastCardTitle}>Cabbage · Meena</Text>
              <Text style={produceStyles.forecastCardSub}>Coonoor · PLT-00177-1</Text>
              <Text style={produceStyles.forecastCardLine}>Planting 6 Apr 2025 · Harvest (7 of 7)</Text>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Expected harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>30 Jun 2025 (calculated)</Text>
              </View>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Actual harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>29 Jun 2025 (recorded)</Text>
              </View>
              <Text style={produceStyles.forecastCardFooter}>
                Expected quantity not entered · Updated 30 Jun 2025, 08:00
              </Text>
            </View>

            {/* Card 4: Beans · Lakshmi */}
            <View style={produceStyles.forecastCard}>
              <Text style={produceStyles.forecastCardTitle}>Beans · Lakshmi</Text>
              <Text style={produceStyles.forecastCardSub}>Coonoor · PLT-00203-1</Text>
              <Text style={produceStyles.forecastCardLine}>Planting 22 Apr 2025 · Harvest (7 of 7)</Text>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Expected harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>26 Jun 2025 (calculated)</Text>
              </View>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Actual harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>2 Jul 2025 (recorded)</Text>
              </View>
              <Text style={produceStyles.forecastCardFooter}>
                Expected quantity 5,371 KG (farmer-entered) · Updated 26 Jun 2025, 08:00
              </Text>
            </View>

            {/* Card 5: Garlic · Senthil */}
            <View style={produceStyles.forecastCard}>
              <Text style={produceStyles.forecastCardTitle}>Garlic · Senthil</Text>
              <Text style={produceStyles.forecastCardSub}>Gudalur · PLT-00127-1</Text>
              <Text style={produceStyles.forecastCardLine}>Planting 12 Aug 2025 · Harvest (7 of 7)</Text>
              <View style={{ marginVertical: 3 }}>
                <Text style={produceStyles.forecastBoldLabel}>
                  Expected harvest:{' '}
                  <Text style={produceStyles.forecastUnavailableText}>
                    Unavailable. No crop duration rule is configured for Garlic, so the forecast is unavailable.
                  </Text>
                </Text>
              </View>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Actual harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>10 Dec 2025 (recorded)</Text>
              </View>
              <Text style={produceStyles.forecastCardFooter}>
                Expected quantity not entered · Updated 10 Nov 2025, 08:00
              </Text>
            </View>

            {/* Card 6: Potato · Sundar */}
            <View style={produceStyles.forecastCard}>
              <Text style={produceStyles.forecastCardTitle}>Potato · Sundar</Text>
              <Text style={produceStyles.forecastCardSub}>Gudalur · PLT-00146-1</Text>
              <Text style={produceStyles.forecastCardLine}>Planting 28 Aug 2025 · Harvest (7 of 7)</Text>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Expected harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>6 Dec 2025 (calculated)</Text>
              </View>
              <View style={produceStyles.forecastRow}>
                <Text style={produceStyles.forecastBoldLabel}>Actual harvest: </Text>
                <Text style={produceStyles.forecastBoldVal}>2 Dec 2025 (recorded)</Text>
              </View>
              <Text style={produceStyles.forecastCardFooter}>
                Expected quantity 15,015 KG (farmer-entered) · Updated 6 Dec 2025, 08:00
              </Text>
            </View>
          </View>
        ) : (
          /* ─── TAB 2: INSIGHTS (Images 2, 3, 4) ─── */
          <View>
            {/* Card 1: Recorded yield trend */}
            <View style={produceStyles.breakdownCard}>
              <Text style={produceStyles.sectionTitle}>Recorded yield trend</Text>
              <Text style={produceStyles.sectionSubtitle}>
                Date range 30 May 2025 to 28 Sep 2026 · Unit KG per acre, monthly average · 19 records · Source: recorded harvests and farm area
              </Text>
              {[
                { label: '25-05', pct: 60, val: '4,420 (1)' },
                { label: '25-06', pct: 95, val: '6,660 (1)' },
                { label: '25-07', pct: 42, val: '3,081 (2)' },
                { label: '25-09', pct: 50, val: '3,580 (2)' },
                { label: '25-10', pct: 60, val: '4,315 (3)' },
                { label: '25-12', pct: 55, val: '3,943 (3)' },
                { label: '26-01', pct: 60, val: '4,315 (3)' },
                { label: '26-08', pct: 28, val: '2,090 (1)' },
                { label: '26-09', pct: 70, val: '4,972 (3)' },
              ].map((item, idx) => (
                <View key={idx} style={produceStyles.trendBarRow}>
                  <Text style={produceStyles.trendBarLabel}>{item.label}</Text>
                  <View style={produceStyles.trendBarTrack}>
                    <View style={[produceStyles.trendBarFill, { width: `${item.pct}%` }]} />
                  </View>
                  <Text style={produceStyles.trendBarValue}>{item.val}</Text>
                </View>
              ))}
            </View>

            {/* Card 2: Best-performing crops */}
            <View style={produceStyles.breakdownCard}>
              <Text style={produceStyles.sectionTitle}>Best-performing crops</Text>
              <Text style={produceStyles.sectionSubtitle}>
                Date range 30 May 2025 to 28 Sep 2026 · Unit KG per acre, average · 19 records · Source: recorded harvests and farm area
              </Text>
              <Text style={[produceStyles.sectionSubtitle, { marginTop: 4, marginBottom: 12 }]}>
                Average recorded yield, KG per acre (proposed metric, to confirm)
              </Text>
              {[
                { name: 'Cabbage', pct: 92, val: '6,210 (4)' },
                { name: 'Potato', pct: 82, val: '5,473 (2)' },
                { name: 'Tomato', pct: 71, val: '4,715 (3)' },
                { name: 'Carrot', pct: 64, val: '4,263 (4)' },
                { name: 'Beans', pct: 32, val: '2,151 (4)' },
                { name: 'Garlic', pct: 27, val: '1,773 (2)' },
              ].map((item, idx) => (
                <View key={idx} style={produceStyles.cropBarRow}>
                  <Text style={produceStyles.cropBarLabel}>{item.name}</Text>
                  <View style={produceStyles.trendBarTrack}>
                    <View style={[produceStyles.trendBarFill, { width: `${item.pct}%` }]} />
                  </View>
                  <Text style={produceStyles.cropBarValue}>{item.val}</Text>
                </View>
              ))}
            </View>

            {/* Card 3: Seasonal crop patterns */}
            <View style={produceStyles.breakdownCard}>
              <Text style={produceStyles.sectionTitle}>Seasonal crop patterns</Text>
              <Text style={produceStyles.sectionSubtitle}>
                Harvested crops by season · Unit records · 20 records · Source: recorded harvests and farm area
              </Text>
              {[
                { title: 'Summer 2025 · Beans', count: '2' },
                { title: 'Summer 2025 · Cabbage', count: '2' },
                { title: 'Summer 2025 · Carrot', count: '1' },
                { title: 'Summer 2025 · Garlic', count: '1' },
                { title: 'Summer 2025 · Potato', count: '1' },
                { title: 'Summer 2025 · Tomato', count: '1' },
                { title: 'Winter 2025 · Beans', count: '1' },
                { title: 'Winter 2025 · Cabbage', count: '1' },
                { title: 'Winter 2025 · Carrot', count: '2' },
                { title: 'Winter 2025 · Garlic', count: '1' },
                { title: 'Winter 2025 · Potato', count: '1' },
                { title: 'Winter 2025 · Tomato', count: '2' },
                { title: 'Winter 2026 · Beans', count: '1' },
                { title: 'Winter 2026 · Cabbage', count: '1' },
                { title: 'Winter 2026 · Carrot', count: '1' },
                { title: 'Winter 2026 · Potato', count: '1' },
              ].map((row, idx) => (
                <View
                  key={idx}
                  style={[
                    produceStyles.trendTableRow,
                    idx > 0 && produceStyles.dottedDivider,
                  ]}
                >
                  <Text style={produceStyles.seasonalLabel}>{row.title}</Text>
                  <Text style={produceStyles.seasonalValue}>{row.count}</Text>
                </View>
              ))}
            </View>

            {/* Card 4: Planned versus actual harvest */}
            <View style={produceStyles.breakdownCard}>
              <Text style={produceStyles.sectionTitle}>Planned versus actual harvest</Text>
              <Text style={produceStyles.sectionSubtitle}>
                Expected (calculated or farmer-entered) against the recorded harvest · 18 records · 8 also have an expected quantity
              </Text>
              {[
                { crop: 'Tomato · CR-2025-0001', diff: '4 days before' },
                { crop: 'Carrot · CR-2025-0002', diff: '3 days after' },
                { crop: 'Cabbage · CR-2025-0003', diff: '1 days before' },
                { crop: 'Beans · CR-2025-0004', diff: '6 days after' },
                { crop: 'Potato · CR-2025-0006', diff: '2 days after' },
                { crop: 'Tomato · CR-2025-0007', diff: '5 days after' },
                { crop: 'Carrot · CR-2025-0008', diff: '1 days after' },
                { crop: 'Cabbage · CR-2025-0009', diff: '3 days before' },
              ].map((row, idx) => (
                <View
                  key={idx}
                  style={[
                    produceStyles.trendTableRow,
                    idx > 0 && produceStyles.dottedDivider,
                  ]}
                >
                  <Text style={produceStyles.seasonalLabel}>{row.crop}</Text>
                  <Text style={produceStyles.plannedDiffValue}>{row.diff}</Text>
                </View>
              ))}
              <Text style={[produceStyles.footnoteText, { marginTop: 8 }]}>Showing 8 of 18.</Text>
            </View>

            {/* Card 5: Revenue per zone */}
            <View style={produceStyles.breakdownCard}>
              <View style={produceStyles.revenueHeaderRow}>
                <Text style={produceStyles.sectionTitle}>Revenue per zone</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <ProduceFilterSlidersIcon size={20} color={adminColors.brandDeep} />
                </TouchableOpacity>
              </View>
              <Text style={produceStyles.sectionSubtitle}>Needs a defined revenue source</Text>

              <View style={produceStyles.revenueEmptyBox}>
                <ProduceMoneyNotAvailableIcon size={34} color="#606060" />
                <Text style={produceStyles.revenueEmptyTitle}>Not available</Text>
                <Text style={produceStyles.revenueEmptyDesc}>
                  The revenue source is not defined, so revenue per zone is not shown.
                </Text>
              </View>
            </View>

            {/* Export Report Button */}
            <TouchableOpacity
              style={produceStyles.exportReportButton}
              onPress={onOpenExportModal}
              activeOpacity={0.85}
            >
              <ProduceDownloadIcon size={20} color={adminColors.onBrand} />
              <Text style={produceStyles.exportReportButtonText}>Export Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Image 5: Export Crop Records Modal (Bottom Sheet) ──────────────────────────

interface ExportCropRecordsModalProps {
  visible: boolean;
  onClose: () => void;
  onDownloadCSV: () => void;
}

export function ExportCropRecordsModal({
  visible,
  onClose,
  onDownloadCSV,
}: ExportCropRecordsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={produceStyles.modalBackdrop}>
        <Pressable style={produceStyles.modalDismissArea} onPress={onClose} />
        <View style={produceStyles.exportModalContent}>
          <Text style={produceStyles.exportModalTitle}>Export crop records</Text>

          <View style={produceStyles.exportInfoBox}>
            <View style={produceStyles.trendTableRow}>
              <Text style={produceStyles.exportInfoLabel}>Rows</Text>
              <Text style={produceStyles.exportInfoValue}>43 crop records</Text>
            </View>
            <View style={produceStyles.dottedDivider} />
            <View style={[produceStyles.trendTableRow, { alignItems: 'flex-start', paddingTop: 8 }]}>
              <Text style={[produceStyles.exportInfoLabel, { width: 70 }]}>Columns</Text>
              <Text style={[produceStyles.exportInfoValue, { flex: 1, textAlign: 'right', lineHeight: 20 }]}>
                record, farmer ID, zone, plot, crop, variety, season, planting date, stage, expected harvest, status, recorded quantity
              </Text>
            </View>
          </View>

          <Text style={produceStyles.exportFootnote}>
            Expected harvest dates are exported as forecasts. Farmer phone numbers are not included.
          </Text>

          <View style={produceStyles.exportActionsRow}>
            <TouchableOpacity
              style={produceStyles.exportBtnOutline}
              onPress={onDownloadCSV}
              activeOpacity={0.75}
            >
              <Text style={produceStyles.exportBtnOutlineText}>Download CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={produceStyles.exportBtnOutline}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text style={produceStyles.exportBtnOutlineText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen 6: Crop History & Records Screen (Image 1) ──────────────────────────

interface CropHistoryRecordsScreenProps {
  onBack: () => void;
  onOpenCompareModal: () => void;
  onSelectCropRecord: (recordId: string) => void;
  onOpenFilters?: () => void;
  selectedCompareIds: string[];
  onToggleCompare: (recordId: string) => void;
}

export function CropHistoryRecordsScreen({
  onBack,
  onOpenCompareModal,
  onSelectCropRecord,
  onOpenFilters,
  selectedCompareIds,
  onToggleCompare,
}: CropHistoryRecordsScreenProps) {
  const [searchTxt, setSearchTxt] = useState('');

  const historyRecords = [
    {
      id: 'CR-2026-0040',
      title: 'Potato · Winter 2026',
      badge: 'Harvested',
      farmerLine: 'CR-2026-0040 · FMR-00221 · Priya',
      plotLine: 'Kotagiri · PLT-00221-2',
      datesLine: 'Planted 17 Jun 2026 · Harvested 28 Sep 2026',
      quantityLine: 'Quantity 5,225 KG · Source Farmer entry',
    },
    {
      id: 'CR-2026-0031',
      title: 'Cabbage · Winter 2026',
      badge: 'Harvested',
      farmerLine: 'CR-2026-0031 · FMR-00127 · Senthil',
      plotLine: 'Gudalur · PLT-00127-2',
      datesLine: 'Planted 30 Jun 2026 · Harvested 26 Sep 2026',
      quantityLine: 'Quantity 5,700 KG · Source Farmer entry',
    },
    {
      id: 'CR-2026-0024',
      title: 'Carrot · Winter 2026',
      badge: 'Harvested',
      farmerLine: 'CR-2026-0024 · FMR-00146 · Sundar',
      plotLine: 'Gudalur · PLT-00146-1',
      datesLine: 'Planted 9 Jun 2026 · Harvested 20 Sep 2026',
      quantityLine: 'Quantity 9,975 KG · Source Farmer entry',
    },
  ];

  return (
    <View style={produceStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={produceStyles.headerBanner}>
        <View style={produceStyles.headerTopRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={produceStyles.backBtnTouch}>
            <ProduceBackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={produceStyles.headerTitle}>Crop History & Records</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Search Bar */}
        <View style={[produceStyles.searchBarContainer, { marginHorizontal: adminSpacing.md, marginTop: adminSpacing.md, marginBottom: 12 }]}>
          <ProduceSearchIcon size={18} color="#8C7E74" />
          <TextInput
            style={produceStyles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor="#8C7E74"
            value={searchTxt}
            onChangeText={setSearchTxt}
          />
          <TouchableOpacity
            style={produceStyles.filterTouchBtn}
            onPress={onOpenFilters}
            activeOpacity={0.8}
          >
            <ProduceFilterSlidersIcon size={20} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Compare Button */}
        <TouchableOpacity
          style={produceStyles.comparePillButton}
          onPress={onOpenCompareModal}
          activeOpacity={0.8}
        >
          <ProduceCompareIcon size={18} color={adminColors.brandDeep} />
          <Text style={produceStyles.comparePillButtonText}>
            Compare ({selectedCompareIds.length})
          </Text>
        </TouchableOpacity>

        {/* Subtitle count */}
        <Text style={produceStyles.historyCyclesCount}>16 completed 2025 cycles</Text>

        {/* List of cards */}
        {historyRecords.map((item) => {
          const isSelected = selectedCompareIds.includes(item.id);
          return (
            <View key={item.id} style={produceStyles.historyCard}>
              <View style={produceStyles.historyCardTopRow}>
                <Text style={produceStyles.historyCardTitle}>{item.title}</Text>
                <View style={produceStyles.harvestedBadge}>
                  <Text style={produceStyles.harvestedBadgeText}>{item.badge}</Text>
                </View>
              </View>

              <Text style={produceStyles.historyCardMeta}>{item.farmerLine}</Text>
              <Text style={produceStyles.historyCardMeta}>{item.plotLine}</Text>
              <Text style={produceStyles.historyCardMeta}>{item.datesLine}</Text>
              <Text style={produceStyles.historyCardMeta}>{item.quantityLine}</Text>

              <View style={produceStyles.historyCardActionsRow}>
                <TouchableOpacity
                  onPress={() => onSelectCropRecord(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={produceStyles.historyActionLink}>Open full record</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onToggleCompare(item.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      produceStyles.historyActionLink,
                      isSelected && { color: adminColors.brand, fontWeight: '800' },
                    ]}
                  >
                    {isSelected ? 'Selected to compare ✓' : 'Select to compare'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Compare Crop Cycles Modal (Image 1 popup) ──────────────────────────────────

interface CompareCropCyclesModalProps {
  visible: boolean;
  onClose: () => void;
  onExportDetails: () => void;
}

export function CompareCropCyclesModal({
  visible,
  onClose,
  onExportDetails,
}: CompareCropCyclesModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={produceStyles.modalBackdrop}>
        <Pressable style={produceStyles.modalDismissArea} onPress={onClose} />
        <View style={produceStyles.exportModalContent}>
          <Text style={produceStyles.exportModalTitle}>Compare crop cycles</Text>

          {/* Comparison Table Box */}
          <View style={produceStyles.compareTableBox}>
            {/* Table Header Row */}
            <View style={produceStyles.compareTableRow}>
              <View style={{ width: 85 }} />
              <Text style={produceStyles.compareColHeader}>CR-2026-0040</Text>
              <Text style={produceStyles.compareColHeader}>CR-2026-0031</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            {/* Row 1: Crop */}
            <View style={produceStyles.compareTableRow}>
              <Text style={produceStyles.compareRowLabel}>Crop</Text>
              <Text style={produceStyles.compareRowValue}>Potato</Text>
              <Text style={produceStyles.compareRowValue}>Cabbage</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            {/* Row 2: Season */}
            <View style={produceStyles.compareTableRow}>
              <Text style={produceStyles.compareRowLabel}>Season</Text>
              <Text style={produceStyles.compareRowValue}>Winter 2026</Text>
              <Text style={produceStyles.compareRowValue}>Winter 2026</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            {/* Row 3: Zone / plot */}
            <View style={produceStyles.compareTableRow}>
              <Text style={produceStyles.compareRowLabel}>Zone / plot</Text>
              <Text style={produceStyles.compareRowValue}>Kotagiri · PLT-00221-2</Text>
              <Text style={produceStyles.compareRowValue}>Gudalur · PLT-00127-2</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            {/* Row 4: Quantity */}
            <View style={produceStyles.compareTableRow}>
              <Text style={produceStyles.compareRowLabel}>Quantity</Text>
              <Text style={produceStyles.compareRowValue}>5,225 KG</Text>
              <Text style={produceStyles.compareRowValue}>5,700 KG</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            {/* Row 5: Yield */}
            <View style={produceStyles.compareTableRow}>
              <Text style={produceStyles.compareRowLabel}>Yield</Text>
              <Text style={produceStyles.compareRowValue}>5,225 KG/acre</Text>
              <Text style={produceStyles.compareRowValue}>5,700 KG/acre</Text>
            </View>
            <View style={produceStyles.dottedDivider} />

            {/* Row 6: Planting to harvest */}
            <View style={produceStyles.compareTableRow}>
              <Text style={produceStyles.compareRowLabel}>Planting to harvest</Text>
              <Text style={produceStyles.compareRowValue}>103 days</Text>
              <Text style={produceStyles.compareRowValue}>88 days</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[produceStyles.exportActionsRow, { marginTop: 20 }]}>
            <TouchableOpacity
              style={produceStyles.exportDetailsBtn}
              onPress={onExportDetails}
              activeOpacity={0.75}
            >
              <Text style={produceStyles.exportDetailsBtnText}>Export Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={produceStyles.exportBtnOutline}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text style={produceStyles.exportBtnOutlineText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Produce Control Stylesheet ────────────────────────────────────────────────

const produceStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header Banner in Terracotta Brand Orange
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
  headerTopRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtnTouch: {
    paddingRight: 4,
    paddingVertical: 4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 13,
    marginTop: 4,
    paddingLeft: 34,
  },
  headerRightIconTouch: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Overview Card (Screen 1 & 2)
  overviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    ...adminShadow.sm,
    marginBottom: adminSpacing.lg,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  overviewLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: adminColors.brandDeep,
    flex: 1,
    paddingRight: 8,
  },
  overviewValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  dottedDivider: {
    borderBottomWidth: 1,
    borderColor: '#E8E0D7',
    borderStyle: 'dashed',
    marginVertical: 8,
  },

  // Month Navigation
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.xs,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: '#E2DCD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // Calendar Grid
  calendarContainer: {
    backgroundColor: 'transparent',
    marginTop: adminSpacing.xs,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
    paddingHorizontal: 2,
  },
  weekdayCell: {
    width: '13%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  dayCellEmpty: {
    width: '13%',
    height: 48,
  },
  dayCell: {
    width: '13%',
    height: 48,
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayCellOrangeBorder: {
    borderColor: adminColors.brand,
    borderWidth: 2,
  },
  dayCellBrownBorder: {
    borderColor: adminColors.brandDeep,
    borderWidth: 2,
  },
  dayCellSelected: {
    borderColor: adminColors.brand,
    borderWidth: 1.5,
  },
  dayNumText: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.ink,
  },
  dayNumTextBold: {
    fontWeight: '800',
  },
  dayDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    marginTop: 2,
    minHeight: 8,
  },
  calendarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.8,
    borderColor: '#2E7D32',
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: adminSpacing.md,
    paddingHorizontal: 2,
    rowGap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
  },
  legendRing: {
    width: 8.5,
    height: 8.5,
    borderRadius: 4.5,
    borderWidth: 1.8,
    borderColor: '#2E7D32',
  },
  legendText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#4B5563',
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: '#E5DFD7',
    paddingHorizontal: adminSpacing.md,
    height: 46,
    marginTop: adminSpacing.lg,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: adminSpacing.sm,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  filterTouchBtn: {
    padding: adminSpacing.xs,
  },

  // Date Section Header
  dateSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },

  // Activity Card
  activityCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    marginBottom: adminSpacing.sm,
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  recordedBadge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  recordedBadgeText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },
  activityMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Footnote
  explanatoryFootnote: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginVertical: adminSpacing.md,
  },

  // Quick Actions Section
  quickActionsSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: adminSpacing.sm,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE7E1',
    minHeight: 115,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'center',
    marginTop: adminSpacing.sm,
    lineHeight: 16,
  },

  // Modal / Bottom Sheet (Screen 3)
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
    marginTop: adminSpacing.xs,
  },
  filterDropdown: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9D2C9',
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
    marginTop: 6,
    marginBottom: adminSpacing.md,
  },
  filterDropdownValue: {
    fontSize: 14,
    color: adminColors.ink,
    fontWeight: '500',
  },
  filterButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  filterApplyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C8BFB5',
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C8BFB5',
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },

  // Zone & Crop Breakdown (Screen 4)
  breakdownMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  breakdownMetricCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
  },
  breakdownMetricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: adminColors.ink,
  },
  breakdownMetricValueSub: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  breakdownMetricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  breakdownFootnote: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginVertical: adminSpacing.sm,
  },
  breakdownSectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  chipScrollRow: {
    flexDirection: 'row',
    marginBottom: adminSpacing.sm,
  },
  categoryChip: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9D2C9',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  categoryChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  zonePanelCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    marginBottom: adminSpacing.sm,
  },
  zonePanelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  zonePanelFarm: {
    fontSize: 13.5,
    color: '#6B7280',
  },
  zonePanelDetail: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  zonePanelDivider: {
    height: 1,
    backgroundColor: '#EDE7E1',
    marginVertical: 8,
  },
  cropRecordCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    marginBottom: adminSpacing.md,
  },
  cropRecordTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cropRecordName: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  growingBadge: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  growingBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D97706',
  },
  cropRecordSub: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 4,
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  segmentGreen: {
    backgroundColor: '#2E7D32',
  },
  segmentOrange: {
    backgroundColor: '#E67E22',
  },
  segmentGray: {
    backgroundColor: '#E5DFD7',
  },
  cropRecordHarvest: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Crop Record Detail (Screen 5)
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    marginBottom: adminSpacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailRowLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailRowValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#EDE7E1',
    marginVertical: 6,
  },
  detailFootnote: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
    marginTop: 10,
  },
  openFarmerProfileTouch: {
    marginTop: 12,
  },
  openFarmerProfileText: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brand,
  },
  growthStagesCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    marginBottom: adminSpacing.md,
  },
  growthStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  stageRowCurrent: {
    backgroundColor: '#FFF4EB',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -4,
  },
  stageNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageNameText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
  stageNameTextCurrent: {
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
  stageDateText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  stageDateTextCurrent: {
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
  stageDottedDivider: {
    borderBottomWidth: 1,
    borderColor: '#E8E0D7',
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  bottomCropCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.sm,
  },

  // General Card & Section Titles
  breakdownCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    padding: adminSpacing.md,
    marginHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: adminColors.muted,
    lineHeight: 16,
    marginBottom: adminSpacing.sm,
  },
  footnoteText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },

  // Detail table and tabs
  cropDetailLabel: {
    fontSize: 13.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  cropDetailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F1A17',
  },
  historyEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    padding: 14,
    marginHorizontal: adminSpacing.md,
    marginBottom: 10,
  },
  historyEventTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F1A17',
    marginBottom: 2,
  },
  historyEventSub: {
    fontSize: 12.5,
    color: '#6B7280',
    marginBottom: 4,
  },
  historyEventRec: {
    fontSize: 12,
    color: '#8A7E75',
  },
  historyLockedCard: {
    borderWidth: 1,
    borderColor: '#EDE7E1',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: adminSpacing.md,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
    marginBottom: 14,
  },
  historyLockedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A4E45',
  },
  timeFilterRow: {
    flexDirection: 'row',
    marginHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    gap: 8,
  },
  timeFilterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: '#EDE7E1',
  },
  timeFilterBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  timeFilterText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  timeFilterTextActive: {
    color: adminColors.onBrand,
  },
  forecastRecordCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.muted,
    marginHorizontal: adminSpacing.md,
    marginBottom: 10,
  },

  // Harvest Forecast & Insights (Screen 1 & 2 of new prompt)
  forecastTabsContainer: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    padding: 4,
    marginHorizontal: adminSpacing.md,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  forecastTabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  forecastTabButtonActive: {
    backgroundColor: adminColors.brand,
  },
  forecastTabText: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  forecastTabTextActive: {
    color: adminColors.onBrand,
  },

  forecastCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    padding: adminSpacing.md,
    marginHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  forecastCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1A17',
    marginBottom: 2,
  },
  forecastCardSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7A6E65',
    marginBottom: 6,
  },
  forecastCardLine: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B3E36',
    marginBottom: 6,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  forecastBoldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1F1A17',
  },
  forecastBoldVal: {
    fontSize: 13.5,
    fontWeight: '400',
    color: '#2A201A',
  },
  forecastUnavailableText: {
    color: '#D9534F',
    fontWeight: '500',
  },
  forecastCardFooter: {
    fontSize: 12,
    color: '#8A7E75',
    marginTop: 6,
    fontWeight: '400',
  },

  // Trend Bars & Insights Metrics
  trendBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  trendBarLabel: {
    width: 46,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6E6259',
  },
  trendBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#EBE5DC',
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  trendBarFill: {
    height: '100%',
    backgroundColor: adminColors.brand,
    borderRadius: 5,
  },
  trendBarValue: {
    width: 76,
    textAlign: 'right',
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1F1A17',
  },

  cropBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  cropBarLabel: {
    width: 65,
    fontSize: 13,
    fontWeight: '600',
    color: '#4A3E36',
  },
  cropBarValue: {
    width: 76,
    textAlign: 'right',
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1F1A17',
  },

  trendTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  seasonalLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#3A2E26',
    flex: 1,
  },
  seasonalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F1A17',
  },
  plannedDiffValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1F1A17',
  },

  revenueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueEmptyBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E8E2D8',
    borderRadius: 14,
    paddingVertical: 26,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#FCFAF7',
  },
  revenueEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1A17',
    marginTop: 10,
  },
  revenueEmptyDesc: {
    fontSize: 13,
    color: '#7A6E65',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  exportReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    height: 50,
    marginHorizontal: adminSpacing.md,
    marginTop: adminSpacing.sm,
    marginBottom: 30,
    gap: 8,
  },
  exportReportButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: adminColors.onBrand,
  },

  // Export Crop Records Modal (Image 5)
  exportModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: adminSpacing.lg,
    paddingBottom: 36,
  },
  exportModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F1A17',
    marginBottom: adminSpacing.md,
  },
  exportInfoBox: {
    borderWidth: 1,
    borderColor: '#EBE4D8',
    borderRadius: 14,
    padding: adminSpacing.md,
    backgroundColor: '#FFFFFF',
  },
  exportInfoLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#7A6E65',
  },
  exportInfoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F1A17',
  },
  exportFootnote: {
    fontSize: 12.5,
    color: '#7A6E65',
    marginTop: 14,
    marginBottom: 20,
    lineHeight: 18,
  },
  exportActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  exportBtnOutline: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DED6CB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  exportBtnOutlineText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },

  // Crop History & Records (New Mockup)
  comparePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E2D8',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    height: 46,
    marginHorizontal: adminSpacing.md,
    marginBottom: 12,
    gap: 8,
  },
  comparePillButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  historyCyclesCount: {
    fontSize: 13,
    color: adminColors.muted,
    marginHorizontal: adminSpacing.md,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    padding: adminSpacing.md,
    marginHorizontal: adminSpacing.md,
    marginBottom: 12,
  },
  historyCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1A17',
  },
  harvestedBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  harvestedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  historyCardMeta: {
    fontSize: 12.5,
    color: '#6B7280',
    marginBottom: 3,
    lineHeight: 18,
  },
  historyCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 20,
  },
  historyActionLink: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Compare Modal
  compareTableBox: {
    borderWidth: 1,
    borderColor: '#EBE4D8',
    borderRadius: 14,
    padding: adminSpacing.md,
    backgroundColor: '#FFFFFF',
  },
  compareTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  compareColHeader: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1F1A17',
    textAlign: 'center',
  },
  compareRowLabel: {
    width: 85,
    fontSize: 12.5,
    color: '#6B7280',
    fontWeight: '500',
  },
  compareRowValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#1F1A17',
    textAlign: 'center',
  },
  exportDetailsBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  exportDetailsBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brand,
  },
});
