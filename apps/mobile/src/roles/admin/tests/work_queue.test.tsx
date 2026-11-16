/**
 * Tohfa Admin Work Queue tab (screens/work-queue/WorkQueueScreen.tsx), ported
 * from the design (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen, "WORK
 * QUEUE TAB (M1-S03)" + "WORK QUEUE FILTER & SORT MODAL (M1-S03a)").
 * Rendered with react-test-renderer and a real QueryClient against a mocked
 * api/tasks client. Pins:
 *   - nothing is requested or shown without task.own.view (BR-77);
 *   - cards come only from GET /admin/tasks; none of the design's fixture
 *     names, codes, dates or counts render;
 *   - the pending count is GET /admin/tasks/summary's `open`;
 *   - loading / error with Retry / empty states;
 *   - design parity: ONE action button per card (no Mark as Done), drawn
 *     always and enabled only with its host callback; the count line keeps
 *     "blocked / exception" as an em dash; Assigned to (disabled) and the
 *     Blocked / Exception / In review statuses are present;
 *   - the design categories with no backend source show the empty state
 *     without a request;
 *   - source guards (no hex, no numeric fontSize, no role names, <= 800 lines,
 *     t() keys exist, catalogue registered).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as WarehouseListModule from '../api/warehouseList';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  BackHandler: { addEventListener: vi.fn(() => ({ remove: () => undefined })) },
  Modal: 'Modal',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Defs: 'Defs',
  Line: 'Line',
  LinearGradient: 'LinearGradient',
  Path: 'Path',
  Rect: 'Rect',
  Stop: 'Stop',
}));

const api = vi.hoisted(() => ({
  listTasks: vi.fn(),
  getTaskSummary: vi.fn(),
  markTaskDone: vi.fn(),
  listAllWarehouses: vi.fn(),
}));
vi.mock('../api/tasks', () => ({
  listTasks: api.listTasks,
  getTaskSummary: api.getTaskSummary,
  markTaskDone: api.markTaskDone,
}));
vi.mock('../api/warehouseList', async (importOriginal) => ({
  ...(await importOriginal<typeof WarehouseListModule>()),
  listAllWarehouses: api.listAllWarehouses,
}));

import { WorkQueueScreen, type WorkQueueScreenProps } from '../screens/work-queue';
import type { TaskItemDto } from '../api/tasks';
import { makeCan } from '../permissions/can';
import { en, t } from '../i18n';

const ADMIN = path.join(__dirname, '..');
const DIR = path.join(ADMIN, 'screens/work-queue');

const WH = '00000000-0000-4000-8000-0000000000aa';

function task(over: Partial<TaskItemDto> = {}): TaskItemDto {
  return {
    itemKey: 'ORDER_PACK:00000000-0000-4000-8000-000000000001',
    type: 'ORDER_PACK',
    titleKey: 'task.order_pack.title',
    refType: 'ORDER',
    refId: '00000000-0000-4000-8000-000000000001',
    warehouseId: WH,
    createdAt: '2026-11-09T06:00:00.000Z',
    dueOn: null,
    params: { orderNumber: 'ORD-2026-0451', customerName: 'Meena' },
    state: 'OPEN',
    ...over,
  };
}

const ORDER = task();
const QC = task({
  itemKey: 'GOODS_RECEIPT_QC:00000000-0000-4000-8000-000000000002',
  type: 'GOODS_RECEIPT_QC',
  refType: 'GOODS_RECEIPT',
  refId: '00000000-0000-4000-8000-000000000002',
  params: { grnNumber: 'GRN-0099' },
});
const RETURN = task({
  itemKey: 'RETURN_INSPECTION:00000000-0000-4000-8000-000000000003',
  type: 'RETURN_INSPECTION',
  refType: 'RETURN_REQUEST',
  refId: '00000000-0000-4000-8000-000000000003',
  params: { rmaNumber: 'RMA-0007' },
});

const page = (items: TaskItemDto[]) => ({ items, page: { nextCursor: null, hasMore: false } });

const VIEW = makeCan(['task.own.view', 'warehouse.all.view']);

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}
const allText = (tree: renderer.ReactTestRenderer) => textOf(tree.toJSON()).join('\n');
const byId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);
const cardIds = (tree: renderer.ReactTestRenderer) =>
  tree.root
    .findAll((n) => typeof n.type === 'string' && /^workQueue\.card\.[^.]+:[^.]+$/.test(String(n.props.testID ?? '')))
    .map((n) => String(n.props.testID).slice('workQueue.card.'.length));

async function flush() {
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

async function mount(props: Partial<WorkQueueScreenProps> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <QueryClientProvider client={client}>
        <WorkQueueScreen can={VIEW} onBack={() => undefined} {...props} />
      </QueryClientProvider>,
    );
  });
  await flush();
  return tree;
}

async function press(tree: renderer.ReactTestRenderer, id: string) {
  const nodes = byId(tree, id);
  expect(nodes.length, id).toBeGreaterThan(0);
  await act(async () => {
    nodes[0]!.props.onPress();
  });
  await flush();
}

beforeEach(() => {
  api.listTasks.mockResolvedValue(page([ORDER, QC, RETURN]));
  api.getTaskSummary.mockResolvedValue({ open: 3, byType: { ORDER_PACK: 1, GOODS_RECEIPT_QC: 1, RETURN_INSPECTION: 1 } });
  api.markTaskDone.mockResolvedValue({ itemKey: ORDER.itemKey, state: 'DONE', snoozedUntil: null, updatedAt: '2026-11-11T05:00:00Z' });
  api.listAllWarehouses.mockResolvedValue([]);
});
afterEach(() => vi.clearAllMocks());

describe('permission gate (task.own.view, BR-77)', () => {
  it('without task.own.view: no request, a not-available note, no cards', async () => {
    const tree = await mount({ can: makeCan(['warehouse.all.view']) });
    expect(api.listTasks).not.toHaveBeenCalled();
    expect(api.getTaskSummary).not.toHaveBeenCalled();
    expect(allText(tree)).toContain(t('workQueue.noAccess.title'));
    expect(cardIds(tree)).toEqual([]);
  });

  it('with task.own.view: lists the open tasks of the whole scope (no warehouse id)', async () => {
    await mount();
    expect(api.listTasks).toHaveBeenCalled();
    const params = api.listTasks.mock.calls[0]![0] as Record<string, unknown>;
    expect(params.state).toBe('open');
    expect(params.warehouseId).toBeUndefined();
    expect(params.type).toBeUndefined();
  });
});

describe('cards from the API', () => {
  it('renders one card per real task, with its type, reference and person', async () => {
    const tree = await mount();
    expect(cardIds(tree)).toEqual([ORDER.itemKey, QC.itemKey, RETURN.itemKey]);
    const text = allText(tree);
    for (const s of ['ORD-2026-0451', 'Meena', 'GRN-0099', 'RMA-0007', t('workQueue.type.ORDER_PACK'), t('workQueue.type.GOODS_RECEIPT_QC')]) {
      expect(text).toContain(s);
    }
    expect(text).toContain(t('workQueue.title'));
  });

  it('shows the summary open count, and none of the design fixtures', async () => {
    api.getTaskSummary.mockResolvedValue({ open: 17, byType: {} });
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain(t('workQueue.count.line', { pending: 17, blocked: '—' }));
    for (const fixture of ['Arun', 'Sathish Kumar', 'Vijay', 'TSK-', 'PO-2026', 'APP-2026', 'AUD-2026', '6 pending', '3 blocked', 'Oct 2026', 'Ooty', 'Coonoor', 'Kotagiri', 'scientific']) {
      expect(text).not.toContain(fixture);
    }
  });

  it('design parity: the count line reads "N pending · — blocked / exception" (no API state for blocked / exception)', async () => {
    api.getTaskSummary.mockResolvedValue({ open: 3, byType: {} });
    const tree = await mount();
    expect(allTextOfInstance(byId(tree, 'workQueue.count')[0]!)).toBe('3 pending · — blocked / exception');
  });

  it('design parity: the count line stays drawn with dashes while the summary is unavailable', async () => {
    api.getTaskSummary.mockRejectedValue(new Error('offline'));
    const tree = await mount();
    expect(allTextOfInstance(byId(tree, 'workQueue.count')[0]!)).toBe('— pending · — blocked / exception');
  });

  it('empty list: the empty state', async () => {
    api.listTasks.mockResolvedValue(page([]));
    const tree = await mount();
    expect(allText(tree)).toContain(t('workQueue.empty.title'));
    expect(cardIds(tree)).toEqual([]);
  });

  it('error: the error state, and Retry asks again', async () => {
    api.listTasks.mockRejectedValue(new Error('offline'));
    const tree = await mount();
    expect(allText(tree)).toContain(t('async.error.title'));
    const calls = api.listTasks.mock.calls.length;
    api.listTasks.mockResolvedValue(page([ORDER]));
    const retry = tree.root
      .findAll((n) => typeof n.type === 'string' && n.props.accessibilityRole === 'button')
      .find((n) => allTextOfInstance(n).includes(t('async.retry')));
    expect(retry).toBeDefined();
    await act(async () => retry!.props.onPress());
    await flush();
    expect(api.listTasks.mock.calls.length).toBeGreaterThan(calls);
    expect(cardIds(tree)).toEqual([ORDER.itemKey]);
  });

  it('search narrows the loaded cards', async () => {
    const tree = await mount();
    const input = byId(tree, 'workQueue.search')[0]!;
    await act(async () => input.props.onChangeText('grn-0099'));
    expect(cardIds(tree)).toEqual([QC.itemKey]);
  });
});

function allTextOfInstance(n: renderer.ReactTestInstance): string {
  return n
    .findAll((c) => (c.type as unknown) === 'Text')
    .map((c) => [c.props.children].flat().join(''))
    .join('|');
}

describe('task actions', () => {
  it('design parity: exactly one action button per card, and no Mark as Done anywhere', async () => {
    const tree = await mount({ onOpenOrders: vi.fn(), onOpenReceiving: vi.fn(), onOpenReturns: vi.fn() });
    for (const id of [ORDER.itemKey, QC.itemKey, RETURN.itemKey]) {
      const card = byId(tree, `workQueue.card.${id}`)[0]!;
      const buttons = card.findAll((n) => typeof n.type === 'string' && n.props.accessibilityRole === 'button');
      expect(buttons, id).toHaveLength(1);
      expect(buttons[0]!.props.testID).toBe(`workQueue.card.${id}.open`);
      expect(byId(tree, `workQueue.card.${id}.done`)).toHaveLength(0);
    }
    expect(allText(tree)).not.toMatch(/mark as done/i);
  });

  it('the single button is labelled by the action the task supports', async () => {
    const tree = await mount({ onOpenOrders: vi.fn(), onOpenReceiving: vi.fn(), onOpenReturns: vi.fn() });
    const label = (id: string) => allTextOfInstance(byId(tree, `workQueue.card.${id}.open`)[0]!);
    expect(label(ORDER.itemKey)).toBe(t('workQueue.action.openOrder'));
    expect(label(QC.itemKey)).toBe(t('workQueue.action.openReceipt'));
    expect(label(RETURN.itemKey)).toBe(t('workQueue.action.openReturn'));
  });

  it('the button is always drawn; without a host callback it is disabled, with one it calls it', async () => {
    let tree = await mount();
    for (const id of [ORDER.itemKey, QC.itemKey, RETURN.itemKey]) {
      const button = byId(tree, `workQueue.card.${id}.open`)[0];
      expect(button, id).toBeDefined();
      expect(button!.props.disabled).toBe(true);
    }

    const onOpenOrders = vi.fn();
    const onOpenReceiving = vi.fn();
    const onOpenReturns = vi.fn();
    tree = await mount({ onOpenOrders, onOpenReceiving, onOpenReturns });
    expect(byId(tree, `workQueue.card.${ORDER.itemKey}.open`)[0]!.props.disabled).toBe(false);
    await press(tree, `workQueue.card.${ORDER.itemKey}.open`);
    await press(tree, `workQueue.card.${QC.itemKey}.open`);
    await press(tree, `workQueue.card.${RETURN.itemKey}.open`);
    expect(onOpenOrders).toHaveBeenCalledTimes(1);
    expect(onOpenReceiving).toHaveBeenCalledTimes(1);
    expect(onOpenReturns).toHaveBeenCalledTimes(1);
    expect(api.markTaskDone).not.toHaveBeenCalled();
  });

  it('back calls onBack', async () => {
    const onBack = vi.fn();
    const tree = await mount({ onBack });
    await press(tree, 'workQueue.back');
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('filter and sort sheet', () => {
  it('a task type with a source is sent to the API on Apply', async () => {
    const tree = await mount();
    await press(tree, 'workQueue.filterOpen');
    await press(tree, 'workQueue.filter.field.type');
    await press(tree, 'workQueue.filter.option.type.GOODS_RECEIPT_QC');
    await press(tree, 'workQueue.filter.apply');
    const last = api.listTasks.mock.calls[api.listTasks.mock.calls.length - 1]![0] as Record<string, unknown>;
    expect(last.type).toBe('GOODS_RECEIPT_QC');
  });

  it.each(['PURCHASE_EXCEPTION', 'FARMER_APPLICATION', 'AUDIT_FOLLOW_UP', 'QUALITY_DISCREPANCY'])(
    '%s (no backend source yet): the empty state, no request with that type',
    async (category) => {
      const tree = await mount();
      await press(tree, 'workQueue.filterOpen');
      await press(tree, 'workQueue.filter.field.type');
      await press(tree, `workQueue.filter.option.type.${category}`);
      await press(tree, 'workQueue.filter.apply');
      expect(cardIds(tree)).toEqual([]);
      expect(allText(tree)).toContain(t('workQueue.empty.title'));
      for (const call of api.listTasks.mock.calls) expect((call[0] as Record<string, unknown>).type).not.toBe(category);
    },
  );

  it('design parity: Status offers exactly the design options, in order, with no Done', async () => {
    const tree = await mount();
    await press(tree, 'workQueue.filterOpen');
    await press(tree, 'workQueue.filter.field.status');
    const options = tree.root
      .findAll((n) => typeof n.type === 'string' && String(n.props.testID ?? '').startsWith('workQueue.filter.option.status.'))
      .map((n) => String(n.props.testID).split('.').pop());
    expect(options).toEqual(['all', 'pending', 'exception', 'overdue', 'blocked', 'inReview']);
    expect(allText(tree)).toContain('In review');
  });

  it.each(['exception', 'blocked', 'inReview'])(
    'design parity: status %s is selectable, shows the empty state, and does not change the request',
    async (status) => {
      const tree = await mount();
      await press(tree, 'workQueue.filterOpen');
      await press(tree, 'workQueue.filter.field.status');
      await press(tree, `workQueue.filter.option.status.${status}`);
      await press(tree, 'workQueue.filter.apply');
      expect(cardIds(tree)).toEqual([]);
      expect(allText(tree)).toContain(t('workQueue.empty.title'));
      for (const call of api.listTasks.mock.calls) {
        const params = call[0] as Record<string, unknown>;
        expect(params.state).toBe('open');
        expect(params.type).toBeUndefined();
      }
    },
  );

  it('Cancel discards the draft', async () => {
    const tree = await mount();
    await press(tree, 'workQueue.filterOpen');
    await press(tree, 'workQueue.filter.field.status');
    await press(tree, 'workQueue.filter.option.status.blocked');
    await press(tree, 'workQueue.filter.cancel');
    expect(cardIds(tree)).toEqual([ORDER.itemKey, QC.itemKey, RETURN.itemKey]);
  });

  it('design parity: the Assigned to field is drawn (disabled, empty value, hint), with no invented names', async () => {
    const tree = await mount();
    await press(tree, 'workQueue.filterOpen');
    const field = byId(tree, 'workQueue.filter.field.assign');
    expect(field).toHaveLength(1);
    expect(field[0]!.props.disabled).toBe(true);
    const text = allText(tree);
    expect(text).toContain('Assigned to');
    expect(text).toContain(t('workQueue.assign.helper'));
    await act(async () => field[0]!.props.onPress?.());
    expect(byId(tree, 'workQueue.filter.option.assign.anyone')).toHaveLength(0);
    for (const name of ['Arun', 'Vijay', 'Sathish Kumar']) expect(text).not.toContain(name);
  });

  it('the warehouse field lists the real warehouses and sends the chosen id', async () => {
    api.listAllWarehouses.mockResolvedValue([
      { id: WH, name: 'North Store', code: 'N1', type: 'SUB', city: null, isActive: true },
    ]);
    const tree = await mount();
    await press(tree, 'workQueue.filterOpen');
    await press(tree, 'workQueue.filter.field.warehouse');
    await press(tree, `workQueue.filter.option.warehouse.${WH}`);
    await press(tree, 'workQueue.filter.apply');
    const last = api.listTasks.mock.calls[api.listTasks.mock.calls.length - 1]![0] as Record<string, unknown>;
    expect(last.warehouseId).toBe(WH);
  });

  it('no warehouse.all.view: no warehouse field and no warehouse request', async () => {
    const tree = await mount({ can: makeCan(['task.own.view']) });
    await press(tree, 'workQueue.filterOpen');
    expect(byId(tree, 'workQueue.filter.field.warehouse')).toHaveLength(0);
    expect(api.listAllWarehouses).not.toHaveBeenCalled();
  });
});

describe('source guards', () => {
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).map((f) => path.join(DIR, f)) : [];
  const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('the folder exists', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.length > 0 ? files : ['<none>'])('%s: <= 800 lines, tokens only, no roles, no fixtures, no literal JSX text', (file) => {
    const src = fs.readFileSync(file, 'utf8');
    expect(src.split('\n').length).toBeLessThanOrEqual(800);
    const c = code(src);
    expect(c).not.toMatch(/['"`]#[0-9A-Fa-f]{3,8}['"`]|\brgba?\(/);
    expect(c).not.toMatch(/fontSize:\s*\d/);
    expect(c).not.toMatch(/(padding|margin)[A-Za-z]*:\s*\d/);
    expect(c).not.toMatch(/TOHFA_ADMIN|SUPER_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN|\.role\s*===/);
    expect(c).not.toMatch(/=>\s*true\b/);
    expect(c).not.toMatch(/Arun|Sathish|Vijay|TSK-|WH-[A-Z]/);
    expect(c).not.toMatch(/>\s*[A-Za-z][A-Za-z ]+\s*<\//);
  });

  it('every t() key used exists in the English catalogue', () => {
    for (const file of files) {
      for (const m of fs.readFileSync(file, 'utf8').matchAll(/\bt\('([^']+)'/g)) {
        expect(Object.prototype.hasOwnProperty.call(en, m[1]!), `${file}: ${m[1]}`).toBe(true);
      }
    }
  });

  it('the workQueue catalogue is registered (ta is empty and falls back)', () => {
    const catEn = JSON.parse(fs.readFileSync(path.join(ADMIN, 'i18n/workQueue.en.json'), 'utf8')) as Record<string, string>;
    const catTa = JSON.parse(fs.readFileSync(path.join(ADMIN, 'i18n/workQueue.ta.json'), 'utf8')) as Record<string, string>;
    expect(catTa).toEqual({});
    for (const [k, v] of Object.entries(catEn)) expect((en as Record<string, string>)[k], k).toBe(v);
  });
});
