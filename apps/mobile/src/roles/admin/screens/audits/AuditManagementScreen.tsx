/**
 * Audit Management home, ported from the design
 * (origin/Superadmin-main screens/audits/AuditManagementScreen.tsx) and wired:
 *   - KPI tiles: GET /admin/audits/compliance `counts` (./AuditManagementFormat.ts
 *     says which count fills which tile; a tile with no count shows the dash);
 *   - calendar + day list: GET /admin/audits for the visible IST month,
 *     ascending, every page loaded so each day's markers are complete.
 *
 * Data hooks run only in LiveAuditManagement, which is mounted only for a
 * caller holding audit.view: useAuditCompliance has no `enabled` flag, so the
 * gate is "do not mount". Without it the same layout renders with dashes.
 * Every action is authorised again on the server (root CLAUDE.md 2.1).
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { tokens } from '@tohfa/design-tokens';
import type { AuditComplianceCountsDto, AuditSummaryDto } from '../../api/audits';
import { OverviewCardsGrid, OverviewDashboardCard } from '../../components/OverviewDashboardCard';
import type { Can } from '../../permissions/can';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import {
  auditBadge,
  auditKpiTiles,
  auditRowDetails,
  auditRowTitle,
  auditsOnDay,
  CALENDAR_STATUSES,
  dayHeading,
  dayMarkers,
  istToday,
  monthCells,
  monthRange,
  monthTitle,
  shiftMonth,
  tm,
  type AuditBadgeTone,
  type AuditMgmtKey,
  type CalendarMonth,
  type DayMarker,
} from './AuditManagementFormat';
import { useAuditCompliance, useAuditList, type AuditListFilters } from './useAuditsData';

export type { DayMarker } from './AuditManagementFormat';

// ─── Header & Section SVG Icons Matching Exact Design Mockup ──────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
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

/** The design card's 'clipboard' icon; the local OverviewDashboardCard has no such built-in. */
function KpiClipboardIcon({ color = adminColors.brandDeep }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="2.5" stroke={color} strokeWidth="1.9" />
      <Path d="M9 2.5h6a1 1 0 0 1 1 1V5H8V3.5a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
      <Path d="M8.5 13l2.5 2.5 5-5" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
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

/** One row of the selected day's list: the API row plus nothing invented. */
export type DayAuditItem = AuditSummaryDto;

/** docs/rbac.json codes behind each control. */
export const AUDIT_MANAGEMENT_CODES = {
  view: 'audit.view',
  generateReport: 'audit.report.generate',
} as const;

export interface AuditManagementScreenProps {
  /** Fail closed: without it nothing is fetched and every action is disabled. */
  can?: Can | undefined;
  onBack?: (() => void) | undefined;
  onOpenSchedule?: (() => void) | undefined;
  onOpenHistory?: (() => void) | undefined;
  onOpenGenerateReport?: (() => void) | undefined;
  onOpenReportHistory?: (() => void) | undefined;
  /** Gets the API row; open the detail with `audit.id`. */
  onSelectAuditItem?: ((audit: AuditSummaryDto) => void) | undefined;
  onRefresh?: (() => void) | undefined;
  /** Accepted for the flow's call shape; never used to decide anything (gating is `can`). */
  role?: string | undefined;
  onNavigateSchedule?: ((preFilter: AuditListFilters | undefined, auditId: string | undefined) => void) | undefined;
  onOpenNotifications?: (() => void) | undefined;
  /** Clock for "past scheduled date" and the initial month; tests pass a fixed one. */
  now?: Date | undefined;
}

export function AuditManagementScreen(props: AuditManagementScreenProps) {
  const canView = props.can?.(AUDIT_MANAGEMENT_CODES.view) === true;
  const now = useMemo(() => props.now ?? new Date(), [props.now]);
  const [month, setMonth] = useState<CalendarMonth>(() => istToday(now));
  const [selectedDay, setSelectedDay] = useState<number>(() => istToday(now).day);

  const changeMonth = (delta: number) => {
    setMonth((m) => shiftMonth(m, delta));
    setSelectedDay(1);
  };

  const shared = { props, now, month, selectedDay, onSelectDay: setSelectedDay, onChangeMonth: changeMonth, canView };
  return canView ? <LiveAuditManagement {...shared} /> : <AuditManagementLayout {...shared} data={NO_DATA} />;
}

interface LayoutData {
  counts: AuditComplianceCountsDto | undefined;
  complianceError: unknown;
  onRetryCompliance: (() => void) | undefined;
  audits: AuditSummaryDto[];
  auditsLoading: boolean;
  auditsError: unknown;
  onRetryAudits: (() => void) | undefined;
}

const NO_DATA: LayoutData = {
  counts: undefined,
  complianceError: null,
  onRetryCompliance: undefined,
  audits: [],
  auditsLoading: false,
  auditsError: null,
  onRetryAudits: undefined,
};

interface SharedProps {
  props: AuditManagementScreenProps;
  now: Date;
  month: CalendarMonth;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onChangeMonth: (delta: number) => void;
  canView: boolean;
}

function LiveAuditManagement(shared: SharedProps) {
  const compliance = useAuditCompliance();
  const range = monthRange(shared.month);
  const list = useAuditList({
    status: CALENDAR_STATUSES,
    scheduledFrom: range.scheduledFrom,
    scheduledTo: range.scheduledTo,
    sort: 'scheduledFor',
    limit: 100,
  });

  // The markers must cover the whole month, so every page is fetched; loadMore
  // is a no-op while a page is already in flight.
  const { hasMore, loadMore } = list;
  useEffect(() => {
    if (hasMore) loadMore();
  }, [hasMore, list.items.length, loadMore]);

  const data: LayoutData = {
    counts: compliance.data?.counts,
    complianceError: compliance.error,
    onRetryCompliance: () => {
      void compliance.refetch();
    },
    audits: list.items,
    auditsLoading: list.isLoading,
    auditsError: list.error,
    onRetryAudits: list.refresh,
  };
  return <AuditManagementLayout {...shared} data={data} />;
}

const BADGE_COLORS: Record<AuditBadgeTone, { bg: string; text: string }> = {
  info: adminColors.info,
  danger: adminColors.danger,
  warning: adminColors.warning,
  success: adminColors.success,
};

const WEEKDAY_KEYS: AuditMgmtKey[] = [0, 1, 2, 3, 4, 5, 6].map((i) => `admin.audits.management.weekday.${i}` as const);

function AuditManagementLayout({
  props,
  now,
  month,
  selectedDay,
  onSelectDay,
  onChangeMonth,
  canView,
  data,
}: SharedProps & { data: LayoutData }) {
  const { can, onBack, onOpenSchedule, onOpenHistory, onOpenGenerateReport, onOpenReportHistory, onSelectAuditItem } = props;
  const canReport = can?.(AUDIT_MANAGEMENT_CODES.generateReport) === true;

  const kpiCards = auditKpiTiles(data.counts);
  const markers: Record<number, DayMarker> = useMemo(() => dayMarkers(data.audits, month), [data.audits, month]);
  const calendarCells = monthCells(month);
  const selectedDate = useMemo(() => ({ ...month, day: selectedDay }), [month, selectedDay]);
  const dayAudits = useMemo(() => auditsOnDay(data.audits, selectedDate), [data.audits, selectedDate]);

  const quickActions: Array<{ key: AuditMgmtKey; icon: React.ReactNode; onPress: (() => void) | undefined; allowed: boolean }> = [
    { key: 'admin.audits.management.quick.schedule', icon: <ActionCalendarIcon />, onPress: onOpenSchedule, allowed: canView },
    { key: 'admin.audits.management.quick.history', icon: <ActionHistoryIcon />, onPress: onOpenHistory, allowed: canView },
    { key: 'admin.audits.management.quick.generateReport', icon: <ActionReportDocIcon />, onPress: onOpenGenerateReport, allowed: canReport },
    { key: 'admin.audits.management.quick.reportHistory', icon: <ActionHistoryIcon />, onPress: onOpenReportHistory, allowed: canView },
  ];

  const renderDayList = () => {
    if (!canView) return <AdminEmptyState title={tm('admin.audits.management.day.noAccess')} />;
    if (dayAudits.length === 0) {
      if (data.auditsLoading) return <AdminLoadingState />;
      if (data.auditsError !== null && data.auditsError !== undefined) {
        return <AdminErrorState error={data.auditsError} onRetry={data.onRetryAudits} />;
      }
      return <AdminEmptyState title={tm('admin.audits.management.day.empty')} />;
    }
    return dayAudits.map((item) => {
      const badge = auditBadge(item, now);
      const colors = BADGE_COLORS[badge.tone];
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.auditItemCard}
          onPress={() => onSelectAuditItem?.(item)}
          disabled={onSelectAuditItem === undefined}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <View style={styles.auditItemTopRow}>
            <Text style={styles.auditItemCodeTitle} numberOfLines={1}>
              {auditRowTitle(item)}
            </Text>
            <View style={[styles.auditBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.auditBadgeText, { color: colors.text }]}>{tm(badge.labelKey)}</Text>
            </View>
          </View>
          <Text style={styles.auditItemDetails} numberOfLines={2}>
            {auditRowDetails(item)}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner ── */}
      <View style={styles.headerBanner}>
        {onBack ? (
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tm('admin.audits.management.header.back')}
          >
            <BackArrowIcon />
          </TouchableOpacity>
        ) : null}

        <View style={styles.headerLeftCol}>
          <Text style={styles.headerTitle}>{tm('admin.audits.management.header.title')}</Text>
          <Text style={styles.headerSubtitle}>{tm('admin.audits.management.header.subtitle')}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── 1. Top 6 KPI Metric Cards ── */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          {kpiCards.map((kpi) => (
            <OverviewDashboardCard
              key={kpi.id}
              value={kpi.value}
              title={tm(kpi.labelKey)}
              icon={kpi.icon === 'clipboard' ? <KpiClipboardIcon /> : kpi.icon}
              tone={kpi.tone}
              titlePosition="bottom"
            />
          ))}
        </OverviewCardsGrid>
        {data.counts === undefined && data.complianceError !== null && data.complianceError !== undefined ? (
          <AdminErrorState error={data.complianceError} onRetry={data.onRetryCompliance} />
        ) : null}

        {/* ── 2. Calendar Widget ── */}
        <View style={styles.calendarCard}>
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              style={styles.monthArrowBtn}
              activeOpacity={0.7}
              onPress={() => onChangeMonth(-1)}
              accessibilityRole="button"
              accessibilityLabel={tm('admin.audits.management.calendar.prevMonth')}
            >
              <ChevronLeftIcon />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>{monthTitle(month)}</Text>

            <TouchableOpacity
              style={styles.monthArrowBtn}
              activeOpacity={0.7}
              onPress={() => onChangeMonth(1)}
              accessibilityRole="button"
              accessibilityLabel={tm('admin.audits.management.calendar.nextMonth')}
            >
              <ChevronRightIcon />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_KEYS.map((key) => (
              <View key={key} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{tm(key)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarCells.map((dayNum, cellIdx) => {
              if (dayNum === null) {
                return <View key={`empty-${cellIdx}`} style={styles.dayCellEmpty} />;
              }
              const isSelected = selectedDay === dayNum;
              const marker = markers[dayNum];
              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => onSelectDay(dayNum)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>{dayNum}</Text>
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

        {/* ── 3. Selected Date Audits ── */}
        <Text style={styles.sectionHeaderTitle}>{dayHeading(selectedDate)}</Text>
        <View style={styles.dayAuditsList}>{renderDayList()}</View>

        {/* ── 4. Quick Actions (2x2 Grid) ── */}
        <Text style={styles.sectionHeaderTitle}>{tm('admin.audits.management.quick.title')}</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => {
            const enabled = action.allowed && action.onPress !== undefined;
            return (
              <TouchableOpacity
                key={action.key}
                style={[styles.actionCard, !action.allowed && styles.actionCardDisabled]}
                onPress={enabled ? action.onPress : undefined}
                disabled={!enabled}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ disabled: !enabled }}
              >
                <View style={styles.actionIconBox}>{action.icon}</View>
                <Text style={styles.actionTitle}>{tm(action.key)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Literals moved onto tokens: 6 = xsSm, 8 = sm, 4 = xs; 36 = xl + md (header
// back button), 32 = xxl, 40 = xxxl - sm (day cell), 98 = 2 x xxxl + 2 (action
// tile). Font sizes the admin type styles lack come from the platform type
// styles: 15 -> body (14), 12 -> small, 11 -> caption, 13.5 -> admin body (13),
// 22 -> admin title (19).
const half = adminSpacing.xs / 2;
const DOT = adminSpacing.xs;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
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
    width: adminSpacing.xl + adminSpacing.md,
    height: adminSpacing.xl + adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.xsSm,
  },
  headerLeftCol: { flex: 1 },
  headerTitle: { ...adminType.title, color: adminColors.onBrand, letterSpacing: -0.3 },
  headerSubtitle: { ...adminType.rowTitle, fontWeight: '700', color: adminColors.onBrand, opacity: 0.9, marginTop: half },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },
  kpiGrid: { marginBottom: adminSpacing.sm },

  calendarCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
    marginBottom: adminSpacing.lg,
  },
  monthNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.sm },
  monthArrowBtn: {
    width: adminSpacing.xxl,
    height: adminSpacing.xxl,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    ...adminType.sectionHead,
    fontSize: tokens.typeStyle.body.size,
    lineHeight: tokens.typeStyle.body.lineHeight,
    color: adminColors.brandDeep,
  },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: adminSpacing.xs, paddingHorizontal: half },
  weekdayCell: { width: '13.5%', alignItems: 'center' },
  weekdayText: {
    fontSize: tokens.typeStyle.small.size,
    lineHeight: tokens.typeStyle.small.lineHeight,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: adminSpacing.sm },
  dayCellEmpty: { width: '13.5%', height: adminSpacing.xxxl - adminSpacing.sm },
  dayCell: {
    width: '13.5%',
    height: adminSpacing.xxxl - adminSpacing.sm,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: half,
  },
  dayCellSelected: { borderColor: adminColors.brand, borderWidth: 1.8 },
  dayNumber: { fontSize: adminType.rowTitle.fontSize, fontWeight: '700', color: adminColors.ink },
  dayNumberSelected: { fontWeight: '800', color: adminColors.ink },
  markerContainer: { height: adminSpacing.xsSm, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  dotRow: { flexDirection: 'row', alignItems: 'center', columnGap: 2.5 },
  orangeDot: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: adminColors.brand },
  blueDot: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: adminColors.info.text },
  greenRing: { width: 5.5, height: 5.5, borderRadius: 3, borderWidth: 1.2, borderColor: adminColors.success.text },

  sectionHeaderTitle: {
    ...adminType.sectionHead,
    fontSize: tokens.typeStyle.body.size,
    lineHeight: tokens.typeStyle.body.lineHeight,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  dayAuditsList: { rowGap: adminSpacing.sm, marginBottom: adminSpacing.lg },
  auditItemCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  auditItemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.xs },
  auditItemCodeTitle: {
    ...adminType.rowTitle,
    fontSize: adminType.body.fontSize,
    color: adminColors.ink,
    flex: 1,
    marginRight: adminSpacing.xsSm,
  },
  auditBadge: { borderRadius: adminRadius.sm, paddingHorizontal: adminSpacing.sm, paddingVertical: half + 1 },
  auditBadgeText: { ...adminType.caption, fontSize: adminType.rowMeta.fontSize },
  auditItemDetails: {
    ...adminType.rowMeta,
    fontSize: tokens.typeStyle.caption.size,
    lineHeight: adminType.rowMeta.lineHeight + 1,
    color: adminColors.muted,
  },

  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: adminSpacing.md },
  actionCard: {
    width: '48.5%',
    height: adminSpacing.xxxl * 2 + half,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  actionCardDisabled: { opacity: 0.5 },
  actionIconBox: { marginBottom: adminSpacing.xsSm, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { ...adminType.rowTitle, fontWeight: '700', color: adminColors.ink, textAlign: 'center' },
});
