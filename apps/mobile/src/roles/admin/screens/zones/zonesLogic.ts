/**
 * Everything Zone Management decides about its data, kept pure so plain-Node
 * vitest covers it (hooks and components only pass values through).
 *
 * The rule is the one in api/pricingMappers.ts: what the API sends is shown as
 * sent, what it does not send is `null` here and the dash (ADMIN_NO_VALUE) on
 * screen, NEVER a guess. What the API sends today:
 *
 *   zone            GET /admin/zones[/{id}]: name, code, shortCode, description,
 *                   isActive, taluks, the ONE mapped warehouse, createdAt, and
 *                   (detail only) the manager.
 *   farmer count    GET /admin/farmers/summary `zones[]`. That list holds ACTIVE
 *                   zones only, so an inactive zone has NO count (null), not 0.
 *   farmer list     GET /admin/farmers?zoneId=: name, code, mobile, account and
 *                   KYC status. No acreage, farming type or village.
 *   warehouses      GET /warehouses: code, name, type, isActive.
 *
 * What it does NOT send, so every one of these is null / the dash:
 * zone acreage, zone yield or produce, zone polygon / boundary, locations
 * (towns, villages), district, a farmer's farm size / farming type /
 * registered location, transfer history, a change-history actor, and any
 * report figure built on those.
 *
 * Sub-counts derived from a paged list ("verified farmers of 92") are honest
 * only once every page is loaded: they go through countLoadedWhere, which is
 * null while pages remain.
 */
import type { AdminZoneDetailDto, AdminZoneListItemDto } from '../../api/zones';
import type { FarmerSummaryDto } from '../../api/farmers';
import type { FarmerRowView } from '../../api/farmerTypes';
import { countLoadedWhere } from '../../api/hookHelpers';
import type { WarehouseDto } from '../../api/warehouses';
import { formatAdminDay } from '../../utils/datetime';

// ---------------------------------------------------------------------------
// View models (what the design's cards draw)
// ---------------------------------------------------------------------------

export interface ZoneData {
  id: string;
  code: string;
  shortCode: string;
  name: string;
  /** No source: the zone API carries no district. */
  district: null;
  /** The mapped taluks joined, or null when the zone has none. */
  taluk: string | null;
  taluks: string[];
  /** No source: there is no location resource. */
  locationsCount: null;
  /** The summary's count; null for an inactive zone (not in the summary) or before it loads. */
  farmersCount: number | null;
  /** 0 or 1: a zone maps to a single warehouse. */
  warehousesCount: number;
  /** No source: no zone acreage anywhere in the API. */
  farmAreaAcres: null;
  /** From the zone's farmer list; null until every page is loaded. */
  verifiedFarmers: number | null;
  activeFarmers: number | null;
  status: 'Active' | 'Inactive';
  /** ISO instant, for ordering. */
  createdAt: string;
  /** "25 Sep 2026", or null when the instant is unreadable. */
  createdDate: string | null;
  /** The detail's manager name; meaningful only when `managerLoaded`. */
  manager: string | null;
  /** True once the detail read answered, so `manager: null` then means "not assigned". */
  managerLoaded: boolean;
  description: string | null;
  /** The manager's masked mobile (BR-92) from the detail, or null. */
  contact: string | null;
  /** No source: no zone polygon in the API. */
  boundaryPoints: null;
  warehouseId: string | null;
  warehouses: string[];
}

export interface ZoneFarmerData {
  id: string;
  name: string;
  code: string;
  /** No source: the list carries no village. */
  location: null;
  zoneId: string;
  phone: string;
  /** No source. */
  farmingType: null;
  /** No source. */
  acres: null;
  status: 'Active' | 'Inactive';
  verification: 'Verified' | 'Pending' | 'Rejected';
}

export interface UnassignedFarmerData {
  id: string;
  name: string;
  code: string;
  /** No source. */
  registeredLocation: null;
  verification: 'Verified' | 'Pending' | 'Rejected';
}

