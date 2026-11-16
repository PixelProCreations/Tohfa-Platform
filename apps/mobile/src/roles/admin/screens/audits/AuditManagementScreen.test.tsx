/**
 * AuditManagementScreen rendered with react-test-renderer against mocked audit
 * hooks. Pins: every designed element renders with no data (KPI tiles as
 * em-dash, the calendar, the day section and all four quick actions), no hook
 * runs without audit.view, live counts and rows when granted, the month range
 * the list asks for, the real audit id reaching onSelectAuditItem, and the
 * fail-closed quick-action gates.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';
import type { AuditSummaryDto } from '../../api/audits';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Line: 'Line', Path: 'Path', Rect: 'Rect' }));

const hooks = vi.hoisted(() => ({ useAuditCompliance: vi.fn(), useAuditList: vi.fn() }));
vi.mock('./useAuditsData', () => hooks);

import { AuditManagementScreen, type AuditManagementScreenProps } from './AuditManagementScreen';
import { OverviewDashboardCard } from '../../components/OverviewDashboardCard';
import { makeCan } from '../../permissions/can';
import { tm } from './AuditManagementFormat';
import { ADMIN_NO_VALUE } from '../../utils/noValue';

const NOW = new Date('2026-10-09T06:00:00Z');

function row(over: Partial<AuditSummaryDto> = {}): AuditSummaryDto {
  return {
    id: '7f9c1e2a-0000-4000-8000-000000000001',
    farmerId: 'f-1',
    tohfaFarmerId: 'TOHFA-F-2026-0131',
    farmerName: 'Selvi',
    farmId: null,
    farmName: 'Coonoor farm',
    zoneId: null,
    zoneName: 'Zone A',
    fiscalYear: '2026-27',
    quarter: 3,
    auditType: 'INTERNAL',
    status: 'SCHEDULED',
    scheduledFor: '2026-10-09T08:00:00Z',
    startedAt: null,
    completedAt: null,
    auditorUserId: null,
    auditorName: 'S. Mohan',
    externalAgencyName: null,
    totalScore: null,
    maxScore: 100,
    tier: null,
    majorViolationsCount: 0,
    findingCounts: { major: 0, minor: 0, observation: 0, openMajor: 0 },
    redFlagged: false,
    ...over,
  };
}

function list(over: Record<string, unknown> = {}) {
  return { items: [], firstPage: undefined, loadMore: vi.fn(), hasMore: false, isLoading: false, error: null, refresh: vi.fn(), isRefreshing: false, ...over };
}

function compliance(over: Record<string, unknown> = {}) {
  return { data: undefined, error: null, refetch: vi.fn(), ...over };
}

function mount(props: Partial<AuditManagementScreenProps>) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<AuditManagementScreen now={NOW} {...props} />);
  });
  return tree;
}

function allText(tree: renderer.ReactTestRenderer): string {
  return tree.root
    .findAll((n) => (n.type as unknown) === 'Text')
    .map((n) => [n.props.children].flat().join(''))
    .join('|');
}

function pressableWithText(tree: renderer.ReactTestRenderer, text: string): ReactTestInstance {
  return tree.root.find(
    (n) => (n.type as unknown) === 'TouchableOpacity' && n.findAll((c) => (c.type as unknown) === 'Text' && [c.props.children].flat().join('') === text).length > 0,
  );
}

const QUICK = [
  'admin.audits.management.quick.schedule',
  'admin.audits.management.quick.history',
  'admin.audits.management.quick.generateReport',
  'admin.audits.management.quick.reportHistory',
] as const;

afterEach(() => vi.clearAllMocks());

describe('AuditManagementScreen without audit.view', () => {
  it('renders every designed element with em-dashes and fetches nothing', () => {
    const tree = mount({ can: makeCan([]) });
    expect(hooks.useAuditCompliance).not.toHaveBeenCalled();
    expect(hooks.useAuditList).not.toHaveBeenCalled();
    const cards = tree.root.findAllByType(OverviewDashboardCard);
    expect(cards).toHaveLength(6);
    for (const card of cards) expect(card.props.value).toBe(ADMIN_NO_VALUE);
    const text = allText(tree);
    expect(text).toContain(tm('admin.audits.management.header.title'));
    expect(text).toContain(tm('admin.audits.management.quick.title'));
    for (const key of QUICK) {
      const button = pressableWithText(tree, tm(key));
      expect(button.props.disabled).toBe(true);
    }
    // 31 October days in the calendar grid.
    const days = tree.root.findAll((n) => (n.type as unknown) === 'TouchableOpacity' && n.props.accessibilityState?.selected !== undefined);
    expect(days).toHaveLength(31);
  });

  it('treats a missing can as no permission', () => {
    mount({});
    expect(hooks.useAuditCompliance).not.toHaveBeenCalled();
  });
});

describe('AuditManagementScreen with audit.view', () => {
  const can = makeCan(['audit.view']);

  it('asks for the visible IST month, ascending, without cancelled audits', () => {
    hooks.useAuditCompliance.mockReturnValue(compliance());
    hooks.useAuditList.mockReturnValue(list());
    mount({ can });
    expect(hooks.useAuditList).toHaveBeenCalledWith({
      status: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
      scheduledFrom: '2026-09-30T18:30:00.000Z',
      scheduledTo: '2026-10-31T18:29:59.999Z',
      sort: 'scheduledFor',
      limit: 100,
    });
  });

  it('fills the tiles that have a count and keeps the rest as em-dash', () => {
    hooks.useAuditCompliance.mockReturnValue(
      compliance({
        data: {
          counts: {
            farmersInScope: 1, compliant: 1, pending: 0, nonCompliant: 0, overdueAudits: 0,
            farmersWithoutCurrentQuarterAudit: 0, redFlaggedAudits: 5, redFlaggedFarmers: 1,
            openMajorFindings: 17, scheduledThisQuarter: 6,
          },
        },
      }),
    );
    hooks.useAuditList.mockReturnValue(list());
    const tree = mount({ can });
    const values = tree.root.findAllByType(OverviewDashboardCard).map((c) => c.props.value);
    expect(values).toEqual([ADMIN_NO_VALUE, ADMIN_NO_VALUE, ADMIN_NO_VALUE, ADMIN_NO_VALUE, '17', '5']);
  });

  it("lists today's audits and passes the API row (real id) on press", () => {
    hooks.useAuditCompliance.mockReturnValue(compliance());
    const audit = row();
    hooks.useAuditList.mockReturnValue(list({ items: [audit, row({ id: 'other-day', scheduledFor: '2026-10-20T08:00:00Z' })] }));
    const onSelectAuditItem = vi.fn();
    const tree = mount({ can, onSelectAuditItem });
    const badge = tm('admin.audits.management.badge.scheduled');
    expect(allText(tree)).toContain(badge);
    act(() => {
      pressableWithText(tree, badge).props.onPress();
    });
    expect(onSelectAuditItem).toHaveBeenCalledWith(audit);
    expect(onSelectAuditItem.mock.calls[0]?.[0].id).toBe('7f9c1e2a-0000-4000-8000-000000000001');
  });

  it('shows the empty state for a day without audits, loading while it loads', () => {
    hooks.useAuditCompliance.mockReturnValue(compliance());
    hooks.useAuditList.mockReturnValue(list());
    expect(allText(mount({ can }))).toContain(tm('admin.audits.management.day.empty'));
    hooks.useAuditList.mockReturnValue(list({ isLoading: true }));
    expect(mount({ can }).root.findAll((n) => (n.type as unknown) === 'ActivityIndicator').length).toBeGreaterThan(0);
  });

  it('gates quick actions: view codes open schedule/history, report needs audit.report.generate', () => {
    hooks.useAuditCompliance.mockReturnValue(compliance());
    hooks.useAuditList.mockReturnValue(list());
    const onOpenSchedule = vi.fn();
    const onOpenGenerateReport = vi.fn();
    const tree = mount({ can, onOpenSchedule, onOpenGenerateReport });
    const schedule = pressableWithText(tree, tm('admin.audits.management.quick.schedule'));
    expect(schedule.props.disabled).toBe(false);
    act(() => schedule.props.onPress());
    expect(onOpenSchedule).toHaveBeenCalledTimes(1);
    expect(pressableWithText(tree, tm('admin.audits.management.quick.generateReport')).props.disabled).toBe(true);

    const withReport = mount({ can: makeCan(['audit.view', 'audit.report.generate']), onOpenGenerateReport });
    const report = pressableWithText(withReport, tm('admin.audits.management.quick.generateReport'));
    act(() => report.props.onPress());
    expect(onOpenGenerateReport).toHaveBeenCalledTimes(1);
  });

  it('moves the calendar a month forward', () => {
    hooks.useAuditCompliance.mockReturnValue(compliance());
    hooks.useAuditList.mockReturnValue(list());
    const tree = mount({ can });
    const next = tree.root.find((n) => (n.type as unknown) === 'TouchableOpacity' && n.props.accessibilityLabel === tm('admin.audits.management.calendar.nextMonth'));
    act(() => next.props.onPress());
    expect(hooks.useAuditList).toHaveBeenLastCalledWith(expect.objectContaining({ scheduledFrom: '2026-10-31T18:30:00.000Z' }));
  });
});
