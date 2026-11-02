/**
 * Tier threshold configuration (BR-04, BR-111).
 *
 * ONE STORE, TWO PERMISSIONS. BR-04 ("Extension to audits", product decision 2026-10-01) gives
 * farm ratings and audits one 0-100 scale read from `rating_tier_config`. `farmer.rating.configure_tiers`
 * and `audit.tier.configure_thresholds` therefore both replace the same generation; the permission
 * that admitted the call (`scope.permission`) is recorded as the audit row's action code so the
 * trail still says which screen made the change.
 *
 * NO THRESHOLD LITERALS. The only constants here are the tier CODES (identifiers, shared with the
 * read schemas) and the 0-100 range of the score itself (BR-06: 10 categories x 10 points). The band
 * boundaries come from the request and the current generation, never from this file.
 *
 * VALIDATION (BR-111) runs before anything is written. Conventions are the table's own: min
 * inclusive, max exclusive, null unbounded. Bands must start at 0, be contiguous, be non-empty, and
 * end unbounded, so every score 0-100 has exactly one tier.
 */
import { writeAuditLog } from '../../audit/auditLog.js';
import type { Executor } from '../../db/pool.js';
import { withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { tierConfigRepo, type Generation, type NewTierRow, type TierConfigRepo } from './tier-config.repo.js';
import { RATING_TIER_CODES, type TierBandsBody, type TierBandsGeneration } from './tier-config.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface TierConfigServiceDeps {
  repo: TierConfigRepo;
  transaction: TransactionRunner;
}

export interface TierConfigService {
  replaceTiers(scope: ResolvedScope, body: TierBandsBody): Promise<TierBandsGeneration>;
}

/** `rating_tier_config.min_score` / `max_score` are numeric(6,2). */
function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-9;
}

class Problems {
  readonly errors: Record<string, string[]> = {};
  add(index: number, field: string, message: string): void {
    const key = `body.tiers.${index}.${field}`;
    (this.errors[key] ??= []).push(message);
  }
  get any(): boolean {
    return Object.keys(this.errors).length > 0;
  }
}

/** BR-111a: the shape rules the zod schema cannot express. */
function validateBands(tiers: TierBandsBody['tiers']): Problems {
  const problems = new Problems();
  const last = tiers.length - 1;
  tiers.forEach((tier, i) => {
    const expected = RATING_TIER_CODES[i];
    if (tier.code !== expected) problems.add(i, 'code', `Tier ${i + 1} must be ${expected}; tiers are listed once each, lowest first.`);
    if (!hasAtMostTwoDecimals(tier.minScore)) problems.add(i, 'minScore', 'At most 2 decimal places.');
    if (tier.maxScore !== null && !hasAtMostTwoDecimals(tier.maxScore)) problems.add(i, 'maxScore', 'At most 2 decimal places.');
    if (i === 0 && tier.minScore !== 0) problems.add(i, 'minScore', 'The lowest tier must start at 0.');
    if (i === last) {
      if (tier.maxScore !== null) problems.add(i, 'maxScore', 'The highest tier must be unbounded (null), so every score has a tier.');
      return;
    }
    if (tier.maxScore === null) {
      problems.add(i, 'maxScore', 'Only the highest tier may be unbounded.');
      return;
    }
    if (tier.maxScore <= tier.minScore) problems.add(i, 'maxScore', 'Must be greater than minScore (maxScore is exclusive).');
    const next = tiers[i + 1]!;
    if (tier.maxScore < next.minScore) problems.add(i, 'maxScore', `Leaves a gap: the next tier starts at ${next.minScore}.`);
    if (tier.maxScore > next.minScore) problems.add(i, 'maxScore', `Overlaps the next tier, which starts at ${next.minScore}.`);
  });
  return problems;
}

function bandsImage(generation: { effectiveFrom: string | null; tiers: Array<{ code: string; label: string; minScore: number; maxScore: number | null }> }) {
  return {
    effectiveFrom: generation.effectiveFrom,
    tiers: generation.tiers.map(({ code, label, minScore, maxScore }) => ({ code, label, minScore, maxScore })),
  };
}

function toResponse(generation: Generation): TierBandsGeneration {
  return {
    effectiveFrom: generation.effectiveFrom ?? '',
    tiers: generation.tiers.map((t) => ({
      code: t.code as TierBandsGeneration['tiers'][number]['code'],
      label: t.label,
      minScore: t.minScore,
      maxScore: t.maxScore,
      sortOrder: t.sortOrder,
    })),
  };
}

export function createTierConfigService(deps: Partial<TierConfigServiceDeps> = {}): TierConfigService {
  const repo = deps.repo ?? tierConfigRepo;
  const transaction: TransactionRunner = deps.transaction ?? ((fn) => withTransaction(fn));

  return {
    async replaceTiers(scope, body) {
      const problems = validateBands(body.tiers);
      if (problems.any) {
        throw new AppError('VALIDATION_FAILED', { detail: 'The tier bands are invalid.', errors: problems.errors });
      }

      return transaction(async (tx) => {
        await repo.lock(tx);
        const current = await repo.currentGeneration(tx);
        const currentByCode = new Map(current.tiers.map((t) => [t.code, t]));

        const missingLabels = new Problems();
        const rows: NewTierRow[] = body.tiers.map((tier, i) => {
          const previous = currentByCode.get(tier.code);
          const label = tier.label ?? previous?.label;
          if (label === undefined) missingLabels.add(i, 'label', 'Required: there is no current label for this tier to keep.');
          return {
            code: tier.code,
            label: label ?? '',
            minScore: tier.minScore,
            maxScore: tier.maxScore,
            colorHex: previous?.colorHex ?? null,
            sortOrder: i + 1,
          };
        });
        if (missingLabels.any) {
          throw new AppError('VALIDATION_FAILED', { detail: 'The tier bands are invalid.', errors: missingLabels.errors });
        }

        // BR-111c: the same bands again record nothing.
        const before = bandsImage(current);
        const unchanged = JSON.stringify(before.tiers) === JSON.stringify(bandsImage({ effectiveFrom: null, tiers: rows }).tiers);
        if (unchanged) return toResponse(current);

        await repo.writeTodaysGeneration(tx, rows, scope.userId);
        const updated = await repo.currentGeneration(tx);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: scope.permission,
          entityType: 'rating_tier_config',
          entityId: null,
          before,
          after: bandsImage(updated),
          changedFields: ['tiers'],
        });
        return toResponse(updated);
      });
    },
  };
}

export const tierConfigService: TierConfigService = createTierConfigService();
