/**
 * M15-03 Warehouse Detail for the Main admin (WarehouseCityDetailScreen), which
 * is also the per-warehouse detail panel of D02 Warehouse Overview: the tabs,
 * today's receiving kg and orders (BR-80), Pending Orders, the staff count
 * from the roll call (BR-84), the SWA cards, the inline document (BR-105), the
 * recent activity (BR-104), and the Open Inventory / Open Operations links that
 * keep this warehouse (BR-30).
 *
 * Pure functions are tested directly; the wiring between screens is checked on
 * the source, as warehouse_management_m15.test.ts does (no React renderer in
 * this app's plain-Node vitest).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { OrderSummaryDto } from '../api/orders';
import type { SubAdminDto } from '../api/subAdmins';
import type { WarehouseActivityEventDto } from '../api/warehouseActivity';
import type { WarehouseDocumentDto } from '../api/warehouseDocuments';
import type { WarehousePerformanceDto } from '../api/warehouseOps';
import en from '../i18n/en.json';
import ta from '../i18n/ta.json';
import type { Page } from '../../../shell/api/pagination';
import { toDocumentView } from '../screens/warehouse/profile-settings/mappers_documents';
import { toActivityRow } from '../screens/warehouse/storage-ops/mappers';
import { figureLabel } from '../screens/warehouse/warehouse-admin/mappers';
import {
  DETAIL_ACTIVITY_ROWS,
  documentSubtitle,
  FIRST_DOCUMENT_PAGE,
  PENDING_ORDER_STATUSES,
  PENDING_ORDERS_PAGE_LIMIT,
  pendingOrdersFigure,
  pendingOrdersLabel,
  pendingOrdersRequests,
  recentActivityRows,
  swaAssignedRows,
  swaCardMeta,
  todayOrdersCount,
  todayReceivedKgLabel,
  WAREHOUSE_DETAIL_CODES,
  warehouseDetailTabLabel,
  warehouseDetailTabs,
} from '../screens/warehouse/warehouse-admin/detailFigures';
import { inventoryEntryOf, operationsEntryOf } from '../screens/warehouse/warehouse-admin/routes';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const RBAC = fs.readFileSync(path.join(SRC, '..', '..', '..', 'docs', 'rbac.json'), 'utf8');

const WA = 'roles/admin/screens/warehouse/warehouse-admin';
const CITY_RAW = read(`${WA}/WarehouseCityDetailScreen.tsx`);
const CITY = code(CITY_RAW);
const FLOW = code(read(`${WA}/WarehouseAdminFlow.tsx`));
const DATA = code(read(`${WA}/useWarehouseAdminData.ts`));
const SHELL = code(read('roles/admin/screens/dashboard/MainWarehouseAdminDashboardScreen.tsx'));
const DOCS = code(read('roles/admin/screens/warehouse/profile-settings/DocumentsScreen.tsx'));

const COON = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-10-23T06:30:00Z'); // 12:00 IST

const allow = (codes: readonly string[]) => (c: string) => codes.includes(c);

function perf(over: { grossQtyKg?: string; goodsReceipts?: number; placed?: number } = {}): WarehousePerformanceDto {
  return {
    warehouseId: COON,
    from: '2026-10-23',
    to: '2026-10-23',
    orders: { placed: over.placed ?? 84, fulfilled: 0, cancelled: 0, byStatus: [] },
    receiving: {
      goodsReceipts: over.goodsReceipts ?? 3,
      byStatus: [],
      grossQtyKg: over.grossQtyKg ?? '420.000',
      acceptedQtyKg: '0.000',
      rejectedQtyKg: '0.000',
    },
    returns: { requested: 0, byStatus: [] },
    stockMovements: [],
  };
}

function order(id: string, status: string): OrderSummaryDto {
  return { id, orderNumber: `ORD-${id}`, status: status as OrderSummaryDto['status'], totalAmount: '100.00' as OrderSummaryDto['totalAmount'], placedAt: '2026-10-23T04:00:00Z' };
}

function page(items: OrderSummaryDto[], hasMore = false): Page<OrderSummaryDto> {
  return { items, page: { nextCursor: hasMore ? 'next' : null, hasMore } };
}

function swa(over: Partial<SubAdminDto> = {}): SubAdminDto {
  return {
    userId: 'u-1',
    adminCode: 'SWA-002',
    fullName: 'Karthik Kumar',
    status: 'ACTIVE',
    warehouseId: COON,
    assignedAt: '2026-08-15T05:00:00Z',
    ...over,
  };
}

function doc(over: Partial<WarehouseDocumentDto> = {}): WarehouseDocumentDto {
  return {
    id: 'd-1',
    warehouseId: COON,
    docType: 'LICENSE',
    title: 'Warehouse Registration',
    documentNumber: 'DOC-00125',
    issueDate: null,
    expiryDate: '2026-12-31',
    status: 'ACTIVE',
    uploadId: 'up-1',
    uploadedBy: 'u-9',
    archivedAt: null,
    archivedBy: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
    ...over,
  };
}

function event(n: number): WarehouseActivityEventDto {
  return {
    type: 'GOODS_RECEIPT',
    sourceId: `gr-${n}`,
    occurredAt: '2026-10-23T04:50:00Z',
    reference: `GRN-${n}`,
    status: null,
    severity: null,
    qtyKg: '420.000',
    direction: null,
    actorId: 'u-7',
  };
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

describe('tabs (design M15-03): only tabs whose content this screen has, each on its read permission', () => {
  it('Overview and Capacity always; SWA, Documents and Activity only with their codes', () => {
    expect(warehouseDetailTabs(allow([]))).toEqual(['overview', 'capacity']);
    expect(
      warehouseDetailTabs(allow(['admin.sub_wh_admin.create', 'warehouse.document.view', 'warehouse.activity.view'])),
    ).toEqual(['overview', 'swa', 'capacity', 'documents', 'activity']);
    expect(warehouseDetailTabs(allow(['warehouse.activity.view']))).toEqual(['overview', 'capacity', 'activity']);
  });

  it('never draws the design Inventory / Operations / Staff tabs: they are links to other modules', () => {
    const every = warehouseDetailTabs(() => true);
    for (const tab of ['inventory', 'operations', 'staff']) expect(every).not.toContain(tab);
  });

  it('every tab label is an i18n key with English and Tamil', () => {
    for (const tab of warehouseDetailTabs(() => true)) {
      const key = `warehouseAdmin.detail.tab.${tab}`;
      expect(en).toHaveProperty([key]);
      expect(ta).toHaveProperty([key]);
      expect(warehouseDetailTabLabel(tab)).toBe((en as Record<string, string>)[key]);
    }
  });

  it('the screen draws the tab bar from warehouseDetailTabs(can) on local state, with the shared ChipGroup', () => {
    expect(CITY).toMatch(/warehouseDetailTabs\(can\)/);
    expect(CITY).toMatch(/useState<WarehouseDetailTab>\('overview'\)/);
    expect(CITY).toMatch(/<ChipGroup\s/);
  });
});

// ─── Today (BR-80) ───────────────────────────────────────────────────────────

describe("BR-80: today's receiving and orders come from the IST day's performance (exact counts only)", () => {
  it("BR-80: TODAY'S RECEIVING is the gross kg of today's goods receipts, read as text into grams", () => {
    expect(todayReceivedKgLabel(perf({ grossQtyKg: '420.000' }))).toBe('420 kg');
    expect(todayReceivedKgLabel(perf({ grossQtyKg: '1250.5' }))).toBe('1,250.5 kg');
    expect(todayReceivedKgLabel(perf({ grossQtyKg: '0.000' }))).toBe('0 kg');
  });

  it('BR-80: an unreadable kg is null (the tile shows the dash), never 0', () => {
    expect(todayReceivedKgLabel(perf({ grossQtyKg: 'abc' }))).toBeNull();
    expect(todayReceivedKgLabel(perf({ grossQtyKg: '' }))).toBeNull();
  });

  it("BR-80: TODAY'S ORDERS is orders.placed; anything but a whole count is null", () => {
    expect(todayOrdersCount(perf({ placed: 84 }))).toBe(84);
    expect(todayOrdersCount(perf({ placed: 0 }))).toBe(0);
    expect(todayOrdersCount(perf({ placed: 2.5 }))).toBeNull();
    expect(todayOrdersCount(perf({ placed: -1 }))).toBeNull();
  });

  it('BR-80: the screen reads both from the one performance read it already makes', () => {
    expect(CITY).toMatch(/useTodayPerformance\(warehouseId, true\)/);
    expect(CITY).toMatch(/todayReceivedKgLabel\(/);
    expect(CITY).toMatch(/todayOrdersCount\(/);
    expect(CITY).toMatch(/t\('warehouseAdmin\.detail\.kpi\.todayReceiving'\)/);
    expect(CITY).toMatch(/t\('warehouseAdmin\.detail\.kpi\.todayOrders'\)/);
  });
});

// ─── Pending Orders (D02 detail panel) ───────────────────────────────────────

describe('Pending Orders: CONFIRMED, PACKED or READY_FOR_PICKUP, three one-page reads', () => {
  it('BR-30: one request per pending status, each sent with this warehouse uuid and the API max page', () => {
    expect(PENDING_ORDER_STATUSES).toEqual(['CONFIRMED', 'PACKED', 'READY_FOR_PICKUP']);
    expect(PENDING_ORDERS_PAGE_LIMIT).toBe(100);
    expect(pendingOrdersRequests(COON)).toEqual([
      { status: 'CONFIRMED', warehouseId: COON, limit: 100 },
      { status: 'PACKED', warehouseId: COON, limit: 100 },
      { status: 'READY_FOR_PICKUP', warehouseId: COON, limit: 100 },
    ]);
  });

  it('PENDING_PAYMENT is never requested', () => {
    expect(pendingOrdersRequests(COON).map((r) => r.status)).not.toContain('PENDING_PAYMENT');
  });

  it('the sum is exact when no page has more rows', () => {
    const figure = pendingOrdersFigure([page([order('a', 'CONFIRMED'), order('b', 'CONFIRMED')]), page([order('c', 'PACKED')]), page([])]);
    expect(figure).toEqual({ count: 3, exact: true });
    expect(pendingOrdersLabel(figure)).toBe('3');
    expect(pendingOrdersLabel(pendingOrdersFigure([page([]), page([]), page([])]))).toBe('0');
  });

  it('a page with more rows makes the figure a lower bound, shown as "n+", never paged further', () => {
    const full = Array.from({ length: 100 }, (_, i) => order(`c${i}`, 'CONFIRMED'));
    const figure = pendingOrdersFigure([page(full, true), page([order('p', 'PACKED')]), page([])]);
    expect(figure).toEqual({ count: 101, exact: false });
    expect(pendingOrdersLabel(figure)).toBe('101+');
  });

  it('a PENDING_PAYMENT (or any other) row is not counted, and an order seen twice counts once', () => {
    const figure = pendingOrdersFigure([
      page([order('a', 'CONFIRMED'), order('x', 'PENDING_PAYMENT')]),
      page([order('a', 'PACKED'), order('y', 'PICKED_UP')]),
      page([order('r', 'READY_FOR_PICKUP')]),
    ]);
    expect(figure).toEqual({ count: 2, exact: true });
  });

  it('is read with order.list.view_all, a code that exists in docs/rbac.json, keyed by this warehouse', () => {
    expect(WAREHOUSE_DETAIL_CODES.pendingOrders).toBe('order.list.view_all');
    expect(CITY).toMatch(/usePendingOrders\(warehouseId, can\(WAREHOUSE_DETAIL_CODES\.pendingOrders\)\)/);
    expect(DATA).toMatch(/adminKeys\.scoped\(ORDERS, warehouseId, \{ resource: 'pendingCount'/);
    expect(DATA).toMatch(/pendingOrdersRequests\(id\)\.map\(\(params\) => listAdminOrders\(params, signal\)\)/);
    // One page per status: no cursor is ever sent.
    expect(DATA).not.toMatch(/listAdminOrders\([^)]*cursor/);
  });

  it('the tile is drawn only with the code', () => {
    expect(CITY).toMatch(/canPending\s*\?/);
    expect(CITY).toMatch(/t\('warehouseAdmin\.detail\.kpi\.pendingOrders'\)/);
  });
});

// ─── Staff count (BR-84) ─────────────────────────────────────────────────────

describe('BR-84: staff count from the roll call, never 0 when unknown', () => {
  it('BR-84: loading and error never read as 0; a real 0 does', () => {
    expect(figureLabel({ data: undefined, isLoading: true, error: null }, String)).not.toBe('0');
    expect(figureLabel({ data: undefined, isLoading: false, error: new Error('x') }, String)).toBe(en['warehouseAdmin.figure.unavailable']);
    expect(figureLabel({ data: 0, isLoading: false, error: null }, String)).toBe('0');
  });

  it('BR-84: the screen reuses useStaffCounts for this warehouse, only with admin.staff.attendance.view', () => {
    expect(CITY).toMatch(/const canStaffCount = can\(WAREHOUSE_OVERVIEW_CODES\.staffCount\)/);
    expect(CITY).toMatch(/useStaffCounts\(\[warehouseId\], canStaffCount\)\.get\(warehouseId\)/);
    expect(CITY).toMatch(/canStaffCount\s*\?/);
    expect(CITY).toMatch(/t\('warehouseAdmin\.detail\.field\.staffCount'\)/);
  });
});

// ─── SWA ─────────────────────────────────────────────────────────────────────

describe('SWA card', () => {
  it('"Admin ID: code · status", the status only for a legacy row without a code', () => {
    expect(swaCardMeta(swa())).toBe('Admin ID: SWA-002 · Active');
    expect(swaCardMeta(swa({ adminCode: null, status: 'PENDING' }))).toBe('Pending');
  });

  it('the screen draws one card per SWA, the unassigned text with none, and the View All link from the flow', () => {
    expect(CITY).toMatch(/swas\.data\.map\(/);
    expect(CITY).toMatch(/swaCardMeta\(/);
    expect(CITY).toMatch(/subAdminStatusTone\(/);
    expect(CITY).toMatch(/t\('warehouseAdmin\.swa\.unassigned'\)/);
    expect(CITY).toMatch(/t\('warehouseAdmin\.detail\.swa\.viewAll'\)/);
    expect(FLOW).toMatch(
      /onOpenSubAdmins=\{canOpenWarehouseAdminRoute\('ManageSubWarehouseAdmins', can\) \? \(\) => navigate\('ManageSubWarehouseAdmins'\) : undefined\}/,
    );
  });

  it('the "SWA assigned" activity item is the assignment date and name, clearly labelled', () => {
    expect(swaAssignedRows([swa()])).toEqual([{ key: 'u-1', title: 'SWA assigned — Karthik Kumar', when: '15 Aug 2026' }]);
    expect(swaAssignedRows([])).toEqual([]);
  });
});

// ─── Documents (BR-105) ──────────────────────────────────────────────────────

describe('BR-105: the inline document card, view-only', () => {
  it('BR-105: asks for one row; the server orders the list soonest expiry first, so that row is shown', () => {
    expect(FIRST_DOCUMENT_PAGE).toEqual({ page: 1, pageSize: 1 });
    expect(DATA).toMatch(/listWarehouseDocuments\(id, FIRST_DOCUMENT_PAGE, signal\)/);
    expect(DATA).toMatch(/adminKeys\.scoped\(WAREHOUSE_DOCUMENTS_MODULE, warehouseId,/);
  });

  it('BR-105: the number line falls back exactly as the Documents list does', () => {
    expect(documentSubtitle(toDocumentView(doc()))).toBe('Licence · DOC-00125');
    expect(documentSubtitle(toDocumentView(doc({ documentNumber: null })))).toBe('Licence');
    expect(documentSubtitle(toDocumentView(doc({ documentNumber: '  ' })))).toBe('Licence');
    expect(DOCS).toContain('doc.documentNumber === null ? doc.docTypeLabel : `${doc.docTypeLabel} · ${doc.documentNumber}`');
  });

  it('BR-105: status pill and expiry line come from the existing document mapper (server status, never computed)', () => {
    const view = toDocumentView(doc({ status: 'EXPIRING_SOON' }));
    expect(view.statusLabel).toBe(en['warehouseDocs.status.EXPIRING_SOON']);
    expect(CITY).toMatch(/statusLabel=\{document\.statusLabel\}/);
    expect(CITY).toMatch(/statusTone=\{document\.statusTone\}/);
    expect(CITY).toMatch(/dateLine=\{document\.dateLine\}/);
  });

  it('BR-105: gated on warehouse.document.view, with no write control, and View All Documents on this warehouse', () => {
    expect(CITY).toMatch(/useFirstWarehouseDocument\(warehouseId, tabs\.includes\('documents'\)\)/);
    expect(CITY).toMatch(/onPress=\{\(\) => onOpenDocuments\(w\.id\)\}/);
    expect(CITY).toMatch(/t\('warehouseAdmin\.detail\.documents\.viewAll'\)/);
    expect(CITY).not.toMatch(/archiveWarehouseDocument|updateWarehouseDocument|createWarehouseDocument/);
  });
});

// ─── Activity (BR-104) ───────────────────────────────────────────────────────

describe('BR-104: recent activity, read-only and farm-anonymous', () => {
  it('BR-104: at most DETAIL_ACTIVITY_ROWS rows, each mapped by the storage-ops activity mapper', () => {
    expect(DETAIL_ACTIVITY_ROWS).toBe(5);
    const events = Array.from({ length: 8 }, (_, i) => event(i));
    const rows = recentActivityRows(events, NOW);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual(toActivityRow(events[0] as WarehouseActivityEventDto, NOW));
  });

  it('BR-104: a row carries no actor uuid, only whether one was recorded (BR-16: no person or farm identity)', () => {
    const [row] = recentActivityRows([event(1)], NOW);
    expect(row).toBeDefined();
    expect(JSON.stringify(row)).not.toContain('u-7');
    expect(row?.hasActor).toBe(true);
  });

  it('BR-104 / BR-30: one page of this warehouse, the limit sent, gated on warehouse.activity.view', () => {
    expect(DATA).toMatch(/listWarehouseActivity\(id, \{ limit: DETAIL_ACTIVITY_ROWS \}, signal\)/);
    expect(DATA).toMatch(/adminKeys\.scoped\(STORAGE_OPS, warehouseId, \{ resource: 'activity-recent'/);
    expect(CITY).toMatch(/useRecentWarehouseActivity\(warehouseId, tabs\.includes\('activity'\)\)/);
    expect(CITY).toMatch(/<ActivityRowCard key=\{row\.key\} row=\{row\} \/>/);
  });
});

// ─── Open Inventory / Open Operations keep this warehouse (BR-30) ────────────

describe('BR-30: Open Inventory / Open Operations open on this warehouse', () => {
  it('BR-30: the Operations hub entry preselects the warehouse; without one the hub keeps its own pick', () => {
    expect(operationsEntryOf(COON)).toEqual({ initialScreen: 'Operations', initialParams: { warehouseId: COON } });
    expect(operationsEntryOf(undefined)).toEqual({ initialScreen: 'Operations', initialParams: undefined });
  });

  it('BR-30: the Inventory entry is the Inventory tab filtered to the warehouse', () => {
    expect(inventoryEntryOf(COON)).toEqual({ tab: 'Inventory', filterWarehouseId: COON });
  });

  it('the links are hidden without the target code (inventory.batch.view; the hub gate) or a host', () => {
    expect(WAREHOUSE_DETAIL_CODES.inventory).toBe('inventory.batch.view');
    expect(CITY).toMatch(/can\(WAREHOUSE_DETAIL_CODES\.inventory\) \? onOpenInventory : undefined/);
    expect(CITY).toMatch(/canOpenStorageRoute\('Operations', can\) \? onOpenOperations : undefined/);
    expect(CITY).toMatch(/onPress=\{\(\) => openInventory\(w\.id\)\}/);
    expect(CITY).toMatch(/onPress=\{\(\) => openOperations\(w\.id\)\}/);
  });

  it('the flow takes the host callbacks and hands them to City Detail', () => {
    expect(FLOW).toMatch(/onOpenInventory\?: \(\(warehouseId: string\) => void\) \| undefined/);
    expect(FLOW).toMatch(/onOpenOperations\?: \(\(warehouseId: string\) => void\) \| undefined/);
    expect(FLOW).toMatch(/onOpenInventory=\{onOpenInventory\}/);
    expect(FLOW).toMatch(/onOpenOperations=\{onOpenOperations\}/);
  });

  it('both Main shell hosts of the flow wire both links, and the hub opens on the chosen warehouse', () => {
    const hosts = SHELL.match(/<WarehouseAdminFlow[\s\S]*?\/>/g) ?? [];
    expect(hosts.length).toBe(2);
    for (const host of hosts) {
      expect(host).toMatch(/onOpenInventory=\{openInventoryOn\}/);
      expect(host).toMatch(/onOpenOperations=\{openOperationsOn\}/);
    }
    expect(SHELL).toMatch(/const entry = inventoryEntryOf\(warehouseId\);\s*setFilterWarehouseId\(entry\.filterWarehouseId\);\s*openTab\(entry\.tab\);/);
    expect(SHELL).toMatch(/setOperationsWarehouseId\(warehouseId\);\s*navigateWh\('warehouse_operations'\);/);
    expect(SHELL).toMatch(/const operationsEntry = operationsEntryOf\(operationsWarehouseId\);/);
    expect(SHELL).toMatch(/initialScreen=\{operationsEntry\.initialScreen\}\s*initialParams=\{operationsEntry\.initialParams\}/);
  });
});

// ─── Codes, docblock, i18n ───────────────────────────────────────────────────

describe('codes, docblock and strings', () => {
  it('every code the detail adds exists in docs/rbac.json', () => {
    for (const c of Object.values(WAREHOUSE_DETAIL_CODES)) expect(RBAC).toContain(`"code": "${c}"`);
  });

  it('the docblock no longer says staff count and pending orders are impossible', () => {
    expect(CITY_RAW).not.toMatch(/no endpoint carries them: staff count/);
    expect(CITY_RAW).not.toMatch(/"Pending orders" is now "open tasks"/);
  });

  it('the KPIs are the shared stat card', () => {
    expect(CITY).toMatch(/<OverviewDashboardCard\s/);
    expect(CITY).toMatch(/<OverviewCardsGrid>/);
  });

  const NEW_KEYS = [
    'warehouseAdmin.detail.tab.overview',
    'warehouseAdmin.detail.tab.swa',
    'warehouseAdmin.detail.tab.capacity',
    'warehouseAdmin.detail.tab.documents',
    'warehouseAdmin.detail.tab.activity',
    'warehouseAdmin.detail.field.status',
    'warehouseAdmin.detail.field.staffCount',
    'warehouseAdmin.detail.kpi.todayReceiving',
    'warehouseAdmin.detail.kpi.todayOrders',
    'warehouseAdmin.detail.kpi.pendingOrders',
    'warehouseAdmin.detail.kpi.receiptsCount',
    'warehouseAdmin.detail.pendingOrders.atLeast',
    'warehouseAdmin.detail.link.inventory.text',
    'warehouseAdmin.detail.link.inventory.action',
    'warehouseAdmin.detail.link.operations.text',
    'warehouseAdmin.detail.link.operations.action',
    'warehouseAdmin.detail.link.staff.text',
    'warehouseAdmin.detail.link.staff.action',
    'warehouseAdmin.detail.link.settings.text',
    'warehouseAdmin.detail.link.settings.action',
    'warehouseAdmin.detail.link.capacity',
    'warehouseAdmin.detail.swa.meta',
    'warehouseAdmin.detail.swa.viewAll',
    'warehouseAdmin.detail.section.documents',
    'warehouseAdmin.detail.documents.hint',
    'warehouseAdmin.detail.documents.viewAll',
    'warehouseAdmin.detail.documents.empty',
    'warehouseAdmin.detail.section.activity',
    'warehouseAdmin.detail.activity.empty',
    'warehouseAdmin.detail.activity.assignments',
    'warehouseAdmin.detail.activity.swaAssigned',
  ] as const;

  it.each(NEW_KEYS)('%s exists in English and Tamil', (key) => {
    expect(en).toHaveProperty([key]);
    expect(ta).toHaveProperty([key]);
  });

  it('every warehouseAdmin.detail.* key the screen uses has a Tamil string', () => {
    const used = [...CITY.matchAll(/t\('(warehouseAdmin\.detail\.[^']+)'/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(10);
    for (const key of used) expect(ta).toHaveProperty([key as string]);
  });
});
