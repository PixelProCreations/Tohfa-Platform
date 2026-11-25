/**
 * Admin farmer account status API (D8): POST /v1/admin/farmers/:id/status
 */
import { adminPost } from './http';

export type FarmerStatusAction = 'DISABLE' | 'ACTIVATE';

export interface UpdateFarmerStatusBody {
  action: FarmerStatusAction;
  reason: string;
}

export interface UpdateFarmerStatusResponse {
  farmerId: string;
  status: string;
  isMarketBlocked: boolean;
  updatedAt: string;
}

export function updateFarmerStatus(farmerId: string, body: UpdateFarmerStatusBody) {
  return adminPost<UpdateFarmerStatusResponse>(`/v1/admin/farmers/${farmerId}/status`, body);
}
