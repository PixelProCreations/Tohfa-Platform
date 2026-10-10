/**
 * soil.repo — classification-band configuration (BR-40).
 *
 * No seed inserts the `soil.classification.*` system_config rows, so a freshly
 * migrated database must answer with a clear, actionable 503 instead of an
 * opaque 500 from a bare `Error`.
 */
import { describe, expect, it } from 'vitest';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { SOIL_CLASSIFICATION_CONFIG_KEYS, soilRepo } from './soil.repo.js';

/** An Executor that answers the single system_config read with the given rows. */
function executorReturning(rows: Array<{ key: string; value: unknown }>): Executor {
  return {
    query: async () => ({ rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] }),
  } as unknown as Executor;
}

describe('soilRepo.getClassificationBands', () => {
  it('BR-40: a missing config is a 503 AppError naming every missing key, not a plain Error', async () => {
    const err = await soilRepo.getClassificationBands(executorReturning([])).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AppError);
    const appError = err as AppError;
    expect(appError.status).toBe(503);
    expect(appError.code).toBe('INTERNAL');
    for (const key of Object.values(SOIL_CLASSIFICATION_CONFIG_KEYS)) {
      expect(appError.detail).toContain(key);
    }
    expect(appError.meta).toEqual({
      missingConfigKeys: Object.values(SOIL_CLASSIFICATION_CONFIG_KEYS),
    });
  });

  it('BR-40: a partly configured database names only the keys that are missing', async () => {
    const band = { low: 1, high: 2, belowLabel: 'L', insideLabel: 'M', aboveLabel: 'H' };
    const present = Object.values(SOIL_CLASSIFICATION_CONFIG_KEYS).slice(0, 6);
    const err = await soilRepo
      .getClassificationBands(executorReturning(present.map((key) => ({ key, value: band }))))
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).meta).toEqual({
      missingConfigKeys: [SOIL_CLASSIFICATION_CONFIG_KEYS.potassium],
    });
  });

  it('BR-40: returns the bands keyed by metric when every key is present', async () => {
    const band = { low: 1, high: 2, belowLabel: 'L', insideLabel: 'M', aboveLabel: 'H' };
    const rows = Object.values(SOIL_CLASSIFICATION_CONFIG_KEYS).map((key) => ({ key, value: band }));

    const bands = await soilRepo.getClassificationBands(executorReturning(rows));

    expect(Object.keys(bands).sort()).toEqual(Object.keys(SOIL_CLASSIFICATION_CONFIG_KEYS).sort());
    expect(bands.ph).toEqual(band);
  });
});