export interface BulkFarmerItem {
  id: string;
  name: string;
  code: string;
  /** No source. */
  district: null;
  /** No source. */
  registeredLocation: null;
  verification: 'Verified' | 'Pending' | 'Rejected';
  assignedZoneName?: string;
  disabled?: boolean;
}

/** A town / village / locality of a zone. The API has no such resource; the type survives for the drawn views. */
export interface LocationData {
  id: string;
  code: string;
  name: string;
  type: 'Town' | 'Village' | 'Locality';
  zoneId: string;
  zoneName: string;
  district: string;
  taluk: string;
  pinCode: string;
  farmersCount: number;
  status: 'Active' | 'Inactive';
  latitude?: string | undefined;
  longitude?: string | undefined;
  notes?: string | undefined;
}

export interface ZoneWarehouseMappingData {
  id: string;
  code: string;
  name: string;
  type: 'Main warehouse' | 'Sub warehouse';
  /** No source: the zone API does not say when the mapping began. */
  sinceDate: null;
  status: 'Active' | 'Inactive';
  isMapped: boolean;
}

/**
 * The placeholder the screen holds while nothing is selected. Not a zone: every
 * figure is null and the name is empty, so it can never read as data.
 */
export const NO_ZONE: ZoneData = {
  id: '',
  code: '',
  shortCode: '',
  name: '',
  district: null,
  taluk: null,
  taluks: [],
  locationsCount: null,
  farmersCount: null,
  warehousesCount: 0,
  farmAreaAcres: null,
  verifiedFarmers: null,
  activeFarmers: null,
  status: 'Inactive',
  createdAt: '',
  createdDate: null,
  manager: null,
  managerLoaded: false,
  description: null,
  contact: null,
  boundaryPoints: null,
  warehouseId: null,
  warehouses: [],
};

// ---------------------------------------------------------------------------
// Zones
// ---------------------------------------------------------------------------

/** "Ooty Zone (OOT)": the label the design's pickers and breadcrumbs use. */
export function zoneLabel(zone: Pick<ZoneData, 'name' | 'shortCode'>): string {
  return `${zone.name} (${zone.shortCode})`;
}

/** The farmer count per zone id, from the summary. Empty before the summary loads. */
export function farmerCountsByZone(summary: FarmerSummaryDto | undefined): Map<string, number> {
  const out = new Map<string, number>();
  if (summary === undefined) return out;
  for (const zone of summary.zones) out.set(zone.id, zone.count);
  return out;
}

export interface ToZoneViewOptions {
  farmersCount: number | null;
  /** The detail read, when it has loaded (adds the manager). */
  detail?: AdminZoneDetailDto | undefined;
  verifiedFarmers?: number | null | undefined;
  activeFarmers?: number | null | undefined;
}

export function toZoneView(dto: AdminZoneListItemDto, options: ToZoneViewOptions): ZoneData {
  const created = formatAdminDay(dto.createdAt);
  const detail = options.detail;
  return {
    id: dto.id,
    code: dto.code,
    shortCode: dto.shortCode,
    name: dto.name,
    district: null,
    taluk: dto.taluks.length === 0 ? null : dto.taluks.join(', '),
    taluks: dto.taluks,
    locationsCount: null,
    farmersCount: options.farmersCount,
    warehousesCount: dto.warehouseId === null ? 0 : 1,
    farmAreaAcres: null,
    verifiedFarmers: options.verifiedFarmers ?? null,
    activeFarmers: options.activeFarmers ?? null,
    status: dto.isActive ? 'Active' : 'Inactive',
    createdAt: dto.createdAt,
    createdDate: created === '' ? null : created,
    manager: detail?.manager?.fullName ?? null,
    managerLoaded: detail !== undefined,
    description: dto.description,
    contact: detail?.manager?.mobile ?? null,
    boundaryPoints: null,
    warehouseId: dto.warehouseId,
    warehouses: dto.warehouseName === null ? [] : [dto.warehouseName],
  };
}

