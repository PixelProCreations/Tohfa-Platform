/**
 * Generated from the _example reference module. See CLAUDE.md.
 *
 * Notification-category preferences (BR-48). The caller only ever reads or
 * writes their OWN rows — the user id comes from the resolved scope, never
 * from the request — so there is no cross-user path and no predicate to
 * evaluate.
 *
 * Not audited: this is a user's own preference toggle, not a mutating admin
 * action (root CLAUDE.md §6 scopes the audit_log requirement to admin
 * actions), the same as device-token registration in the notifications
 * module.
 */
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { notificationPreferencesRepo, type NotificationPreferencesRepo } from './notification-preferences.repo.js';
import {
  notificationCategories,
  type ListPreferencesResponse,
  type NotificationCategory,
  type NotificationPreferenceResponse,
} from './notification-preferences.schema.js';

export interface NotificationPreferencesServiceDeps {
  repo: NotificationPreferencesRepo;
  db: Executor;
}

export interface NotificationPreferencesService {
  /** All five categories, always, in the fixed sheet order. */
  listMine(scope: ResolvedScope): Promise<ListPreferencesResponse>;
  updateMine(
    scope: ResolvedScope,
    category: NotificationCategory,
    enabled: boolean,
  ): Promise<NotificationPreferenceResponse>;
}

export function createNotificationPreferencesService(
  deps: Partial<NotificationPreferencesServiceDeps> = {},
): NotificationPreferencesService {
  const repo = deps.repo ?? notificationPreferencesRepo;
  const db = deps.db ?? pool;

  return {
    async listMine(scope) {
      const stored = await repo.listByUserId(db, scope.userId);
      const byCategory = new Map(stored.map((p) => [p.category, p.enabled]));

      // The table is sparse: a category with no row is enabled.
      return {
        items: notificationCategories.map((category) => ({
          category,
          enabled: byCategory.get(category) ?? true,
        })),
      };
    },

    async updateMine(scope, category, enabled) {
      return repo.upsert(db, scope.userId, category, enabled);
    },
  };
}

/** The production instance. */
export const notificationPreferencesService: NotificationPreferencesService =
  createNotificationPreferencesService();
