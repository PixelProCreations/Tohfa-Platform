/**
 * TanStack Query mutation hooks for admin zone writes (D10).
 */
import {
  createZone,
  transferZoneFarmers,
  updateZone,
  type CreateZoneBody,
  type TransferZoneFarmersBody,
  type UpdateZoneBody,
  type ZoneWriteResponse,
} from './zoneWrites';
import { useAdminMutation } from './hooks';
import { adminKeys } from './queryKeys';

export const ZONES_MODULE = 'zones';

export function useCreateZone() {
  return useAdminMutation<CreateZoneBody, ZoneWriteResponse>({
    mutationFn: (body) => createZone(body),
    invalidates: [adminKeys.module(ZONES_MODULE)],
  });
}

export function useUpdateZone(zoneId: string) {
  return useAdminMutation<UpdateZoneBody, ZoneWriteResponse>({
    mutationFn: (body) => updateZone(zoneId, body),
    invalidates: [adminKeys.module(ZONES_MODULE)],
  });
}

export function useTransferZoneFarmers(zoneId: string) {
  return useAdminMutation<TransferZoneFarmersBody, { transferredCount: number }>({
    mutationFn: (body) => transferZoneFarmers(zoneId, body),
    invalidates: [adminKeys.module(ZONES_MODULE)],
  });
}
