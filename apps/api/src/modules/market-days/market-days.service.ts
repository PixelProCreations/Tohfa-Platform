import { pool } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type {
  CreateMarketDayInput,
  ListMarketDaysQuery,
  MarketDayResponse,
  PatchMarketDayInput,
} from './market-days.schema.js';
import { marketDaysRepo, type MarketDaysRepo } from './market-days.repo.js';

export interface MarketDaysService {
  create(
    input: CreateMarketDayInput,
    createdBy?: string,
  ): Promise<MarketDayResponse>;
  update(
    id: string,
    patch: PatchMarketDayInput,
  ): Promise<MarketDayResponse>;
  list(query: ListMarketDaysQuery): Promise<MarketDayResponse[]>;
}

export function createMarketDaysService(
  repo: MarketDaysRepo = marketDaysRepo,
): MarketDaysService {
  return {
    async create(input, createdBy) {
      // Validate warehouse exists
      const whRes = await pool.query<{ id: string }>(
        `SELECT id FROM warehouses WHERE id = $1 AND deleted_at IS NULL`,
        [input.warehouseId],
      );
      if (whRes.rows.length === 0) {
        throw new AppError('NOT_FOUND', { detail: 'Warehouse not found' });
      }

      if (input.startTime >= input.endTime) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'startTime must be before endTime',
        });
      }

      return repo.create(pool, input, createdBy);
    },

    async update(id, patch) {
      const existing = await repo.findById(pool, id);
      if (!existing) {
        throw new AppError('NOT_FOUND', { detail: 'Market day not found' });
      }

      const effectiveStart = patch.startTime ?? existing.startTime;
      const effectiveEnd = patch.endTime ?? existing.endTime;
      if (effectiveStart >= effectiveEnd) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'startTime must be before endTime',
        });
      }

      const updated = await repo.update(pool, id, patch);
      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: 'Market day not found' });
      }
      return updated;
    },

    async list(query) {
      return repo.list(pool, query);
    },
  };
}

export const marketDaysService = createMarketDaysService();
