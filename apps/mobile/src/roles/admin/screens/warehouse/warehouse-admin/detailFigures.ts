/**
 * Pure figures of the Main admin's Warehouse Detail (design M15-03, which is
 * also the per-warehouse panel of D02): which tabs it draws, today's receiving
 * and orders, Pending Orders, the SWA card line, the inline document line and
 * the recent activity rows. No React, no react-native, so plain-Node vitest
 * covers every decision (tests/warehouse_detail_m15_03.test.ts).
 *
 * A figure the server's answer does not carry is null (the screen shows the
 * dash), never a 0 the server did not say.
 */
import type { Page } from '../../../../../shell/api/pagination';
import type { ListAdminOrdersParams, OrderListStatusFilter, OrderSummaryDto } from '../../../api/orders';
import type { SubAdminDto } from '../../../api/subAdmins';
import type { WarehouseActivityEventDto } from '../../../api/warehouseActivity';
import type { WarehousePerformanceDto } from '../../../api/warehouseOps';
import { t, type TranslationKey } from '../../../i18n';
import { formatAdminDay } from '../../../utils/datetime';
import { isAreaAvailable } from '../availability';
import { kgLabel } from '../dashboard-home-more/mappers_dashboardHome';
import type { WarehouseDocumentView } from '../profile-settings/mappers_documents';
import { toActivityRow, type ActivityRow } from '../storage-ops/mappers';
import { countLabel, subAdminStatusLabel } from './mappers';
import type { PermissionCheck } from './types';

/** The docs/rbac.json codes the detail's added parts are gated on. */
export const WAREHOUSE_DETAIL_CODES = {
  /** GET /admin/orders (Pending Orders). MAIN all. */
  pendingOrders: 'order.list.view_all',
  /** The Inventory tab the Open Inventory link opens. MAIN all. */
  inventory: 'inventory.batch.view',
  /** GET /admin/sub-warehouse-admins (the SWA tab); the same code as WAREHOUSE_ADMIN_CODES.swaCreate. MAIN all. */
  swa: 'admin.sub_wh_admin.create',
} as const;

