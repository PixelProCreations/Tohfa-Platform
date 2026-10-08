import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  cropInputsRepo,
  type CropInputCursor,
  type CropInputsRepo,
} from './crop-inputs.repo.js';
import type {
  CreateCropInputBody,
  CropInputResponse,
  CropNpkContributionResponse,
  ListCropInputsQuery,
  ListCropInputsResponse,
  UpdateCropInputBody,
} from './crop-inputs.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface CropInputsServiceDeps {
  repo: CropInputsRepo;
  db: Executor;
  runTx: TransactionRunner;
}

function ownFarmerId(scope: ResolvedScope): string {
  if (scope.farmerId === undefined) {
    throw new AppError('FORBIDDEN', { detail: 'Endpoint requires a farmer identity.' });
  }
  return scope.farmerId;
}

function getTodayKolkata(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function encodeCursor(cursor: CropInputCursor): string {
  return Buffer.from(JSON.stringify([cursor.createdAt, cursor.id]), 'utf8').toString('base64url');
}

function decodeCursor(raw: string): CropInputCursor {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === 'string' &&
      !Number.isNaN(Date.parse(parsed[0])) &&
      typeof parsed[1] === 'string' &&
      /^[0-9a-f-]{36}$/i.test(parsed[1])
    ) {
      return { createdAt: parsed[0], id: parsed[1] };
    }
  } catch {
    // fall through
  }
  throw new AppError('VALIDATION_FAILED', { detail: 'cursor is not a value returned by this endpoint.' });
}

function getUnitMultiplierToKg(unit: string): number {
  switch (unit) {
    case 'TONNE':
      return 1000;
    case 'GRAM':
      return 0.001;
    case 'ML':
      return 0.001;
    case 'BAG':
      return 50; // standard 50kg bag
    case 'KG':
    case 'LITRE':
    default:
      return 1;
  }
}

export interface CropInputsService {
  listCropInputs(
    scope: ResolvedScope,
    farmCropId: string,
    query: ListCropInputsQuery,
  ): Promise<ListCropInputsResponse>;
  getCropInput(
    scope: ResolvedScope,
    farmCropId: string,
    id: string,
  ): Promise<CropInputResponse>;
  createCropInput(
    scope: ResolvedScope,
    farmCropId: string,
    body: CreateCropInputBody,
  ): Promise<CropInputResponse>;
  updateCropInput(
    scope: ResolvedScope,
    farmCropId: string,
    id: string,
    body: UpdateCropInputBody,
  ): Promise<CropInputResponse>;
  deleteCropInput(
    scope: ResolvedScope,
    farmCropId: string,
    id: string,
  ): Promise<void>;
  getNpkContribution(
    scope: ResolvedScope,
    farmCropId: string,
  ): Promise<CropNpkContributionResponse>;
}

