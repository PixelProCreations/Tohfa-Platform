/**
 * Admin farmer subscription API (D9):
 * - GET /v1/admin/farmers/:id/subscription
 * - POST /v1/admin/farmers/:id/subscription/extend
 * - POST /v1/admin/farmers/:id/subscription/waive
 */
import { adminGet, adminPost } from './http';

export interface FarmerSubscriptionDto {
  farmerId: string;
  tier: string;
  status: string;
  validUntil: string | null;
  maxListings?: number | null;
  updatedAt?: string;
}

export interface ExtendSubscriptionBody {
  days: number;
  reason: string;
}

export interface WaiveSubscriptionBody {
  reason: string;
}

export function getFarmerSubscription(farmerId: string, signal?: AbortSignal) {
  return adminGet<FarmerSubscriptionDto>(`/v1/admin/farmers/${farmerId}/subscription`, undefined, signal);
}

export function extendFarmerSubscription(farmerId: string, body: ExtendSubscriptionBody) {
  return adminPost<FarmerSubscriptionDto>(`/v1/admin/farmers/${farmerId}/subscription/extend`, body);
}

export function waiveFarmerSubscription(farmerId: string, body: WaiveSubscriptionBody) {
  return adminPost<FarmerSubscriptionDto>(`/v1/admin/farmers/${farmerId}/subscription/waive`, body);
}
