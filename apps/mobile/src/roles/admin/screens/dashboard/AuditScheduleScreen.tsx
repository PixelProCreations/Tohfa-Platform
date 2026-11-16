/**
 * Audit Schedule (design: origin/Superadmin-main dashboard/AuditScheduleScreen.tsx):
 * the audit calendar, schedule list, filters, history, audit detail and report,
 * on GET /admin/audits (+ /compliance, /{id}, /{id}/report).
 *
 * The design switched layouts on a role string. Here the switch is the
 * permission that actually differs: without `audit.schedule` (docs/rbac.json:
 * Farmer Admin attends audits in a support capacity only) the viewer gets the
 * "field visit" layout (KPI cards, Field Visit Schedule, the permission
 * notice); with it, the scheduling layout (type/status/zone filter cards).
 *
 * The design's inspection screens (Inspection / Findings, Documents &
 * Findings, the 12-section inspection) are separate screens owned elsewhere;
 * the host opens them through `onOpenInspection`.
 */
import React, { useEffect, useState } from 'react';
import type { AuditSummaryDto } from '../../api/audits';
import { makeCan, type Can } from '../../permissions/can';
import { AuditDetailView } from './audit-schedule/AuditDetailView';
import { AuditDetailsM5View } from './audit-schedule/AuditDetailsM5View';
import { AuditReportView } from './audit-schedule/AuditReportView';
import { AuditTimelineView } from './audit-schedule/AuditTimelineView';
import { CalendarMonthView, type CalendarState } from './audit-schedule/CalendarMonthView';
import { FiltersPageView } from './audit-schedule/FiltersPageView';
import { HistoryView, defaultHistoryFilters } from './audit-schedule/HistoryView';
import { DEFAULT_SCHEDULE_FILTERS, ScheduleListView } from './audit-schedule/ScheduleListView';
import { useSelectedAudit } from './audit-schedule/detailParts';
import { istDateOf, type HistoryFilters, type IstDate, type ScheduleFilters } from './audit-schedule/scheduleFormat';

export type AuditScheduleInitialFilter = 'all' | 'field_visit' | 'history' | 'calendar' | 'report' | 'calendar_view';

export type AuditScheduleInitialView =
  | 'history'
  | 'audit_detail'
  | 'audit_report'
  | 'list'
  | 'detail'
  | 'schedule_visit'
  | 'inspection'
  | 'calendar'
  | 'calendar_view'
  | 'audit_details_m5'
  | 'pdf_viewer';

export interface AuditScheduleScreenProps {
  onBack: () => void;
  isTabRoot?: boolean;
  onViewModeChange?: (isRoot: boolean) => void;
  onNavigateTab?: (tab: string) => void;
  initialTypeFilter?: AuditScheduleInitialFilter | undefined;
  initialAuditId?: string | undefined;
  initialView?: AuditScheduleInitialView | undefined;
  onNavigateFarmerProfile?: ((farmerId: string) => void) | undefined;
  onOpenNotifications?: (() => void) | undefined;
  /** docs/rbac.json permission check for the signed-in admin (permissions/can.ts). Fails closed when absent. */
  can?: Can;
  /** Opens the inspection / findings screens for an audit; the button is disabled without it. */
  onOpenInspection?: ((auditId: string) => void) | undefined;
}

type View = 'calendar' | 'audit_details_m5' | 'history' | 'audit_detail' | 'audit_report' | 'filters' | 'detail';
type Mode = 'Month' | 'List';

const NO_PERMISSIONS = makeCan([]);

/** The design's initial view: views it never drew on their own fall through to Audit History, as there. */
export function initialViewOf(initialView: AuditScheduleInitialView | undefined, initialTypeFilter: AuditScheduleInitialFilter): View {
  if (initialView === 'calendar_view' || initialView === 'calendar') return 'calendar';
  if (initialView === 'audit_detail' || initialView === 'audit_report' || initialView === 'detail' || initialView === 'audit_details_m5') {
    return initialView;
  }
  if (initialView === 'history') return 'history';
  if (initialView !== undefined) return 'history';
  if (initialTypeFilter === 'report') return 'audit_report';
  if (initialTypeFilter === 'history') return 'history';
  return 'calendar';
}

export function initialModeOf(
  initialView: AuditScheduleInitialView | undefined,
  initialTypeFilter: AuditScheduleInitialFilter,
  fieldVisitMode: boolean,
): Mode {
  if (initialView === 'calendar_view' || initialTypeFilter === 'calendar_view' || (fieldVisitMode && initialView !== 'list')) {
    return 'Month';
  }
  return 'List';
}

