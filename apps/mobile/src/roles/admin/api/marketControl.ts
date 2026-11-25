/**
 * Admin warehouse market open/close control API (D13):
 * - GET /v1/admin/warehouses/:id/market-status
 * - POST /v1/admin/warehouses/:id/market-status
 * - GET /v1/admin/warehouses/:id/market-schedules
 * - POST /v1/admin/warehouses/:id/market-schedules
 * - PATCH /v1/admin/warehouses/:id/market-schedules/:scheduleId
 * - DELETE /v1/admin/warehouses/:id/market-schedules/:scheduleId
 */
import { adminDelete, adminGet, adminPatch, adminPost } from './http';

export type MarketRepeatRule = 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type MarketAction = 'OPEN' | 'CLOSE';

export interface MarketStatusDto {
  warehouseId: string;
  isMarketOpen: boolean;
  updatedAt?: string;
}

export interface MarketScheduleDto {
  id: string;
  warehouseId: string;
  action: MarketAction;
  scheduleDate: string;
  scheduleTime: string;
  repeatRule: MarketRepeatRule;
  isActive: boolean;
  reason?: string | null;
  createdAt: string;
}

export interface SetMarketStatusBody {
  isOpen: boolean;
  reason?: string;
}

export interface CreateMarketScheduleBody {
  action: MarketAction;
  scheduleDate: string;
  scheduleTime: string;
  repeatRule: MarketRepeatRule;
  reason?: string;
}

export interface UpdateMarketScheduleBody {
  scheduleDate?: string;
  scheduleTime?: string;
  repeatRule?: MarketRepeatRule;
  isActive?: boolean;
  reason?: string;
}

export function getMarketStatus(warehouseId: string, signal?: AbortSignal) {
  return adminGet<MarketStatusDto>(`/v1/admin/warehouses/${warehouseId}/market-status`, undefined, signal);
}

export function setMarketStatus(warehouseId: string, body: SetMarketStatusBody) {
  return adminPost<MarketStatusDto>(`/v1/admin/warehouses/${warehouseId}/market-status`, body);
}

export function listMarketSchedules(warehouseId: string, signal?: AbortSignal) {
  return adminGet<{ items: MarketScheduleDto[] }>(`/v1/admin/warehouses/${warehouseId}/market-schedules`, undefined, signal);
}

export function createMarketSchedule(warehouseId: string, body: CreateMarketScheduleBody) {
  return adminPost<MarketScheduleDto>(`/v1/admin/warehouses/${warehouseId}/market-schedules`, body);
}

export function updateMarketSchedule(warehouseId: string, scheduleId: string, body: UpdateMarketScheduleBody) {
  return adminPatch<MarketScheduleDto>(`/v1/admin/warehouses/${warehouseId}/market-schedules/${scheduleId}`, body);
}

export function deleteMarketSchedule(warehouseId: string, scheduleId: string) {
  return adminDelete(`/v1/admin/warehouses/${warehouseId}/market-schedules/${scheduleId}`);
}
