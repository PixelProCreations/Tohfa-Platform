import { z } from 'zod';

export const deliveryPartnerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone: z.string(),
  vehicleRef: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }).nullable(),
});
export type DeliveryPartner = z.infer<typeof deliveryPartnerSchema>;

export const createDeliveryPartnerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  phone: z.string().trim().min(1, 'Phone is required').max(20),
  vehicleRef: z.string().trim().max(100).optional(),
});
export type CreateDeliveryPartnerRequest = z.infer<typeof createDeliveryPartnerSchema>;

export const updateDeliveryPartnerSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().min(1).max(20).optional(),
  vehicleRef: z.string().trim().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateDeliveryPartnerRequest = z.infer<typeof updateDeliveryPartnerSchema>;

export const deliveryPartnerIdParamSchema = z.object({
  id: z.string().uuid(),
});
export type DeliveryPartnerIdParam = z.infer<typeof deliveryPartnerIdParamSchema>;

export const listDeliveryPartnersQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'all']).default('active').optional(),
});
export type ListDeliveryPartnersQuery = z.infer<typeof listDeliveryPartnersQuerySchema>;
