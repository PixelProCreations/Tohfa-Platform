/**
 * The "Audits" / "Audit Calendar" month view (design: currentView 'calendar',
 * calendarViewMode 'Month'). Dots and day cards come from GET /admin/audits
 * for the shown IST month.
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import type { AuditSummaryDto } from '../../../api/audits';
import { adminColors, adminSpacing } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { formatAdminDay, formatAdminTime } from '../../../utils/datetime';
import { AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import { ds, type DashScheduleKey } from './i18n';
import {
  BackArrowIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockHistoryIcon,
  HeaderBellIcon,
  HeaderCalendarIcon,
  ReportDocIcon,
} from './icons';
import {
  STATUS_FILTERS,
  TYPE_FILTERS,
  auditorOf,
  auditsOnDay,
  badgeKeyOf,
  cycle,
  dayMarker,
  distinctZones,
  monthListQuery,
  mondayFirstWeeks,
  orDash,
  shiftMonth,
  typeKeyOf,
  type StatusFilter,
  type TypeFilter,
} from './scheduleFormat';
import { scheduleStyles as styles } from './scheduleStyles';
import { sharedStyles } from './sharedStyles';
import { useFieldVisitKpis, useLatestCompletedAudit, useWholeList } from './useScheduleData';

export interface CalendarState {
  year: number;
  /** 0-11 */
  month: number;
  day: number;
  type: TypeFilter;
  status: StatusFilter;
  /** null = All Zones. */
  zoneId: string | null;
}

export interface CalendarMonthViewProps {
  fieldVisitMode: boolean;
  isTabRoot: boolean;
  now: Date;
  state: CalendarState;
  onStateChange: (next: CalendarState) => void;
  onBack: () => void;
  onOpenNotifications?: (() => void) | undefined;
  onOpenList: () => void;
  onOpenAudit: (audit: AuditSummaryDto) => void;
  onOpenHistory: () => void;
  onOpenReport: (audit: AuditSummaryDto) => void;
}

const TYPE_CARD_KEY: Record<TypeFilter, DashScheduleKey> = {
  all: 'admin.audits.dashSchedule.cal.allTypes',
  internal: 'admin.audits.dashSchedule.filter.type.internal',
  external: 'admin.audits.dashSchedule.filter.type.external',
  fieldVisit: 'admin.audits.dashSchedule.filter.type.fieldVisit',
};
const STATUS_CARD_KEY: Record<StatusFilter, DashScheduleKey> = {
  all: 'admin.audits.dashSchedule.cal.allStatus',
  upcoming: 'admin.audits.dashSchedule.filter.status.upcoming',
  scheduled: 'admin.audits.dashSchedule.filter.status.scheduled',
  inProgress: 'admin.audits.dashSchedule.filter.status.inProgress',
};

export function monthName(month: number): string {
  return ds(`admin.audits.dashSchedule.month.${month}` as DashScheduleKey);
}

function countLabel(n: number): string {
  if (n === 0) return ds('admin.audits.dashSchedule.cal.countNone');
  if (n === 1) return ds('admin.audits.dashSchedule.cal.countOne');
  return ds('admin.audits.dashSchedule.cal.countMany', { count: n });
}

function KpiValue({ value }: { value: number | null }) {
  return <Text style={styles.kpiValue}>{value === null ? ADMIN_NO_VALUE : String(value)}</Text>;
}

