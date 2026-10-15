/**
 * The two warehouse writes the Main Warehouse admin's Warehouse Settings screen
 * makes (docs/openapi.yaml tag Inventory):
 *   PATCH /warehouses/{id}            warehouse.profile.edit  (BR-80; Sub = none)
 *   PATCH /warehouses/{id}/capacity   warehouse.capacity.set  (BR-66; Sub = none)
 *
 * Kept out of ./warehouses.ts on purpose: that module is the read side every
 * warehouse role uses, and profile_wiring.test.ts pins it as read-only.
 *
 * PATCH /warehouses/{id} is strict on the server: it edits `contactPhone` and
 * `operatingHours` and NOTHING else (name, code, capacity ... are a 422). The
 * body is therefore built from an allow-list here, so a caller cannot leak
 * another key onto the wire. `null` clears a value.
 *
 * Capacity is a decimal kg STRING (at most 9 integer digits and 3 decimals,
 * greater than 0), never a float (root CLAUDE.md 2.2 applies to quantities in
 * this app too). The server does not check it against current stock.
 *
 * Neither write moves money or declares an Idempotency-Key; none is sent (both
 * are idempotent by value).
 *
 * No UI imports, so any admin area can reuse this module.
 */
import type { GenericProblemCode } from '@tohfa/shared-types';
import { adminPatch } from './http';
import type { WarehouseCapacityDto, WarehouseDto } from './warehouses';

/** docs/openapi.yaml WarehouseProfileUpdate.operatingHours: the seven weekdays, Monday first. */
export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export type OperatingDayDto = { closed: true } | { closed: false; open: string; close: string };
export type OperatingHoursDto = Record<Weekday, OperatingDayDto>;

/** docs/openapi.yaml WarehouseProfileUpdate: at least one key. */
export interface UpdateWarehouseProfileBody {
  /** E.164 (+91...), or null to clear. */
  contactPhone?: string | null | undefined;
  /** All seven days, or null to clear. */
  operatingHours?: OperatingHoursDto | null | undefined;
}

/** 401, 403 (Sub admin), 404, 422, 500. */
export const ERROR_CODES: readonly GenericProblemCode[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
];

/**
 * The contract bounds of the two request schemas (docs/openapi.yaml), checked
 * before a request so the admin sees the problem at once. Contract formats,
 * not business thresholds: the server rejects anything else with 422.
 */
export const E164_RE = /^\+[1-9][0-9]{7,14}$/;
export const CAPACITY_KG_RE = /^\d{1,9}(\.\d{1,3})?$/;
export const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function warehousePath(warehouseId: string): string {
  return `/warehouses/${encodeURIComponent(warehouseId)}`;
}

/** BR-80: contact phone and/or operating hours, and nothing else. */
export function updateWarehouseProfile(warehouseId: string, body: UpdateWarehouseProfileBody): Promise<WarehouseDto> {
  const allowed: UpdateWarehouseProfileBody = {};
  if (body.contactPhone !== undefined) allowed.contactPhone = body.contactPhone;
  if (body.operatingHours !== undefined) allowed.operatingHours = body.operatingHours;
  if (Object.keys(allowed).length === 0) {
    return Promise.reject(new RangeError('a warehouse profile edit needs contactPhone or operatingHours'));
  }
  return adminPatch<WarehouseDto>(warehousePath(warehouseId), allowed);
}

/** BR-66: sets the capacity; `capacityKg` is a decimal kg string greater than 0. */
export function setWarehouseCapacity(warehouseId: string, capacityKg: string): Promise<WarehouseCapacityDto> {
  if (!CAPACITY_KG_RE.test(capacityKg) || !/[1-9]/.test(capacityKg)) {
    return Promise.reject(new RangeError(`not a capacity in kg: ${capacityKg}`));
  }
  return adminPatch<WarehouseCapacityDto>(`${warehousePath(warehouseId)}/capacity`, { capacityKg });
}
