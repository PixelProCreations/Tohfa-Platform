/**
 * Farm rating service (BR-04, BR-06).
 *
 * PRODUCT DECISION (2026-10-01, owner): the rating comes from AUDITS ONLY.
 * There is no manual write any more (the PUT /admin/farmers/{id}/rating route,
 * setRating and the farmer.rating.edit permission were removed). The one write
 * is `recordAuditRating`, which audits.service.ts calls inside the SAME
 * transaction that completes an INTERNAL audit. EXTERNAL audits, red flags,
 * cancellations and reschedules never call it.
 *
 * HISTORY. Every audit-derived rating is a NEW farm_ratings row; nothing ever
 * updates an earlier row. The newest row (findLatestRating) is the current
 * rating. Legacy manual rows (source_audit_id NULL, 'CYCLE-n') stay as history
 * and read back with source MANUAL.
 */
import { writeAuditLog } from '../../audit/auditLog.js';
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { farmRatingsRepo, type FarmRatingsRepo } from './farm-ratings.repo.js';
import type { FarmRatingResponse, RatingTier } from './farm-ratings.schema.js';

/** What a completed INTERNAL audit hands over to become a farm rating. */
export interface AuditRatingInput {
  auditId: string;
  farmerId: string;
  farmId: string | null;
  zoneId: string | null;
  /** Indian fiscal year label, e.g. '2026-27' (BR-03). */
  fiscalYear: string;
  quarter: number;
  scores: Array<{ categoryCode: string; score: number; remarks: string | null }>;
  /** users.id of the admin completing the audit: rated_by and scored_by. */
  ratedBy: string;
  actorRole: string;
}

export interface FarmRatingsService {
  getAdminRating(scope: ResolvedScope, farmerId: string): Promise<FarmRatingResponse>;
  getMyRating(scope: ResolvedScope): Promise<FarmRatingResponse>;
  /**
   * Creates a COMPLETE rating from a completed INTERNAL audit. Takes the
   * caller's transaction client: it must commit or roll back together with the
   * audit's own COMPLETED transition (BR-06g). Writes its own audit_log row
   * through the same client.
   */
  recordAuditRating(tx: Executor, input: AuditRatingInput): Promise<FarmRatingResponse>;
}

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = '23505';

/** One period per audit quarter; keeps UNIQUE (farmer_id, period_label) meaningful. */
export function auditPeriodLabel(fiscalYear: string, quarter: number): string {
  return `${fiscalYear} Q${quarter}`;
}

/**
 * Assembles the FarmRating response for a farmer from the latest cycle, or an
 * all-null DRAFT shell if the farmer has never been rated. Shared by both GET
 * endpoints and by recordAuditRating's before/after audit snapshots, so the
 * shape returned to a client always matches what got written to `audit_log`.
 *
 * "CYCLE-1" for a never-rated farmer is a legacy placeholder kept so existing
 * clients see an unchanged shape; it is never persisted (audit-derived rows
 * are labelled '<fiscal year> Q<quarter>').
 */
async function assembleResponse(
  repo: FarmRatingsRepo,
  tx: Executor,
  farmerId: string,
): Promise<FarmRatingResponse> {
  const categories = await repo.findActiveCategories(tx);
  const latest = await repo.findLatestRating(tx, farmerId);
  const scoresByCategoryId = latest !== null ? await repo.findScoresForRating(tx, latest.id) : new Map<string, number>();

  return {
    farmerId,
    periodLabel: latest?.periodLabel ?? 'CYCLE-1',
    status: latest?.status ?? 'DRAFT',
    modules: categories.map((category) => ({
      categoryCode: category.code,
      score: scoresByCategoryId.get(category.id) ?? null,
      maxScore: 10 as const,
    })),
    overallRating: latest?.totalScore ?? null,
    ratingTier: (latest?.tierCode as RatingTier | null | undefined) ?? null,
    ratedAt: latest?.ratedAt ? latest.ratedAt.toISOString() : null,
    source: latest === null ? null : latest.sourceAuditId === null ? 'MANUAL' : 'AUDIT',
    sourceAuditId: latest?.sourceAuditId ?? null,
  };
}

/**
 * No transaction runner: the reads use `db`, and the one write joins the
 * caller's transaction (the audit completion's) rather than opening its own.
 */
