/**
 * The three audit screens that used to fabricate success, rendered over mocked
 * audit hooks: Schedule New Audit, Audit Inspection and Bulk Reschedule.
 *
 * Each screen is pinned for two things: it CALLS the endpoint's hook with the
 * right body, and it reports success (the onSuccess / onSubmitted callback)
 * ONLY from the mutation's own success path, never when the call fails.
 *
 * BR-03: scheduling and bulk reschedule (per-item outcome; a 200 with failures is not success).
 * BR-05 / BR-06: the inspection logs a MAJOR finding and scores every category before completing.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';
import type { Problem } from '@tohfa/shared-types';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, hairlineWidth: 1 },
  Switch: 'Switch',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect' }));
vi.mock('@tohfa/mobile-ui', () => ({ Icon: 'Icon', SafeAreaView: 'SafeAreaView', ScreenStatusBar: 'ScreenStatusBar' }));

const auditHooks = vi.hoisted(() => ({
  useAuditDetail: vi.fn(),
  useAuditList: vi.fn(),
  useCreateAudit: vi.fn(),
  useInspectAudit: vi.fn(),
  useBulkRescheduleAudits: vi.fn(),
}));
vi.mock('../screens/audits/useAuditsData', () => auditHooks);
const farmerHooks = vi.hoisted(() => ({ useFarmerList: vi.fn() }));
vi.mock('../api/farmerHooks', () => farmerHooks);

import { Alert } from 'react-native';
import { ApiError, NetworkError } from '../../../shell/api/client';
import type { AuditDetailDto, AuditSummaryDto } from '../api/audits';
import { t } from '../i18n';
import { makeCan } from '../permissions/can';
import { InspectionStepError } from '../screens/audits/auditActions';
import { AuditInspectionScreen } from '../screens/audits/AuditInspectionScreen';
import { BulkRescheduleAuditsScreen } from '../screens/audits/BulkRescheduleAuditsScreen';
import { ScheduleNewAuditScreen } from '../screens/audits/ScheduleNewAuditScreen';

const SCHEDULE_CAN = makeCan(['audit.schedule', 'farmer.profile.view_all']);
const BULK_CAN = makeCan(['audit.view', 'audit.schedule']);
const INSPECT_CAN = makeCan(['audit.conduct', 'audit.score.categories', 'audit.findings.log']);

function apiError(code: string, status = 422): ApiError {
  return new ApiError({ type: 'about:blank', title: 'x', status, code } as Problem);
}

function textOf(node: ReactTestInstance | string): string {
  if (typeof node === 'string') return node;
  return node.children.map(textOf).join('');
}
const allText = (tree: renderer.ReactTestRenderer) =>
  tree.root.findAll((n) => String(n.type) === 'Text').map((n) => textOf(n)).join('\n');
function button(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance {
  const found = tree.root.findAll((n) => String(n.type) === 'TouchableOpacity' && textOf(n) === label);
  if (found.length === 0) throw new Error(`no button "${label}" in:\n${allText(tree)}`);
  return found[0]!;
}
function byLabel(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance {
  return tree.root.findAll((n) => String(n.type) === 'TouchableOpacity' && n.props.accessibilityLabel === label)[0]!;
}
function mount(el: React.ReactElement) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(el);
  });
  return tree;
}
const press = (node: ReactTestInstance) => act(() => node.props.onPress());

type MutateOptions = { onSuccess?: (data: unknown) => void; onError?: (err: unknown) => void };
function mutation() {
  return { mutate: vi.fn(), isPending: false, error: null as unknown };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
describe('ScheduleNewAuditScreen -> POST /admin/audits', () => {
  let create: ReturnType<typeof mutation>;
  beforeEach(() => {
    create = mutation();
    auditHooks.useCreateAudit.mockReturnValue(create);
    farmerHooks.useFarmerList.mockReturnValue({
      items: [{ id: 'f-1', name: 'Lakshmi', farmerCode: 'TOHFA-F-2026-0001' }],
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refresh: vi.fn(),
    });
  });

  function chooseFarmer(tree: renderer.ReactTestRenderer) {
    const input = tree.root.findAll((n) => String(n.type) === 'TextInput')[0]!;
    act(() => input.props.onChangeText('Lak'));
    press(button(tree, t('admin.auditActions.schedule.farmerOption', { name: 'Lakshmi', code: 'TOHFA-F-2026-0001' })));
  }

  function chooseTime(tree: renderer.ReactTestRenderer, text: string) {
    const input = tree.root.findAll(
      (n) => String(n.type) === 'TextInput' && n.props.placeholder === t('admin.auditActions.schedule.timePlaceholder'),
    )[0]!;
    act(() => input.props.onChangeText(text));
  }

  it('BR-03: calls createAudit with the chosen farmer, type and the IST instant at the chosen time, and no fiscalYear/quarter', () => {
    const tree = mount(<ScheduleNewAuditScreen onBack={vi.fn()} onSuccess={vi.fn()} can={SCHEDULE_CAN} />);
    chooseFarmer(tree);
    chooseTime(tree, '02:30 PM');
    press(button(tree, 'Schedule Audit'));
    expect(create.mutate).toHaveBeenCalledTimes(1);
    const body = create.mutate.mock.calls[0]![0] as Record<string, unknown>;
    expect(body).toMatchObject({ farmerId: 'f-1', auditType: 'INTERNAL' });
    expect(String(body['scheduledFor'])).toMatch(/^\d{4}-\d{2}-\d{2}T14:30:00\+05:30$/);
    expect(body).not.toHaveProperty('fiscalYear');
    expect(body).not.toHaveProperty('quarter');
  });

  it('BR-03: the submit is disabled, and sends nothing, until the admin has chosen a start time', () => {
    const tree = mount(<ScheduleNewAuditScreen onBack={vi.fn()} onSuccess={vi.fn()} can={SCHEDULE_CAN} />);
    chooseFarmer(tree);
    expect(button(tree, 'Schedule Audit').props.disabled).toBe(true);
    press(button(tree, 'Schedule Audit'));
    expect(create.mutate).not.toHaveBeenCalled();
    chooseTime(tree, 'later');
    expect(button(tree, 'Schedule Audit').props.disabled).toBe(true);
    chooseTime(tree, '10:00 AM');
    expect(button(tree, 'Schedule Audit').props.disabled).toBe(false);
  });

  it('does NOT report success before the server answers, nor when the call fails; shows the error', () => {
    const onSuccess = vi.fn();
    const tree = mount(<ScheduleNewAuditScreen onBack={vi.fn()} onSuccess={onSuccess} can={SCHEDULE_CAN} />);
    chooseFarmer(tree);
    chooseTime(tree, '10:00 AM');
    press(button(tree, 'Schedule Audit'));
    expect(onSuccess).not.toHaveBeenCalled();
    act(() => (create.mutate.mock.calls[0]![1] as MutateOptions).onError!(apiError('AUDIT_QUARTER_TAKEN', 409)));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(allText(tree)).toContain(t('admin.error.AUDIT_QUARTER_TAKEN'));
  });

  it('reports success only from the mutation success path', () => {
    const onSuccess = vi.fn();
    const tree = mount(<ScheduleNewAuditScreen onBack={vi.fn()} onSuccess={onSuccess} can={SCHEDULE_CAN} />);
    chooseFarmer(tree);
    chooseTime(tree, '10:00 AM');
    press(button(tree, 'Schedule Audit'));
    act(() => (create.mutate.mock.calls[0]![1] as MutateOptions).onSuccess!({ id: 'a-1' }));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('sends nothing and reports nothing without a chosen farmer', () => {
    const onSuccess = vi.fn();
    const tree = mount(<ScheduleNewAuditScreen onBack={vi.fn()} onSuccess={onSuccess} can={SCHEDULE_CAN} />);
    chooseTime(tree, '10:00 AM');
    press(button(tree, 'Schedule Audit'));
    expect(create.mutate).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(allText(tree)).toContain(t('admin.auditActions.schedule.farmerRequired'));
  });

  it('without audit.schedule the action is disabled and nothing is sent (fail closed)', () => {
    const tree = mount(<ScheduleNewAuditScreen onBack={vi.fn()} onSuccess={vi.fn()} />);
    const cta = button(tree, 'Schedule Audit');
    expect(cta.props.disabled).toBe(true);
    act(() => cta.props.onPress());
    expect(create.mutate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
describe('AuditInspectionScreen -> start, scores, findings, complete', () => {
  const CAT = (code: string) => t(`farmerDetail.rating.category.${code}` as never);
  const detail = {
    id: 'a-1',
    status: 'SCHEDULED',
    farmerName: 'Lakshmi',
    tohfaFarmerId: 'TOHFA-F-2026-0001',
    zoneName: 'Ooty',
    scheduledFor: '2026-11-05T04:30:00Z',
    categoryScores: [
      { categoryCode: 'CERTIFICATION', score: null, maxScore: 10 },
      { categoryCode: 'SOIL_LAND', score: null, maxScore: 10 },
    ],
  } as unknown as AuditDetailDto;
  let inspect: ReturnType<typeof mutation>;

  beforeEach(() => {
    inspect = mutation();
    auditHooks.useInspectAudit.mockImplementation(() => inspect);
    auditHooks.useAuditDetail.mockReturnValue({ data: detail, isPending: false, error: null, refetch: vi.fn() });
  });

  function scoreAll(tree: renderer.ReactTestRenderer) {
    press(byLabel(tree, `Increase ${CAT('CERTIFICATION')}`));
    press(byLabel(tree, `Increase ${CAT('SOIL_LAND')}`));
  }

  it('calls the inspection with the real audit id, its status and every category score', () => {
    const tree = mount(<AuditInspectionScreen auditId="a-1" onBack={vi.fn()} onSubmitted={vi.fn()} can={INSPECT_CAN} />);
    scoreAll(tree);
    press(button(tree, 'Submit Inspection'));
    expect(inspect.mutate).toHaveBeenCalledTimes(1);
    expect(inspect.mutate.mock.calls[0]![0]).toMatchObject({
      auditId: 'a-1',
      status: 'SCHEDULED',
      scores: [
        { categoryCode: 'CERTIFICATION', score: 1 },
        { categoryCode: 'SOIL_LAND', score: 1 },
      ],
    });
  });

  it('BR-06: a category left unscored is incomplete, not zero: nothing is sent', () => {
    const tree = mount(<AuditInspectionScreen auditId="a-1" onBack={vi.fn()} onSubmitted={vi.fn()} can={INSPECT_CAN} />);
    press(byLabel(tree, `Increase ${CAT('CERTIFICATION')}`));
    press(button(tree, 'Submit Inspection'));
    expect(inspect.mutate).not.toHaveBeenCalled();
    expect(allText(tree)).toContain(t('admin.auditActions.inspection.categoryRequired'));
  });

  it('BR-05: a flagged major violation is sent as the finding description from the notes', () => {
    const tree = mount(<AuditInspectionScreen auditId="a-1" onBack={vi.fn()} onSubmitted={vi.fn()} can={INSPECT_CAN} />);
    scoreAll(tree);
    const sw = tree.root.findAll((n) => String(n.type) === 'Switch')[0]!;
    act(() => sw.props.onValueChange(true));
    const notes = tree.root.findAll((n) => String(n.type) === 'TextInput')[0]!;
    act(() => notes.props.onChangeText('  Prohibited pesticide on plot 3  '));
    press(button(tree, 'Submit Inspection'));
    expect(inspect.mutate.mock.calls[0]![0]).toMatchObject({ majorFindingDescription: 'Prohibited pesticide on plot 3' });
  });

  it('does NOT report the inspection as submitted when the server call fails', () => {
    const onSubmitted = vi.fn();
    const tree = mount(<AuditInspectionScreen auditId="a-1" onBack={vi.fn()} onSubmitted={onSubmitted} can={INSPECT_CAN} />);
    scoreAll(tree);
    press(button(tree, 'Submit Inspection'));
    act(() => (inspect.mutate.mock.calls[0]![1] as MutateOptions).onError!(new NetworkError(new Error('down'))));
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('partial failure: scores saved but complete refused, the screen says so, names what was saved, and reports no success', () => {
    const onSubmitted = vi.fn();
    inspect.error = new InspectionStepError('complete', ['start', 'scores'], apiError('AUDIT_INCOMPLETE'));
    const tree = mount(<AuditInspectionScreen auditId="a-1" onBack={vi.fn()} onSubmitted={onSubmitted} can={INSPECT_CAN} />);
    const text = allText(tree);
    expect(text).toContain(t('admin.auditActions.inspection.failedTitle'));
    expect(text).toContain(t('admin.error.AUDIT_INCOMPLETE'));
    expect(text).toContain(t('admin.auditActions.inspection.failedAt', { step: t('admin.auditActions.inspection.step.complete') }));
    expect(text).toContain(
      t('admin.auditActions.inspection.savedSoFar', {
        steps: `${t('admin.auditActions.inspection.saved.start')}, ${t('admin.auditActions.inspection.saved.scores')}`,
      }),
    );
    expect(text).toContain(t('admin.auditActions.inspection.resumeHint'));
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('reports the inspection only from the COMPLETED audit the server returned, with the server\'s totals', () => {
    const onSubmitted = vi.fn();
    const tree = mount(<AuditInspectionScreen auditId="a-1" onBack={vi.fn()} onSubmitted={onSubmitted} can={INSPECT_CAN} />);
    scoreAll(tree);
    press(button(tree, 'Submit Inspection'));
    const completed = {
      ...detail,
      status: 'COMPLETED',
      totalScore: 71,
      maxScore: 100,
      majorViolationsCount: 1,
      tier: 'GOOD',
      completedAt: '2026-11-05T06:00:00Z',
      auditType: 'INTERNAL',
      auditorName: 'Ravi',
      externalAgencyName: null,
    };
    act(() => (inspect.mutate.mock.calls[0]![1] as MutateOptions).onSuccess!(completed));
    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(onSubmitted.mock.calls[0]![0]).toMatchObject({ totalScore: 71, maxScore: 100, majorViolations: 1 });
  });

  it('without the conduct and score permissions it is disabled and sends nothing (fail closed)', () => {
    const tree = mount(<AuditInspectionScreen auditId="a-1" onBack={vi.fn()} onSubmitted={vi.fn()} />);
    const cta = button(tree, 'Submit Inspection');
    expect(cta.props.disabled).toBe(true);
    act(() => cta.props.onPress());
    expect(inspect.mutate).not.toHaveBeenCalled();
  });

  it('draws none of the design fixtures when the audit has not loaded', () => {
    auditHooks.useAuditDetail.mockReturnValue({ data: undefined, isPending: true, error: null, refetch: vi.fn() });
    const tree = mount(<AuditInspectionScreen auditId="a-1" onBack={vi.fn()} can={INSPECT_CAN} />);
    const text = allText(tree);
    for (const fixture of ['Vijay Anand', 'TOHFA-F-00234', 'Sep 14, 2026']) expect(text).not.toContain(fixture);
  });
});

// ---------------------------------------------------------------------------
describe('BulkRescheduleAuditsScreen -> POST /admin/audits/bulk-reschedule', () => {
  function summary(id: string, farmerName: string, scheduledFor: string): AuditSummaryDto {
    return {
      id,
      farmerName,
      tohfaFarmerId: `TOHFA-${id}`,
      farmName: null,
      zoneName: 'Ooty',
      scheduledFor,
      auditType: 'INTERNAL',
      auditorName: 'Ravi',
      externalAgencyName: null,
    } as unknown as AuditSummaryDto;
  }
  const AUDITS = [
    summary('a-1', 'Lakshmi', '2026-10-14T04:30:00Z'),
    summary('a-2', 'Selvi', '2026-10-15T04:30:00Z'),
  ];
  let bulk: ReturnType<typeof mutation>;

  beforeEach(() => {
    bulk = mutation();
    auditHooks.useBulkRescheduleAudits.mockReturnValue(bulk);
    auditHooks.useAuditList.mockReturnValue({
      items: AUDITS,
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      refresh: vi.fn(),
      isRefreshing: false,
      firstPage: undefined,
    });
  });

  /** Selects every audit, presses confirm and accepts the confirmation dialog. */
  function confirmAll(tree: renderer.ReactTestRenderer) {
    press(button(tree, `Select All (${AUDITS.length} audits)`));
    press(button(tree, `Confirm Batch Reschedule (${AUDITS.length})`));
    const buttons = (Alert.alert as ReturnType<typeof vi.fn>).mock.calls[0]![2] as Array<{ text: string; onPress?: () => void }>;
    act(() => buttons.find((b) => b.text === 'Confirm Reschedule')!.onPress!());
  }

  it('BR-03: calls the endpoint with the real audit ids, the shift, and each audit\'s expectedScheduledFor', () => {
    const tree = mount(<BulkRescheduleAuditsScreen onBack={vi.fn()} onSuccess={vi.fn()} can={BULK_CAN} />);
    confirmAll(tree);
    expect(bulk.mutate).toHaveBeenCalledTimes(1);
    expect(bulk.mutate.mock.calls[0]![0]).toEqual({
      items: [
        { auditId: 'a-1', expectedScheduledFor: '2026-10-14T04:30:00Z' },
        { auditId: 'a-2', expectedScheduledFor: '2026-10-15T04:30:00Z' },
      ],
      shiftDays: 7,
      reason: 'Heavy Rainfall / Weather',
    });
  });

  function customDate(tree: renderer.ReactTestRenderer) {
    press(button(tree, 'Custom Date'));
  }
  function typeCustomTime(tree: renderer.ReactTestRenderer, text: string) {
    const input = tree.root.findAll(
      (n) => String(n.type) === 'TextInput' && n.props.placeholder === t('admin.auditActions.bulk.timePlaceholder'),
    )[0]!;
    act(() => input.props.onChangeText(text));
  }

  it('BR-03: Custom Date sends newScheduledFor at the chosen IST time and never shiftDays', () => {
    const tree = mount(<BulkRescheduleAuditsScreen onBack={vi.fn()} onSuccess={vi.fn()} can={BULK_CAN} />);
    customDate(tree);
    typeCustomTime(tree, '4:45 PM');
    confirmAll(tree);
    expect(bulk.mutate).toHaveBeenCalledTimes(1);
    const body = bulk.mutate.mock.calls[0]![0] as Record<string, unknown>;
    expect(String(body['newScheduledFor'])).toMatch(/^\d{4}-\d{2}-\d{2}T16:45:00\+05:30$/);
    expect(body).not.toHaveProperty('shiftDays');
  });

  it('BR-03: Custom Date keeps the confirm button disabled, and sends nothing, until a start time is chosen', () => {
    const tree = mount(<BulkRescheduleAuditsScreen onBack={vi.fn()} onSuccess={vi.fn()} can={BULK_CAN} />);
    press(button(tree, `Select All (${AUDITS.length} audits)`));
    const confirm = () => button(tree, `Confirm Batch Reschedule (${AUDITS.length})`);
    expect(confirm().props.disabled).toBe(false); // shift mode needs no time
    customDate(tree);
    expect(confirm().props.disabled).toBe(true);
    press(confirm());
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(bulk.mutate).not.toHaveBeenCalled();
    typeCustomTime(tree, 'whenever');
    expect(confirm().props.disabled).toBe(true);
    typeCustomTime(tree, '10:00 AM');
    expect(confirm().props.disabled).toBe(false);
  });

  it('does NOT report success when the call fails; shows the error and never opens the success dialog', () => {
    const onSuccess = vi.fn();
    const tree = mount(<BulkRescheduleAuditsScreen onBack={vi.fn()} onSuccess={onSuccess} can={BULK_CAN} />);
    confirmAll(tree);
    act(() => (bulk.mutate.mock.calls[0]![1] as MutateOptions).onError!(new NetworkError(new Error('down'))));
    expect(onSuccess).not.toHaveBeenCalled();
    expect(allText(tree)).toContain(t('admin.error.network'));
    // Only the confirmation dialog was ever shown.
    expect((Alert.alert as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
  });

  it('BR-03: a 200 with failed items is a partial result: success is not reported and the failures are listed', () => {
    const onSuccess = vi.fn();
    const tree = mount(<BulkRescheduleAuditsScreen onBack={vi.fn()} onSuccess={onSuccess} can={BULK_CAN} />);
    confirmAll(tree);
    act(() =>
      (bulk.mutate.mock.calls[0]![1] as MutateOptions).onSuccess!({
        rescheduledCount: 1,
        failedCount: 1,
        results: [
          { auditId: 'a-1', outcome: 'RESCHEDULED' },
          { auditId: 'a-2', outcome: 'FAILED', code: 'AUDIT_QUARTER_TAKEN' },
        ],
      }),
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect((Alert.alert as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1);
    const text = allText(tree);
    expect(text).toContain(t('admin.auditActions.bulk.partialTitle'));
    expect(text).toContain(t('admin.auditActions.bulk.failedRow', { farmer: 'Selvi', reason: t('admin.error.AUDIT_QUARTER_TAKEN') }));
  });

  it('reports success only when the server rescheduled every selected audit, with the server\'s count', () => {
    const onSuccess = vi.fn();
    const onBack = vi.fn();
    const tree = mount(<BulkRescheduleAuditsScreen onBack={onBack} onSuccess={onSuccess} can={BULK_CAN} />);
    confirmAll(tree);
    act(() =>
      (bulk.mutate.mock.calls[0]![1] as MutateOptions).onSuccess!({
        rescheduledCount: 2,
        failedCount: 0,
        results: [
          { auditId: 'a-1', outcome: 'RESCHEDULED' },
          { auditId: 'a-2', outcome: 'RESCHEDULED' },
        ],
      }),
    );
    const calls = (Alert.alert as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[1]![0]).toBe(t('admin.auditActions.bulk.doneTitle'));
    expect(onSuccess).not.toHaveBeenCalled();
    (calls[1]![2] as Array<{ onPress: () => void }>)[0]!.onPress();
    expect(onSuccess).toHaveBeenCalledWith(2);
    expect(onBack).toHaveBeenCalled();
  });

  it('sends nothing when no audit is selected, and nothing without audit.schedule (fail closed)', () => {
    const tree = mount(<BulkRescheduleAuditsScreen onBack={vi.fn()} onSuccess={vi.fn()} can={BULK_CAN} />);
    press(button(tree, 'Confirm Batch Reschedule (0)'));
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(bulk.mutate).not.toHaveBeenCalled();
    expect(allText(tree)).toContain(t('admin.auditActions.bulk.noneSelected'));

    const denied = mount(<BulkRescheduleAuditsScreen onBack={vi.fn()} onSuccess={vi.fn()} can={makeCan(['audit.view'])} />);
    expect(button(denied, 'Confirm Batch Reschedule (0)').props.disabled).toBe(true);
  });

  it('lists the server\'s scheduled audits, none of the design fixtures', () => {
    const tree = mount(<BulkRescheduleAuditsScreen onBack={vi.fn()} can={BULK_CAN} />);
    const text = allText(tree);
    expect(text).toContain('Lakshmi');
    for (const fixture of ['Vijay Anand', 'Karthik Raja', 'Gopalakrishnan', 'Zone A - Coimbatore']) expect(text).not.toContain(fixture);
    expect(auditHooks.useAuditList).toHaveBeenCalledWith(expect.objectContaining({ status: ['SCHEDULED'] }), { enabled: true });
  });
});
