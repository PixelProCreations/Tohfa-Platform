/**
 * Admin Produce Control Calendar (BR-142): Service layer.
 *
 * Translates ResolvedScope to SQL scope filter using shared `farmerScopeFilter`,
 * coordinates calls to the repo, enforces NOT_FOUND on absent/out-of-scope rows,
 * and parses all responses through strict Zod allow-list schemas.
 */
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { farmerScopeFilter } from '../admin-farmers/admin-farmers.service.js';
import {
  adminProduceRepo,
  type AdminProduceRepo,
} from './admin-produce.repo.js';
import {
  cropRecordSummarySchema,
  produceCalendarEventsResponse,
  produceCalendarResponse,
  produceFilterOptionsResponse,
  produceRecordDetailResponse,
  produceRecordsListResponse,
  type ListProduceRecordsQuery,
  type ProduceCalendarEventsQuery,
  type ProduceCalendarEventsResponse,
  type ProduceCalendarQuery,
  type ProduceCalendarResponse,
  type ProduceFilterOptionsResponse,
  type ProduceRecordDetailResponse,
  type ProduceRecordsListResponse,
} from './admin-produce.schema.js';

export interface AdminProduceService {
  listRecords(scope: ResolvedScope, query: ListProduceRecordsQuery): Promise<ProduceRecordsListResponse>;
  getRecordById(scope: ResolvedScope, id: string): Promise<ProduceRecordDetailResponse>;
  getCalendar(scope: ResolvedScope, query: ProduceCalendarQuery): Promise<ProduceCalendarResponse>;
  listCalendarEvents(scope: ResolvedScope, query: ProduceCalendarEventsQuery): Promise<ProduceCalendarEventsResponse>;
  getFilterOptions(scope: ResolvedScope): Promise<ProduceFilterOptionsResponse>;
}

export function createAdminProduceService(
  repo: AdminProduceRepo = adminProduceRepo,
  db: Executor = pool,
): AdminProduceService {
  return {
    async listRecords(scope: ResolvedScope, query: ListProduceRecordsQuery): Promise<ProduceRecordsListResponse> {
      const scopeFilter = farmerScopeFilter(scope);
      const { cursor, limit, includeTotal, ...filters } = query;

      const result = await repo.listRecords(db, {
        filters,
        scope: scopeFilter,
        limit,
        cursor,
        includeTotal,
      });

      const items = result.items.map((item) => cropRecordSummarySchema.parse(item));
      return produceRecordsListResponse.parse({
        items,
        page: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
          total: result.total,
        },
      });
    },

    async getRecordById(scope: ResolvedScope, id: string): Promise<ProduceRecordDetailResponse> {
      const scopeFilter = farmerScopeFilter(scope);
      const detail = await repo.findRecordById(db, id, scopeFilter);
      if (!detail) {
        throw new AppError('NOT_FOUND', { detail: `No crop record with id "${id}" is visible to you.` });
      }

      return produceRecordDetailResponse.parse(detail);
    },

    async getCalendar(scope: ResolvedScope, query: ProduceCalendarQuery): Promise<ProduceCalendarResponse> {
      const scopeFilter = farmerScopeFilter(scope);
      const { month, ...filters } = query;

      const result = await repo.getCalendar(db, {
        month,
        filters,
        scope: scopeFilter,
      });

      return produceCalendarResponse.parse(result);
    },

    async listCalendarEvents(scope: ResolvedScope, query: ProduceCalendarEventsQuery): Promise<ProduceCalendarEventsResponse> {
      const scopeFilter = farmerScopeFilter(scope);
      const { date, cursor, limit, ...filters } = query;

      const result = await repo.listCalendarEvents(db, {
        date,
        filters,
        scope: scopeFilter,
        limit,
        cursor,
      });

      return produceCalendarEventsResponse.parse({
        items: result.items,
        page: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    },

    async getFilterOptions(scope: ResolvedScope): Promise<ProduceFilterOptionsResponse> {
      const result = await repo.getFilterOptions(db, scope);
      return produceFilterOptionsResponse.parse(result);
    },
  };
}

export const adminProduceService = createAdminProduceService();
