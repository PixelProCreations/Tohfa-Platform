/**
 * TanStack Query hooks for admin warehouse market open/close control (D13).
 */
import {
  createMarketSchedule,
  deleteMarketSchedule,
  getMarketStatus,
  listMarketSchedules,
  setMarketStatus,
  updateMarketSchedule,
  type CreateMarketScheduleBody,
  type MarketScheduleDto,
  type MarketStatusDto,
  type SetMarketStatusBody,
  type UpdateMarketScheduleBody,
} from './marketControl';
import { useAdminMutation, useAdminQuery } from './hooks';
import { adminKeys } from './queryKeys';

export const MARKET_CONTROL_MODULE = 'marketControl';

export function useMarketStatus(warehouseId: string | undefined, enabled = true) {
  return useAdminQuery<MarketStatusDto>(
    adminKeys.scoped(MARKET_CONTROL_MODULE, warehouseId, { resource: 'status' }),
    (signal) => getMarketStatus(warehouseId!, signal),
    { enabled: enabled && Boolean(warehouseId) },
  );
}

export function useSetMarketStatus(warehouseId: string) {
  return useAdminMutation<SetMarketStatusBody, MarketStatusDto>({
    mutationFn: (body) => setMarketStatus(warehouseId, body),
    invalidates: [adminKeys.module(MARKET_CONTROL_MODULE)],
  });
}

export function useMarketSchedules(warehouseId: string | undefined, enabled = true) {
  return useAdminQuery<{ items: MarketScheduleDto[] }>(
    adminKeys.scoped(MARKET_CONTROL_MODULE, warehouseId, { resource: 'schedules' }),
    (signal) => listMarketSchedules(warehouseId!, signal),
    { enabled: enabled && Boolean(warehouseId) },
  );
}

export function useCreateMarketSchedule(warehouseId: string) {
  return useAdminMutation<CreateMarketScheduleBody, MarketScheduleDto>({
    mutationFn: (body) => createMarketSchedule(warehouseId, body),
    invalidates: [adminKeys.module(MARKET_CONTROL_MODULE)],
  });
}

export function useUpdateMarketSchedule(warehouseId: string) {
  return useAdminMutation<{ scheduleId: string; body: UpdateMarketScheduleBody }, MarketScheduleDto>({
    mutationFn: ({ scheduleId, body }) => updateMarketSchedule(warehouseId, scheduleId, body),
    invalidates: [adminKeys.module(MARKET_CONTROL_MODULE)],
  });
}

export function useDeleteMarketSchedule(warehouseId: string) {
  return useAdminMutation<string, void>({
    mutationFn: (scheduleId) => deleteMarketSchedule(warehouseId, scheduleId),
    invalidates: [adminKeys.module(MARKET_CONTROL_MODULE)],
  });
}
