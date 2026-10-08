
import type { Executor } from '../../db/pool.js';
import type { NotificationCategory, NotificationPreferenceResponse } from './notification-preferences.schema.js';

/** Raw row shape as it comes out of Postgres. Never leaves this file. */
interface NotificationPreferenceRow {
  category: NotificationCategory;
  enabled: boolean;
}

function toPreference(row: NotificationPreferenceRow): NotificationPreferenceResponse {
  return { category: row.category, enabled: row.enabled };
}

/**
 * The repository interface. The service depends on THIS, not on the concrete
 * object, so tests can hand in a fake.
 */
export interface NotificationPreferencesRepo {
  /** Stored rows only — categories the user has never touched are absent. */
  listByUserId(db: Executor, userId: string): Promise<NotificationPreferenceResponse[]>;
  upsert(
    db: Executor,
    userId: string,
    category: NotificationCategory,
    enabled: boolean,
  ): Promise<NotificationPreferenceResponse>;
  /**
   * Single-category lookup for the notification dispatcher (BR-52). Missing
   * row → true, so a user who never opened Settings keeps today's all-on
   * behaviour.
   */
  isCategoryEnabled(db: Executor, userId: string, category: NotificationCategory): Promise<boolean>;
}

export const notificationPreferencesRepo: NotificationPreferencesRepo = {
  async listByUserId(db, userId) {
    const result = await db.query<NotificationPreferenceRow>(
      `SELECT category, enabled
         FROM notification_preferences
        WHERE user_id = $1`,
      [userId],
    );
    return result.rows.map(toPreference);
  },

  async upsert(db, userId, category, enabled) {
    const result = await db.query<NotificationPreferenceRow>(
      `INSERT INTO notification_preferences (user_id, category, enabled)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, category) DO UPDATE
         SET enabled = EXCLUDED.enabled
       RETURNING category, enabled`,
      [userId, category, enabled],
    );
    return toPreference(result.rows[0]!);
  },

  async isCategoryEnabled(db, userId, category) {
    const result = await db.query<{ enabled: boolean }>(
      `SELECT enabled
         FROM notification_preferences
        WHERE user_id = $1 AND category = $2
        LIMIT 1`,
      [userId, category],
    );
    return result.rows[0]?.enabled ?? true;
  },
};
