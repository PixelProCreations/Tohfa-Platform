/**
 * Farm rating (BR-06, LOCKED). Exactly 10 named categories, each scored 0-10,
 * summed DIRECTLY to a 0-100 total — no multiplier (10 x 10 = 100 already).
 * See db/migrations/0003_farmers_and_farms.sql for the schema and
 * db/seed/001_reference.sql for the 10 seeded categories.
 *
 * READ-ONLY over HTTP (product decision 2026-10-01): a rating is created only
 * by completing an INTERNAL audit (farm-ratings.service.ts recordAuditRating,
 * called from audits.service.ts complete). There is no request schema here
 * because there is no write endpoint; the removed PUT's body went with it.
 */
import { z } from 'zod';

export const ratingTiers = ['POOR', 'MODERATE', 'GOOD', 'EXCELLENT'] as const;
export type RatingTier = (typeof ratingTiers)[number];

export const ratingStatuses = ['DRAFT', 'COMPLETE'] as const;
export type RatingStatus = (typeof ratingStatuses)[number];

/** AUDIT = derived from a completed INTERNAL audit; MANUAL = legacy row from the removed PUT. */
export const ratingSources = ['AUDIT', 'MANUAL'] as const;
export type RatingSource = (typeof ratingSources)[number];

export const farmerIdParams = z
  .object({
    id: z.string().uuid('Farmer ID must be a valid UUID'),
  })
  .strict();
export type FarmerIdParams = z.infer<typeof farmerIdParams>;

/**
 * No `name`/display-name field: root CLAUDE.md §2.7 forbids user-facing
 * strings sourced from the DB reaching a client. The mobile/admin clients own
 * category display names via their own i18n catalogues; `categoryCode` is
 * enough for them to look up their own label.
 */
export const farmRatingModuleResponse = z.object({
  categoryCode: z.string(),
  score: z.number().int().nullable(),
  maxScore: z.literal(10),
});
export type FarmRatingModuleResponse = z.infer<typeof farmRatingModuleResponse>;

export const farmRatingResponse = z.object({
  farmerId: z.string().uuid(),
  periodLabel: z.string(),
  status: z.enum(ratingStatuses),
  modules: z.array(farmRatingModuleResponse).length(10),
  overallRating: z.number().nullable(),
  ratingTier: z.enum(ratingTiers).nullable(),
  ratedAt: z.string().nullable(),
  // Additive (2026-10-01). null only for a farmer who has never been rated.
  source: z.enum(ratingSources).nullable(),
  sourceAuditId: z.string().uuid().nullable(),
});
export type FarmRatingResponse = z.infer<typeof farmRatingResponse>;
