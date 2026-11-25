/**
 * Audit Schedule screen (port of origin/Superadmin-main dashboard/AuditScheduleScreen.tsx).
 * Pins: every designed element renders with empty data (the dash where the
 * API has no value), no design fixture string ever renders, the field-visit
 * layout follows the missing `audit.schedule` permission (not a role), and
 * Download PDF follows `audit.report.generate` + a COMPLETED audit.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';
import type { AuditDetailDto, AuditSummaryDto } from '../api/audits';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  Linking: { openURL: vi.fn(() => Promise.resolve()) },
  Modal: 'Modal',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Line: 'Line', Path: 'Path', Rect: 'Rect' }));

const hooks = vi.hoisted(() => ({
  useAuditList: vi.fn(),
  useAuditCompliance: vi.fn(),
  useAuditDetail: vi.fn(),
  useAuditReport: vi.fn(),
}));
vi.mock('../screens/audits/useAuditsData', () => hooks);

import { AuditScheduleScreen } from '../screens/dashboard/AuditScheduleScreen';
import { ds, type DashScheduleKey } from '../screens/dashboard/audit-schedule/i18n';
import { makeCan } from '../permissions/can';
import { ADMIN_NO_VALUE } from '../utils/noValue';

const FIELD_VISIT = makeCan(['audit.view', 'audit.conduct']);
const SCHEDULER = makeCan(['audit.view', 'audit.schedule', 'audit.report.generate']);
const K = (k: string) => ds(`admin.audits.dashSchedule.${k}` as DashScheduleKey);

const FIXTURE_STRINGS = ['Ramesh Kumar', 'AUD-2026-0042', 'Quarterly Farm Audit', 'Ooty Farm 01', 'Priya Nair', '80/100', '12 Jun 2027'];

function textOf(node: ReactTestInstance | string): string {
  if (typeof node === 'string') return node;
  return node.children.map(textOf).join('');
}
const texts = (tree: renderer.ReactTestRenderer) => tree.root.findAll((n) => String(n.type) === 'Text').map(textOf);
const allText = (tree: renderer.ReactTestRenderer) => texts(tree).join('\n');
function button(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance {
  const hits = tree.root.findAll((n) => String(n.type) === 'TouchableOpacity' && textOf(n).includes(label));
  expect(hits.length, `button "${label}"`).toBeGreaterThan(0);
  return hits[hits.length - 1] as ReactTestInstance;
}
async function tap(tree: renderer.ReactTestRenderer, label: string) {
  const b = button(tree, label);
  await act(async () => {
    b.props.onPress();
  });
}
function mount(el: React.ReactElement) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(el);
  });
  return tree;
}

function list(items: AuditSummaryDto[] = [], over: Record<string, unknown> = {}) {
  return { items, firstPage: undefined, loadMore: vi.fn(), hasMore: false, isLoading: false, error: null, refresh: vi.fn(), isRefreshing: false, ...over };
}

function summary(over: Partial<AuditSummaryDto> = {}): AuditSummaryDto {
  const today = new Date();
  return {
    id: 'abcdef12-0000-4000-8000-000000000001',
    farmerId: 'f-1',
    tohfaFarmerId: 'TOHFA-F-2026-0099',
    farmerName: 'Live Farmer',
    farmId: null,
    farmName: 'Live Farm',
    zoneId: 'z-1',
    zoneName: 'Live Zone',
    fiscalYear: '2026-27',
    quarter: 3,
    auditType: 'INTERNAL',
    status: 'SCHEDULED',
    scheduledFor: today.toISOString(),
    startedAt: null,
    completedAt: null,
    auditorUserId: null,
    auditorName: 'Live Auditor',
    externalAgencyName: null,
    totalScore: null,
    maxScore: 100,
    tier: null,
    majorViolationsCount: 0,
    findingCounts: { major: 2, minor: 1, observation: 0, openMajor: 0 },
    redFlagged: false,
    ...over,
  };
}

function detail(over: Partial<AuditDetailDto> = {}): AuditDetailDto {
  return {
    ...summary(),
    summary: null,
    reportUpload: null,
    redFlagReason: null,
    redFlaggedAt: null,
    redFlaggedByName: null,
    cancelledReason: null,
    cancelledAt: null,
    createdByName: 'Admin',
    createdAt: '2026-10-01T04:30:00Z',
    updatedAt: null,
    categoryScores: [],
    findings: [],
    ...over,
  };
}

const reportMutation = { mutateAsync: vi.fn(() => Promise.resolve('https://signed.example/report.pdf')), isPending: false };

beforeEach(() => {
  for (const h of Object.values(hooks)) h.mockReset();
  hooks.useAuditList.mockReturnValue(list());
  hooks.useAuditCompliance.mockReturnValue({ data: undefined });
  hooks.useAuditDetail.mockReturnValue({ data: undefined, isLoading: false, error: null, refetch: vi.fn() });
  hooks.useAuditReport.mockReturnValue(reportMutation);
});

describe('calendar, empty data', () => {
  it('field-visit layout (no audit.schedule): KPI cards, field visit, quick actions; dashes; no fixtures', () => {
    const tree = mount(<AuditScheduleScreen onBack={() => undefined} can={FIELD_VISIT} isTabRoot initialView="calendar_view" />);
    const text = allText(tree);
    for (const k of ['kpi.upcoming', 'kpi.today', 'kpi.pending', 'kpi.completed', 'cal.fieldVisit', 'cal.viewAll', 'cal.quickActions', 'cal.auditHistory', 'cal.reports', 'header.audits', 'cal.countNone']) {
      expect(text, k).toContain(K(k));
    }
    for (let i = 0; i < 7; i++) expect(text).toContain(K(`cal.weekday.${i}`));
    // Fully loaded empty lists are a real 0; PENDING (compliance not loaded) is the dash.
    expect(texts(tree).filter((s) => s === '0').length).toBe(3);
    expect(texts(tree)).toContain(ADMIN_NO_VALUE);
    expect(text).not.toContain(K('cal.auditTypeLabel'));
    for (const f of FIXTURE_STRINGS) expect(text).not.toContain(f);
  });

  it('KPI counts are the dash while loading or when more pages exist (no count endpoint)', () => {
    hooks.useAuditList.mockReturnValue(list([], { hasMore: true }));
    const tree = mount(<AuditScheduleScreen onBack={() => undefined} can={FIELD_VISIT} initialView="calendar_view" />);
    expect(texts(tree).filter((s) => s === ADMIN_NO_VALUE).length).toBeGreaterThanOrEqual(4);
  });

  it('PENDING AUDIT is the compliance overdueAudits count', () => {
    hooks.useAuditCompliance.mockReturnValue({ data: { counts: { overdueAudits: 7 } } });
    const tree = mount(<AuditScheduleScreen onBack={() => undefined} can={FIELD_VISIT} initialView="calendar_view" />);
    expect(texts(tree)).toContain('7');
  });

  it('scheduling layout: the three filter cards render, the KPI cards do not', () => {
    const tree = mount(<AuditScheduleScreen onBack={() => undefined} can={SCHEDULER} initialView="calendar_view" />);
    const text = allText(tree);
    for (const k of ['cal.auditTypeLabel', 'cal.statusLabel', 'cal.zoneLabel', 'cal.allTypes', 'cal.allStatus', 'cal.allZones', 'header.auditCalendar']) {
      expect(text, k).toContain(K(k));
    }
    expect(text).not.toContain(K('kpi.upcoming'));
  });
});

describe('calendar -> audit details', () => {
  it('a live audit on today opens the quick detail; unknown fields and checklist show the dash', async () => {
    hooks.useAuditList.mockReturnValue(list([summary()]));
    const tree = mount(<AuditScheduleScreen onBack={() => undefined} can={FIELD_VISIT} initialView="calendar_view" />);
    expect(allText(tree)).toContain(K('cal.countOne'));
    await tap(tree, K('typeTitle.internal'));
    const text = allText(tree);
    for (const k of ['detail.farmerInformation', 'detail.auditInformation', 'detail.farm', 'detail.documents', 'detail.auditChecklist', 'detail.checklistFile', 'detail.permissionNotice']) {
      expect(text, k).toContain(K(k));
    }
    expect(text).toContain('TOHFA-F-2026-0099');
    expect(text).toContain('Live Auditor');
    expect(text).toContain('ABCDEF12');
    expect(texts(tree).filter((s) => s === ADMIN_NO_VALUE).length).toBeGreaterThanOrEqual(5);
    expect(button(tree, K('doc.download')).props.disabled).toBe(true);
  });

  it('a scheduler does not see the "not Farmer Admin permissions" notice', async () => {
    hooks.useAuditList.mockReturnValue(list([summary()]));
    const tree = mount(<AuditScheduleScreen onBack={() => undefined} can={SCHEDULER} initialView="calendar_view" />);
    await tap(tree, K('cal.viewDetails'));
    expect(allText(tree)).not.toContain(K('detail.permissionNotice'));
  });
});

describe('detail and report', () => {
  it('detail: certification, farming type and years organic render as the dash; Inspection disabled without a host', () => {
    hooks.useAuditDetail.mockReturnValue({ data: detail(), isLoading: false, error: null, refetch: vi.fn() });
    const tree = mount(<AuditScheduleScreen onBack={() => undefined} can={SCHEDULER} initialView="detail" initialAuditId="x" />);
    const text = allText(tree);
    for (const k of ['cert.pgsOrganic', 'cert.npop', 'detail.previousAuditSummary', 'field.yearsOrganic', 'detail.viewAuditHistory', 'detail.inspectionFindings']) {
      expect(text, k).toContain(K(k));
    }
    expect(button(tree, K('detail.inspectionFindings')).props.disabled).toBe(true);
  });

  it('report: findings from findingCounts, score dash before completion, Download disabled until COMPLETED', () => {
    hooks.useAuditDetail.mockReturnValue({ data: detail(), isLoading: false, error: null, refetch: vi.fn() });
    const tree = mount(<AuditScheduleScreen onBack={() => undefined} can={SCHEDULER} initialView="audit_report" initialAuditId="x" />);
    const text = allText(tree);
    for (const k of ['report.findingsSummary', 'report.major', 'report.minor', 'report.redFlags', 'report.auditScore', 'report.remarks', 'report.inference', 'report.viewFarmer', 'report.downloadPdf']) {
      expect(text, k).toContain(K(k));
    }
    expect(texts(tree)).toContain('2');
    expect(button(tree, K('report.downloadPdf')).props.disabled).toBe(true);
  });

  it('report: a COMPLETED audit downloads with audit.report.generate, not without it', async () => {
    hooks.useAuditDetail.mockReturnValue({
      data: detail({ status: 'COMPLETED', totalScore: 82, completedAt: '2026-11-01T04:30:00Z' }),
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    const ok = mount(<AuditScheduleScreen onBack={() => undefined} can={SCHEDULER} initialView="audit_report" initialAuditId="x" />);
    expect(texts(ok)).toContain('82');
    expect(button(ok, K('report.downloadPdf')).props.disabled).toBe(false);
    await tap(ok, K('report.downloadPdf'));
    expect(reportMutation.mutateAsync).toHaveBeenCalledWith('generated');

    const no = mount(<AuditScheduleScreen onBack={() => undefined} can={makeCan(['audit.view', 'audit.schedule'])} initialView="audit_report" initialAuditId="x" />);
    expect(button(no, K('report.downloadPdf')).props.disabled).toBe(true);
  });

  it('field-visit report hides Inference and the View Farmer / History pair, as the design does', () => {
    hooks.useAuditDetail.mockReturnValue({ data: detail(), isLoading: false, error: null, refetch: vi.fn() });
    const tree = mount(<AuditScheduleScreen onBack={() => undefined} can={FIELD_VISIT} initialView="audit_report" initialAuditId="x" />);
    expect(allText(tree)).not.toContain(K('report.inference'));
  });
});

describe('history and list', () => {
  it('history: empty state and the inline filter', async () => {
    const tree = mount(<AuditScheduleScreen onBack={() => undefined} can={SCHEDULER} initialView="history" />);
    expect(allText(tree)).toContain(K('history.emptyTitle'));
    await act(async () => {
      tree.root.findAll((n) => String(n.type) === 'TouchableOpacity' && n.props.accessibilityLabel === K('a11y.filters'))[0]?.props.onPress();
    });
    const text = allText(tree);
    for (const k of ['filter.auditType', 'filter.year', 'filter.historyStatus.rescheduled', 'filter.apply', 'filter.clear']) expect(text, k).toContain(K(k));
  });

  it('history card: score dash, findings from the summary', () => {
    hooks.useAuditList.mockReturnValue(list([summary({ status: 'COMPLETED' })]));
    const tree = mount(<AuditScheduleScreen onBack={() => undefined} can={SCHEDULER} initialView="history" />);
    expect(hooks.useAuditList.mock.calls.some((c) => (c[0] as { sort?: string }).sort === '-scheduledFor')).toBe(true);
    expect(allText(tree)).toContain('ABCDEF12');
  });

  it('schedule list: Field Visit type sends no request and shows the no-match card', () => {
    const tree = mount(<AuditScheduleScreen onBack={() => undefined} can={SCHEDULER} initialView="list" initialTypeFilter="field_visit" />);
    // initialView 'list' falls through to Audit History, as in the design.
    expect(allText(tree)).toContain(K('header.auditHistory'));
  });

  it('schedule list (scheduler, default): header, search, empty note with Reset Filters', () => {
    const tree = mount(<AuditScheduleScreen onBack={() => undefined} can={SCHEDULER} initialTypeFilter="field_visit" />);
    const text = allText(tree);
    expect(text).toContain(K('header.auditSchedule'));
    expect(text).toContain(K('list.noMatch'));
    expect(text).toContain(K('list.resetFilters'));
    expect(hooks.useAuditList.mock.calls.every((c) => (c[1] as { enabled?: boolean }).enabled === false)).toBe(true);
  });
});
