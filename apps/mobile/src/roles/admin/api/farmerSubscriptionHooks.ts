/**
 * TanStack Query hooks for admin farmer subscription management (D9).
 */
import {
  extendFarmerSubscription,
  getFarmerSubscription,
  waiveFarmerSubscription,
  type ExtendSubscriptionBody,
  type FarmerSubscriptionDto,
  type WaiveSubscriptionBody,
} from './farmerSubscription';
import { useAdminMutation, useAdminQuery } from './hooks';
import { adminKeys, FARMERS_MODULE } from './queryKeys';

export function useFarmerSubscription(farmerId: string | undefined, enabled = true) {
  return useAdminQuery<FarmerSubscriptionDto>(
    adminKeys.scoped(FARMERS_MODULE, undefined, { resource: 'subscription', farmerId: farmerId ?? null }),
    (signal) => getFarmerSubscription(farmerId!, signal),
    { enabled: enabled && Boolean(farmerId) },
  );
}

export function useExtendFarmerSubscription(farmerId: string) {
  return useAdminMutation<ExtendSubscriptionBody, FarmerSubscriptionDto>({
    mutationFn: (body) => extendFarmerSubscription(farmerId, body),
    invalidates: [adminKeys.module(FARMERS_MODULE)],
  });
}

export function useWaiveFarmerSubscription(farmerId: string) {
  return useAdminMutation<WaiveSubscriptionBody, FarmerSubscriptionDto>({
    mutationFn: (body) => waiveFarmerSubscription(farmerId, body),
    invalidates: [adminKeys.module(FARMERS_MODULE)],
  });
}
