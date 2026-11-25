/**
 * A farmer's farm assets and livestock, read by an admin (docs/openapi.yaml):
 *
 *   GET /admin/farmers/{farmerId}/farm-assets          admin.assets.view_all     (cursor paged)
 *   GET /admin/farmers/{farmerId}/livestock/animals    admin.livestock.view_all  (every animal, one response)
 *
 * Both are read-only: the spec has no admin write for either (no record
 * service, retire, production log or end-of-life route), so the screen's
 * actions for them stay disabled.
 *
 * Field names are docs/openapi.yaml `FarmAsset` and `Animal`, verbatim. Money
 * (`costPaise`) is integer paise, never a float. No UI imports.
 */
import type { PageMeta } from '../../../shell/api/pagination';
import { useAdminQuery, useCursorList, type CursorList } from './hooks';
import { adminGet } from './http';
import { adminKeys } from './queryKeys';

export const FARM_RECORDS_MODULE = 'farmRecords';

export type FarmAssetCategory = 'TOOL' | 'EQUIPMENT' | 'MACHINERY';
/** Computed by the server from nextServiceDueOn on every read. */
export type FarmAssetStatus = 'OK' | 'DUE_SOON' | 'OVERDUE';

/** openapi FarmAsset. */
export interface FarmAssetDto {
  id: string;
  farmId: string;
  category: FarmAssetCategory;
  name: string;
  makeModel: string | null;
  fuelType: string | null;
  coverageAreaAcres: number | null;
  purchasedOn: string | null;
  costPaise: number | null;
  serviceIntervalDays: number | null;
  lastServicedOn: string | null;
  nextServiceDueOn: string | null;
  status: FarmAssetStatus;
  dueNote: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface FarmAssetPage {
  items: FarmAssetDto[];
  page: PageMeta;
}

export type AnimalSpecies = 'CATTLE' | 'BUFFALO' | 'GOAT' | 'POULTRY' | 'SHEEP';
export type AnimalSource = 'BORN_ON_FARM' | 'PURCHASED';
export type AnimalLifecycleStatus = 'ACTIVE' | 'SOLD' | 'TRANSFERRED' | 'CULLED' | 'DECEASED';

/** openapi Animal. */
export interface AnimalDto {
  id: string;
  tag: string;
  name: string | null;
  species: AnimalSpecies;
  breed: string | null;
  gender: 'FEMALE' | 'MALE';
  dateOfBirth: string | null;
  source: AnimalSource;
  purchasedOn: string | null;
  sourceFarm: string | null;
  organicStatus: 'ORGANIC' | 'TRANSITIONING' | 'CONVENTIONAL';
  lifecycleStatus: AnimalLifecycleStatus;
  withdrawalUntil: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface AnimalList {
  items: AnimalDto[];
}

function farmerPath(farmerId: string): string {
  return `/admin/farmers/${encodeURIComponent(farmerId)}`;
}

export function listAdminFarmerAssets(farmerId: string, cursor: string | undefined, signal?: AbortSignal): Promise<FarmAssetPage> {
  return adminGet<FarmAssetPage>(`${farmerPath(farmerId)}/farm-assets`, { cursor }, signal);
}

export function listAdminFarmerAnimals(farmerId: string, signal?: AbortSignal): Promise<AnimalList> {
  return adminGet<AnimalList>(`${farmerPath(farmerId)}/livestock/animals`, undefined, signal);
}

export const farmRecordKeys = {
  assets: (farmerId: string | undefined) =>
    adminKeys.scoped(FARM_RECORDS_MODULE, undefined, { resource: 'assets', farmerId: farmerId ?? null }),
  animals: (farmerId: string | undefined) =>
    adminKeys.scoped(FARM_RECORDS_MODULE, undefined, { resource: 'animals', farmerId: farmerId ?? null }),
};

export interface FarmRecordHookOptions {
  enabled?: boolean | undefined;
}

function keepAsset(dto: FarmAssetDto): FarmAssetDto {
  return dto;
}

/** admin.assets.view_all. Nothing is fetched without a farmer id. */
export function useAdminFarmerAssets(
  farmerId: string | undefined,
  options: FarmRecordHookOptions = {},
): CursorList<FarmAssetDto, FarmAssetPage> {
  return useCursorList<FarmAssetDto, FarmAssetDto, FarmAssetPage>(
    farmRecordKeys.assets(farmerId),
    (cursor, signal) => listAdminFarmerAssets(farmerId ?? '', cursor, signal),
    keepAsset,
    { enabled: farmerId !== undefined && (options.enabled ?? true) },
  );
}

/** admin.livestock.view_all. The response carries every animal, so its length is a real count. */
export function useAdminFarmerAnimals(farmerId: string | undefined, options: FarmRecordHookOptions = {}) {
  const enabled = farmerId !== undefined && (options.enabled ?? true);
  const query = useAdminQuery(farmRecordKeys.animals(farmerId), (signal) => listAdminFarmerAnimals(farmerId ?? '', signal), {
    enabled,
  });
  return {
    animals: query.data?.items,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}
