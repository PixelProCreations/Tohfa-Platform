import { api, ApiError } from '../../../shell/api/client';
import { formatKg } from './listings';

// ---------------------------------------------------------------------------
// BR-136 — community planting summary (TOHFA Calendar).
// Mirrors apps/api/src/modules/community-planting/ and docs/openapi.yaml
// `CommunityPlantingSummaryResponse` / `CommunityPlantingFiltersResponse`.
//
// The server decides what is released (k-anonymity, minGroupSize from
// system_config). The client renders the response as-is: it never infers a
// suppressed crop, and `other` names no crop.
//
// Until the owner decides (docs/rules.md open contradiction 34) the server
// grants the permission to no role and ships no threshold, so the expected
// answers today are 403 FORBIDDEN or 503 COMMUNITY_PLANTING_NOT_CONFIGURED.
// Both mean "not available", not "try again".
// ---------------------------------------------------------------------------

/** True for the answers that mean the community view is switched off, not failing. */
export function isCommunityPlantingUnavailable(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.is('FORBIDDEN') || error.is('COMMUNITY_PLANTING_NOT_CONFIGURED'))
  );
}

export interface CommunityPlantingQuery {
  /** crop_master id. */
  crop: string | null;
  /** Calendar month of planted_on, 1-12. */
  month: number | null;
  /** Normalised farm taluk, as listed by the filters endpoint. */
  region: string | null;
}

export const EMPTY_COMMUNITY_PLANTING_QUERY: CommunityPlantingQuery = {
  crop: null,
  month: null,
  region: null,
};

export interface CommunityPlantingCrop {
  cropMasterId: string;
  cropName: string;
  farmers: number;
  quantityKg: number;
}

export interface CommunityPlantingOther {
  crops: number;
  farmers: number;
  quantityKg: number;
}

export interface CommunityPlantingSummary {
  generatedAt: string;
  filters: CommunityPlantingQuery;
  minGroupSize: number;
  totals: { farmers: number; totalPlantedKg: number; crops: number };
  byCrop: CommunityPlantingCrop[];
  other: CommunityPlantingOther | null;
}

export interface CommunityPlantingFilters {
  minGroupSize: number;
  crops: Array<{ cropMasterId: string; cropName: string }>;
  months: number[];
  regions: string[];
}

const SUMMARY_PATH = '/farmers/community/planting-summary';
const FILTERS_PATH = '/farmers/community/planting-filters';

/**
 * Builds the query string by hand, in a fixed order, rather than with
 * URLSearchParams: React Native's URLSearchParams is only partially
 * implemented. Unset filters are omitted (the server treats absent as "all";
 * an empty `region` would be a 422).
 */
export function communityPlantingSummaryPath(query: CommunityPlantingQuery): string {
  const parts: string[] = [];
  if (query.crop !== null) parts.push(`crop=${encodeURIComponent(query.crop)}`);
  if (query.month !== null) parts.push(`month=${query.month}`);
  if (query.region !== null) parts.push(`region=${encodeURIComponent(query.region)}`);
  return parts.length === 0 ? SUMMARY_PATH : `${SUMMARY_PATH}?${parts.join('&')}`;
}

/** GET /farmers/community/planting-summary — permission farmer.community.view_planting_summary. */
export async function getCommunityPlantingSummary(
  query: CommunityPlantingQuery,
  signal?: AbortSignal,
): Promise<CommunityPlantingSummary> {
  return api.get<CommunityPlantingSummary>(communityPlantingSummaryPath(query), signal);
}

/** GET /farmers/community/planting-filters — permission farmer.community.view_planting_summary. */
export async function getCommunityPlantingFilters(signal?: AbortSignal): Promise<CommunityPlantingFilters> {
  return api.get<CommunityPlantingFilters>(FILTERS_PATH, signal);
}

/**
 * Display a server kg figure ("20450.5" -> "20,450.5").
 *
 * The server sums in integer grams, so the value has at most 3 decimals. It is
 * converted back to integer grams once and rendered with integer arithmetic,
 * then trimmed by the listings `formatKg` helper — no float formatting
 * artefacts (e.g. 0.30000000000000004) can reach the screen.
 */
export function formatCommunityKg(kg: number): string {
  if (!Number.isFinite(kg) || kg < 0) return '0';
  const grams = Math.round(kg * 1000);
  const whole = Math.floor(grams / 1000);
  const fraction = grams % 1000;
  const plain = formatKg(fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(3, '0')}`);
  const [intPart = '0', decimals] = plain.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimals === undefined ? grouped : `${grouped}.${decimals}`;
}
