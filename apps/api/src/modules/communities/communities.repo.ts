/**
 * Communities repository (Antigravity Brief 01 / BR-59s).
 * Pure SQL access layer over PostgreSQL.
 */
import type { Executor } from '../../db/pool.js';
import type { GroupRow } from '../learning-hub/learning-hub.repo.js';
import type {
  CreateCommunityBody,
  ListCommunitiesQuery,
  UpdateCommunityBody,
} from './communities.schema.js';

export interface CommunityRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  rules: string | null;
  is_archived: boolean;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  group_count?: number;
  member_count?: number;
}

export interface CommunityMemberRow {
  farmer_id: string;
  farmer_name: string;
  phone: string;
  village: string | null;
  joined_at: string;
  group_count: number;
  groups: Array<{ id: string; name: string }>;
}

export interface FindCommunitiesParams extends ListCommunitiesQuery {}

const escapeIlike = (s: string): string => s.replace(/[%_\\]/g, '\\$&');

export interface CommunitiesRepo {
  findCommunities(
    db: Executor,
    params: FindCommunitiesParams,
  ): Promise<{ rows: CommunityRow[]; total: number }>;

  findCommunityById(db: Executor, id: string): Promise<CommunityRow | null>;

  createCommunity(
    db: Executor,
    body: CreateCommunityBody,
    createdBy: string | null,
  ): Promise<CommunityRow>;

  updateCommunity(
    db: Executor,
    id: string,
    patch: UpdateCommunityBody,
  ): Promise<CommunityRow | null>;

  archiveCommunity(db: Executor, id: string): Promise<CommunityRow | null>;

  findCommunityGroups(
    db: Executor,
    communityId: string,
    params: { page: number; limit: number },
  ): Promise<{ rows: GroupRow[]; total: number }>;

  findCommunityMembers(
    db: Executor,
    communityId: string,
    params: { page: number; limit: number; q?: string | undefined },
  ): Promise<{ rows: CommunityMemberRow[]; total: number }>;
}

