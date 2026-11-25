/**
 * TanStack Query hooks for admin farmer status updates (D8).
 */
import { updateFarmerStatus, type UpdateFarmerStatusBody, type UpdateFarmerStatusResponse } from './farmerStatus';
import { useAdminMutation } from './hooks';
import { adminKeys, FARMERS_MODULE } from './queryKeys';

export function useUpdateFarmerStatus(farmerId: string) {
  return useAdminMutation<UpdateFarmerStatusBody, UpdateFarmerStatusResponse>({
    mutationFn: (body) => updateFarmerStatus(farmerId, body),
    invalidates: [adminKeys.module(FARMERS_MODULE)],
  });
}
