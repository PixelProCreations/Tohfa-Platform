/**
 * Audit Inspection overview (screens/dashboard/AuditInspectionOverviewScreen.tsx),
 * ported from origin/Superadmin-main. Pins:
 *   - every designed element (header, 6 info cells, progress card, 12 section
 *     rows, both buttons) renders with no access and no data, values as the dash;
 *   - real values come from GET /admin/audits/{id}, read only with audit.view;
 *   - Review & Submit calls POST /complete only on IN_PROGRESS with audit.conduct;
 *     Save Draft on SCHEDULED calls POST /start; host callbacks run after success;
 *   - pure format helpers; source guards (no hex, no numeric fontSize, no fixtures).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as AuditsModule from '../api/audits';
import type { AuditDetailDto } from '../api/audits';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
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
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Ellipse: 'Ellipse',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));

const api = vi.hoisted(() => ({ getAudit: vi.fn(), startAudit: vi.fn(), completeAudit: vi.fn() }));
vi.mock('../api/audits', async (importOriginal) => ({
  ...(await importOriginal<typeof AuditsModule>()),
  getAudit: api.getAudit,
  startAudit: api.startAudit,
  completeAudit: api.completeAudit,
}));

import { Alert } from 'react-native';
import { AuditInspectionOverviewScreen } from '../screens/dashboard/AuditInspectionOverviewScreen';
import {
  AUDIT_12_SECTIONS,
  completedSectionIds,
  overviewActions,
  overviewInfo,
  overviewProgress,
  sectionSubtitle,
} from '../screens/dashboard/auditInspectionOverviewFormat';
import { makeCan } from '../permissions/can';

const DASH = '—';
const AUDIT_ID = '00000000-0000-4000-8000-0000000000a1';
const noop = () => undefined;

function audit(over: Partial<AuditDetailDto> = {}): AuditDetailDto {
  return {
    id: AUDIT_ID,
    farmerId: '00000000-0000-4000-8000-0000000000f1',
    tohfaFarmerId: 'TOHFA-F-2026-0001',
    farmerName: 'Test Farmer',
    farmId: null,
    farmName: 'Test Farm',
    zoneId: null,
    zoneName: null,
    fiscalYear: '2026-27',
    quarter: 3,
    auditType: 'INTERNAL',
    status: 'IN_PROGRESS',
    scheduledFor: '2026-10-15T04:30:00.000Z',
    startedAt: null,
    completedAt: null,
    auditorUserId: null,
    auditorName: 'Test Auditor',
    externalAgencyName: null,
    totalScore: null,
    maxScore: 100,
    tier: null,
    majorViolationsCount: 0,
    findingCounts: { major: 0, minor: 0, observation: 0, openMajor: 0 },
    redFlagged: false,
    summary: null,
    reportUpload: null,
    redFlagReason: null,
    redFlaggedAt: null,
    redFlaggedByName: null,
    cancelledReason: null,
    cancelledAt: null,
    createdByName: 'Creator',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: null,
    categoryScores: [],
    findings: [],
    ...over,
  };
}

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}
const allText = (tree: renderer.ReactTestRenderer) => textOf(tree.toJSON()).join('\n');
const byId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);
const one = (tree: renderer.ReactTestRenderer, id: string) => {
  const hits = byId(tree, id);
  expect(hits.length, id).toBe(1);
  return hits[0]!;
};

async function flush() {
  for (let i = 0; i < 6; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

async function mount(el: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<QueryClientProvider client={client}>{el}</QueryClientProvider>);
  });
  await flush();
  return tree;
}

const baseProps = {
  record: { id: AUDIT_ID },
  completedSections: {},
  onSelectSection: noop,
  onBack: noop,
  onReviewSubmit: noop,
  onSaveDraft: noop,
};

beforeEach(() => {
  api.getAudit.mockResolvedValue(audit());
  api.startAudit.mockResolvedValue(audit({ status: 'IN_PROGRESS' }));
  api.completeAudit.mockResolvedValue(audit({ status: 'COMPLETED' }));
});
afterEach(() => vi.clearAllMocks());

describe('format helpers', () => {
  it('overviewInfo: every value is the dash before the audit loads', () => {
    expect(Object.values(overviewInfo(undefined))).toEqual([DASH, DASH, DASH, DASH, DASH, DASH]);
  });

  it('overviewInfo: maps the audit; the human audit code is always the dash (API has none)', () => {
    const info = overviewInfo(audit({ farmName: null, auditorName: null, externalAgencyName: 'Agency X', auditType: 'EXTERNAL' }));
    expect(info.auditCode).toBe(DASH);
    expect(info.farmer).toBe('Test Farmer');
    expect(info.farm).toBe(DASH);
    expect(info.auditor).toBe('Agency X');
    expect(info.type).toBe('External Audit');
    expect(info.date).toBe('15 Oct 2026');
  });

  it('completedSectionIds: COMPLETED audit is all 12 done; otherwise the host map decides', () => {
    expect(completedSectionIds('COMPLETED', {}).size).toBe(12);
    expect([...completedSectionIds('IN_PROGRESS', { 2: true, 5: false, 7: true })]).toEqual([2, 7]);
    expect(completedSectionIds(undefined, {}).size).toBe(0);
  });

  it('overviewProgress: heading, dash for the missing-field count, and bar width', () => {
    const p = overviewProgress(new Set([1, 2, 3]));
    expect(p.heading).toBe('3 of 12 sections complete');
    expect(p.subtext).toBe(`${DASH} required fields are still missing`);
    expect(p.fillWidth).toBe('25%');
    expect(overviewProgress(new Set()).fillWidth).toBe('4%');
    expect(overviewProgress(new Set(AUDIT_12_SECTIONS.map((s) => s.id))).subtext).toBe('All required fields are completed and verified');
  });

  it('sectionSubtitle: done / required-left dash / not started / rating copy', () => {
    const byIdx = (id: number) => AUDIT_12_SECTIONS.find((s) => s.id === id)!;
    expect(sectionSubtitle(byIdx(1), true)).toBe('Completed and verified');
    expect(sectionSubtitle(byIdx(1), false)).toBe(`${DASH} required fields left`);
    expect(sectionSubtitle(byIdx(8), false)).toBe('Not started');
    expect(sectionSubtitle(byIdx(12), false)).toBe('Rate the farmer based on the audit inspection.');
  });

  it('overviewActions: submit only IN_PROGRESS with conduct; draft on live audits; nothing while busy', () => {
    expect(overviewActions({ status: 'IN_PROGRESS', canConduct: true, busy: false })).toEqual({ canSubmit: true, canSaveDraft: true, draftStartsAudit: false });
    expect(overviewActions({ status: 'SCHEDULED', canConduct: true, busy: false })).toEqual({ canSubmit: false, canSaveDraft: true, draftStartsAudit: true });
    expect(overviewActions({ status: 'COMPLETED', canConduct: true, busy: false })).toMatchObject({ canSubmit: false, canSaveDraft: false });
    expect(overviewActions({ status: 'IN_PROGRESS', canConduct: false, busy: false })).toMatchObject({ canSubmit: false, canSaveDraft: false });
    expect(overviewActions({ status: 'IN_PROGRESS', canConduct: true, busy: true })).toMatchObject({ canSubmit: false, canSaveDraft: false });
  });
});

describe('AuditInspectionOverviewScreen', () => {
  it('design parity: every element renders with no access and no data, values as the dash', async () => {
    const tree = await mount(<AuditInspectionOverviewScreen {...baseProps} />);
    expect(api.getAudit).not.toHaveBeenCalled();
    for (const id of ['back', 'subtitle', 'info', 'progress', 'submit', 'saveDraft']) one(tree, `auditOverview.${id}`);
    for (const id of ['auditId', 'type', 'farmer', 'farm', 'date', 'auditor']) one(tree, `auditOverview.meta.${id}`);
    for (const s of AUDIT_12_SECTIONS) one(tree, `auditOverview.section.${s.id}`);
    const text = allText(tree);
    expect(text).toContain('Audit Inspection');
    expect(text).toContain('0 of 12 sections complete');
    expect(text).toContain('Inspection sections');
    expect(text).toContain('Review & Submit');
    expect(text).toContain('Save Draft');
    expect(text.split('\n').filter((l) => l === DASH).length).toBe(6);
    // none of the design's fixture fallbacks
    for (const fixture of ['AUD-2026-0042', 'Ramesh', 'Suresh Kumar', '15 Oct 2026']) expect(text).not.toContain(fixture);
    expect(one(tree, 'auditOverview.submit').props.disabled).toBe(true);
    expect(one(tree, 'auditOverview.saveDraft').props.disabled).toBe(true);
  });

  it('reads the audit with audit.view and shows real values', async () => {
    const tree = await mount(<AuditInspectionOverviewScreen {...baseProps} can={makeCan(['audit.view'])} />);
    expect(api.getAudit).toHaveBeenCalledWith(AUDIT_ID, expect.anything());
    const text = allText(tree);
    expect(text).toContain('Test Farmer');
    expect(text).toContain('Test Farm');
    expect(text).toContain('Test Auditor');
    expect(text).toContain('Internal Audit');
    expect(text).toContain('15 Oct 2026');
    // without audit.conduct the actions stay disabled
    expect(one(tree, 'auditOverview.submit').props.disabled).toBe(true);
  });

  it('Review & Submit completes an IN_PROGRESS audit, then calls the host with it', async () => {
    const onReviewSubmit = vi.fn();
    const tree = await mount(
      <AuditInspectionOverviewScreen {...baseProps} onReviewSubmit={onReviewSubmit} can={makeCan(['audit.view', 'audit.conduct'])} />,
    );
    const submit = one(tree, 'auditOverview.submit');
    expect(submit.props.disabled).toBe(false);
    await act(async () => submit.props.onPress());
    await flush();
    expect(api.completeAudit).toHaveBeenCalledWith(AUDIT_ID, undefined);
    expect(onReviewSubmit).toHaveBeenCalledWith(expect.objectContaining({ status: 'COMPLETED' }));
  });

  it('a refused completion is shown and the host is not told it succeeded', async () => {
    api.completeAudit.mockRejectedValue(new Error('AUDIT_INCOMPLETE'));
    const onReviewSubmit = vi.fn();
    const tree = await mount(
      <AuditInspectionOverviewScreen {...baseProps} onReviewSubmit={onReviewSubmit} can={makeCan(['audit.view', 'audit.conduct'])} />,
    );
    await act(async () => one(tree, 'auditOverview.submit').props.onPress());
    await flush();
    expect(Alert.alert).toHaveBeenCalled();
    expect(onReviewSubmit).not.toHaveBeenCalled();
  });

  it('Save Draft on a SCHEDULED audit starts it; Review & Submit stays disabled', async () => {
    api.getAudit.mockResolvedValue(audit({ status: 'SCHEDULED' }));
    const onSaveDraft = vi.fn();
    const tree = await mount(
      <AuditInspectionOverviewScreen {...baseProps} onSaveDraft={onSaveDraft} can={makeCan(['audit.view', 'audit.conduct'])} />,
    );
    expect(one(tree, 'auditOverview.submit').props.disabled).toBe(true);
    await act(async () => one(tree, 'auditOverview.saveDraft').props.onPress());
    await flush();
    expect(api.startAudit).toHaveBeenCalledWith(AUDIT_ID, undefined);
    expect(onSaveDraft).toHaveBeenCalledTimes(1);
  });

  it('a COMPLETED audit reads as 12 of 12 with both actions disabled', async () => {
    api.getAudit.mockResolvedValue(audit({ status: 'COMPLETED' }));
    const tree = await mount(<AuditInspectionOverviewScreen {...baseProps} can={makeCan(['audit.view', 'audit.conduct'])} />);
    const text = allText(tree);
    expect(text).toContain('12 of 12 sections complete');
    expect(text).toContain('All required fields are completed and verified');
    expect(one(tree, 'auditOverview.submit').props.disabled).toBe(true);
    expect(one(tree, 'auditOverview.saveDraft').props.disabled).toBe(true);
  });

  it('section rows navigate through the host', async () => {
    const onSelectSection = vi.fn();
    const tree = await mount(<AuditInspectionOverviewScreen {...baseProps} onSelectSection={onSelectSection} />);
    await act(async () => one(tree, 'auditOverview.section.7').props.onPress());
    expect(onSelectSection).toHaveBeenCalledWith(7);
  });
});

describe('source guards', () => {
  const dir = path.resolve(__dirname, '../screens/dashboard');
  const files = ['AuditInspectionOverviewScreen.tsx', 'auditInspectionOverviewFormat.ts'].map((f) =>
    fs.readFileSync(path.join(dir, f), 'utf8'),
  );
  it('no raw colour, numeric fontSize, fontFamily, fixtures, mobile-ui or role strings', () => {
    for (const src of files) {
      expect(src).not.toMatch(/(['"`])#[0-9A-Fa-f]{3,8}\1|\brgba?\s*\(/);
      expect(src).not.toMatch(/fontSize\s*:\s*[0-9]/);
      expect(src).not.toMatch(/fontFamily/);
      expect(src).not.toMatch(/from '\.\/fixtures'/);
      expect(src).not.toMatch(/@tohfa\/mobile-ui/);
      expect(src).not.toMatch(/SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN/);
      expect(src).not.toMatch(/as any/);
    }
  });
});
