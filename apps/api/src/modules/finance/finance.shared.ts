/**
 * Module 11 (Warehouse Finance): helpers shared by the finance, expense-lifecycle,
 * expense-categories and cash-close services. Pure functions only, no I/O.
 */
import { ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The microsecond timestamp the repos emit for cursors. */
export const MICRO_TS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;

export function failValidation(errors: Record<string, string[]>): never {
  throw new AppError('VALIDATION_FAILED', { detail: 'One or more fields are invalid.', errors });
}

export function notFound(what: string, id: string): AppError {
  return new AppError('NOT_FOUND', { detail: `${what} "${id}" not found.` });
}

/**
 * The warehouses the actor is confined to, or null when the scope is not confined to any (an
 * `all` grant, or an `own` grant on a role with no warehouse dimension: the owner default).
 */
export function confinedWarehouses(scope: ResolvedScope): { first: string; all: string[] } | null {
  if (scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL) return null;
  const [first] = scope.warehouseIds;
  return first === undefined ? null : { first, all: scope.warehouseIds };
}

/**
 * The warehouse a write targets. A confined (Sub) actor defaults to their own warehouse and gets
 * 404, never 403, for another one (a 403 would confirm it exists); an unconfined actor must name one.
 */
export function targetWarehouse(scope: ResolvedScope, requested: string | undefined, field = 'body.warehouseId'): string {
  const confined = confinedWarehouses(scope);
  if (confined !== null) {
    if (requested === undefined) return confined.first;
    if (!confined.all.includes(requested)) throw notFound('Warehouse', requested);
    return requested;
  }
  if (requested === undefined) {
    return failValidation({ [field]: ['warehouseId is required for an actor not assigned to a warehouse.'] });
  }
  return requested;
}

export function encodeCursor(parts: string[]): string {
  return Buffer.from(JSON.stringify(parts), 'utf8').toString('base64url');
}

export function invalidCursor(): never {
  throw new AppError('VALIDATION_FAILED', { detail: 'cursor is not a value returned by this endpoint.' });
}

export function decodeCursorParts(raw: string, length: number): string[] {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (Array.isArray(parsed) && parsed.length === length && parsed.every((part) => typeof part === 'string')) {
      return parsed as string[];
    }
  } catch {
    // fall through to the 422 below
  }
  return invalidCursor();
}

export function pageOf<C>(next: C | null, encode: (cursor: C) => string): { nextCursor: string | null; hasMore: boolean } {
  return { nextCursor: next === null ? null : encode(next), hasMore: next !== null };
}
