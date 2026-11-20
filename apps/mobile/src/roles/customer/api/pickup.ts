/**
 * Public pickup points (docs/openapi.yaml `GET /pickup-points`, BR-23/BR-170).
 * `lat` and `lng` go together or not at all (else 422); with them each item
 * gains `distanceKm` and exactly one is `isNearest`, nearest first.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../shell/api/client';
import { buildQueryString } from '../../../shell/api/pagination';

export interface PickupPoint {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  /** Keys mon..sun; `{closed:true}` or `{closed:false, open:'HH:MM', close:'HH:MM'}` (IST). */
  openingHours: Record<string, { closed: boolean; open?: string; close?: string }> | null;
  isOpenNow: boolean;
  lat: number | null;
  lng: number | null;
  distanceKm?: number | null;
  isNearest?: boolean;
}

export interface Coords {
  lat: number;
  lng: number;
}

export const pickupQueryKeys = {
  points: (coords?: Coords | null) => ['pickup-points', coords?.lat ?? null, coords?.lng ?? null] as const,
};

export async function fetchPickupPoints(coords?: Coords | null, signal?: AbortSignal): Promise<PickupPoint[]> {
  const qs = coords ? buildQueryString({ lat: coords.lat, lng: coords.lng }) : '';
  const res = await api.get<{ items: PickupPoint[] }>(`/pickup-points${qs}`, signal);
  return res.items;
}

export const usePickupPoints = (coords?: Coords | null) =>
  useQuery({
    queryKey: pickupQueryKeys.points(coords),
    queryFn: ({ signal }) => fetchPickupPoints(coords, signal),
    staleTime: 5 * 60_000,
  });

/** The pickup point to preselect: `preferredId` if listed, else `isNearest`, else the first. */
export function defaultPickupPoint(points: readonly PickupPoint[] | undefined, preferredId?: string | null): PickupPoint | null {
  if (!points || points.length === 0) return null;
  return (
    (preferredId ? points.find((p) => p.id === preferredId) : undefined) ??
    points.find((p) => p.isNearest) ??
    points[0] ??
    null
  );
}