function isCount(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0;
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

/**
 * The design's tab bar is Overview / Inventory / Operations / Staff / SWA /
 * Capacity / Documents / Activity. Inventory, Operations and Staff only say
 * "detail lives in Module n" and link out, so they are link cards on Overview
 * rather than tabs with nothing of their own.
 */
export type WarehouseDetailTab = 'overview' | 'swa' | 'capacity' | 'documents' | 'activity';

const TAB_LABEL: Readonly<Record<WarehouseDetailTab, TranslationKey>> = {
  overview: 'warehouseAdmin.detail.tab.overview',
  swa: 'warehouseAdmin.detail.tab.swa',
  capacity: 'warehouseAdmin.detail.tab.capacity',
  documents: 'warehouseAdmin.detail.tab.documents',
  activity: 'warehouseAdmin.detail.tab.activity',
};

/** The tabs this caller gets, in design order: a tab whose read it cannot make is not drawn. */
export function warehouseDetailTabs(can: PermissionCheck): WarehouseDetailTab[] {
  const tabs: WarehouseDetailTab[] = ['overview'];
  if (can(WAREHOUSE_DETAIL_CODES.swa)) tabs.push('swa');
  // Capacity reads GET /warehouses/{id}/capacity, which this screen's own code already covers.
  tabs.push('capacity');
  if (isAreaAvailable('warehouseDocuments', can)) tabs.push('documents');
  if (isAreaAvailable('warehouseActivity', can)) tabs.push('activity');
  return tabs;
}

export function warehouseDetailTabLabel(tab: WarehouseDetailTab): string {
  return t(TAB_LABEL[tab]);
}

// ─── Today (GET /warehouses/{id}/performance for the IST day, BR-80) ─────────

/** TODAY'S RECEIVING: the gross kg of today's goods receipts, read as text into grams (never parseFloat). */
export function todayReceivedKgLabel(dto: Pick<WarehousePerformanceDto, 'receiving'>): string | null {
  return kgLabel(dto.receiving.grossQtyKg);
}

/** TODAY'S ORDERS: the orders placed today, the server's exact count. */
export function todayOrdersCount(dto: Pick<WarehousePerformanceDto, 'orders'>): number | null {
  const n = dto.orders.placed;
  return isCount(n) ? n : null;
}

// ─── Pending Orders (GET /admin/orders, order.list.view_all) ─────────────────

/** Owner decision 2026-10-23: pending = waiting to be packed or collected. PENDING_PAYMENT is not an order to work yet. */
export const PENDING_ORDER_STATUSES = ['CONFIRMED', 'PACKED', 'READY_FOR_PICKUP'] as const satisfies readonly OrderListStatusFilter[];

/**
 * The largest page GET /admin/orders serves (`limit` 1-100). An API limit, not
 * a business threshold: the list has no `total`, so one full page per status is
 * the most this figure reads.
 */
export const PENDING_ORDERS_PAGE_LIMIT = 100;

/** One request per pending status (the list takes one status per call), each on this warehouse (BR-30). */
export function pendingOrdersRequests(warehouseId: string): ListAdminOrdersParams[] {
  return PENDING_ORDER_STATUSES.map((status) => ({ status, warehouseId, limit: PENDING_ORDERS_PAGE_LIMIT }));
}

export interface PendingOrdersFigure {
  count: number;
  /** False when a status has more rows than its one page: `count` is then a lower bound. */
  exact: boolean;
}

/**
 * The pending orders over the per-status first pages. Never pages further (the
 * owner's rule: fewest calls); a page with more rows makes the sum a lower
 * bound. A row in another status is not counted, and an order that moved
 * between two of the calls (CONFIRMED -> PACKED) counts once.
 */
export function pendingOrdersFigure(pages: readonly Page<Pick<OrderSummaryDto, 'id' | 'status'>>[]): PendingOrdersFigure {
  const pending: readonly string[] = PENDING_ORDER_STATUSES;
  const ids = new Set<string>();
  let exact = true;
  for (const p of pages) {
    if (p.page.hasMore) exact = false;
    for (const item of p.items) if (pending.includes(item.status)) ids.add(item.id);
  }
  return { count: ids.size, exact };
}

/** "12", or "100+" when the figure is a lower bound. */
export function pendingOrdersLabel(figure: PendingOrdersFigure): string {
  return figure.exact ? countLabel(figure.count) : t('warehouseAdmin.detail.pendingOrders.atLeast', { count: figure.count });
}

// ─── SWA ─────────────────────────────────────────────────────────────────────

/** "Admin ID: SWA-002 · Active"; a legacy row without a code shows its status alone. */
export function swaCardMeta(dto: Pick<SubAdminDto, 'adminCode' | 'status'>): string {
  const status = subAdminStatusLabel(dto.status);
  return dto.adminCode === null ? status : t('warehouseAdmin.detail.swa.meta', { code: dto.adminCode, status });
}

export interface SwaAssignedRow {
  key: string;
  title: string;
  when: string;
}

/**
 * The design's "SWA assigned — name / date" item. The activity feed has no
 * such event (BR-104), so it comes from the assignment itself: its name and
 * `assignedAt` day, under its own heading rather than mixed into the feed.
 */
export function swaAssignedRows(dtos: readonly Pick<SubAdminDto, 'userId' | 'fullName' | 'assignedAt'>[]): SwaAssignedRow[] {
  return dtos.map((dto) => ({
    key: dto.userId,
    title: t('warehouseAdmin.detail.activity.swaAssigned', { name: dto.fullName }),
    when: formatAdminDay(dto.assignedAt),
  }));
}

// ─── Documents (GET /warehouses/{id}/documents, BR-105) ──────────────────────

/**
 * One row of the list. The server orders it by expiry (soonest first, no
 * expiry last), then title, and takes no sort parameter, so this is the
 * document that needs attention first.
 */
export const FIRST_DOCUMENT_PAGE = { page: 1, pageSize: 1 } as const;

/** "Licence · DOC-00125", or the type alone without a number: the Documents list's own line. */
export function documentSubtitle(view: Pick<WarehouseDocumentView, 'docTypeLabel' | 'documentNumber'>): string {
  return view.documentNumber === null ? view.docTypeLabel : `${view.docTypeLabel} · ${view.documentNumber}`;
}

// ─── Activity (GET /warehouses/{id}/activity, BR-104) ────────────────────────

/** Rows of Recent Activity: a list length, not a business limit. */
export const DETAIL_ACTIVITY_ROWS = 5;

/**
 * The newest events as the storage-ops feed shows them (the same mapper, so
 * the same fields: no actor uuid, no farm or customer, BR-16). Cut to
 * DETAIL_ACTIVITY_ROWS even if the server sent more.
 */
export function recentActivityRows(events: readonly WarehouseActivityEventDto[], now: Date): ActivityRow[] {
  return events.slice(0, DETAIL_ACTIVITY_ROWS).map((event) => toActivityRow(event, now));
}
