/**
 * The warehouse master list (docs/openapi.yaml tag Inventory):
 *   GET /warehouses   warehouse.all.view   (BR-23, BR-24, BR-66)
 *
 * Super, Tohfa and Main Warehouse Admin see every warehouse; a Sub Warehouse
 * Admin does not hold `warehouse.all.view` and gets 403 here, so a Sub screen
 * never calls this: it reads its own warehouse through GET /warehouses/{id}
 * (./warehouses.ts) with scope.warehouseId (BR-30).
 *
 * The list is offset-paged (`items, page, pageSize, total`), pageSize 1-100.
 * The platform has four fixed warehouses (BR-23), so one page of 100 is the
 * whole list; `listAllWarehouses` still follows `total` so a fifth warehouse
 * would not silently drop out of a picker.
 *
 * `toWarehouseOptions` turns the rows into picker options keyed by the server
 * uuid. Pickers must send this uuid: the old fixture ids ('WH-OOTY', ...) are
 * not uuids and the server answers 422/400 for them.
 *
 * No UI imports, so any admin area can reuse it.
 */
import type { GenericProblemCode } from '@tohfa/shared-types';
import type { OffsetPage } from '../../../shell/api/pagination';
import { adminGet } from './http';
import type { WarehouseDto } from './warehouses';

export interface ListWarehousesParams {
  /** Free-text match on name or code (1-120 chars). */
  q?: string | undefined;
  type?: 'MAIN' | 'SUB' | undefined;
  isActive?: boolean | undefined;
  /** From 1. */
  page?: number | undefined;
  /** 1-100, server default 20. */
  pageSize?: number | undefined;
}

/** 401, 403 (no warehouse.all.view, e.g. a Sub admin), 422, 500. */
export const ERROR_CODES: readonly GenericProblemCode[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'VALIDATION_FAILED',
  'INTERNAL',
];

/** The largest page the server accepts. */
export const WAREHOUSE_LIST_MAX_PAGE_SIZE = 100;

export function listWarehouses(
  params: ListWarehousesParams = {},
  signal?: AbortSignal,
): Promise<OffsetPage<WarehouseDto>> {
  return adminGet<OffsetPage<WarehouseDto>>(
    '/warehouses',
    {
      q: params.q,
      type: params.type,
      isActive: params.isActive === undefined ? undefined : String(params.isActive),
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  );
}

/** Every warehouse, following `total` page by page (normally one request). */
export async function listAllWarehouses(
  params: Omit<ListWarehousesParams, 'page' | 'pageSize'> = {},
  signal?: AbortSignal,
): Promise<WarehouseDto[]> {
  const out: WarehouseDto[] = [];
  for (let page = 1; ; page += 1) {
    const res = await listWarehouses({ ...params, page, pageSize: WAREHOUSE_LIST_MAX_PAGE_SIZE }, signal);
    out.push(...res.items);
    if (res.items.length === 0 || out.length >= res.total) return out;
  }
}

/** One picker entry. `warehouseId` is the server uuid; `warehouseCode` is for display only. */
export interface WarehouseOption {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  type: 'MAIN' | 'SUB';
  city: string | null;
  isActive: boolean;
}

/** Picker options: active warehouses first, MAIN before SUB, then by name. */
export function toWarehouseOptions(rows: readonly WarehouseDto[]): WarehouseOption[] {
  return rows
    .map((row) => ({
      warehouseId: row.id,
      warehouseName: row.name,
      warehouseCode: row.code,
      type: row.type,
      city: row.city ?? null,
      isActive: row.isActive,
    }))
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      if (a.type !== b.type) return a.type === 'MAIN' ? -1 : 1;
      return a.warehouseName.localeCompare(b.warehouseName);
    });
}

/** The display name for a uuid, or undefined when it is not in the list. */
export function warehouseOptionName(options: readonly WarehouseOption[], warehouseId: string | undefined): string | undefined {
  if (warehouseId === undefined) return undefined;
  return options.find((o) => o.warehouseId === warehouseId)?.warehouseName;
}