/** Every zone the API sent, newest registration order as the server gave it, with its summary count. */
export function toZoneViews(dtos: readonly AdminZoneListItemDto[] | undefined, summary: FarmerSummaryDto | undefined): ZoneData[] {
  if (dtos === undefined) return [];
  const counts = farmerCountsByZone(summary);
  return dtos.map((dto) => toZoneView(dto, { farmersCount: counts.get(dto.id) ?? null }));
}

export function findZone(zones: readonly ZoneData[], id: string | null | undefined): ZoneData | undefined {
  if (id === null || id === undefined || id === '') return undefined;
  return zones.find((zone) => zone.id === id);
}

/** Match a "Name (SHORT)" label, a name or an id back to a zone. */
export function findZoneByLabel(zones: readonly ZoneData[], label: string): ZoneData | undefined {
  return zones.find((zone) => zoneLabel(zone) === label || zone.name === label || zone.id === label);
}

/** Newest first (createdAt), `count` of them. */
export function recentZones(zones: readonly ZoneData[], count: number): ZoneData[] {
  return [...zones].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0)).slice(0, count);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface ZoneKpis {
  totalZones: number | null;
  activeZones: number | null;
  inactiveZones: number | null;
  /** No source (no location resource). */
  totalLocations: null;
  /** Every registered farmer, from the summary. */
  registeredFarmers: number | null;
  /** The sum of the zone counts; null unless EVERY zone has one (the summary omits inactive zones). */
  assignedFarmers: number | null;
  /** registered - assigned; null whenever either is unknown. */
  unassignedFarmers: number | null;
  mainWarehouses: number | null;
  subWarehouses: number | null;
}

/**
 * `zones` is undefined until the list loads. An assigned total built from a
 * summary that skips inactive zones would drop those farmers into "unassigned",
 * so it is only stated when every listed zone carries a count.
 */
export function zoneKpis(
  zones: readonly ZoneData[] | undefined,
  summary: FarmerSummaryDto | undefined,
  warehouses: readonly WarehouseDto[] | undefined,
): ZoneKpis {
  const registered = summary?.totalFarmers ?? null;
  const allCounted = zones !== undefined && summary !== undefined && zones.every((zone) => zone.farmersCount !== null);
  const assigned = allCounted ? zones.reduce((sum, zone) => sum + (zone.farmersCount ?? 0), 0) : null;
  const unassigned = assigned !== null && registered !== null && registered >= assigned ? registered - assigned : null;
  const active = warehouses?.filter((w) => w.isActive);
  return {
    totalZones: zones === undefined ? null : zones.length,
    activeZones: zones === undefined ? null : zones.filter((zone) => zone.status === 'Active').length,
    inactiveZones: zones === undefined ? null : zones.filter((zone) => zone.status === 'Inactive').length,
    totalLocations: null,
    registeredFarmers: registered,
    assignedFarmers: assigned,
    unassignedFarmers: unassigned,
    mainWarehouses: active === undefined ? null : active.filter((w) => w.type === 'MAIN').length,
    subWarehouses: active === undefined ? null : active.filter((w) => w.type === 'SUB').length,
  };
}

export interface DistributionRow {
  id: string;
  name: string;
  /** null: no count for this zone (inactive, or the summary has not loaded). */
  count: number | null;
  /** The server's ratio of all farmers, 0-1, or null with the count. */
  ratio: number | null;
}

/** One row per zone, in the zones' order, with the summary's own count and ratio. */
export function farmerDistribution(zones: readonly ZoneData[], summary: FarmerSummaryDto | undefined): DistributionRow[] {
  const byId = new Map<string, { count: number; ratio: number }>();
  for (const zone of summary?.zones ?? []) byId.set(zone.id, { count: zone.count, ratio: zone.ratio });
  return zones.map((zone) => {
    const hit = byId.get(zone.id);
    return { id: zone.id, name: zone.name, count: hit?.count ?? null, ratio: hit?.ratio ?? null };
  });
}

