/** Serviceability, pickup points and area requests (BR-171/198). Public endpoints; token is optional. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../shell/api/client';

export interface Serviceability {
  serviceable: boolean;
  deliveryAvailable: boolean;
  nearestPickupPointId?: string;
}
export interface PickupPoint {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  openingHours: Record<string, unknown> | null;
  isOpenNow: boolean;
  lat: number | null;
  lng: number | null;
  distanceKm?: number | null;
  isNearest?: boolean;
}
export interface ServiceAreaRequest {
  id: string;
  area: string;
  locality: string;
  city: string;
  pincode: string | null;
  status: 'NEW' | 'REVIEWED' | 'SERVED' | 'DECLINED';
  createdAt: string;
}
export interface CreateServiceAreaRequestInput {
  area: string;
  locality: string;
  city: string;
  pincode?: string;
  contact?: string;
}

export interface ServiceabilityQuery {
  pincode?: string | undefined;
  lat?: number | undefined;
  lng?: number | undefined;
}

export const serviceabilityQueryKeys = {
  check: (q: ServiceabilityQuery) => ['serviceability', q.pincode ?? null, q.lat ?? null, q.lng ?? null] as const,
  pickupPoints: (lat?: number, lng?: number) => ['pickup-points', lat ?? null, lng ?? null] as const,
  myRequests: ['customer', 'service-area-requests'] as const,
};

export function checkServiceability(q: ServiceabilityQuery, signal?: AbortSignal): Promise<Serviceability> {
  const params: string[] = [];
  if (q.pincode) params.push(`pincode=${encodeURIComponent(q.pincode)}`);
  if (typeof q.lat === 'number' && typeof q.lng === 'number') params.push(`lat=${q.lat}`, `lng=${q.lng}`);
  return api.get<Serviceability>(`/serviceability?${params.join('&')}`, signal);
}

export async function listPickupPoints(lat?: number, lng?: number, signal?: AbortSignal): Promise<PickupPoint[]> {
  const qs = typeof lat === 'number' && typeof lng === 'number' ? `?lat=${lat}&lng=${lng}` : '';
  return (await api.get<{ items: PickupPoint[] }>(`/pickup-points${qs}`, signal)).items;
}

export const createServiceAreaRequest = (input: CreateServiceAreaRequestInput): Promise<ServiceAreaRequest> =>
  api.post<ServiceAreaRequest>('/service-area-requests', input);

export async function listMyServiceAreaRequests(signal?: AbortSignal): Promise<ServiceAreaRequest[]> {
  return (await api.get<{ items: ServiceAreaRequest[] }>('/service-area-requests/me', signal)).items;
}

export function useServiceability(q: ServiceabilityQuery, enabled = true) {
  const has = Boolean(q.pincode) || (typeof q.lat === 'number' && typeof q.lng === 'number');
  return useQuery({
    queryKey: serviceabilityQueryKeys.check(q),
    queryFn: ({ signal }) => checkServiceability(q, signal),
    enabled: enabled && has,
    staleTime: 60_000,
    retry: 1,
  });
}
export function usePickupPoints(lat?: number, lng?: number) {
  return useQuery({
    queryKey: serviceabilityQueryKeys.pickupPoints(lat, lng),
    queryFn: ({ signal }) => listPickupPoints(lat, lng, signal),
    retry: 1,
  });
}
export function useMyServiceAreaRequests(enabled = true) {
  return useQuery({
    queryKey: serviceabilityQueryKeys.myRequests,
    queryFn: ({ signal }) => listMyServiceAreaRequests(signal),
    enabled,
    retry: 1,
  });
}
export function useCreateServiceAreaRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createServiceAreaRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceabilityQueryKeys.myRequests }),
  });
}
