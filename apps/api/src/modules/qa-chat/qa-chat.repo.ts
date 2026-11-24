/**
 * Q&A Chat repository (Antigravity Brief 03 / BR-59u).
 * Pure SQL operations for questions and answers.
 */
import type { Executor } from '../../db/pool.js';
import type { QaContentType } from './qa-chat.schema.js';

export interface QaAuthorRow {
  author_user_id: string;
  author_name: string;
  author_role: 'FARMER' | 'ADMIN';
}

export interface QaQuestionRow extends QaAuthorRow {
  id: string;
  community_id: string | null;
  content_type: QaContentType | null;
  content_id: string | null;
  title: string;
  content: string;
  is_blocked: boolean;
  blocked_by: string | null;
  blocked_at: string | null;
  block_reason: string | null;
  answer_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface QaAnswerRow extends QaAuthorRow {
  id: string;
  question_id: string;
  content: string;
  is_blocked: boolean;
  blocked_by: string | null;
  blocked_at: string | null;
  block_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FindQuestionsParams {
  page: number;
  limit: number;
  communityId?: string | undefined;
  contentType?: QaContentType | undefined;
  contentId?: string | undefined;
  q?: string | undefined;
  authorUserId?: string | undefined;
}

export interface CreateQuestionParams {
  communityId?: string | null | undefined;
  contentType?: QaContentType | null | undefined;
  contentId?: string | null | undefined;
  title: string;
  content: string;
  authorUserId: string;
}

export interface UpdateQuestionParams {
  title?: string | undefined;
  content?: string | undefined;
}

export interface ModerateContentParams {
  isBlocked?: boolean | undefined;
  blockReason?: string | null | undefined;
  softDelete?: boolean | undefined;
  moderatorUserId: string;
}

export interface CreateAnswerParams {
  questionId: string;
  content: string;
  authorUserId: string;
}

export interface UpdateAnswerParams {
  content: string;
}

function escapeIlike(str: string): string {
  return str.replace(/([\\%_])/g, '\\$1');
}

export interface QaChatRepo {
  findQuestions(db: Executor, params: FindQuestionsParams): Promise<{ rows: QaQuestionRow[]; total: number }>;
  findQuestionById(db: Executor, id: string): Promise<QaQuestionRow | null>;
  createQuestion(db: Executor, data: CreateQuestionParams): Promise<QaQuestionRow>;
  updateQuestion(db: Executor, id: string, patch: UpdateQuestionParams): Promise<QaQuestionRow | null>;
  softDeleteQuestion(db: Executor, id: string): Promise<boolean>;
  moderateQuestion(db: Executor, id: string, patch: ModerateContentParams): Promise<QaQuestionRow | null>;

  findAnswersByQuestionId(db: Executor, questionId: string): Promise<QaAnswerRow[]>;
  findAnswerById(db: Executor, id: string): Promise<QaAnswerRow | null>;
  createAnswer(db: Executor, data: CreateAnswerParams): Promise<QaAnswerRow>;
  updateAnswer(db: Executor, id: string, patch: UpdateAnswerParams): Promise<QaAnswerRow | null>;
  softDeleteAnswer(db: Executor, id: string): Promise<boolean>;
  moderateAnswer(db: Executor, id: string, patch: ModerateContentParams): Promise<QaAnswerRow | null>;
}

export const qaChatRepo: QaChatRepo = {
  async findQuestions(db, { page, limit, communityId, contentType, contentId, q, authorUserId }) {
    const conditions: string[] = ['q.deleted_at IS NULL'];
    const params: unknown[] = [];
    let idx = 1;

    if (communityId !== undefined) {
      conditions.push(`q.community_id = $${idx++}`);
      params.push(communityId);
    }
    if (contentType !== undefined) {
      conditions.push(`q.content_type = $${idx++}`);
      params.push(contentType);
    }
    if (contentId !== undefined) {
      conditions.push(`q.content_id = $${idx++}`);
      params.push(contentId);
    }
    if (authorUserId !== undefined) {
      conditions.push(`q.author_user_id = $${idx++}`);
      params.push(authorUserId);
    }
    if (q) {
      conditions.push(`(q.title ILIKE $${idx} ESCAPE '\\' OR q.content ILIKE $${idx} ESCAPE '\\')`);
      idx++;
      params.push(`%${escapeIlike(q)}%`);
    }

    const whereClause = conditions.join(' AND ');
    const countSql = `SELECT count(*)::int AS total FROM qa_questions q WHERE ${whereClause}`;
    const countRes = await db.query<{ total: number }>(countSql, params);
    const total = countRes.rows[0]?.total ?? 0;

    const offset = (page - 1) * limit;
    const selectSql = `
      SELECT
        q.id,
        q.community_id,
        q.content_type,
        q.content_id,
        q.title,
        q.content,
        q.is_blocked,
        q.blocked_by,
        q.blocked_at,
        q.block_reason,
        q.author_user_id,
        COALESCE(u.full_name, 'Anonymous') AS author_name,
        CASE WHEN u.user_type = 'ADMIN' THEN 'ADMIN' ELSE 'FARMER' END AS author_role,
        COALESCE(ans.ans_count, 0)::int AS answer_count,
        q.created_at,
        q.updated_at,
        q.deleted_at
      FROM qa_questions q
      JOIN users u ON q.author_user_id = u.id
      LEFT JOIN (
        SELECT question_id, count(*)::int AS ans_count
        FROM qa_answers
        WHERE deleted_at IS NULL
        GROUP BY question_id
      ) ans ON ans.question_id = q.id
      WHERE ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);

    const res = await db.query<QaQuestionRow>(selectSql, params);
    return { rows: res.rows, total };
  },

  async findQuestionById(db, id) {
    const sql = `
      SELECT
        q.id,
        q.community_id,
        q.content_type,
        q.content_id,
        q.title,
        q.content,
        q.is_blocked,
        q.blocked_by,
        q.blocked_at,
        q.block_reason,
        q.author_user_id,
        COALESCE(u.full_name, 'Anonymous') AS author_name,
        CASE WHEN u.user_type = 'ADMIN' THEN 'ADMIN' ELSE 'FARMER' END AS author_role,
        COALESCE(ans.ans_count, 0)::int AS answer_count,
        q.created_at,
        q.updated_at,
        q.deleted_at
      FROM qa_questions q
      JOIN users u ON q.author_user_id = u.id
      LEFT JOIN (
        SELECT question_id, count(*)::int AS ans_count
        FROM qa_answers
        WHERE deleted_at IS NULL
        GROUP BY question_id
      ) ans ON ans.question_id = q.id
      WHERE q.id = $1 AND q.deleted_at IS NULL
    `;
    const res = await db.query<QaQuestionRow>(sql, [id]);
    return res.rows[0] ?? null;
  },

  async createQuestion(db, data) {
    const sql = `
      INSERT INTO qa_questions (
        community_id, content_type, content_id, title, content, author_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const inserted = await db.query<{ id: string }>(sql, [
      data.communityId ?? null,
      data.contentType ?? null,
      data.contentId ?? null,
      data.title,
      data.content,
      data.authorUserId,
    ]);
    const id = inserted.rows[0]!.id;
    const row = await this.findQuestionById(db, id);
    if (!row) throw new Error('Failed to retrieve created question');
    return row;
  },

  async updateQuestion(db, id, patch) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id];
    let idx = 2;

    if (patch.title !== undefined) {
      sets.push(`title = $${idx++}`);
      params.push(patch.title);
    }
    if (patch.content !== undefined) {
      sets.push(`content = $${idx++}`);
      params.push(patch.content);
    }

    const sql = `
      UPDATE qa_questions
      SET ${sets.join(', ')}
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;
    const res = await db.query<{ id: string }>(sql, params);
    if (res.rows.length === 0) return null;
    return this.findQuestionById(db, id);
  },

  async softDeleteQuestion(db, id) {
    const sql = `
      UPDATE qa_questions
      SET deleted_at = now()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;
    const res = await db.query(sql, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async moderateQuestion(db, id, patch) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id];
    let idx = 2;

    if (patch.isBlocked !== undefined) {
      sets.push(`is_blocked = $${idx++}`);
      params.push(patch.isBlocked);
      if (patch.isBlocked) {
        sets.push(`blocked_by = $${idx++}`);
        params.push(patch.moderatorUserId);
        sets.push(`blocked_at = now()`);
        if (patch.blockReason !== undefined) {
          sets.push(`block_reason = $${idx++}`);
          params.push(patch.blockReason);
        }
      } else {
        sets.push(`blocked_by = NULL`);
        sets.push(`blocked_at = NULL`);
        sets.push(`block_reason = NULL`);
      }
    }
    if (patch.softDelete === true) {
      sets.push(`deleted_at = now()`);
    }

    const sql = `
      UPDATE qa_questions
      SET ${sets.join(', ')}
      WHERE id = $1
      RETURNING id
    `;
    const res = await db.query<{ id: string }>(sql, params);
    if (res.rows.length === 0) return null;
    return this.findQuestionById(db, id);
  },

  async findAnswersByQuestionId(db, questionId) {
    const sql = `
      SELECT
        a.id,
        a.question_id,
        a.content,
        a.is_blocked,
        a.blocked_by,
        a.blocked_at,
        a.block_reason,
        a.author_user_id,
        COALESCE(u.full_name, 'Anonymous') AS author_name,
        CASE WHEN u.user_type = 'ADMIN' THEN 'ADMIN' ELSE 'FARMER' END AS author_role,
        a.created_at,
        a.updated_at,
        a.deleted_at
      FROM qa_answers a
      JOIN users u ON a.author_user_id = u.id
      WHERE a.question_id = $1 AND a.deleted_at IS NULL
      ORDER BY a.created_at ASC
    `;
    const res = await db.query<QaAnswerRow>(sql, [questionId]);
    return res.rows;
  },

  async findAnswerById(db, id) {
    const sql = `
      SELECT
        a.id,
        a.question_id,
        a.content,
        a.is_blocked,
        a.blocked_by,
        a.blocked_at,
        a.block_reason,
        a.author_user_id,
        COALESCE(u.full_name, 'Anonymous') AS author_name,
        CASE WHEN u.user_type = 'ADMIN' THEN 'ADMIN' ELSE 'FARMER' END AS author_role,
        a.created_at,
        a.updated_at,
        a.deleted_at
      FROM qa_answers a
      JOIN users u ON a.author_user_id = u.id
      WHERE a.id = $1 AND a.deleted_at IS NULL
    `;
    const res = await db.query<QaAnswerRow>(sql, [id]);
    return res.rows[0] ?? null;
  },

  async createAnswer(db, data) {
    const sql = `
      INSERT INTO qa_answers (
        question_id, content, author_user_id
      ) VALUES ($1, $2, $3)
      RETURNING id
    `;
    const inserted = await db.query<{ id: string }>(sql, [
      data.questionId,
      data.content,
      data.authorUserId,
    ]);
    const id = inserted.rows[0]!.id;
    const row = await this.findAnswerById(db, id);
    if (!row) throw new Error('Failed to retrieve created answer');
    return row;
  },

  async updateAnswer(db, id, patch) {
    const sql = `
      UPDATE qa_answers
      SET content = $2, updated_at = now()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;
    const res = await db.query<{ id: string }>(sql, [id, patch.content]);
    if (res.rows.length === 0) return null;
    return this.findAnswerById(db, id);
  },

  async softDeleteAnswer(db, id) {
    const sql = `
      UPDATE qa_answers
      SET deleted_at = now()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;
    const res = await db.query(sql, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async moderateAnswer(db, id, patch) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id];
    let idx = 2;

    if (patch.isBlocked !== undefined) {
      sets.push(`is_blocked = $${idx++}`);
      params.push(patch.isBlocked);
      if (patch.isBlocked) {
        sets.push(`blocked_by = $${idx++}`);
        params.push(patch.moderatorUserId);
        sets.push(`blocked_at = now()`);
        if (patch.blockReason !== undefined) {
          sets.push(`block_reason = $${idx++}`);
          params.push(patch.blockReason);
        }
      } else {
        sets.push(`blocked_by = NULL`);
        sets.push(`blocked_at = NULL`);
        sets.push(`block_reason = NULL`);
      }
    }
    if (patch.softDelete === true) {
      sets.push(`deleted_at = now()`);
    }

    const sql = `
      UPDATE qa_answers
      SET ${sets.join(', ')}
      WHERE id = $1
      RETURNING id
    `;
    const res = await db.query<{ id: string }>(sql, params);
    if (res.rows.length === 0) return null;
    return this.findAnswerById(db, id);
  },
};