export const communitiesRepo: CommunitiesRepo = {
  async findCommunities(db, params) {
    const { page, limit, category, isArchived, q, sort } = params;
    const conditions: string[] = ['c.deleted_at IS NULL'];
    const queryParams: unknown[] = [];
    let idx = 1;

    if (category) {
      conditions.push(`c.category = $${idx++}`);
      queryParams.push(category);
    }
    if (typeof isArchived === 'boolean') {
      conditions.push(`c.is_archived = $${idx++}`);
      queryParams.push(isArchived);
    }
    if (q) {
      conditions.push(`(c.name ILIKE $${idx} ESCAPE '\\' OR (c.description IS NOT NULL AND c.description ILIKE $${idx} ESCAPE '\\'))`);
      queryParams.push(`%${escapeIlike(q)}%`);
      idx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countSql = `SELECT count(*)::int AS total FROM communities c ${whereClause}`;
    const countRes = await db.query<{ total: number }>(countSql, queryParams);
    const total = countRes.rows[0]?.total ?? 0;

    let orderBy = 'c.created_at DESC, c.id ASC';
    if (sort === 'members') {
      orderBy = 'member_count DESC, LOWER(c.name) ASC, c.id ASC';
    } else if (sort === 'groups') {
      orderBy = 'group_count DESC, LOWER(c.name) ASC, c.id ASC';
    } else if (sort === 'name') {
      orderBy = 'LOWER(c.name) ASC, c.id ASC';
    } else if (sort === 'createdAt') {
      orderBy = 'c.created_at DESC, c.id ASC';
    }

    const offset = (page - 1) * limit;
    const querySql = `
      SELECT
        c.id, c.name, c.description, c.category, c.rules,
        c.is_archived, c.archived_at, c.created_by, c.created_at, c.updated_at, c.deleted_at,
        (
          SELECT count(*)::int
          FROM learning_groups g
          WHERE g.community_id = c.id
        ) AS group_count,
        (
          SELECT count(DISTINCT m.farmer_id)::int
          FROM learning_groups g
          JOIN learning_group_memberships m ON m.group_id = g.id
          WHERE g.community_id = c.id
        ) AS member_count
      FROM communities c
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    queryParams.push(limit, offset);

    const res = await db.query<CommunityRow>(querySql, queryParams);
    return { rows: res.rows, total };
  },

  async findCommunityById(db, id) {
    const querySql = `
      SELECT
        c.id, c.name, c.description, c.category, c.rules,
        c.is_archived, c.archived_at, c.created_by, c.created_at, c.updated_at, c.deleted_at,
        (
          SELECT count(*)::int
          FROM learning_groups g
          WHERE g.community_id = c.id
        ) AS group_count,
        (
          SELECT count(DISTINCT m.farmer_id)::int
          FROM learning_groups g
          JOIN learning_group_memberships m ON m.group_id = g.id
          WHERE g.community_id = c.id
        ) AS member_count
      FROM communities c
      WHERE c.id = $1 AND c.deleted_at IS NULL
    `;
    const res = await db.query<CommunityRow>(querySql, [id]);
    return res.rows[0] ?? null;
  },

  async createCommunity(db, body, createdBy) {
    const res = await db.query<CommunityRow>(
      `INSERT INTO communities (name, description, category, rules, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, category, rules, is_archived, archived_at, created_by, created_at, updated_at, deleted_at`,
      [
        body.name,
        body.description ?? null,
        body.category,
        body.rules ?? null,
        createdBy ?? null,
      ],
    );
    const row = res.rows[0]!;
    row.group_count = 0;
    row.member_count = 0;
    return row;
  },

  async updateCommunity(db, id, patch) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id];
    let idx = 2;

    if (patch.name !== undefined) {
      sets.push(`name = $${idx++}`);
      params.push(patch.name);
    }
    if (patch.description !== undefined) {
      sets.push(`description = $${idx++}`);
      params.push(patch.description);
    }
    if (patch.category !== undefined) {
      sets.push(`category = $${idx++}`);
      params.push(patch.category);
    }
    if (patch.rules !== undefined) {
      sets.push(`rules = $${idx++}`);
      params.push(patch.rules);
    }

    const res = await db.query<CommunityRow>(
      `UPDATE communities
       SET ${sets.join(', ')}
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, name, description, category, rules, is_archived, archived_at, created_by, created_at, updated_at, deleted_at,
         (
           SELECT count(*)::int
           FROM learning_groups g
           WHERE g.community_id = $1
         ) AS group_count,
         (
           SELECT count(DISTINCT m.farmer_id)::int
           FROM learning_groups g
           JOIN learning_group_memberships m ON m.group_id = g.id
           WHERE g.community_id = $1
         ) AS member_count`,
      params,
    );
    return res.rows[0] ?? null;
  },

  async archiveCommunity(db, id) {
    const res = await db.query<CommunityRow>(
      `UPDATE communities
       SET is_archived = true, archived_at = now(), updated_at = now()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, name, description, category, rules, is_archived, archived_at, created_by, created_at, updated_at, deleted_at,
         (
           SELECT count(*)::int
           FROM learning_groups g
           WHERE g.community_id = $1
         ) AS group_count,
         (
           SELECT count(DISTINCT m.farmer_id)::int
           FROM learning_groups g
           JOIN learning_group_memberships m ON m.group_id = g.id
           WHERE g.community_id = $1
         ) AS member_count`,
      [id],
    );
    return res.rows[0] ?? null;
  },

  async findCommunityGroups(db, communityId, params) {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    const countRes = await db.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM learning_groups WHERE community_id = $1`,
      [communityId],
    );
    const total = countRes.rows[0]?.total ?? 0;

    const querySql = `
      SELECT
        g.id, g.name, g.description, g.category, g.archived_at, g.community_id, g.created_at, g.updated_at,
        (SELECT count(*)::int FROM learning_group_memberships m WHERE m.group_id = g.id) AS member_count,
        false AS is_joined
      FROM learning_groups g
      WHERE g.community_id = $1
      ORDER BY g.created_at DESC, g.id ASC
      LIMIT $2 OFFSET $3
    `;
    const res = await db.query<GroupRow>(querySql, [communityId, limit, offset]);
    return { rows: res.rows, total };
  },

  async findCommunityMembers(db, communityId, params) {
    const { page, limit, q } = params;
    const offset = (page - 1) * limit;

    const queryParams: unknown[] = [communityId];
    let idx = 2;
    let searchCondition = '';

    if (q) {
      searchCondition = `AND (u.full_name ILIKE $${idx} ESCAPE '\\' OR u.mobile ILIKE $${idx} ESCAPE '\\' OR (f.village IS NOT NULL AND f.village ILIKE $${idx} ESCAPE '\\'))`;
      queryParams.push(`%${escapeIlike(q)}%`);
      idx++;
    }

    const countSql = `
      SELECT count(DISTINCT f.id)::int AS total
      FROM learning_group_memberships m
      JOIN learning_groups g ON g.id = m.group_id
      JOIN farmers f ON f.id = m.farmer_id
      JOIN users u ON u.id = f.user_id
      WHERE g.community_id = $1 ${searchCondition}
    `;
    const countRes = await db.query<{ total: number }>(countSql, queryParams);
    const total = countRes.rows[0]?.total ?? 0;

    const querySql = `
      SELECT
        f.id AS farmer_id,
        COALESCE(u.full_name, 'Unknown Farmer') AS farmer_name,
        COALESCE(u.mobile, '') AS phone,
        f.village,
        MIN(m.joined_at)::text AS joined_at,
        COUNT(DISTINCT g.id)::int AS group_count,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT('id', g.id, 'name', g.name)
            ORDER BY g.name ASC
          ),
          '[]'::json
        ) AS groups
      FROM learning_group_memberships m
      JOIN learning_groups g ON g.id = m.group_id
      JOIN farmers f ON f.id = m.farmer_id
      JOIN users u ON u.id = f.user_id
      WHERE g.community_id = $1 ${searchCondition}
      GROUP BY f.id, u.full_name, u.mobile, f.village
      ORDER BY joined_at ASC, farmer_name ASC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    queryParams.push(limit, offset);

    const res = await db.query<CommunityMemberRow>(querySql, queryParams);
    return { rows: res.rows, total };
  },
};
