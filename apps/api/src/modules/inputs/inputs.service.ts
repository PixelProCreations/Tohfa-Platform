import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { inputsRepo, type InputCursor } from './inputs.repo.js';
import {
  publicInputResponse,
  type AdminInputResponse,
  type CreateInputBody,
  type ListInputsQuery,
  type PublicInputResponse,
  type UpdateInputBody,
} from './inputs.schema.js';

function encodeCursor(cursor: InputCursor): string {
  return Buffer.from(JSON.stringify([cursor.createdAt, cursor.id]), 'utf8').toString('base64url');
}

function decodeCursor(raw: string): InputCursor {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === 'string' &&
      !Number.isNaN(Date.parse(parsed[0])) &&
      typeof parsed[1] === 'string'
    ) {
      return { createdAt: parsed[0], id: parsed[1] };
    }
  } catch {
    // fall through
  }
  throw new AppError('VALIDATION_FAILED', { detail: 'cursor is invalid.' });
}

function toPublicInput(row: AdminInputResponse): PublicInputResponse {
  return publicInputResponse.parse(row);
}

function mapUniqueViolation(error: unknown, code: string): never {
  if (typeof error === 'object' && error !== null && (error as { code?: unknown }).code === '23505') {
    throw new AppError('CONFLICT', { detail: `An input with code "${code}" already exists.` });
  }
  throw error;
}

export const inputsService = {
  async listAdmin(query: ListInputsQuery) {
    const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;
    const { items, next } = await inputsRepo.list(pool, {
      status: query.status,
      category: query.category,
      search: query.search,
      cursor,
      limit: query.limit,
    });
    return {
      items,
      page: { nextCursor: next === null ? null : encodeCursor(next), hasMore: next !== null },
    };
  },

  async getAdmin(id: string): Promise<AdminInputResponse> {
    const row = await inputsRepo.findById(pool, id, false);
    if (row === null) throw new AppError('NOT_FOUND', { detail: `Input ${id} not found.` });
    return row;
  },

  async create(scope: ResolvedScope, body: CreateInputBody): Promise<AdminInputResponse> {
    return withTransaction(async (tx) => {
      let id: string;
      try {
        id = await inputsRepo.create(tx, {
          code: body.code.toUpperCase(),
          name: body.name,
          category: body.category,
          subcategory: body.subcategory ?? null,
          farmingType: body.farmingType ?? null,
          manufacturer: body.manufacturer,
          registrationId: body.registrationId ?? null,
          composition: body.composition ?? null,
          applicableCrops: body.applicableCrops,
          dosage: body.dosage ?? null,
          applicationMethod: body.applicationMethod ?? null,
          status: body.status,
          referenceNote: body.referenceNote ?? null,
          statusReason: body.statusReason ?? null,
          supportingDocs: body.supportingDocs,
          approvedBy: body.status === 'APPROVED' ? scope.userId : null,
          actorId: scope.userId,
        });
      } catch (error) {
        mapUniqueViolation(error, body.code);
      }

      const created = await inputsRepo.findById(tx, id, false);
      if (created === null) throw new AppError('NOT_FOUND', { detail: `Input ${id} not found.` });

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'inputs.create',
        entityType: 'approved_input',
        entityId: id,
        after: created,
      });
      return created;
    });
  },

  async update(scope: ResolvedScope, id: string, body: UpdateInputBody): Promise<AdminInputResponse> {
    return withTransaction(async (tx) => {
      const before = await inputsRepo.findById(tx, id, false);
      if (before === null) throw new AppError('NOT_FOUND', { detail: `Input ${id} not found.` });

      const patch: Record<string, unknown> = { ...body };
      if (body.code !== undefined) patch['code'] = body.code.toUpperCase();
      if (body.status === 'APPROVED') {
        patch['approvedBy'] = scope.userId;
      }

      try {
        await inputsRepo.update(tx, id, patch, scope.userId);
      } catch (error) {
        mapUniqueViolation(error, body.code ?? before.code);
      }

      const after = await inputsRepo.findById(tx, id, false);
      if (after === null) throw new AppError('NOT_FOUND', { detail: `Input ${id} not found.` });

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'inputs.update',
        entityType: 'approved_input',
        entityId: id,
        before,
        after,
        changedFields: changedFields(before, after),
      });
      return after;
    });
  },

  async remove(scope: ResolvedScope, id: string): Promise<void> {
    await withTransaction(async (tx) => {
      const before = await inputsRepo.findById(tx, id, false);
      if (before === null) throw new AppError('NOT_FOUND', { detail: `Input ${id} not found.` });
      const deleted = await inputsRepo.softDelete(tx, id, scope.userId);
      if (!deleted) throw new AppError('NOT_FOUND', { detail: `Input ${id} not found.` });
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'inputs.delete',
        entityType: 'approved_input',
        entityId: id,
        before,
      });
    });
  },

  async listPublic(query: ListInputsQuery) {
    const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;
    const { items, next } = await inputsRepo.list(pool, {
      status: 'APPROVED',
      category: query.category,
      search: query.search,
      cursor,
      limit: query.limit,
    });
    return {
      items: items.map(toPublicInput),
      page: { nextCursor: next === null ? null : encodeCursor(next), hasMore: next !== null },
    };
  },

  async getPublic(id: string): Promise<PublicInputResponse> {
    const row = await inputsRepo.findById(pool, id, true);
    if (row === null) throw new AppError('NOT_FOUND', { detail: `Approved input ${id} not found.` });
    return toPublicInput(row);
  },
};
