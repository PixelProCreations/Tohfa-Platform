import { z } from 'zod';

export const cropPlanningInsightItem = z.object({
  cropMasterId: z.string().uuid(),
  cropName: z.string(),
  category: z.string(),
  youGrow: z.boolean(),
  inSeason: z.boolean().nullable(),
  activePlots: z.array(z.string()),
  totalAcreageGrown: z.number(),
  expectedYieldKg: z.number().nullable(),
  pastHarvestCount: z.number(),
  lastHarvestedOn: z.string().nullable(),
  hasConsecutivePlanting: z.boolean(),
  consecutivePlotNames: z.array(z.string()),
});
export type CropPlanningInsightItem = z.infer<typeof cropPlanningInsightItem>;

export const cropPlanningInsightResponse = z.object({
  generatedAt: z.string(),
  crops: z.array(cropPlanningInsightItem),
  specGaps: z.array(z.string()),
});
export type CropPlanningInsightResponse = z.infer<typeof cropPlanningInsightResponse>;
