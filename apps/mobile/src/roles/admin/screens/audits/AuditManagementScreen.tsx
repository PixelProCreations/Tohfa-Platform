import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── Header & Section SVG Icons Matching Exact Design Mockup ──────────────────

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

function SearchHeaderIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function BellHeaderIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RefreshHeaderIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.5 2v6h-6M2.5 22v-6h6M20.5 13A8.5 8.5 0 0 1 5.3 17.7L2.5 16M3.5 11a8.5 8.5 0 0 1 15.2-4.7l2.8 1.7"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Quick Actions SVG Icons ──────────────────────────────────────────────────

function ActionCalendarIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="2.5" stroke={color} strokeWidth="1.9" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.9" />
      {/* 2x3 Grid of calendar date dots matching mock */}
      <Circle cx="8" cy="13" r="1.1" fill={color} />
      <Circle cx="12" cy="13" r="1.1" fill={color} />
      <Circle cx="16" cy="13" r="1.1" fill={color} />
      <Circle cx="8" cy="17" r="1.1" fill={color} />
      <Circle cx="12" cy="17" r="1.1" fill={color} />
      <Circle cx="16" cy="17" r="1.1" fill={color} />
    </Svg>
  );
}

function ActionHistoryIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ActionReportDocIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
      <Line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="8" y1="17" x2="13" y2="17" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data Types ───────────────────────────────────────────────────────────────

export interface AuditKpiItem {
  value: string;
  label: string;
}

export interface DayMarker {
  hasOrangeDot?: boolean;
  hasBlueDot?: boolean;
  hasGreenRing?: boolean;
}

export interface DayAuditItem {
  id: string;
  code: string;
  farmerName: string;
  farmerId?: string;
  badge: 'Scheduled' | 'Past scheduled date' | 'Completed' | 'In Progress';
  farmDetails: string;
}

export interface AuditManagementScreenProps {
  onBack?: () => void;
  onOpenSchedule?: () => void;
  onOpenHistory?: () => void;
  onOpenGenerateReport?: () => void;
  onOpenReportHistory?: () => void;
  onSelectAuditItem?: (audit: DayAuditItem) => void;
  onRefresh?: () => void;
}

