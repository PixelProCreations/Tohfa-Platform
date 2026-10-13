/**
 * The admin's own warehouse, read-only — docs/openapi.yaml:
 *  - `GET /warehouses/{id}` (`getWarehouse`, `warehouse.own.view`, BR-30/BR-66)
 *  - `GET /warehouses/{id}/capacity` (`getWarehouseCapacity`, `warehouse.own.view`, BR-66)
 *  - `GET /warehouses/{id}/storage-locations` (`listStorageLocations`,
 *    `inventory.batch.view`, BR-30/BR-79) — OFFSET paged (`StorageLocationList`)
 *
 * Callers pass `scope.warehouseId` (BR-30), never user input. A Sub Warehouse
 * Admin gets 404 `NOT_FOUND` (never 403) for any other id (BR-66a).
 *
 * Deliberately NOT wrapped (no screen may offer them to a Sub Warehouse Admin):
 *  - `PATCH /warehouses/{id}` — `warehouse.profile.edit`, SUB_WH_ADMIN `none`;
 *  - `PATCH /warehouses/{id}/capacity` — `warehouse.capacity.set`, SUB `none`;
 *  - storage-location writes — `warehouse.storage_location.manage`, SUB `none`.
 *
 * DTOs mirror the OpenAPI schemas. Quantities are kg decimal strings; convert
 * to grams in the mappers.
 */
import type { OffsetPage } from '../../../shell/api/pagination';
import { adminGet } from './http';

/** docs/openapi.yaml `Warehouse.type`. */
export const WAREHOUSE_TYPES = ['MAIN', 'SUB'] as const;
export type WarehouseTypeDto = (typeof WAREHOUSE_TYPES)[number];

/** Problem codes these endpoints can answer with (docs/openapi.yaml responses). */
export const ERROR_CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
] as const;

/** docs/openapi.yaml `Warehouse`. */
export interface WarehouseDto {
  id: string;
  code: string;
  name: string;
  type: WarehouseTypeDto;
  address?: string | null | undefined;
  city?: string | null | undefined;
  pincode?: string | null | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  /** kg, 3 decimals. */
  capacityKg?: string | null | undefined;
  contactPhone?: string | null | undefined;
  /** Stored JSON passed through unchanged; format is an unconfirmed default (BR-80). */
  operatingHours?: unknown;
  isMarketDayVenue?: boolean | undefined;
  marketDayOfWeek?: number | null | undefined;
  isActive: boolean;
  createdAt: string;
}

/** docs/openapi.yaml `WarehouseCapacity`. */
export interface WarehouseCapacityDto {
  warehouseId: string;
  capacityKg: string | null;
  usedKg: string;
  /** Negative when over capacity — never clamped. */
  availableKg: string | null;
  /** Rounded to 2 decimals by the server; above 100 when over capacity. */
  utilizationPercent: number | null;
}

/** docs/openapi.yaml `StorageLocation`. */
export interface StorageLocationDto {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  locationType: string | null;
  capacityKg: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListStorageLocationsParams {
  /** 1..120 characters; matches code, name or type. */
  q?: string | undefined;
  isActive?: boolean | undefined;
  /** 1-based, server default 1. */
  page?: number | undefined;
  /** 1..100, server default 20. */
  pageSize?: number | undefined;
}

function warehousePath(id: string): string {
  return `/warehouses/${encodeURIComponent(id)}`;
}

export function getWarehouse(id: string, signal?: AbortSignal): Promise<WarehouseDto> {
  return adminGet<WarehouseDto>(warehousePath(id), { signal });
}

export function getWarehouseCapacity(id: string, signal?: AbortSignal): Promise<WarehouseCapacityDto> {
  return adminGet<WarehouseCapacityDto>(`${warehousePath(id)}/capacity`, { signal });
}

export function listStorageLocations(
  warehouseId: string,
  params: ListStorageLocationsParams,
  signal?: AbortSignal,
): Promise<OffsetPage<StorageLocationDto>> {
  return adminGet<OffsetPage<StorageLocationDto>>(`${warehousePath(warehouseId)}/storage-locations`, {
    query: {
      q: params.q,
      isActive: params.isActive,
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  });
}