export function AuditScheduleScreen({
  onBack,
  isTabRoot = false,
  onViewModeChange,
  initialTypeFilter = 'calendar',
  initialAuditId,
  initialView,
  onNavigateFarmerProfile,
  onOpenNotifications,
  can = NO_PERMISSIONS,
  onOpenInspection,
}: AuditScheduleScreenProps) {
  const fieldVisitMode = !can('audit.schedule');
  const [now] = useState(() => new Date());
  const [view, setView] = useState<View>(() => initialViewOf(initialView, initialTypeFilter));
  const [previousView, setPreviousView] = useState<string>(
    initialView === 'calendar_view' || initialTypeFilter === 'calendar_view' ? 'calendar_view' : 'calendar',
  );
  const [mode, setMode] = useState<Mode>(() => initialModeOf(initialView, initialTypeFilter, fieldVisitMode));
  const [selectedId, setSelectedId] = useState<string | undefined>(initialAuditId);
  const [selectedSummary, setSelectedSummary] = useState<AuditSummaryDto | undefined>(undefined);
  const [calState, setCalState] = useState<CalendarState>(() => {
    const today = istDateOf(now) as IstDate;
    return { year: today.year, month: today.month, day: today.day, type: 'all', status: 'all', zoneId: null };
  });
  const [scheduleFilters, setScheduleFilters] = useState<ScheduleFilters>(
    initialTypeFilter === 'field_visit' ? { ...DEFAULT_SCHEDULE_FILTERS, type: 'fieldVisit' } : DEFAULT_SCHEDULE_FILTERS,
  );
  const [search, setSearch] = useState('');
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>(() => defaultHistoryFilters(now));
  const [showHistoryFilter, setShowHistoryFilter] = useState(false);

  const selected = useSelectedAudit(selectedId, selectedSummary);

  useEffect(() => {
    onViewModeChange?.(view === 'calendar' && mode === 'Month');
  }, [view, mode, onViewModeChange]);

  const select = (audit: AuditSummaryDto) => {
    setSelectedId(audit.id);
    setSelectedSummary(audit);
  };
  const go = (next: View, from: string) => {
    setPreviousView(from);
    setView(next);
  };
  const toCalendar = (m: Mode) => {
    setMode(m);
    setView('calendar');
  };

  if (view === 'calendar' && mode === 'List') {
    return (
      <ScheduleListView
        fieldVisitMode={fieldVisitMode}
        now={now}
        filters={scheduleFilters}
        onFiltersChange={setScheduleFilters}
        search={search}
        onSearchChange={setSearch}
        onBack={() => (fieldVisitMode ? setMode('Month') : onBack())}
        onOpenAudit={(audit) => {
          select(audit);
          const quick = fieldVisitMode && (audit.status === 'IN_PROGRESS' || audit.status === 'SCHEDULED');
          go(quick ? 'audit_details_m5' : 'detail', 'calendar_list');
        }}
      />
    );
  }

  if (view === 'calendar') {
    return (
      <CalendarMonthView
        fieldVisitMode={fieldVisitMode}
        isTabRoot={isTabRoot}
        now={now}
        state={calState}
        onStateChange={setCalState}
        onBack={onBack}
        onOpenNotifications={onOpenNotifications}
        onOpenList={() => setMode('List')}
        onOpenAudit={(audit) => {
          select(audit);
          go('audit_details_m5', 'calendar_view');
        }}
        onOpenHistory={() => go('history', 'calendar_view')}
        onOpenReport={(audit) => {
          select(audit);
          go('audit_report', 'calendar_view');
        }}
      />
    );
  }

  if (view === 'audit_details_m5') {
    return (
      <AuditDetailsM5View
        selected={selected}
        can={can}
        onBack={() => toCalendar(previousView === 'calendar_view' ? 'Month' : 'List')}
        onNavigateFarmerProfile={onNavigateFarmerProfile}
      />
    );
  }

  if (view === 'detail') {
    return (
      <AuditDetailView
        selected={selected}
        onBack={() => toCalendar('List')}
        onViewHistory={() => go('history', 'detail')}
        onOpenInspection={onOpenInspection}
      />
    );
  }

  if (view === 'audit_detail') {
    return (
      <AuditTimelineView
        selected={selected}
        onBack={() => {
          if (initialView === 'detail' || initialView === 'audit_detail') onBack();
          else if (previousView === 'history') setView('history');
          else if (previousView === 'calendar') setView('calendar');
          else onBack();
        }}
        onOpenHistoryFilter={() => {
          setShowHistoryFilter(true);
          setView('history');
        }}
        onViewReport={() => go('audit_report', 'audit_detail')}
      />
    );
  }

  if (view === 'audit_report') {
    return (
      <AuditReportView
        selected={selected}
        can={can}
        fieldVisitMode={fieldVisitMode}
        onBack={() => {
          if (initialView === 'audit_report' || initialTypeFilter === 'report') onBack();
          else if (previousView === 'calendar_view') toCalendar('Month');
          else setView('history');
        }}
        onViewHistory={() => go('history', 'audit_report')}
        onNavigateFarmerProfile={onNavigateFarmerProfile}
      />
    );
  }

  if (view === 'filters') {
    return (
      <FiltersPageView
        filters={scheduleFilters}
        onBack={() => setView('history')}
        onApply={(next) => {
          setScheduleFilters(next);
          setView('history');
        }}
        onClear={() => setScheduleFilters(DEFAULT_SCHEDULE_FILTERS)}
      />
    );
  }

  return (
    <HistoryView
      now={now}
      filters={historyFilters}
      onFiltersChange={setHistoryFilters}
      showFilter={showHistoryFilter}
      onToggleFilter={() => setShowHistoryFilter((prev) => !prev)}
      search={search}
      onSearchChange={setSearch}
      onBack={() => {
        if (initialTypeFilter === 'history' || initialView === 'history') onBack();
        else if (previousView === 'calendar_view') toCalendar('Month');
        else if (previousView === 'detail') setView('detail');
        else if (previousView === 'calendar' || previousView === 'calendar_list') toCalendar('List');
        else toCalendar('Month');
      }}
      onOpenAudit={(audit) => {
        select(audit);
        go(fieldVisitMode ? 'audit_report' : 'audit_detail', 'history');
      }}
    />
  );
}
