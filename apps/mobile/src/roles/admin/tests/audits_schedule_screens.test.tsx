/**
 * AuditScheduleAssignmentScreen and ScheduleAuditFormScreen rendered against
 * mocked audit and farmer hooks. Pins: every designed element renders with
 * empty data (dashes where the API has no value), no design fixture text, the
 * row callbacks carry the real API id, permission gating (fail closed), and
 * that the form sends the create body without fiscalYear/quarter.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';
import type { AuditDetailDto, AuditSummaryDto } from '../api/audits';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Modal: 'Modal',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, hairlineWidth: 1 },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Line: 'Line', Path: 'Path', Rect: 'Rect' }));

const auditHooks = vi.hoisted(() => ({
  useAuditList: vi.fn(),
  useCancelAudit: vi.fn(),
  useAuditDetail: vi.fn(),
  useCreateAudit: vi.fn(),
  useUpdateAudit: vi.fn(),
}));
vi.mock('../screens/audits/useAuditsData', () => auditHooks);
const farmerHooks = vi.hoisted(() => ({ useFarmerList: vi.fn(), useFarmer: vi.fn() }));
vi.mock('../api/farmerHooks', () => farmerHooks);

import { AuditScheduleAssignmentScreen } from '../screens/audits/AuditScheduleAssignmentScreen';
import { ScheduleAuditFormScreen } from '../screens/audits/ScheduleAuditFormScreen';
import { ts, type AuditsScheduleKey } from '../screens/audits/auditScheduleFormat';
import { makeCan } from '../permissions/can';
import { ADMIN_NO_VALUE } from '../utils/noValue';

const ALL = makeCan(['audit.view', 'audit.schedule', 'farmer.profile.view_all']);
const VIEW_ONLY = makeCan(['audit.view']);

function summary(over: Partial<AuditSummaryDto> = {}): AuditSummaryDto {
  return {
    id: 'uuid-1',
    farmerId: 'f-1',
    tohfaFarmerId: 'TOHFA-F-2026-0001',
    farmerName: 'Lakshmi',
    farmId: null,
    farmName: null,
    zoneId: null,
    zoneName: null,
    fiscalYear: '2026-27',
    quarter: 3,
    auditType: 'INTERNAL',
    status: 'SCHEDULED',
    scheduledFor: '2099-10-20T04:30:00.000Z',
    startedAt: null,
    completedAt: null,
    auditorUserId: null,
    auditorName: null,
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

function cursorList(items: AuditSummaryDto[]) {
  return { items, firstPage: undefined, loadMore: vi.fn(), hasMore: false, isLoading: false, error: null, refresh: vi.fn(), isRefreshing: false };
}
const mutation = () => ({ mutate: vi.fn(), isPending: false });

function textOf(node: ReactTestInstance | string): string {
  if (typeof node === 'string') return node;
  return node.children.map(textOf).join('');
}
const allText = (tree: renderer.ReactTestRenderer) =>
  tree.root.findAll((n) => String(n.type) === 'Text').map((n) => textOf(n)).join('\n');
function buttons(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance[] {
  return tree.root.findAll((n) => String(n.type) === 'TouchableOpacity' && textOf(n) === label);
}
function mount(el: React.ReactElement) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(el);
  });
  return tree;
}
const k = (key: AuditsScheduleKey) => ts(key);

beforeEach(() => {
  vi.clearAllMocks();
  auditHooks.useAuditList.mockReturnValue(cursorList([]));
  auditHooks.useCancelAudit.mockReturnValue(mutation());
  auditHooks.useAuditDetail.mockReturnValue({ data: undefined, isPending: false, error: null, refetch: vi.fn() });
  auditHooks.useCreateAudit.mockReturnValue(mutation());
  auditHooks.useUpdateAudit.mockReturnValue(mutation());
  farmerHooks.useFarmerList.mockReturnValue({ ...cursorList([]), items: [] });
  farmerHooks.useFarmer.mockReturnValue({ dto: undefined, isLoading: false, error: null, refresh: vi.fn() });
});

describe('AuditScheduleAssignmentScreen', () => {
  it('draws the designed chrome with no data and none of the design fixtures', () => {
    const tree = mount(<AuditScheduleAssignmentScreen onBack={vi.fn()} can={ALL} />);
    const text = allText(tree);
    expect(text).toContain(k('admin.audits.schedule.title'));
    expect(text).toContain(ts('admin.audits.schedule.count.other', { count: 0 }));
    expect(tree.root.findAll((n) => String(n.type) === 'TextInput').length).toBeGreaterThan(0);
    for (const fixture of ['AUD-2026', 'Ramesh Kumar', 'Selvi', 'S. Mohan', 'AgriCert']) expect(text).not.toContain(fixture);
  });

  it('asks the server for SCHEDULED, IN_PROGRESS and COMPLETED, and only with audit.view', () => {
    mount(<AuditScheduleAssignmentScreen onBack={vi.fn()} can={ALL} />);
    expect(auditHooks.useAuditList).toHaveBeenCalledWith(expect.objectContaining({ status: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] }), { enabled: true });
    mount(<AuditScheduleAssignmentScreen onBack={vi.fn()} />);
    expect(auditHooks.useAuditList).toHaveBeenLastCalledWith(expect.anything(), { enabled: false });
  });

  it('renders a row with dashes for missing values and passes the real API id', () => {
    auditHooks.useAuditList.mockReturnValue(cursorList([summary()]));
    const onEdit = vi.fn();
    const tree = mount(<AuditScheduleAssignmentScreen onBack={vi.fn()} can={ALL} onEditSchedule={onEdit} onViewSchedule={vi.fn()} onReschedule={vi.fn()} />);
    const text = allText(tree);
    expect(text).toContain(ts('admin.audits.schedule.cardTitle', { code: ADMIN_NO_VALUE, farmer: 'Lakshmi' }));
    expect(text).toContain(k('admin.audits.schedule.status.scheduled'));
    for (const key of ['view', 'edit', 'reschedule', 'cancel'] as const) {
      expect(buttons(tree, k(`admin.audits.schedule.action.${key}`)).length).toBe(1);
    }
    act(() => buttons(tree, k('admin.audits.schedule.action.edit'))[0]!.props.onPress());
    expect(onEdit.mock.calls[0]![0]).toMatchObject({ id: 'uuid-1', audit: { id: 'uuid-1' } });
  });

  it('without audit.schedule the actions are drawn but disabled', () => {
    auditHooks.useAuditList.mockReturnValue(cursorList([summary()]));
    const tree = mount(<AuditScheduleAssignmentScreen onBack={vi.fn()} can={VIEW_ONLY} onEditSchedule={vi.fn()} onViewSchedule={vi.fn()} onReschedule={vi.fn()} />);
    expect(buttons(tree, k('admin.audits.schedule.action.edit'))[0]!.props.disabled).toBe(true);
    expect(buttons(tree, k('admin.audits.schedule.action.reschedule'))[0]!.props.disabled).toBe(true);
    expect(buttons(tree, k('admin.audits.schedule.action.cancel'))[0]!.props.disabled).toBe(true);
    expect(buttons(tree, k('admin.audits.schedule.action.view'))[0]!.props.disabled).toBe(false);
  });

  it('cancel asks for a reason and posts it', () => {
    const cancel = mutation();
    auditHooks.useCancelAudit.mockReturnValue(cancel);
    auditHooks.useAuditList.mockReturnValue(cursorList([summary()]));
    const tree = mount(<AuditScheduleAssignmentScreen onBack={vi.fn()} can={ALL} />);
    act(() => buttons(tree, k('admin.audits.schedule.action.cancel'))[0]!.props.onPress());
    const confirm = () => buttons(tree, k('admin.audits.schedule.cancel.confirm'))[0]!;
    act(() => confirm().props.onPress());
    expect(cancel.mutate).not.toHaveBeenCalled();
    const input = tree.root.findAll((n) => String(n.type) === 'TextInput' && n.props.maxLength === 500)[0]!;
    act(() => input.props.onChangeText('Farmer unavailable'));
    act(() => confirm().props.onPress());
    expect(cancel.mutate.mock.calls[0]![0]).toEqual({ auditId: 'uuid-1', body: { reason: 'Farmer unavailable' } });
  });

  it('completed rows show the view-only note instead of actions', () => {
    auditHooks.useAuditList.mockReturnValue(cursorList([summary({ status: 'COMPLETED' })]));
    const tree = mount(<AuditScheduleAssignmentScreen onBack={vi.fn()} can={ALL} />);
    expect(allText(tree)).toContain(k('admin.audits.schedule.viewOnly'));
    expect(buttons(tree, k('admin.audits.schedule.action.edit')).length).toBe(0);
  });
});

describe('ScheduleAuditFormScreen', () => {
  it('draws every designed field and button with dashes where nothing is chosen', () => {
    const tree = mount(<ScheduleAuditFormScreen onBack={vi.fn()} can={ALL} />);
    const text = allText(tree);
    for (const key of [
      'admin.audits.form.title',
      'admin.audits.form.section.info',
      'admin.audits.form.section.farmer',
      'admin.audits.form.section.auditor',
      'admin.audits.form.field.auditId',
      'admin.audits.form.field.date',
      'admin.audits.form.field.startTime',
      'admin.audits.form.field.duration',
      'admin.audits.form.field.farmer',
      'admin.audits.form.field.farm',
      'admin.audits.form.field.auditor',
      'admin.audits.form.farmHint',
      'admin.audits.form.submit',
      'admin.audits.form.saveDraft',
    ] as const) {
      expect(text).toContain(k(key));
    }
    expect(text.split('\n').filter((l) => l === ADMIN_NO_VALUE).length).toBeGreaterThanOrEqual(4);
    for (const fixture of ['AUD-2026', 'Lakshmi', 'R. Devi', '20/10/2026']) expect(text).not.toContain(fixture);
  });

  it('fails closed: without audit.schedule the submit button is disabled', () => {
    const tree = mount(<ScheduleAuditFormScreen onBack={vi.fn()} />);
    expect(buttons(tree, k('admin.audits.form.submit'))[0]!.props.disabled).toBe(true);
    expect(buttons(tree, k('admin.audits.form.saveDraft'))[0]!.props.disabled).toBe(true);
  });

  it('creates an INTERNAL audit without fiscalYear/quarter', () => {
    const create = mutation();
    auditHooks.useCreateAudit.mockReturnValue(create);
    const draft = {
      farmerId: 'f-1', farmerLabel: 'Lakshmi', farmId: null, farmLabel: ADMIN_NO_VALUE, auditType: 'INTERNAL' as const,
      auditorUserId: null, externalAgencyName: '', date: '20/10/2026', startTime: '10:00 AM', duration: '',
    };
    const tree = mount(<ScheduleAuditFormScreen onBack={vi.fn()} can={ALL} initialDraft={draft} />);
    act(() => buttons(tree, k('admin.audits.form.submit'))[0]!.props.onPress());
    const body = create.mutate.mock.calls[0]![0];
    expect(body).toEqual({ farmerId: 'f-1', auditType: 'INTERNAL', scheduledFor: '2026-10-20T10:00:00+05:30' });
    expect(body).not.toHaveProperty('fiscalYear');
    expect(body).not.toHaveProperty('quarter');
  });

  it('edits a loaded audit through PATCH with only the changed field', () => {
    const update = mutation();
    auditHooks.useUpdateAudit.mockReturnValue(update);
    const audit = { ...summary(), scheduledFor: '2026-10-20T04:30:00.000Z' } as AuditDetailDto;
    auditHooks.useAuditDetail.mockReturnValue({ data: audit, isPending: false, error: null, refetch: vi.fn() });
    const tree = mount(<ScheduleAuditFormScreen initialAuditId="uuid-1" onBack={vi.fn()} can={ALL} />);
    expect(auditHooks.useAuditDetail).toHaveBeenCalledWith('uuid-1');
    const dateInput = tree.root.findAll((n) => String(n.type) === 'TextInput')[0]!;
    act(() => dateInput.props.onChangeText('21/10/2026'));
    act(() => buttons(tree, k('admin.audits.form.submit'))[0]!.props.onPress());
    expect(update.mutate.mock.calls[0]![0]).toEqual({ auditId: 'uuid-1', body: { scheduledFor: '2026-10-21T10:00:00+05:30' } });
  });

  it('save draft hands the form to the host', () => {
    const onSaveDraft = vi.fn();
    const tree = mount(<ScheduleAuditFormScreen onBack={vi.fn()} can={ALL} onSaveDraft={onSaveDraft} />);
    act(() => buttons(tree, k('admin.audits.form.saveDraft'))[0]!.props.onPress());
    expect(onSaveDraft).toHaveBeenCalledWith(expect.objectContaining({ auditType: 'INTERNAL', farmerId: null }));
  });
});
