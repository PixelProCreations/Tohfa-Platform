import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');

export const milestoneStatusEnum = z.enum(['PENDING', 'COMPLETED', 'SKIPPED']);
export type MilestoneStatus = z.infer<typeof milestoneStatusEnum>;

export const farmCropIdParams = z
  .object({
    farmCropId: z.string().uuid('farmCropId must be a UUID'),
  })
  .strict();
export type FarmCropIdParams = z.infer<typeof farmCropIdParams>;

export const milestoneIdParams = z
  .object({
    farmCropId: z.string().uuid('farmCropId must be a UUID'),
    id: z.string().uuid('id must be a UUID'),
  })
  .strict();
export type MilestoneIdParams = z.infer<typeof milestoneIdParams>;

export const updateMilestoneBody = z
  .object({
    status: milestoneStatusEnum.optional(),
    completedOn: isoDate.nullable().optional(),
    targetDate: isoDate.nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field must be supplied' });
export type UpdateMilestoneBody = z.infer<typeof updateMilestoneBody>;

export const listTemplatesQuery = z
  .object({
    cropMasterId: z.string().uuid('cropMasterId must be a UUID').optional(),
  })
  .strict();
export type ListTemplatesQuery = z.infer<typeof listTemplatesQuery>;

export const cropMilestoneResponse = z.object({
  id: z.string().uuid(),
  farmerId: z.string().uuid(),
  farmCropId: z.string().uuid(),
  templateId: z.string().uuid().nullable(),
  stageCode: z.string(),
  stageName: z.string(),
  sequenceOrder: z.number().int(),
  status: milestoneStatusEnum,
  targetDate: z.string().nullable(),
  completedOn: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type CropMilestoneResponse = z.infer<typeof cropMilestoneResponse>;

export const cropMilestonesListResponse = z.object({
  items: z.array(cropMilestoneResponse),
  totalCount: z.number().int(),
  completedCount: z.number().int(),
  progressPct: z.number(),
});
export type CropMilestonesListResponse = z.infer<typeof cropMilestonesListResponse>;

export const cropMilestoneTemplateResponse = z.object({
  id: z.string().uuid(),
  cropMasterId: z.string().uuid().nullable(),
  stageCode: z.string(),
  stageName: z.string(),
  description: z.string().nullable(),
  sequenceOrder: z.number().int(),
  expectedDaysAfterPlanting: z.number().int().nullable(),
});
export type CropMilestoneTemplateResponse = z.infer<typeof cropMilestoneTemplateResponse>;
