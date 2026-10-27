/**
 * Pure mapper functions for the warehouse-admin area.
 *
 * Maps API DTOs → screen types (WarehouseAdminRow, SubWarehouseAdminItem).
 * No React. No network. No business logic beyond presentation.
 *
 * Key rules:
 * - nearFull status: derived from CAPACITY_NEAR_FULL alert (never hardcode %).
 * - Fields not available from any single endpoint show '—' / 0 (spec-gaps W4u-3).
 * - operatingHours: API returns unknown; we display '—' when absent.
 * - BR-30: Sub scope always sees only its own warehouse.
 */
import type { AlertItemDto } from '../../../api/alerts';
import type { SubAdminDto } from '../../../api/subAdmins';
import type { WarehouseCapacityDto, WarehouseDto } from '../../../api/warehouses';
import type { SubWarehouseAdminItem, WarehouseAdminRow } from './types';

/**
 * Maps a WarehouseDto + its WarehouseCapacityDto + a near-full flag into a
 * WarehouseAdminRow that the overview and city-detail screens consume.
 *
 * nearFull comes from nearFullFromAlerts (checked against the alerts endpoint);
 * we never hardcode a % threshold here.
 */
export function toWarehouseAdminRow(
  wh: WarehouseDto,
  capacity: WarehouseCapacityDto,
  nearFull: boolean,
): WarehouseAdminRow {
  const stockKg = parseFloat(capacity.usedKg) || 0;
  const capacityKg = parseFloat(capacity.capacityKg ?? wh.capacityKg ?? '0') || 0;

  const operatingHours =
    wh.operatingHours != null && typeof wh.operatingHours === 'string'
      ? wh.operatingHours
      : '—';

  return {
    warehouseId: wh.id,
    code: wh.code,
    city: wh.city ?? '—',
    kind: wh.type === 'MAIN' ? 'Main Warehouse' : 'Sub Warehouse',
    address: wh.address ?? '—',
    status: nearFull ? 'Near Capacity' : 'Active',
    stockKg,
    capacityKg,
    // Spec-gap W4u-3: receiptsTodayKg, pendingOrders, openIssues, staffCount,
    // lowStockTrigger have no single API endpoint. Display neutral defaults.
    receiptsTodayKg: 0,
    pendingOrders: 0,
    openIssues: 0,
    staffCount: 0,
    lowStockTrigger: '—',
    operatingHours,
  };
}

/**
 * Maps a SubAdminDto (GET /sub-admins) → SubWarehouseAdminItem for the
 * ManageSubWarehouseAdmins screen.
 *
 * `responsibilities` is not returned by the list endpoint; we leave it empty.
 */
export function toSubWarehouseAdminItem(dto: SubAdminDto): SubWarehouseAdminItem {
  const status: SubWarehouseAdminItem['status'] =
    dto.status === 'ACTIVE' ? 'Active' : 'Pending';

  return {
    id: dto.userId,
    name: dto.fullName,
    warehouseId: dto.warehouseId,
    status,
    // Not returned by the list endpoint.
    responsibilities: [],
  };
}

/**
 * Returns true when the alerts list contains a CAPACITY_NEAR_FULL alert for
 * the given warehouseId. Never uses a hardcoded % threshold (CLAUDE.md 2.2).
 */
export function nearFullFromAlerts(
  alerts: readonly Pick<AlertItemDto, 'warehouseId' | 'type'>[] | undefined,
  warehouseId: string,
): boolean {
  if (!alerts) return false;
  return alerts.some(
    (a) => a.warehouseId === warehouseId && a.type === 'CAPACITY_NEAR_FULL',
  );
}
