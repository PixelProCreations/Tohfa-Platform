/**
 * Customer address book (docs/openapi.yaml `/customers/me/addresses`, BR-160).
 *
 * UI <-> API mapping (documented once, here):
 *  - flat/door no + building + street -> `line1` (joined with ", ", max 200)
 *  - area + locality                  -> `line2` (joined with ", ", max 200)
 *    (locality is NOT `district`; `district` is never sent from the UI)
 *  - city -> `city`, state -> `state` (default Tamil Nadu), pincode -> `pincode`
 *  - landmark -> `landmark`; contact phone -> `contactPhone`
 *  - Home/Office/Other -> HOME/OFFICE/OTHER
 *  - nearest market -> `nearestPickupPointId` (from GET /pickup-points or /serviceability)
 *  - map pin -> `lat` + `lng` (always sent together)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../shell/api/client';
import { profileQueryKeys } from './profile';

export const addressQueryKeys = { list: ['customer', 'addresses'] as const };

export type AddressLabel = 'HOME' | 'OFFICE' | 'OTHER';

export interface CustomerAddress {
  id: string;
  label: AddressLabel;
  line1: string;
  line2: string | null;
  city: string;
  district: string | null;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  landmark: string | null;
  contactPhone: string | null;
  nearestPickupPointId: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCustomerAddressInput {
  label?: AddressLabel;
  line1: string;
  line2?: string | null;
  city: string;
  district?: string | null;
  state?: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
  landmark?: string | null;
  contactPhone?: string | null;
  nearestPickupPointId?: string | null;
  isDefault?: boolean;
}
export type UpdateCustomerAddressInput = Partial<Omit<CreateCustomerAddressInput, 'isDefault'>>;

export const listAddresses = async (signal?: AbortSignal): Promise<CustomerAddress[]> =>
  (await api.get<{ items: CustomerAddress[] }>('/customers/me/addresses', signal)).items;
export const createAddress = (input: CreateCustomerAddressInput): Promise<CustomerAddress> =>
  api.post<CustomerAddress>('/customers/me/addresses', input);
export const updateAddress = (id: string, input: UpdateCustomerAddressInput): Promise<CustomerAddress> =>
  api.patch<CustomerAddress>(`/customers/me/addresses/${encodeURIComponent(id)}`, input);
export const deleteAddress = (id: string): Promise<void> =>
  api.delete<void>(`/customers/me/addresses/${encodeURIComponent(id)}`);
export const setDefaultAddress = (id: string): Promise<CustomerAddress> =>
  api.post<CustomerAddress>(`/customers/me/addresses/${encodeURIComponent(id)}/default`, {});

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: addressQueryKeys.list,
    queryFn: ({ signal }) => listAddresses(signal),
    enabled,
    retry: 1,
  });
}

function useInvalidateAddresses() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: addressQueryKeys.list }),
      qc.invalidateQueries({ queryKey: profileQueryKeys.me }),
    ]);
}

export function useCreateAddress() {
  const invalidate = useInvalidateAddresses();
  return useMutation({ mutationFn: createAddress, onSuccess: invalidate });
}
export function useUpdateAddress() {
  const invalidate = useInvalidateAddresses();
  return useMutation({
    mutationFn: (v: { id: string; input: UpdateCustomerAddressInput }) => updateAddress(v.id, v.input),
    onSuccess: invalidate,
  });
}
export function useDeleteAddress() {
  const invalidate = useInvalidateAddresses();
  return useMutation({ mutationFn: deleteAddress, onSuccess: invalidate });
}
export function useSetDefaultAddress() {
  const invalidate = useInvalidateAddresses();
  return useMutation({ mutationFn: setDefaultAddress, onSuccess: invalidate });
}

/* ---------------- mappers ---------------- */

export type UiAddressType = 'Home' | 'Office' | 'Other';
export const labelToApi = (t: string | undefined): AddressLabel =>
  t === 'Office' || t === 'Work' ? 'OFFICE' : t === 'Other' ? 'OTHER' : 'HOME';
export const labelFromApi = (l: AddressLabel): UiAddressType =>
  l === 'OFFICE' ? 'Office' : l === 'OTHER' ? 'Other' : 'Home';

export interface UiAddressFields {
  pincode: string;
  city: string;
  state?: string;
  locality?: string;
  area?: string;
  street?: string;
  /** flat / door no */
  flat: string;
  building?: string;
  landmark?: string;
  contactPhone?: string;
  type?: string;
  isDefault?: boolean;
  lat?: number | null;
  lng?: number | null;
  nearestPickupPointId?: string | null;
}

const clip = (s: string, n: number) => s.trim().slice(0, n);
const join = (parts: Array<string | undefined>) =>
  parts
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(', ');

/** Normalised contact phone for the API pattern `^\+?[0-9]{10,15}$`; undefined when blank/invalid. */
export function normalizeContactPhone(raw: string | undefined): string | undefined {
  const d = (raw ?? '').replace(/[\s-]/g, '');
  return /^\+?[0-9]{10,15}$/.test(d) ? d : undefined;
}

export function toApiAddress(f: UiAddressFields): CreateCustomerAddressInput {
  const line2 = join([f.area, f.locality]);
  const phone = normalizeContactPhone(f.contactPhone);
  const hasPin = typeof f.lat === 'number' && typeof f.lng === 'number';
  return {
    label: labelToApi(f.type),
    line1: clip(join([f.flat, f.building, f.street]), 200),
    ...(line2 ? { line2: clip(line2, 200) } : {}),
    city: clip(f.city, 100),
    state: clip(f.state && f.state.trim() ? f.state.replace(/,?\s*India$/i, '') : 'Tamil Nadu', 100),
    pincode: f.pincode.trim(),
    ...(f.landmark?.trim() ? { landmark: clip(f.landmark, 200) } : {}),
    ...(phone ? { contactPhone: phone } : {}),
    ...(hasPin ? { lat: f.lat as number, lng: f.lng as number } : {}),
    ...(f.nearestPickupPointId ? { nearestPickupPointId: f.nearestPickupPointId } : {}),
    isDefault: f.isDefault === true,
  };
}

export const isValidPincode = (p: string) => /^[1-9][0-9]{5}$/.test(p.trim());

/** One-line display: `line1, line2, city, pincode`. */
export function formatAddressLine(a: Pick<CustomerAddress, 'line1' | 'line2' | 'city' | 'pincode'>): string {
  return join([a.line1, a.line2 ?? undefined, a.city, a.pincode]);
}
/** Short chip text for headers: `line1, city`. */
export function formatAddressShort(a: Pick<CustomerAddress, 'line1' | 'city'>): string {
  return join([a.line1, a.city]);
}
export const pickDefaultAddress = (items: readonly CustomerAddress[] | undefined): CustomerAddress | undefined =>
  items?.find((a) => a.isDefault) ?? items?.[0];
