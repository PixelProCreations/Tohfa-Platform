/**
 * BR-193: per-top-up limits for a customer's digital top-up. system_config keys
 * `topup_min_amount` / `topup_max_amount` (money strings); a missing or malformed value falls
 * back to the documented defaults below rather than failing the wallet screen.
 */
import { isMoney, parseMoney, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';

export const DEFAULT_TOPUP_MIN: Money = parseMoney('100.00');
export const DEFAULT_TOPUP_MAX: Money = parseMoney('50000.00');

export interface TopupLimits {
  min: Money;
  max: Money;
}

export function resolveTopupLimits(minRaw: unknown, maxRaw: unknown): TopupLimits {
  const pick = (raw: unknown, fallback: Money): Money => {
    const v = typeof raw === 'number' ? raw.toFixed(2) : raw;
    return isMoney(v) ? parseMoney(v) : fallback;
  };
  const min = pick(minRaw, DEFAULT_TOPUP_MIN);
  const max = pick(maxRaw, DEFAULT_TOPUP_MAX);
  // A misconfigured pair (min above max) would make every top-up impossible: use the defaults.
  return Number(min) > Number(max) ? { min: DEFAULT_TOPUP_MIN, max: DEFAULT_TOPUP_MAX } : { min, max };
}

export async function readTopupLimits(db: Executor): Promise<TopupLimits> {
  const res = await db.query<{ key: string; value: unknown }>(
    `SELECT key, value FROM system_config WHERE key IN ('topup_min_amount', 'topup_max_amount')`,
  );
  const byKey = new Map(res.rows.map((r) => [r.key, r.value]));
  return resolveTopupLimits(byKey.get('topup_min_amount'), byKey.get('topup_max_amount'));
}
