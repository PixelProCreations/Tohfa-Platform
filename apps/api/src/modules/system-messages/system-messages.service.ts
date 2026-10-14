import type { Actor } from '../../auth/requireAuth.js';
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  systemMessagesRepo,
  type SystemMessageCursor,
  type SystemMessageRow,
  type SystemMessagesRepo,
  type SystemMessageViewer,
} from './system-messages.repo.js';
import type { ListSystemMessagesQuery, SystemMessageListResponse, SystemMessageResponse } from './system-messages.schema.js';

function encodeCursor(cursor: SystemMessageCursor): string {
  return Buffer.from(JSON.stringify([cursor.startsAt, cursor.id]), 'utf8').toString('base64url');
}

// Strict on purpose: the value is bound into SQL as a timestamptz, so only the exact shape the
// repo emits (UTC, six fractional digits) is accepted back.
const CURSOR_STARTS_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function decodeCursor(raw: string): SystemMessageCursor {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === 'string' &&
      CURSOR_STARTS_AT.test(parsed[0]) &&
      typeof parsed[1] === 'string' &&
      UUID.test(parsed[1])
    ) {
      return { startsAt: parsed[0], id: parsed[1] };
    }
  } catch {
    // fall through to the single error below
  }
  throw new AppError('VALIDATION_FAILED', { detail: 'cursor is not a value returned by this endpoint.' });
}

function mapMessage(row: SystemMessageRow): SystemMessageResponse {
  return {
    id: row.id,
    scope: row.scope,
    title: row.title,
    body: row.body,
    locale: row.locale,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    isRead: row.read_at !== null,
    readAt: row.read_at?.toISOString() ?? null,
  };
}

export interface SystemMessagesService {
  list(actor: Actor, scope: ResolvedScope, query: ListSystemMessagesQuery): Promise<SystemMessageListResponse>;
  get(actor: Actor, scope: ResolvedScope, id: string): Promise<SystemMessageResponse>;
  markRead(actor: Actor, scope: ResolvedScope, id: string): Promise<SystemMessageResponse>;
}

export function createSystemMessagesService(
  repo: SystemMessagesRepo = systemMessagesRepo,
  db: Executor = pool,
): SystemMessagesService {
  // The role codes come from the Actor (every role the user holds), not from the scope, which
  // only remembers the single role that won the permission lookup.
  const viewerOf = (actor: Actor, scope: ResolvedScope): SystemMessageViewer => ({
    userId: actor.userId,
    roleCodes: actor.roles.map((role) => role.code),
    scope,
  });

  const notFound = (): AppError => new AppError('NOT_FOUND', { detail: 'System message not found.' });

  return {
    async list(actor, scope, query) {
      const cursor = query.cursor === undefined ? undefined : decodeCursor(query.cursor);
      const { items, next } = await repo.list(db, viewerOf(actor, scope), {
        limit: query.limit,
        status: query.status,
        ...(cursor === undefined ? {} : { cursor }),
      });
      return {
        items: items.map(mapMessage),
        page: { nextCursor: next === null ? null : encodeCursor(next), hasMore: next !== null },
      };
    },

    async get(actor, scope, id) {
      const row = await repo.findVisibleById(db, viewerOf(actor, scope), id);
      if (row === null) throw notFound();
      return mapMessage(row);
    },

    async markRead(actor, scope, id) {
      const viewer = viewerOf(actor, scope);
      if ((await repo.findVisibleById(db, viewer, id)) === null) throw notFound();
      await repo.markRead(db, viewer, id);
      const row = await repo.findVisibleById(db, viewer, id);
      // Gone between the two reads (expired or deleted in that instant): same answer as never visible.
      if (row === null) throw notFound();
      return mapMessage(row);
    },
  };
}

export const systemMessagesService = createSystemMessagesService();
