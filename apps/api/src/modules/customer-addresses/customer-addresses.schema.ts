/**
 * Customer delivery addresses (BR-160). Zod in/out, matching docs/openapi.yaml
 * `CustomerAddress`, `CreateCustomerAddressRequest`, `UpdateCustomerAddressRequest`.
 */
import { z } from 'zod';

export const addressLabels = ['HOME', 'OFFICE', 'OTHER'] as const;
export type AddressLabel = (typeof addressLabels)[number];
/** WORK is a legacy alias for OFFICE: accepted on input, never returned. */
const labelInput = z
  .enum(['HOME', 'OFFICE', 'OTHER', 'WORK'])
  .transform((v): AddressLabel => (v === 'WORK' ? 'OFFICE' : v));
const contactPhone = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,15}$/, 'contactPhone must be 10-15 digits, optional leading +');

/** Same pattern as the customer_addresses.pincode CHECK in 0006. */
const pincode = z.string().regex(/^[1-9][0-9]{5}$/, 'pincode must be a 6-digit Indian PIN code');

const base = {
  label: labelInput,
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).nullable(),
  city: z.string().trim().min(1).max(100),
  district: z.string().trim().max(100).nullable(),
  state: z.string().trim().min(1).max(100),
  pincode,
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  landmark: z.string().trim().max(200).nullable(),
  contactPhone: contactPhone.nullable(),
  nearestPickupPointId: z.string().uuid().nullable(),
};

export const createAddressBody = z
  .object({
    label: base.label.default('HOME'),
    line1: base.line1,
    line2: base.line2.optional(),
    city: base.city,
    district: base.district.optional(),
    state: base.state.default('Tamil Nadu'),
    pincode: base.pincode,
    lat: base.lat.optional(),
    lng: base.lng.optional(),
    landmark: base.landmark.optional(),
    contactPhone: base.contactPhone.optional(),
    nearestPickupPointId: base.nearestPickupPointId.optional(),
    isDefault: z.boolean().default(false),
  })
  .strict()
  .refine((b) => (b.lat == null) === (b.lng == null), {
    message: 'lat and lng must be supplied together',
    path: ['lat'],
  });
export type CreateAddressBody = z.infer<typeof createAddressBody>;

export const updateAddressBody = z
  .object({
    label: base.label.optional(),
    line1: base.line1.optional(),
    line2: base.line2.optional(),
    city: base.city.optional(),
    district: base.district.optional(),
    state: base.state.optional(),
    pincode: base.pincode.optional(),
    lat: base.lat.optional(),
    lng: base.lng.optional(),
    landmark: base.landmark.optional(),
    contactPhone: base.contactPhone.optional(),
    nearestPickupPointId: base.nearestPickupPointId.optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'at least one field is required' })
  .refine((b) => (b.lat === undefined) === (b.lng === undefined), {
    message: 'lat and lng must be changed together',
    path: ['lat'],
  });
export type UpdateAddressBody = z.infer<typeof updateAddressBody>;

export const addressIdParams = z
  .object({ addressId: z.string().uuid('addressId must be a UUID') })
  .strict();

export const customerAddressSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  district: z.string().nullable(),
  state: z.string(),
  pincode: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  landmark: z.string().nullable(),
  contactPhone: z.string().nullable(),
  nearestPickupPointId: z.string().uuid().nullable(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type CustomerAddress = z.infer<typeof customerAddressSchema>;

export interface ListAddressesResponse {
  items: CustomerAddress[];
}
