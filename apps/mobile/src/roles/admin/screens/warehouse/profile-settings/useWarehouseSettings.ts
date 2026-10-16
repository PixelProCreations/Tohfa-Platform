/**
 * Writes of the Main Warehouse admin's Warehouse Settings screen. The reads
 * are ./useProfileData.ts useWarehouseProfile / useWarehouseCapacity (the
 * same cache the Warehouse Profile screens use), so a saved value shows
 * everywhere once these invalidate the warehouse module.
 *
 * Every rule (formats, the allow-listed body) lives in ./mappers_settings.ts
 * and ../../../api/warehouseSettings.ts, which are tested. No Idempotency-Key:
 * neither write moves money and both are idempotent by value.
 */
import { adminKeys } from '../../../api/queryKeys';
import { setWarehouseCapacity, updateWarehouseProfile, type UpdateWarehouseProfileBody } from '../../../api/warehouseSettings';
import { WAREHOUSE_LIST_MODULE } from '../shared/useWarehouseOptions';
import { useWrite, type LiveWrite } from './useProfileData';

/** useProfileData's module key for GET /warehouses/{id} and .../capacity. */
const WAREHOUSE = 'warehouse';

const INVALIDATES = [adminKeys.module(WAREHOUSE), adminKeys.module(WAREHOUSE_LIST_MODULE)];

/** PATCH /warehouses/{id}/capacity (warehouse.capacity.set, BR-66); `capacityKg` is a decimal string. */
export function useSaveCapacity(warehouseId: string | undefined): LiveWrite<string> {
  return useWrite((capacityKg: string) => setWarehouseCapacity(warehouseId ?? '', capacityKg), INVALIDATES);
}

/** PATCH /warehouses/{id} (warehouse.profile.edit, BR-80): contact phone and/or operating hours only. */
export function useSaveWarehouseProfile(warehouseId: string | undefined): LiveWrite<UpdateWarehouseProfileBody> {
  return useWrite((body: UpdateWarehouseProfileBody) => updateWarehouseProfile(warehouseId ?? '', body), INVALIDATES);
}
