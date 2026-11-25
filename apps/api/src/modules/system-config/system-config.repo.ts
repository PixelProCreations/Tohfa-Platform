import type { Executor } from '../../db/pool.js';
import type { ConfigDataType } from './system-config.schema.js';

export interface SystemConfigRow {
  id: string;
  key: string;
  value: unknown;
  dataType: ConfigDataType;
  description: string | null;
  isSecret: boolean;
  updatedAt: Date | null;
}

export const systemConfigRepo = {
  async listAll(db: Executor): Promise<SystemConfigRow[]> {
    const res = await db.query<{
      id: string;
      key: string;
      value: unknown;
      data_type: ConfigDataType;
      description: string | null;
      is_secret: boolean;
      updated_at: Date | null;
    }>(
      `SELECT id, key, value, data_type, description, is_secret, updated_at
         FROM system_config
        ORDER BY key ASC`,
    );
    return res.rows.map((r) => ({
      id: r.id,
      key: r.key,
      value: r.value,
      dataType: r.data_type,
      description: r.description,
      isSecret: r.is_secret,
      updatedAt: r.updated_at,
    }));
  },

  async findByKeyForUpdate(db: Executor, key: string): Promise<SystemConfigRow | null> {
    const res = await db.query<{
      id: string;
      key: string;
      value: unknown;
      data_type: ConfigDataType;
      description: string | null;
      is_secret: boolean;
      updated_at: Date | null;
    }>(
      `SELECT id, key, value, data_type, description, is_secret, updated_at
         FROM system_config
        WHERE key = $1
        LIMIT 1
          FOR UPDATE`,
      [key],
    );
    const r = res.rows[0];
    if (!r) return null;
    return {
      id: r.id,
      key: r.key,
      value: r.value,
      dataType: r.data_type,
      description: r.description,
      isSecret: r.is_secret,
      updatedAt: r.updated_at,
    };
  },

  async updateValue(db: Executor, key: string, value: unknown, actorId: string): Promise<SystemConfigRow | null> {
    const res = await db.query<{
      id: string;
      key: string;
      value: unknown;
      data_type: ConfigDataType;
      description: string | null;
      is_secret: boolean;
      updated_at: Date | null;
    }>(
      `UPDATE system_config
          SET value = $2::jsonb,
              updated_by = $3,
              updated_at = now()
        WHERE key = $1
        RETURNING id, key, value, data_type, description, is_secret, updated_at`,
      [key, JSON.stringify(value), actorId],
    );
    const r = res.rows[0];
    if (!r) return null;
    return {
      id: r.id,
      key: r.key,
      value: r.value,
      dataType: r.data_type,
      description: r.description,
      isSecret: r.is_secret,
      updatedAt: r.updated_at,
    };
  },
};