export function AuditManagementScreen({
  onBack,
  onOpenSchedule,
  onOpenHistory,
  onOpenGenerateReport,
  onOpenReportHistory,
  onSelectAuditItem,
  onRefresh,
}: AuditManagementScreenProps) {
  const [selectedDay, setSelectedDay] = useState<number>(9);
  const [selectedMonth] = useState('October 2026');

  // 6 KPI Metric Cards matching Reference Image 1 Top
  const kpiCards: AuditKpiItem[] = [
    { value: '6', label: 'Upcoming Audits' },
    { value: '1', label: 'Audits In Progress' },
    { value: '2', label: 'Pending Review' },
    { value: '32', label: 'Completed Audits' },
    { value: '17', label: 'Corrective Actions (open)' },
    { value: '5', label: 'Compliance Alerts' },
  ];

  // Calendar Day Markers matching Image 1
  const dayMarkers: Record<number, DayMarker> = {
    1: { hasBlueDot: true, hasOrangeDot: true },
    3: { hasOrangeDot: true },
    6: { hasBlueDot: true, hasOrangeDot: true },
    7: { hasOrangeDot: true },
    9: { hasOrangeDot: true },
    14: { hasOrangeDot: true },
    20: { hasGreenRing: true },
    21: { hasGreenRing: true },
    31: { hasGreenRing: true },
  };

  // Calendar Days layout for October 2026 (Oct 1 = Thursday -> column 4)
  // 3 empty cells before 1, days 1 to 31, then 1 empty cell to complete week
  const calendarCells = [
    null, null, null,
    1, 2, 3, 4,
    5, 6, 7, 8, 9, 10, 11,
    12, 13, 14, 15, 16, 17, 18,
    19, 20, 21, 22, 23, 24, 25,
    26, 27, 28, 29, 30, 31,
    null,
  ];

  // Scheduled audits on selected date (09 Oct 2026) matching Reference Image 1 & 2
  const dayAudits: DayAuditItem[] = [
    {
      id: 'aud_1',
      code: 'AUD-2026-0053',
      farmerName: 'Selvi',
      farmerId: 'FMR-00131',
      badge: 'Scheduled',
      farmDetails: 'Coonoor farm · Zone A · Internal · 15 Oct 2026, 10:00 · Auditor: S. Mohan',
    },
    {
      id: 'aud_2',
      code: 'AUD-2026-0052',
      farmerName: 'Vijay',
      farmerId: 'FMR-00152',
      badge: 'Past scheduled date',
      farmDetails: 'Kotagiri farm · Zone C · External · 8 Oct 2026, 09:30 · Auditor: External agency',
    },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner Matching Reference Image 1 ── */}
      <View style={styles.headerBanner}>
        {onBack ? (
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon />
          </TouchableOpacity>
        ) : null}

        <View style={styles.headerLeftCol}>
          <Text style={styles.headerTitle}>Audit Management</Text>
          <Text style={styles.headerSubtitle}>TOHFA Admin · All zones</Text>
        </View>

        <View style={styles.headerRightCol}>
          {/* 1. Search Button */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Search audits"
          >
            <SearchHeaderIcon />
          </TouchableOpacity>

          {/* 2. Notification Bell with Badge '3' */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Notifications (3 unread)"
          >
            <BellHeaderIcon />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>3</Text>
            </View>
          </TouchableOpacity>

          {/* 3. Refresh Button */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={onRefresh}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Refresh audit data"
          >
            <RefreshHeaderIcon />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Top 6 KPI Metric Cards (2x3 Grid) Matching Image 1 ── */}
        <View style={styles.kpiGrid}>
          {kpiCards.map((kpi) => (
            <View key={kpi.label} style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        {/* ── 2. Interactive Calendar Widget Matching Image 1 ── */}
        <View style={styles.calendarCard}>
          {/* Month Navigation Row */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity style={styles.monthArrowBtn} activeOpacity={0.7}>
              <ChevronLeftIcon />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>{selectedMonth}</Text>

            <TouchableOpacity style={styles.monthArrowBtn} activeOpacity={0.7}>
              <ChevronRightIcon />
            </TouchableOpacity>
          </View>

          {/* Day of Week Row */}
          <View style={styles.weekdayRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <View key={`${day}-${idx}`} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Month Days Grid */}
          <View style={styles.daysGrid}>
            {calendarCells.map((dayNum, cellIdx) => {
              if (dayNum === null) {
                return <View key={`empty-${cellIdx}`} style={styles.dayCellEmpty} />;
              }

              const isSelected = selectedDay === dayNum;
              const marker = dayMarkers[dayNum];

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => setSelectedDay(dayNum)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                    {dayNum}
                  </Text>

                  {/* Marker Dots / Rings */}
                  <View style={styles.markerContainer}>
                    {marker?.hasGreenRing ? (
                      <View style={styles.greenRing} />
                    ) : (
                      <View style={styles.dotRow}>
                        {marker?.hasBlueDot ? <View style={styles.blueDot} /> : null}
                        {marker?.hasOrangeDot || isSelected ? <View style={styles.orangeDot} /> : null}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── 3. Selected Date Audits Section (09 Oct 2026) Matching Image 1 & 2 ── */}
        <Text style={styles.sectionHeaderTitle}>
          {selectedDay < 10 ? `0${selectedDay}` : selectedDay} Oct 2026
        </Text>

        <View style={styles.dayAuditsList}>
          {dayAudits.map((item) => {
            const isScheduled = item.badge === 'Scheduled';
            const badgeBg = isScheduled ? adminColors.info.bg : adminColors.danger.bg;
            const badgeTextColor = isScheduled ? adminColors.info.text : adminColors.danger.text;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.auditItemCard}
                onPress={() => onSelectAuditItem?.(item)}
                activeOpacity={0.75}
              >
                {/* Header Row */}
                <View style={styles.auditItemTopRow}>
                  <Text style={styles.auditItemCodeTitle} numberOfLines={1}>
                    {item.code} · {item.farmerName} {item.farmerId ? `(${item.farmerId})` : ''}
                  </Text>
                  <View style={[styles.auditBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.auditBadgeText, { color: badgeTextColor }]}>
                      {item.badge}
                    </Text>
                  </View>
                </View>

                {/* Subtitle / Details */}
                <Text style={styles.auditItemDetails} numberOfLines={2}>
                  {item.farmDetails}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 4. Quick Actions Section (2x2 Grid) Matching Image 2 ── */}
        <Text style={styles.sectionHeaderTitle}>Quick actions</Text>

        <View style={styles.quickActionsGrid}>
          {/* Action 1: View Audit Schedule */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onOpenSchedule}
            activeOpacity={0.75}
          >
            <View style={styles.actionIconBox}>
              <ActionCalendarIcon />
            </View>
            <Text style={styles.actionTitle}>View Audit Schedule</Text>
          </TouchableOpacity>

          {/* Action 2: View Audit History */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onOpenHistory}
            activeOpacity={0.75}
          >
            <View style={styles.actionIconBox}>
              <ActionHistoryIcon />
            </View>
            <Text style={styles.actionTitle}>View Audit History</Text>
          </TouchableOpacity>

          {/* Action 3: Generate Audit Report */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onOpenGenerateReport}
            activeOpacity={0.75}
          >
            <View style={styles.actionIconBox}>
              <ActionReportDocIcon />
            </View>
            <Text style={styles.actionTitle}>Generate Audit Report</Text>
          </TouchableOpacity>

          {/* Action 4: Report History */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onOpenReportHistory}
            activeOpacity={0.75}
          >
            <View style={styles.actionIconBox}>
              <ActionHistoryIcon />
            </View>
            <Text style={styles.actionTitle}>Report History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerLeftCol: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    ...adminType.caption,
    fontSize: 12.5,
    lineHeight: 16,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 2,
  },
  headerRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: adminColors.danger.text,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: adminColors.onBrand,
  },
  bellBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },

  // 1. KPI Cards Grid (2x3)
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    minHeight: 82,
    justifyContent: 'center',
  },
  kpiValue: {
    ...adminType.kpiValue,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    color: adminColors.ink,
    letterSpacing: -0.3,
  },
  kpiLabel: {
    ...adminType.caption,
    fontSize: 11.5,
    lineHeight: 15,
    color: adminColors.muted,
    fontWeight: '500',
    marginTop: 3,
  },

  // 2. Calendar Widget
  calendarCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
    marginBottom: adminSpacing.lg,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  monthArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    ...adminType.sectionHead,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
    paddingHorizontal: 2,
  },
  weekdayCell: {
    width: '13.5%',
    alignItems: 'center',
  },
  weekdayText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  dayCellEmpty: {
    width: '13.5%',
    height: 40,
  },
  dayCell: {
    width: '13.5%',
    height: 40,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayCellSelected: {
    borderColor: adminColors.brand,
    borderWidth: 1.8,
  },
  dayNumber: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  dayNumberSelected: {
    fontWeight: '800',
    color: adminColors.ink,
  },
  markerContainer: {
    height: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 2.5,
  },
  orangeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: adminColors.brand,
  },
  blueDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: adminColors.info.text,
  },
  greenRing: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    borderWidth: 1.2,
    borderColor: adminColors.success.text,
  },

  // 3. Date Audits Section
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  dayAuditsList: {
    rowGap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  auditItemCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  auditItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  auditItemCodeTitle: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
    flex: 1,
    marginRight: 6,
  },
  auditBadge: {
    borderRadius: adminRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  auditBadgeText: {
    ...adminType.caption,
    fontSize: 10.5,
    fontWeight: '700',
  },
  auditItemDetails: {
    ...adminType.rowMeta,
    fontSize: 11,
    lineHeight: 15,
    color: adminColors.muted,
  },

  // 4. Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
  },
  actionCard: {
    width: '48.5%',
    height: 98,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  actionIconBox: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    ...adminType.caption,
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'center',
  },
});