export function createCropInputsService(deps: CropInputsServiceDeps = {
  repo: cropInputsRepo,
  db: pool,
  runTx: withTransaction,
}): CropInputsService {
  const { repo, db, runTx } = deps;

  async function assertCropOwnership(executor: Executor, farmerId: string, farmCropId: string): Promise<void> {
    const belongs = await repo.checkFarmCropBelongsToFarmer(executor, farmerId, farmCropId);
    if (!belongs) {
      throw new AppError('NOT_FOUND', { detail: `Farm crop with id "${farmCropId}" not found.` });
    }
  }

  function validateInputValues(body: {
    quantity?: number | undefined;
    appliedOn?: string | undefined;
    nitrogenPct?: number | null | undefined;
    phosphorusPct?: number | null | undefined;
    potassiumPct?: number | null | undefined;
  }) {
    if (body.quantity !== undefined && body.quantity <= 0) {
      throw new AppError('VALIDATION_FAILED', { detail: 'quantity must be greater than 0.' });
    }
    if (body.appliedOn) {
      const today = getTodayKolkata();
      if (body.appliedOn > today) {
        throw new AppError('VALIDATION_FAILED', {
          detail: `appliedOn cannot be in the future (today is ${today} in Asia/Kolkata).`,
        });
      }
    }
    for (const [name, val] of [
      ['nitrogenPct', body.nitrogenPct],
      ['phosphorusPct', body.phosphorusPct],
      ['potassiumPct', body.potassiumPct],
    ] as const) {
      if (val !== undefined && val !== null && (val < 0 || val > 100)) {
        throw new AppError('VALIDATION_FAILED', { detail: `${name} must be between 0 and 100.` });
      }
    }
  }

  return {
    async listCropInputs(scope, farmCropId, query) {
      const farmerId = ownFarmerId(scope);
      await assertCropOwnership(db, farmerId, farmCropId);

      const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;
      const { items, next } = await repo.listCropInputs(db, farmerId, farmCropId, query.limit, cursor);

      return {
        items,
        page: {
          nextCursor: next === null ? null : encodeCursor(next),
          hasMore: next !== null,
        },
      };
    },

    async getCropInput(scope, farmCropId, id) {
      const farmerId = ownFarmerId(scope);
      await assertCropOwnership(db, farmerId, farmCropId);

      const record = await repo.findCropInputById(db, farmerId, farmCropId, id);
      if (record === null) {
        throw new AppError('NOT_FOUND', { detail: `Crop input with id "${id}" not found.` });
      }
      return record;
    },

    async createCropInput(scope, farmCropId, body) {
      const farmerId = ownFarmerId(scope);
      validateInputValues(body);

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmerId);
        await assertCropOwnership(tx, farmerId, farmCropId);

        const created = await repo.createCropInput(tx, farmerId, farmCropId, body);

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode ?? 'FARMER',
          actionCode: 'crop_input.create',
          entityType: 'crop_input',
          entityId: created.id,
          after: created,
        });

        return created;
      });
    },

    async updateCropInput(scope, farmCropId, id, body) {
      const farmerId = ownFarmerId(scope);
      validateInputValues(body);

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmerId);
        await assertCropOwnership(tx, farmerId, farmCropId);

        const before = await repo.findCropInputById(tx, farmerId, farmCropId, id);
        if (before === null) {
          throw new AppError('NOT_FOUND', { detail: `Crop input with id "${id}" not found.` });
        }

        const updated = await repo.updateCropInput(tx, farmerId, farmCropId, id, body);
        if (updated === null) {
          throw new AppError('NOT_FOUND', { detail: `Crop input with id "${id}" not found.` });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode ?? 'FARMER',
          actionCode: 'crop_input.update',
          entityType: 'crop_input',
          entityId: id,
          before,
          after: updated,
          changedFields: changedFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
        });

        return updated;
      });
    },

    async deleteCropInput(scope, farmCropId, id) {
      const farmerId = ownFarmerId(scope);

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmerId);
        await assertCropOwnership(tx, farmerId, farmCropId);

        const before = await repo.findCropInputById(tx, farmerId, farmCropId, id);
        if (before === null) {
          throw new AppError('NOT_FOUND', { detail: `Crop input with id "${id}" not found.` });
        }

        const deleted = await repo.softDeleteCropInput(tx, farmerId, farmCropId, id);
        if (!deleted) {
          throw new AppError('NOT_FOUND', { detail: `Crop input with id "${id}" not found.` });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode ?? 'FARMER',
          actionCode: 'crop_input.delete',
          entityType: 'crop_input',
          entityId: id,
          before,
        });
      });
    },

    async getNpkContribution(scope, farmCropId) {
      const farmerId = ownFarmerId(scope);
      await assertCropOwnership(db, farmerId, farmCropId);

      const activeInputs = await repo.getAllActiveInputsForCrop(db, farmerId, farmCropId);

      let totalQuantityKg = 0;
      let totalNitrogenKg = 0;
      let totalPhosphorusKg = 0;
      let totalPotassiumKg = 0;
      let totalCostInr = 0;

      for (const input of activeInputs) {
        const factor = getUnitMultiplierToKg(input.unit);
        const effectiveKg = input.quantity * factor;
        totalQuantityKg += effectiveKg;

        if (input.nitrogenPct !== null) {
          totalNitrogenKg += effectiveKg * (input.nitrogenPct / 100);
        }
        if (input.phosphorusPct !== null) {
          totalPhosphorusKg += effectiveKg * (input.phosphorusPct / 100);
        }
        if (input.potassiumPct !== null) {
          totalPotassiumKg += effectiveKg * (input.potassiumPct / 100);
        }
        if (input.costInr !== null) {
          totalCostInr += input.costInr;
        }
      }

      return {
        farmCropId,
        totalInputsCount: activeInputs.length,
        totalQuantityKg: Math.round(totalQuantityKg * 100) / 100,
        totalNitrogenKg: Math.round(totalNitrogenKg * 100) / 100,
        totalPhosphorusKg: Math.round(totalPhosphorusKg * 100) / 100,
        totalPotassiumKg: Math.round(totalPotassiumKg * 100) / 100,
        totalCostInr: Math.round(totalCostInr * 100) / 100,
      };
    },
  };
}

export const cropInputsService: CropInputsService = createCropInputsService();