/** A bar width: a 0-1 ratio as "NN%", an unknown one as an empty bar. */
export function percentWidth(ratio: number | null): `${number}%` {
  if (ratio === null || !Number.isFinite(ratio)) return '0%';
  return `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
}

/** Bar width of `count` against the largest count in `rows`. */
export function shareOfMax(count: number | null, max: number): `${number}%` {
  if (count === null || max <= 0) return '0%';
  return percentWidth(count / max);
}

export interface WarehouseDistributionRow {
  id: string;
  name: string;
  /** The mapped warehouse's name, or null for "none mapped". */
  warehouse: string | null;
}

export function warehouseDistribution(zones: readonly ZoneData[]): WarehouseDistributionRow[] {
  return zones.map((zone) => ({ id: zone.id, name: zone.name, warehouse: zone.warehouses[0] ?? null }));
}

export interface AttentionItem {
  /** Stable key. */
  key: string;
  kind: 'inactive' | 'noWarehouse';
  zoneId: string;
  zoneName: string;
}

/**
 * What the data can actually flag: an inactive zone, and an active zone with no
 * warehouse. "Farmers still assigned to an inactive zone" is NOT here: the
 * summary skips inactive zones, so that count does not exist.
 */
export function attentionItems(zones: readonly ZoneData[]): AttentionItem[] {
  const out: AttentionItem[] = [];
  for (const zone of zones) {
    if (zone.status === 'Inactive') out.push({ key: `inactive-${zone.id}`, kind: 'inactive', zoneId: zone.id, zoneName: zone.name });
    else if (zone.warehouseId === null) out.push({ key: `nowh-${zone.id}`, kind: 'noWarehouse', zoneId: zone.id, zoneName: zone.name });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Farmers
// ---------------------------------------------------------------------------

function verification(status: FarmerRowView['kycStatus']): 'Verified' | 'Pending' | 'Rejected' {
  if (status === 'VERIFIED') return 'Verified';
  if (status === 'REJECTED') return 'Rejected';
  return 'Pending';
}

export function toZoneFarmerView(row: FarmerRowView): ZoneFarmerData {
  return {
    id: row.id,
    name: row.name,
    code: row.farmerCode,
    location: null,
    zoneId: row.zoneId ?? '',
    phone: row.mobile,
    farmingType: null,
    acres: null,
    status: row.accountStatus === 'ACTIVE' ? 'Active' : 'Inactive',
    verification: verification(row.kycStatus),
  };
}

/** A farmer with no zone, for the Assign Farmers wizard. */
export function unassignedFarmers(rows: readonly FarmerRowView[]): UnassignedFarmerData[] {
  return rows
    .filter((row) => row.zoneId === null && row.accountStatus !== 'DISABLED')
    .map((row) => ({
      id: row.id,
      name: row.name,
      code: row.farmerCode,
      registeredLocation: null,
      verification: verification(row.kycStatus),
    }));
}

/** Farmers already in a zone (or disabled), shown greyed in the Bulk Assignment list. */
export function bulkExistingFarmers(rows: readonly FarmerRowView[], zones: readonly ZoneData[]): BulkFarmerItem[] {
  const out: BulkFarmerItem[] = [];
  for (const row of rows) {
    const zoneName = row.zoneId === null ? undefined : (findZone(zones, row.zoneId)?.name ?? row.zoneName ?? undefined);
    const disabled = row.accountStatus === 'DISABLED';
    if (zoneName === undefined && !disabled) continue;
    out.push({
      id: row.id,
      name: row.name,
      code: row.farmerCode,
      district: null,
      registeredLocation: null,
      verification: verification(row.kycStatus),
      ...(zoneName === undefined ? {} : { assignedZoneName: zoneName }),
      ...(disabled ? { disabled: true } : {}),
    });
  }
  return out;
}

export interface ZoneFarmerCounts {
  verified: number | null;
  active: number | null;
}

/** "Verified" and "Active" farmers of a zone: null until every page of its farmer list is in. */
export function zoneFarmerCounts(rows: readonly FarmerRowView[], allPagesLoaded: boolean): ZoneFarmerCounts {
  return {
    verified: countLoadedWhere(rows, (row) => row.kycStatus === 'VERIFIED', allPagesLoaded),
    active: countLoadedWhere(rows, (row) => row.accountStatus === 'ACTIVE', allPagesLoaded),
  };
}

// ---------------------------------------------------------------------------
// Warehouse mapping
// ---------------------------------------------------------------------------

/**
 * The warehouse(s) a zone is mapped to. The zone API names exactly one; the
 * warehouse list adds its code and type. With no list (not loaded, or the
 * caller lacks warehouse.all.view) the mapping still shows, by name, and the
 * code and type fall back to the dash on screen.
 */
export function warehouseMappingsFor(zone: ZoneData | undefined, warehouses: readonly WarehouseDto[] | undefined): ZoneWarehouseMappingData[] {
  if (zone === undefined || zone.warehouseId === null) return [];
  const hit = warehouses?.find((w) => w.id === zone.warehouseId);
  return [
    {
      id: zone.warehouseId,
      code: hit?.code ?? '',
      name: hit?.name ?? zone.warehouses[0] ?? '',
      type: hit?.type === 'MAIN' ? 'Main warehouse' : 'Sub warehouse',
      sinceDate: null,
      status: hit === undefined || hit.isActive ? 'Active' : 'Inactive',
      isMapped: true,
    },
  ];
}

// ---------------------------------------------------------------------------
// Map (schematic: the API has no zone geometry)
// ---------------------------------------------------------------------------

/**
 * The text for each of the schematic map's zone rectangles: the short code of
 * the n-th zone, or null (the dash) when there are fewer zones than rectangles.
 * The rectangles are the design's drawing, not geography.
 */
export function mapSlotLabels(zones: readonly ZoneData[], slots: number): Array<string | null> {
  return Array.from({ length: slots }, (_, i) => zones[i]?.shortCode ?? null);
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface ReportMetrics {
  /** Per-zone rows, then "no zone" last when it can be stated. */
  farmersByZone: Array<{ key: string; name: string | null; count: number | null }>;
  active: number | null;
  inactive: number | null;
  /** No source: the summary has no verified / pending split. */
  verified: null;
  pending: null;
  /** No source: no farming type on any farmer read. */
  farmingTypes: Array<{ key: 'organic' | 'natural' | 'biodynamic'; count: null }>;
  /** No source. */
  totalFarmAreaAcres: null;
  mappedZones: number | null;
  activeZoneCount: number | null;
}

/**
 * `zoneId` null is "all zones". A single zone has no active / inactive split
 * (the summary's status counts are platform-wide), so those two dash for it.
 */
export function reportMetrics(zones: readonly ZoneData[] | undefined, summary: FarmerSummaryDto | undefined, zoneId: string | null): ReportMetrics {
  const kpis = zoneKpis(zones, summary, undefined);
  const scoped = zones === undefined ? [] : zones.filter((zone) => zoneId === null || zone.id === zoneId);
  const rows: ReportMetrics['farmersByZone'] = scoped.map((zone) => ({ key: zone.id, name: zone.name, count: zone.farmersCount }));
  if (zoneId === null) rows.push({ key: 'no-zone', name: null, count: kpis.unassignedFarmers });
  const activeZones = zones?.filter((zone) => zone.status === 'Active');
  return {
    farmersByZone: rows,
    active: zoneId === null && summary !== undefined ? summary.activeFarmers : null,
    inactive: zoneId === null && summary !== undefined ? summary.totalFarmers - summary.activeFarmers : null,
    verified: null,
    pending: null,
    farmingTypes: [
      { key: 'organic', count: null },
      { key: 'natural', count: null },
      { key: 'biodynamic', count: null },
    ],
    totalFarmAreaAcres: null,
    mappedZones: activeZones === undefined ? null : activeZones.filter((zone) => zone.warehouseId !== null).length,
    activeZoneCount: activeZones === undefined ? null : activeZones.length,
  };
}

/** A number, or the caller's dash. */
export function countText(value: number | null, dash: string): string {
  return value === null ? dash : String(value);
}
