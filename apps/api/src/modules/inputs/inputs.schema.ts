import { z } from 'zod';

export const inputStatuses = ['APPROVED', 'PENDING', 'INACTIVE'] as const;
export type InputStatus = (typeof inputStatuses)[number];

export const inputIdParams = z.object({ id: z.string().uuid('id must be a UUID') }).strict();

export const supportingDocSchema = z
  .object({
    uploadId: z.string().uuid().optional(),
    storageKey: z.string().trim().min(1).max(512),
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(1).max(120),
    sizeBytes: z.number().int().positive(),
  })
  .strict();
export type SupportingDoc = z.infer<typeof supportingDocSchema>;

export const listInputsQuery = z
  .object({
    status: z.enum(inputStatuses).optional(),
    category: z.string().trim().min(1).max(120).optional(),
    search: z.string().trim().min(1).max(120).optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListInputsQuery = z.infer<typeof listInputsQuery>;

export const createInputBody = z
  .object({
    code: z.string().trim().min(2).max(60),
    name: z.string().trim().min(2).max(200),
    category: z.string().trim().min(2).max(120),
    subcategory: z.string().trim().min(1).max(120).optional(),
    farmingType: z.string().trim().min(1).max(80).optional(),
    manufacturer: z.string().trim().min(1).max(200),
    registrationId: z.string().trim().min(1).max(120).optional(),
    composition: z.string().trim().max(2000).optional(),
    applicableCrops: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
    dosage: z.string().trim().max(500).optional(),
    applicationMethod: z.string().trim().max(500).optional(),
    status: z.enum(inputStatuses).default('PENDING'),
    referenceNote: z.string().trim().max(2000).optional(),
    statusReason: z.string().trim().max(500).optional(),
    supportingDocs: z.array(supportingDocSchema).max(20).default([]),
  })
  .strict();
export type CreateInputBody = z.infer<typeof createInputBody>;

export const updateInputBody = z
  .object({
    code: z.string().trim().min(2).max(60).optional(),
    name: z.string().trim().min(2).max(200).optional(),
    category: z.string().trim().min(2).max(120).optional(),
    subcategory: z.string().trim().min(1).max(120).nullable().optional(),
    farmingType: z.string().trim().min(1).max(80).nullable().optional(),
    manufacturer: z.string().trim().min(1).max(200).optional(),
    registrationId: z.string().trim().min(1).max(120).nullable().optional(),
    composition: z.string().trim().max(2000).nullable().optional(),
    applicableCrops: z.array(z.string().trim().min(1).max(120)).max(100).optional(),
    dosage: z.string().trim().max(500).nullable().optional(),
    applicationMethod: z.string().trim().max(500).nullable().optional(),
    status: z.enum(inputStatuses).optional(),
    referenceNote: z.string().trim().max(2000).nullable().optional(),
    statusReason: z.string().trim().max(500).nullable().optional(),
    supportingDocs: z.array(supportingDocSchema).max(20).optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'At least one field must be supplied' });
export type UpdateInputBody = z.infer<typeof updateInputBody>;

const publicInputBase = {
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  category: z.string(),
  subcategory: z.string().nullable(),
  farmingType: z.string().nullable(),
  manufacturer: z.string(),
  registrationId: z.string().nullable(),
  composition: z.string().nullable(),
  applicableCrops: z.array(z.string()),
  dosage: z.string().nullable(),
  applicationMethod: z.string().nullable(),
  status: z.enum(inputStatuses),
  supportingDocs: z.array(supportingDocSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
};

export const publicInputResponse = z.object(publicInputBase);
export type PublicInputResponse = z.infer<typeof publicInputResponse>;

export const adminInputResponse = z.object({
  ...publicInputBase,
  referenceNote: z.string().nullable(),
  statusReason: z.string().nullable(),
  approvedBy: z.string().uuid().nullable(),
  approvedAt: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  updatedBy: z.string().uuid().nullable(),
});
export type AdminInputResponse = z.infer<typeof adminInputResponse>;
