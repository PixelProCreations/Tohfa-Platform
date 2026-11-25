/**
 * Admin farm records API (D5/D6): diary entries, farm assets, livestock animals,
 * lifecycle events, and production logs created/edited on behalf of a farmer.
 */
import { adminDelete, adminGet, adminPatch, adminPost } from './http';

export interface AdminDiaryEntryDto {
  id: string;
  farmerId: string;
  plotId?: string | null;
  cropId?: string | null;
  activityType: string;
  category?: string | null;
  entryDate: string;
  notes?: string | null;
  addedOnBehalf?: boolean;
  createdByAdminId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateAdminDiaryEntryBody {
  plotId?: string;
  cropId?: string;
  activityType: string;
  category?: string;
  entryDate: string;
  notes?: string;
}

export interface UpdateAdminDiaryEntryBody {
  plotId?: string;
  cropId?: string;
  activityType?: string;
  category?: string;
  entryDate?: string;
  notes?: string;
}

export interface CreateAdminFarmAssetBody {
  name: string;
  category: string;
  quantity?: number;
  purchaseDate?: string;
  condition?: string;
  notes?: string;
}

export interface UpdateAdminFarmAssetBody {
  name?: string;
  category?: string;
  quantity?: number;
  purchaseDate?: string;
  condition?: string;
  notes?: string;
}

export interface CreateAdminAnimalBody {
  species: string;
  breed?: string;
  tagNumber?: string;
  count?: number;
  acquisitionDate?: string;
  healthStatus?: string;
  notes?: string;
}

export interface UpdateAdminAnimalBody {
  species?: string;
  breed?: string;
  tagNumber?: string;
  count?: number;
  healthStatus?: string;
  notes?: string;
}

export interface CreateAdminLifecycleEventBody {
  eventType: string;
  eventDate: string;
  notes?: string;
}

export interface CreateAdminProductionLogBody {
  animalId?: string;
  productType: string;
  quantity: number;
  unit: string;
  logDate: string;
  notes?: string;
}

export function listAdminDiaryEntries(farmerId: string, signal?: AbortSignal) {
  return adminGet<{ items: AdminDiaryEntryDto[] }>(`/v1/admin/farmers/${farmerId}/diary/entries`, undefined, signal);
}

export function createAdminDiaryEntry(farmerId: string, body: CreateAdminDiaryEntryBody) {
  return adminPost<AdminDiaryEntryDto>(`/v1/admin/farmers/${farmerId}/diary/entries`, body);
}

export function updateAdminDiaryEntry(farmerId: string, entryId: string, body: UpdateAdminDiaryEntryBody) {
  return adminPatch<AdminDiaryEntryDto>(`/v1/admin/farmers/${farmerId}/diary/entries/${entryId}`, body);
}

export function createAdminFarmAsset(farmerId: string, body: CreateAdminFarmAssetBody) {
  return adminPost<{ id: string; addedOnBehalf?: boolean }>(`/v1/admin/farmers/${farmerId}/farm-assets`, body);
}

export function updateAdminFarmAsset(farmerId: string, assetId: string, body: UpdateAdminFarmAssetBody) {
  return adminPatch<{ id: string; addedOnBehalf?: boolean }>(`/v1/admin/farmers/${farmerId}/farm-assets/${assetId}`, body);
}

export function deleteAdminFarmAsset(farmerId: string, assetId: string) {
  return adminDelete(`/v1/admin/farmers/${farmerId}/farm-assets/${assetId}`);
}

export function createAdminAnimal(farmerId: string, body: CreateAdminAnimalBody) {
  return adminPost<{ id: string; addedOnBehalf?: boolean }>(`/v1/admin/farmers/${farmerId}/livestock/animals`, body);
}

export function updateAdminAnimal(farmerId: string, animalId: string, body: UpdateAdminAnimalBody) {
  return adminPatch<{ id: string; addedOnBehalf?: boolean }>(`/v1/admin/farmers/${farmerId}/livestock/animals/${animalId}`, body);
}

export function createAdminLifecycleEvent(farmerId: string, animalId: string, body: CreateAdminLifecycleEventBody) {
  return adminPost<{ id: string; addedOnBehalf?: boolean }>(
    `/v1/admin/farmers/${farmerId}/livestock/animals/${animalId}/lifecycle-events`,
    body,
  );
}

export function createAdminProductionLog(farmerId: string, body: CreateAdminProductionLogBody) {
  return adminPost<{ id: string; addedOnBehalf?: boolean }>(`/v1/admin/farmers/${farmerId}/livestock/production-logs`, body);
}
