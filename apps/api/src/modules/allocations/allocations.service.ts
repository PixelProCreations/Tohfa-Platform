import { ErrorCode, GenericProblemCode, RoleCode } from '@tohfa/shared-types';
import { kgToGrams, gramsToKg } from '../sales/sales.math.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  allocationsRepo,
  type AllocationConfigFilter,
  type AllocationsRepo,
  type InsertAllocationItem,
  type ListAllocationsResult,
} from './allocations.repo.js';
import type {
  AllocationChannel,
  AllocationConfigView,
  AllocationView,
  ListAllocationsQuery,
  UpdateAllocationConfigBody,
} from './allocations.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface AllocateBatchInput {
  batchId: string;
  warehouseId: string;
  cropId: string;
  qtyReceivedKg: string;
  receivedOn?: string;
}

export class AllocationsService {
  constructor(
    private readonly repo: AllocationsRepo = allocationsRepo,
    private readonly runTx: TransactionRunner = withTransaction,
  ) {}

  /**
   * BR-12: Splits an inventory batch across ONLINE, LIVE_MARKET, RESERVE, BUFFER
   * using the effective configuration percentages and exact rounding to 3 decimal places.
   * Remainder is always given to BUFFER (BR-12a).
   */
  async allocateBatch(
    input: AllocateBatchInput,
    tx?: Executor,
  ): Promise<AllocationView[]> {
    const execute = async (client: Executor) => {
      const effectiveDate =
        input.receivedOn ?? new Date().toISOString().split('T')[0]!;

      // 1. Read percentages dynamically from config — no hardcoded constants
      const percentages = await this.repo.getEffectivePercentages(
        client,
        effectiveDate,
        input.cropId,
        input.warehouseId,
      );

      const batchGrams = kgToGrams(input.qtyReceivedKg);
      const flooredItems: Array<{ channel: AllocationChannel; grams: number }> = [];
      let sumFlooredGrams = 0;

      for (const p of percentages) {
        // Floor integer division: floor(batchGrams * p.percentage / 100)
        const channelGrams = Math.floor((batchGrams * p.percentage) / 100);
        flooredItems.push({ channel: p.channel, grams: channelGrams });
        sumFlooredGrams += channelGrams;
      }

      // Exact remainder goes to BUFFER (BR-12a)
      const remainderGrams = batchGrams - sumFlooredGrams;

      const itemsToInsert: InsertAllocationItem[] = flooredItems.map((item) => {
        let finalGrams = item.grams;
        if (item.channel === 'BUFFER') {
          finalGrams += remainderGrams;
        }
        return {
          batchId: input.batchId,
          warehouseId: input.warehouseId,
          channel: item.channel,
          allocatedQtyKg: gramsToKg(finalGrams),
          computedBy: 'AUTO',
        };
      });

      const rows = await this.repo.insertBatchAllocations(client, itemsToInsert);
      return rows.map((r) => ({
        id: r.id,
        batchId: r.batch_id,
        warehouseId: r.warehouse_id,
        cropId: r.crop_id,
        grade: r.grade,
        allocationDate: effectiveDate,
        channel: r.channel,
        allocatedQtyKg: r.allocated_qty,
        consumedQtyKg: r.consumed_qty,
        reservedQtyKg: r.reserved_qty,
        availableQtyKg: r.available_qty,
        computedBy: r.computed_by,
        overriddenBy: r.overridden_by,
      }));
    };

    if (tx !== undefined) {
      return execute(tx);
    }
    return this.runTx(execute);
  }

  /**
   * Sets channel percentages (Super Admin only).
   */
  async updateAllocationConfig(
    actor: Actor,
    scope: ResolvedScope,
    input: UpdateAllocationConfigBody,
  ): Promise<AllocationConfigView> {
    // Only SUPER_ADMIN may change percentages; TOHFA_ADMIN gets 403
    if (scope.roleCode !== RoleCode.SUPER_ADMIN) {
      throw new AppError(GenericProblemCode.FORBIDDEN, {
        detail: 'Only Super Admin can update channel allocation percentages.',
      });
    }

    return this.runTx(async (tx) => {
      const result = await this.repo.saveAllocationConfig(tx, input, actor.userId);

      await writeAuditLog(tx, {
        actorId: actor.userId,
        actorRole: scope.roleCode,
        actionCode: 'allocation.channel_percentage.set',
        entityType: 'allocation_config',
        entityId: null,
        outcome: 'ALLOWED',
        after: {
          effectiveFrom: input.effectiveFrom,
          warehouseId: input.warehouseId ?? null,
          cropId: input.cropId ?? null,
          grade: input.grade ?? null,
          channels: input.channels,
        },
      });

      return result;
    });
  }

  async getAllocationConfig(
    _scope: ResolvedScope,
    filter?: AllocationConfigFilter | string | null,
    db: Executor = pool,
  ): Promise<AllocationConfigView> {
    return this.repo.getAllocationConfig(db, filter);
  }

  async listAllocations(
    scope: ResolvedScope,
    filters: ListAllocationsQuery,
    db: Executor = pool,
  ): Promise<ListAllocationsResult> {
    return this.repo.listAllocations(db, scope, filters);
  }

  /**
   * BR-12c: Online order exceeding the Online bucket returns 409 INSUFFICIENT_ALLOCATION.
   * Does not draw from Reserve or Buffer.
   */
  async checkChannelAllocation(
    warehouseId: string,
    cropId: string,
    channel: AllocationChannel,
    requestedQtyKg: string,
    db: Executor = pool,
  ): Promise<void> {
    const available = await this.repo.getAvailableQuantityForChannel(
      db,
      warehouseId,
      cropId,
      channel,
    );

    if (kgToGrams(available) < kgToGrams(requestedQtyKg)) {
      throw new AppError(ErrorCode.INSUFFICIENT_ALLOCATION, {
        status: 409,
        detail: `Requested ${requestedQtyKg} kg exceeds available ${available} kg in ${channel} allocation.`,
      });
    }
  }

  /**
   * BR-13a & BR-13b: B2B/Horeca draw from Reserve/Buffer is deferred and blocked on contradiction 10.
   */
  async requestB2BHorecaDraw(): Promise<never> {
    throw new AppError(GenericProblemCode.BAD_REQUEST, {
      status: 501,
      detail:
        'BR-13: B2B/Horeca automatic allocation is deferred and contested (contradiction 10).',
    });
  }
}

export const allocationsService = new AllocationsService();