function FieldVisitKpiGrid({ now, onOpenList }: { now: Date; onOpenList: () => void }) {
  const kpis = useFieldVisitKpis(true, now);
  const cards: { label: DashScheduleKey; value: number | null }[] = [
    { label: 'admin.audits.dashSchedule.kpi.upcoming', value: kpis.upcoming },
    { label: 'admin.audits.dashSchedule.kpi.today', value: kpis.today },
    { label: 'admin.audits.dashSchedule.kpi.pending', value: kpis.pending },
    { label: 'admin.audits.dashSchedule.kpi.completed', value: kpis.completed },
  ];
  return (
    <View style={styles.kpiGrid}>
      {cards.map((c) => (
        <TouchableOpacity key={c.label} style={styles.kpiCard} onPress={onOpenList} activeOpacity={0.7}>
          <Text style={styles.kpiLabel}>{ds(c.label)}</Text>
          <KpiValue value={c.value} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function FieldVisitDayCard({ audit, onPress }: { audit: AuditSummaryDto; onPress: () => void }) {
  const typeKey = typeKeyOf(audit.auditType);
  return (
    <TouchableOpacity style={styles.calAuditCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.calAuditCardTopRow}>
        <Text style={styles.calAuditCardTitle}>{ds(`admin.audits.dashSchedule.typeTitle.${typeKey}`)}</Text>
        <View style={styles.calAuditBadgeScheduled}>
          <Text style={styles.calAuditBadgeScheduledText}>
            {ds(`admin.audits.dashSchedule.badge.${badgeKeyOf(audit.status)}`)}
          </Text>
        </View>
      </View>
      <Text style={styles.calAuditCardSubtitle}>
        {ds('admin.audits.dashSchedule.cal.faCardSubtitle', {
          farmer: orDash(audit.farmerName),
          type: ds(`admin.audits.dashSchedule.type.${typeKey}`),
        })}
      </Text>
      <Text style={styles.calAuditCardDate}>{orDash(formatAdminDay(audit.scheduledFor))}</Text>
    </TouchableOpacity>
  );
}

function AdminDayCard({ audit, onOpen }: { audit: AuditSummaryDto; onOpen: () => void }) {
  const typeKey = typeKeyOf(audit.auditType);
  return (
    <TouchableOpacity style={styles.calAuditCard} onPress={onOpen} activeOpacity={0.85}>
      <View style={styles.calAuditCardTopRow}>
        <Text style={styles.calAuditCardTitle}>{ds(`admin.audits.dashSchedule.typeTitle.${typeKey}`)}</Text>
        <View style={styles.calAuditBadgeBlue}>
          <Text style={styles.calAuditBadgeBlueText}>{ds(`admin.audits.dashSchedule.badge.${badgeKeyOf(audit.status)}`)}</Text>
        </View>
      </View>
      <Text style={styles.calAuditCardSubtitle}>
        {ds('admin.audits.dashSchedule.cal.cardSubtitle', { farmer: orDash(audit.farmerName), farm: orDash(audit.farmName) })}
      </Text>
      <Text style={styles.calAuditCardMeta}>
        {ds('admin.audits.dashSchedule.cal.cardMeta', {
          type: ds(`admin.audits.dashSchedule.typeTitle.${typeKey}`),
          date: orDash(formatAdminDay(audit.scheduledFor)),
          time: orDash(formatAdminTime(audit.scheduledFor)),
        })}
      </Text>
      <Text style={styles.calAuditCardMeta}>
        {ds('admin.audits.dashSchedule.cal.cardAuditor', { auditor: auditorOf(audit), zone: orDash(audit.zoneName) })}
      </Text>
      <TouchableOpacity style={styles.calViewDetailsBtn} onPress={onOpen} activeOpacity={0.7}>
        <Text style={styles.calViewDetailsText}>{ds('admin.audits.dashSchedule.cal.viewDetails')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function CalendarMonthView(props: CalendarMonthViewProps) {
  const { fieldVisitMode, isTabRoot, now, state, onStateChange } = props;
  const query = useMemo(
    () => monthListQuery(state.year, state.month, fieldVisitMode ? 'all' : state.type, fieldVisitMode ? 'all' : state.status, now),
    [state.year, state.month, state.type, state.status, fieldVisitMode, now],
  );
  const list = useWholeList(query);
  const latestCompleted = useLatestCompletedAudit(fieldVisitMode);

  const zones = useMemo(() => distinctZones(list.items), [list.items]);
  const visible = useMemo(
    () => (state.zoneId === null || fieldVisitMode ? list.items : list.items.filter((a) => a.zoneId === state.zoneId)),
    [list.items, state.zoneId, fieldVisitMode],
  );
  const weeks = useMemo(() => mondayFirstWeeks(state.year, state.month), [state.year, state.month]);
  const onSelectedDay = auditsOnDay(visible, state.year, state.month, state.day);
  const zoneName = state.zoneId === null ? null : (zones.find((z) => z.id === state.zoneId)?.name ?? null);

  const goMonth = (delta: number) => {
    const next = shiftMonth(state.year, state.month, delta);
    onStateChange({ ...state, ...next, day: 1 });
  };
  const cycleZone = () => {
    const ids: (string | null)[] = [null, ...zones.map((z) => z.id)];
    onStateChange({ ...state, zoneId: cycle(ids, state.zoneId) });
  };

  return (
    <SafeAreaView style={styles.calRoot}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.calHeader}>
        <View style={styles.calHeaderTopRow}>
          {fieldVisitMode && isTabRoot ? (
            <View style={local.headerRowTight}>
              <HeaderCalendarIcon size={22} color={adminColors.onBrand} />
              <Text style={styles.calHeaderTitle}>{ds('admin.audits.dashSchedule.header.audits')}</Text>
            </View>
          ) : (
            <View style={local.headerRowWide}>
              <TouchableOpacity
                onPress={props.onBack}
                style={sharedStyles.headerBackBtn}
                activeOpacity={0.7}
                accessibilityLabel={ds('admin.audits.dashSchedule.a11y.back')}
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.calHeaderTitle}>
                {fieldVisitMode
                  ? ds('admin.audits.dashSchedule.header.audits')
                  : ds('admin.audits.dashSchedule.header.auditCalendar')}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.calBellBtn}
            onPress={props.onOpenNotifications}
            disabled={props.onOpenNotifications === undefined}
            activeOpacity={0.8}
            accessibilityLabel={ds('admin.audits.dashSchedule.a11y.notifications')}
          >
            <HeaderBellIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={sharedStyles.scroll} contentContainerStyle={local.scrollPad} showsVerticalScrollIndicator={false}>
        {fieldVisitMode ? (
          <FieldVisitKpiGrid now={now} onOpenList={props.onOpenList} />
        ) : (
          <View style={styles.calFiltersRow}>
            <TouchableOpacity
              style={styles.calFilterCard}
              onPress={() => onStateChange({ ...state, type: cycle(TYPE_FILTERS, state.type) })}
              activeOpacity={0.8}
            >
              <Text style={styles.calFilterLabel}>{ds('admin.audits.dashSchedule.cal.auditTypeLabel')}</Text>
              <Text style={styles.calFilterValue} numberOfLines={1}>
                {ds(TYPE_CARD_KEY[state.type])}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.calFilterCard}
              onPress={() => onStateChange({ ...state, status: cycle(STATUS_FILTERS, state.status) })}
              activeOpacity={0.8}
            >
              <Text style={styles.calFilterLabel}>{ds('admin.audits.dashSchedule.cal.statusLabel')}</Text>
              <Text style={styles.calFilterValue} numberOfLines={1}>
                {ds(STATUS_CARD_KEY[state.status])}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.calFilterCard} onPress={cycleZone} activeOpacity={0.8}>
              <Text style={styles.calFilterLabel}>{ds('admin.audits.dashSchedule.cal.zoneLabel')}</Text>
              <Text style={styles.calFilterValue} numberOfLines={1}>
                {zoneName ?? ds('admin.audits.dashSchedule.cal.allZones')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.calMonthNav}>
          <TouchableOpacity style={styles.calMonthNavBtn} onPress={() => goMonth(-1)} activeOpacity={0.7}>
            <ChevronLeftIcon size={18} color={adminColors.muted} />
          </TouchableOpacity>
          <Text style={styles.calMonthNavTitle}>
            {ds('admin.audits.dashSchedule.cal.monthYear', { month: monthName(state.month), year: state.year })}
          </Text>
          <TouchableOpacity style={styles.calMonthNavBtn} onPress={() => goMonth(1)} activeOpacity={0.7}>
            <ChevronRightIcon size={18} color={adminColors.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.calWeekdaysRow}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Text key={i} style={styles.calWeekdayText}>
              {ds(`admin.audits.dashSchedule.cal.weekday.${i}` as DashScheduleKey)}
            </Text>
          ))}
        </View>

        <View style={styles.calGridContainer}>
          {weeks.map((week, wIdx) => (
            <View key={`week-${wIdx}`} style={styles.calGridWeekRow}>
              {week.map((day, dIdx) => {
                if (day === null) return <View key={`empty-${wIdx}-${dIdx}`} style={styles.calGridDayCellEmpty} />;
                const isSelected = state.day === day;
                const marker = dayMarker(auditsOnDay(visible, state.year, state.month, day));
                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={[styles.calGridDayCell, isSelected && styles.calGridDayCellSelected]}
                    onPress={() => onStateChange({ ...state, day })}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.calGridDayText, isSelected && styles.calGridDayTextSelected]}>{day}</Text>
                    {isSelected ? (
                      <View style={[styles.calDotSingle, local.dotSelected]} />
                    ) : marker === 'completed' ? (
                      <View style={[styles.calDotSingle, local.dotCompleted]} />
                    ) : marker === 'multi' ? (
                      <View style={styles.calDotsRow}>
                        <View style={styles.calDotMini} />
                        <View style={styles.calDotMini} />
                        <View style={styles.calDotMini} />
                      </View>
                    ) : marker === 'active' ? (
                      <View style={[styles.calDotSingle, local.dotActive]} />
                    ) : marker === 'cancelled' ? (
                      <View style={[styles.calDotSingle, local.dotCancelled]} />
                    ) : (
                      <View style={local.dotSpacer} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.calSelectedDateSection}>
          {fieldVisitMode ? (
            <View style={styles.fieldVisitHeaderRow}>
              <Text style={styles.fieldVisitHeaderTitle}>{ds('admin.audits.dashSchedule.cal.fieldVisit')}</Text>
              <TouchableOpacity onPress={props.onOpenList} activeOpacity={0.7} hitSlop={HIT_SLOP}>
                <Text style={styles.fieldVisitViewAllText}>{ds('admin.audits.dashSchedule.cal.viewAll')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <Text style={styles.calSelectedDateTitle}>
            {ds('admin.audits.dashSchedule.cal.selectedDate', { day: state.day, month: monthName(state.month), year: state.year })}
          </Text>
          <Text style={styles.calSelectedDateCount}>
            {list.isLoading || list.error ? ADMIN_NO_VALUE : countLabel(onSelectedDay.length)}
          </Text>

          {list.isLoading && list.items.length === 0 ? <AdminLoadingState /> : null}
          {list.error !== null && list.error !== undefined && list.items.length === 0 ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}

          {fieldVisitMode ? (
            <>
              {onSelectedDay.map((audit) => (
                <FieldVisitDayCard key={audit.id} audit={audit} onPress={() => props.onOpenAudit(audit)} />
              ))}
              <View style={styles.quickActionsSection}>
                <Text style={styles.quickActionsTitle}>{ds('admin.audits.dashSchedule.cal.quickActions')}</Text>
                <View style={styles.quickActionsRow}>
                  <TouchableOpacity style={styles.quickActionBtn} onPress={props.onOpenHistory} activeOpacity={0.8}>
                    <ClockHistoryIcon size={24} color={adminColors.brand} />
                    <Text style={styles.quickActionBtnText}>{ds('admin.audits.dashSchedule.cal.auditHistory')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={() => {
                      if (latestCompleted !== undefined) props.onOpenReport(latestCompleted);
                    }}
                    disabled={latestCompleted === undefined}
                    activeOpacity={0.8}
                  >
                    <ReportDocIcon size={24} color={adminColors.brand} />
                    <Text style={styles.quickActionBtnText}>{ds('admin.audits.dashSchedule.cal.reports')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            onSelectedDay.map((audit) => <AdminDayCard key={audit.id} audit={audit} onOpen={() => props.onOpenAudit(audit)} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const HIT_SLOP = { top: adminSpacing.smMd, bottom: adminSpacing.smMd, left: adminSpacing.smMd, right: adminSpacing.smMd };

const local = StyleSheet.create({
  headerRowTight: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.smMd },
  headerRowWide: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  scrollPad: { paddingBottom: 110 },
  dotSelected: { backgroundColor: adminColors.card },
  dotCompleted: { backgroundColor: adminColors.success.text },
  dotActive: { backgroundColor: adminColors.brand },
  dotCancelled: { backgroundColor: adminColors.muted },
  dotSpacer: { height: 6 },
});