export function createFarmRatingsService(
  repo: FarmRatingsRepo = farmRatingsRepo,
  db: Executor = pool,
): FarmRatingsService {
  return {
    async getAdminRating(scope, farmerId) {
      const farmer = await repo.findFarmerForView(db, farmerId, scope);
      if (farmer === null) {
        // NOTE: 404 rather than 403 — a row that exists but is out of scope
        // must not be distinguishable from one that does not exist (root
        // CLAUDE.md §2.1; see also warehouses.service.ts's identical note).
        throw new AppError('NOT_FOUND', {
          detail: `No farmer with id "${farmerId}" is visible to you.`,
        });
      }
      return assembleResponse(repo, db, farmerId);
    },

    async getMyRating(scope) {
      if (scope.farmerId === undefined) {
        throw new AppError('NOT_FOUND', { detail: 'No farmer profile for the current actor.' });
      }
      const farmer = await repo.findFarmerZone(db, scope.farmerId);
      if (farmer === null) {
        throw new AppError('NOT_FOUND', { detail: 'No farmer profile for the current actor.' });
      }
      return assembleResponse(repo, db, scope.farmerId);
    },

    async recordAuditRating(tx, input) {
      // 1. BR-06b: the audit's sheet must be exactly the live active
      //    categories — no unknowns, no duplicates, none missing (a missing
      //    category is incomplete, never zero). The audit completion path has
      //    already enforced this; it is re-checked here because this function
      //    is the rating's own gate and is also callable from scripts.
      const categories = await repo.findActiveCategories(tx);
      const categoryByCode = new Map(categories.map((category) => [category.code, category] as const));
      const seen = new Set<string>();
      for (const entry of input.scores) {
        if (!categoryByCode.has(entry.categoryCode)) {
          throw new AppError('VALIDATION_FAILED', {
            detail: `"${entry.categoryCode}" is not a currently-active rating category.`,
          });
        }
        if (seen.has(entry.categoryCode)) {
          throw new AppError('VALIDATION_FAILED', {
            detail: `Rating category "${entry.categoryCode}" appears more than once.`,
          });
        }
        seen.add(entry.categoryCode);
      }
      const missing = categories.filter((category) => !seen.has(category.code)).map((category) => category.code);
      if (missing.length > 0) {
        throw new AppError('VALIDATION_FAILED', {
          detail: `A farm rating needs every active category; missing: ${missing.join(', ')}.`,
          meta: { missingCategoryCodes: missing },
        });
      }

      // 2. BR-06a: each score is a whole number 0-10. The database CHECKs
      //    enforce it too; the domain error code is what BR-06a names.
      for (const entry of input.scores) {
        if (!Number.isInteger(entry.score) || entry.score < 0 || entry.score > 10) {
          throw new AppError('SCORE_OUT_OF_RANGE', {
            detail: `Score for "${entry.categoryCode}" must be a whole number between 0 and 10 (got ${entry.score}).`,
            meta: { categoryCode: entry.categoryCode, score: entry.score },
          });
        }
      }

      const before = await assembleResponse(repo, tx, input.farmerId);

      // 3. DIRECT sum (BR-06, LOCKED — no multiplier) and the tier from
      //    rating_tier_config (BR-04a — never a literal).
      const totalScore = input.scores.reduce((sum, entry) => sum + entry.score, 0);
      const tierCode = await repo.resolveTierForScore(tx, totalScore);

      // 4. A NEW row, never an update of an earlier one: history is preserved.
      let ratingId: string;
      try {
        ratingId = await repo.insertAuditRating(tx, {
          farmerId: input.farmerId,
          farmId: input.farmId,
          zoneId: input.zoneId,
          periodLabel: auditPeriodLabel(input.fiscalYear, input.quarter),
          totalScore,
          tierCode,
          ratedBy: input.ratedBy,
          sourceAuditId: input.auditId,
        });
      } catch (error) {
        if ((error as { code?: unknown }).code === UNIQUE_VIOLATION) {
          // uq_farm_ratings_source_audit (one rating per audit) or
          // farm_ratings_period_unique (one rating per farmer per audit quarter).
          throw new AppError('CONFLICT', {
            detail: `A farm rating already exists for audit "${input.auditId}" or for ${auditPeriodLabel(input.fiscalYear, input.quarter)}.`,
          });
        }
        throw error;
      }
      await repo.insertScores(
        tx,
        ratingId,
        input.scores.map((entry) => ({
          categoryId: categoryByCode.get(entry.categoryCode)!.id,
          score: entry.score,
          scoredBy: input.ratedBy,
          remarks: entry.remarks,
        })),
      );
      // Farmer-facing cache follows the newest rating, in the same transaction.
      // A plain UPDATE, not a ledger: root CLAUDE.md §2.3's trigger-maintained
      // cache rule is scoped to wallets.balance / inventory_batches.qty_available.
      await repo.updateFarmerRatingCache(tx, input.farmerId, totalScore, tierCode);

      const after = await assembleResponse(repo, tx, input.farmerId);
      await writeAuditLog(tx, {
        actorId: input.ratedBy,
        actorRole: input.actorRole,
        actionCode: 'farm_rating.create_from_audit',
        entityType: 'farm_rating',
        entityId: ratingId,
        before,
        after,
      });
      return after;
    },
  };
}

export const farmRatingsService: FarmRatingsService = createFarmRatingsService();
