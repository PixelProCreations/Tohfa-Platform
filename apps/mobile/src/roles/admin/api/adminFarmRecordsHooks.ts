/**
 * TanStack Query hooks for admin farm records (D5/D6).
 */
import {
  createAdminAnimal,
  createAdminDiaryEntry,
  createAdminFarmAsset,
  createAdminLifecycleEvent,
  createAdminProductionLog,
  deleteAdminFarmAsset,
  listAdminDiaryEntries,
  updateAdminAnimal,
  updateAdminDiaryEntry,
  updateAdminFarmAsset,
  type AdminDiaryEntryDto,
  type CreateAdminAnimalBody,
  type CreateAdminDiaryEntryBody,
  type CreateAdminFarmAssetBody,
  type CreateAdminLifecycleEventBody,
  type CreateAdminProductionLogBody,
  type UpdateAdminAnimalBody,
  type UpdateAdminDiaryEntryBody,
  type UpdateAdminFarmAssetBody,
} from './adminFarmRecords';
import { useAdminMutation, useAdminQuery } from './hooks';
import { adminKeys } from './queryKeys';

export const FARM_RECORDS_MODULE = 'farmRecords';

export function useAdminDiaryEntries(farmerId: string | undefined, enabled = true) {
  return useAdminQuery<{ items: AdminDiaryEntryDto[] }>(
    adminKeys.scoped(FARM_RECORDS_MODULE, undefined, { resource: 'diary', farmerId: farmerId ?? null }),
    (signal) => listAdminDiaryEntries(farmerId!, signal),
    { enabled: enabled && Boolean(farmerId) },
  );
}

export function useCreateAdminDiaryEntry(farmerId: string) {
  return useAdminMutation<CreateAdminDiaryEntryBody, AdminDiaryEntryDto>({
    mutationFn: (body) => createAdminDiaryEntry(farmerId, body),
    invalidates: [adminKeys.module(FARM_RECORDS_MODULE)],
  });
}

export function useUpdateAdminDiaryEntry(farmerId: string) {
  return useAdminMutation<{ entryId: string; body: UpdateAdminDiaryEntryBody }, AdminDiaryEntryDto>({
    mutationFn: ({ entryId, body }) => updateAdminDiaryEntry(farmerId, entryId, body),
    invalidates: [adminKeys.module(FARM_RECORDS_MODULE)],
  });
}

export function useCreateAdminFarmAsset(farmerId: string) {
  return useAdminMutation<CreateAdminFarmAssetBody, { id: string; addedOnBehalf?: boolean }>({
    mutationFn: (body) => createAdminFarmAsset(farmerId, body),
    invalidates: [adminKeys.module(FARM_RECORDS_MODULE)],
  });
}

export function useUpdateAdminFarmAsset(farmerId: string) {
  return useAdminMutation<{ assetId: string; body: UpdateAdminFarmAssetBody }, { id: string; addedOnBehalf?: boolean }>({
    mutationFn: ({ assetId, body }) => updateAdminFarmAsset(farmerId, assetId, body),
    invalidates: [adminKeys.module(FARM_RECORDS_MODULE)],
  });
}

export function useDeleteAdminFarmAsset(farmerId: string) {
  return useAdminMutation<string, void>({
    mutationFn: (assetId) => deleteAdminFarmAsset(farmerId, assetId),
    invalidates: [adminKeys.module(FARM_RECORDS_MODULE)],
  });
}

export function useCreateAdminAnimal(farmerId: string) {
  return useAdminMutation<CreateAdminAnimalBody, { id: string; addedOnBehalf?: boolean }>({
    mutationFn: (body) => createAdminAnimal(farmerId, body),
    invalidates: [adminKeys.module(FARM_RECORDS_MODULE)],
  });
}

export function useUpdateAdminAnimal(farmerId: string) {
  return useAdminMutation<{ animalId: string; body: UpdateAdminAnimalBody }, { id: string; addedOnBehalf?: boolean }>({
    mutationFn: ({ animalId, body }) => updateAdminAnimal(farmerId, animalId, body),
    invalidates: [adminKeys.module(FARM_RECORDS_MODULE)],
  });
}

export function useCreateAdminLifecycleEvent(farmerId: string) {
  return useAdminMutation<{ animalId: string; body: CreateAdminLifecycleEventBody }, { id: string; addedOnBehalf?: boolean }>({
    mutationFn: ({ animalId, body }) => createAdminLifecycleEvent(farmerId, animalId, body),
    invalidates: [adminKeys.module(FARM_RECORDS_MODULE)],
  });
}

export function useCreateAdminProductionLog(farmerId: string) {
  return useAdminMutation<CreateAdminProductionLogBody, { id: string; addedOnBehalf?: boolean }>({
    mutationFn: (body) => createAdminProductionLog(farmerId, body),
    invalidates: [adminKeys.module(FARM_RECORDS_MODULE)],
  });
}
