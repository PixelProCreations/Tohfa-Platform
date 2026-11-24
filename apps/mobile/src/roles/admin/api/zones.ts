/**
 * The admin agricultural zones (docs/openapi.yaml tag Platform, BR-161):
 *
 *   GET /admin/zones        zone.view
 *   GET /admin/zones/{id}   zone.view
 *
 * Read-only: the spec has NO create, edit, deactivate or archive route for a
 * zone, no location (town / village) resource, no zone polygon and no way to
 * move a farmer between zones (PATCH /admin/farmers/{id} does not take a
 * `zoneId`). The Zone Management screen's write controls therefore stay drawn
 * but report "not available" (see screens/zones/zonesLogic.ts).
 *
 * Per-zone farmer counts are NOT here: they come from GET /admin/farmers/summary
 * (api/farmers.ts getFarmerSummary), which lists ACTIVE zones only.
 *
 * `GET /zones` (public, minimal) is deliberately not used: admin screens use
 * the admin endpoints.
 *
 * No UI imports, so any admin area can reuse it.
 */
import type { GenericProblemCode } from '@tohfa/shared-types';
import { adminGet } from './http';

export { ZONES_MODULE, zoneKeys } from './queryKeys';

/** docs/openapi.yaml listAdminZones `status`; the server default is ACTIVE. */
export type AdminZoneStatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

/** docs/openapi.yaml `AdminZoneListItem`. */
export interface AdminZoneListItemDto {
  id: string;
  /** e.g. ZONE-OOTY. */
  code: string;
  /** e.g. OOT. */
  shortCode: string;
  name: string;
  warehouseId: string | null;
  warehouseName: string | null;
  description: string | null;
  taluks: string[];
  isActive: boolean;
  createdAt: string;
}

/** docs/openapi.yaml `ZoneManager`. `mobile` is masked (BR-92). */
export interface ZoneManagerDto {
  userId: string;
  fullName: string;
  mobile: string;
}

/** docs/openapi.yaml `AdminZoneDetail`: the list item plus the active manager. */
export interface AdminZoneDetailDto extends AdminZoneListItemDto {
  manager: ZoneManagerDto | null;
}

export interface ListAdminZonesParams {
  status?: AdminZoneStatusFilter | undefined;
  warehouseId?: string | undefined;
}

/** 401, 403 (no zone.view), 404 (detail: unknown or out-of-scope zone), 500. */
export const ERROR_CODES: readonly GenericProblemCode[] = ['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND', 'INTERNAL'];

const BASE = '/admin/zones';

/** A plain array, not paged. */
export function listAdminZones(params: ListAdminZonesParams = {}, signal?: AbortSignal): Promise<AdminZoneListItemDto[]> {
  return adminGet<AdminZoneListItemDto[]>(BASE, { status: params.status, warehouseId: params.warehouseId }, signal);
}

export function getAdminZone(id: string, signal?: AbortSignal): Promise<AdminZoneDetailDto> {
  return adminGet<AdminZoneDetailDto>(`${BASE}/${encodeURIComponent(id)}`, undefined, signal);
}
