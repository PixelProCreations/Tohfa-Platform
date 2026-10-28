/**
 * Tier threshold configuration (BR-04, BR-111). Zod schemas only, matching docs/openapi.yaml
 * `configureRatingTiers`, `configureAuditTierThresholds`, `TierBandsRequest` and `TierBandsGeneration`.
 *
 * The schema checks shape only. Whether the bands are contiguous and cover 0-100 is a business
 * rule (BR-111) and is decided by the service, so a job or a test calling the service gets the same
 * answer as the route.
 */
import { z } from 'zod';
import { RATING_TIER_CODES } from '../admin-farmers/admin-farmers.schema.js';

export { RATING_TIER_CODES };

const score = z.number().finite().min(0).max(100);

export const tierBandInput = z
  .object({
    code: z.enum(RATING_TIER_CODES),
    label: z.string().trim().min(1).max(60).optional(),
    minScore: score,
    maxScore: score.nullable(),
  })
  .strict();
export type TierBandInput = z.infer<typeof tierBandInput>;

export const tierBandsBody = z.object({ tiers: z.array(tierBandInput).length(RATING_TIER_CODES.length) }).strict();
export type TierBandsBody = z.infer<typeof tierBandsBody>;

export const tierBand = z.object({
  code: z.enum(RATING_TIER_CODES),
  label: z.string(),
  minScore: z.number(),
  maxScore: z.number().nullable(),
  sortOrder: z.number().int(),
});
export type TierBand = z.infer<typeof tierBand>;

export const tierBandsGeneration = z.object({
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tiers: z.array(tierBand),
});
export type TierBandsGeneration = z.infer<typeof tierBandsGeneration>;
