import type { Executor } from '../../db/pool.js';
import type {
  CreateArticleBody,
  CreateGroupBody,
  CreateTrainingBody,
  CreateVideoBody,
  UpdateArticleBody,
  UpdateGroupBody,
  UpdateTrainingBody,
  UpdateVideoBody,
} from './learning-hub.schema.js';

/**
 * BR-59r. Already camelCased by `json_build_object` in `cropsSubquery`, because
 * it crosses the wire as one JSON value rather than as columns the mapper
 * renames. `name_ta` is the only field whose SQL and API names differ.
 */
export interface CropRefRow {
  id: string; name: string; nameTa: string | null;
}

export type ReviewStatus = 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface ArticleRow {
  id: string; title: string; content: string; snippet: string | null;
  read_time: string; author: string; tag: string; language: 'en' | 'ta';
  is_published: boolean;
  review_status?: ReviewStatus;
  submitted_for_review_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  crops?: CropRefRow[]; created_at: string; updated_at: string;
}
export type ArticleSummaryRow = Omit<ArticleRow, 'content'>;

export interface VideoRow {
  id: string; title: string; description: string | null; video_url: string;
  duration: string; author: string; language: 'en' | 'ta'; is_featured: boolean;
  is_published: boolean;
  review_status?: ReviewStatus;
  submitted_for_review_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  crops?: CropRefRow[]; created_at: string; updated_at: string;
}

export interface TrainingRow {
  id: string; title: string; description: string | null; training_date: string;
  start_time: string; end_time: string | null; mode: 'IN_FIELD' | 'ONLINE_WEBINAR';
  location: string; instructor: string; capacity: number | null; language: 'en' | 'ta';
  is_published: boolean;
  review_status?: ReviewStatus;
  submitted_for_review_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  created_at: string; updated_at: string;
  enrolled_count?: string | number; is_enrolled?: boolean;
}

export interface GroupRow {
  id: string; name: string; description: string | null; category: string;
  created_at: string; updated_at: string; member_count?: string | number; is_joined?: boolean;
  archived_at?: string | null; community_id?: string | null;
  review_status?: ReviewStatus;
  submitted_for_review_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
}

export interface TrainingLockRow {
  id: string; capacity: number | null; is_published: boolean;
}

export interface EnrollmentRow {
  id: string; training_id: string; farmer_id: string; enrolled_at: string;
}

export interface MembershipRow {
  id: string; group_id: string; farmer_id: string; joined_at: string;
}

function escapeIlike(str: string): string {
  return str.replace(/([\\%_])/g, '\\$1');
}

/**
 * BR-59r: the crop chips for one content row, as a single JSON column.
 *
 * A correlated subquery rather than a LEFT JOIN + GROUP BY because the list
 * queries already paginate with LIMIT/OFFSET over the content table: grouping
 * would change what LIMIT counts. It is also not a second round-trip, so a page
 * of 20 articles stays one query.
 *
 * A soft-deleted crop is left out of the read even though it could not have
 * been tagged in the first place (the write rejects it): a crop retired AFTER
 * the tag was written must not come back as a chip the admin can no longer pick.
 * Ordered by name so the chip row is stable between requests.
 */
function cropsSubquery(joinTable: string, fkColumn: string, contentTable: string): string {
  return `COALESCE((
      SELECT json_agg(json_build_object('id', cm.id, 'name', cm.name, 'nameTa', cm.name_ta) ORDER BY cm.name)
        FROM ${joinTable} lc
        JOIN crop_master cm ON cm.id = lc.crop_id AND cm.deleted_at IS NULL
       WHERE lc.${fkColumn} = ${contentTable}.id
    ), '[]'::json) AS crops`;
}

const ARTICLE_CROPS = cropsSubquery('learning_article_crops', 'article_id', 'learning_articles');
const VIDEO_CROPS = cropsSubquery('learning_video_crops', 'video_id', 'learning_videos');

export interface FindArticlesParams {
  page: number; limit: number; language?: 'en' | 'ta' | undefined; tag?: string | undefined;
  isPublished?: boolean | undefined; publishedOnly?: boolean | undefined; q?: string | undefined;
  reviewStatus?: ReviewStatus | undefined;
}
export interface FindVideosParams {
  page: number; limit: number; language?: 'en' | 'ta' | undefined;
  isPublished?: boolean | undefined; publishedOnly?: boolean | undefined; q?: string | undefined;
  reviewStatus?: ReviewStatus | undefined;
}
export interface FindTrainingsParams {
  page: number; limit: number; language?: 'en' | 'ta' | undefined;
  isPublished?: boolean | undefined; publishedOnly?: boolean | undefined; farmerId?: string | undefined; q?: string | undefined;
  reviewStatus?: ReviewStatus | undefined;
}
export interface FindGroupsParams {
  page: number; limit: number; category?: string | undefined; communityId?: string | undefined; farmerId?: string | undefined;
  q?: string | undefined; sort?: 'members' | 'name' | undefined;
  reviewStatus?: ReviewStatus | undefined;
}

export interface LearningHubRepo {
  /**
   * BR-59r. Of `cropIds`, the ones that are a live `crop_master` row (not
   * soft-deleted). The service turns the difference into a 422 — it never drops
   * an id it could not resolve.
   *
   * `is_active = false` is deliberately NOT a filter: a deactivated crop is
   * still a real taxonomy row, and content written about it stays true. Only
   * `deleted_at` (the row is gone) disqualifies it.
   */
  findLiveCropIds(db: Executor, cropIds: string[]): Promise<string[]>;
  /**
   * BR-59r. Replaces an article's whole crop set and returns the resulting
   * chips. Callers pass `[]` to clear; they never call this at all to leave the
   * tags alone. Must run inside the caller's transaction, between the content
   * write and its audit row.
   */
  replaceArticleCrops(db: Executor, articleId: string, cropIds: string[]): Promise<CropRefRow[]>;
  replaceVideoCrops(db: Executor, videoId: string, cropIds: string[]): Promise<CropRefRow[]>;

  // Articles
  findArticles(db: Executor, params: FindArticlesParams): Promise<{ rows: ArticleSummaryRow[]; total: number }>;
  findArticleById(db: Executor, id: string, publishedOnly?: boolean): Promise<ArticleRow | null>;
  createArticle(db: Executor, body: CreateArticleBody): Promise<ArticleRow>;
  updateArticle(db: Executor, id: string, patch: UpdateArticleBody): Promise<ArticleRow | null>;
  deleteArticle(db: Executor, id: string): Promise<boolean>;

  // Videos
  findVideos(db: Executor, params: FindVideosParams): Promise<{ rows: VideoRow[]; total: number }>;
  findVideoById(db: Executor, id: string): Promise<VideoRow | null>;
  createVideo(db: Executor, body: CreateVideoBody): Promise<VideoRow>;
  updateVideo(db: Executor, id: string, patch: UpdateVideoBody): Promise<VideoRow | null>;
  deleteVideo(db: Executor, id: string): Promise<boolean>;

  // Trainings
  findTrainings(db: Executor, params: FindTrainingsParams): Promise<{ rows: TrainingRow[]; total: number }>;
  findTrainingById(db: Executor, id: string, farmerId?: string | undefined): Promise<TrainingRow | null>;
  createTraining(db: Executor, body: CreateTrainingBody): Promise<TrainingRow>;
  updateTraining(db: Executor, id: string, patch: UpdateTrainingBody): Promise<TrainingRow | null>;
  deleteTraining(db: Executor, id: string): Promise<boolean>;
  /**
   * `SELECT ... FOR UPDATE` on the training row. Enrolment and capacity edits
   * both take this lock before counting, so "count, then insert" and "count,
   * then lower capacity" are serialised per training. Must run in a transaction.
   */
  lockTraining(db: Executor, trainingId: string): Promise<TrainingLockRow | null>;
  countTrainingEnrollments(db: Executor, trainingId: string): Promise<number>;
  findEnrollment(db: Executor, trainingId: string, farmerId: string): Promise<EnrollmentRow | null>;
  enrollFarmerInTraining(db: Executor, trainingId: string, farmerId: string): Promise<EnrollmentRow>;
  unenrollFarmerFromTraining(db: Executor, trainingId: string, farmerId: string): Promise<boolean>;

  // Groups
  findGroups(db: Executor, params: FindGroupsParams): Promise<{ rows: GroupRow[]; total: number }>;
  findGroupById(db: Executor, id: string, farmerId?: string | undefined): Promise<GroupRow | null>;
  createGroup(db: Executor, body: CreateGroupBody): Promise<GroupRow>;
  updateGroup(db: Executor, id: string, patch: UpdateGroupBody): Promise<GroupRow | null>;
  deleteGroup(db: Executor, id: string): Promise<boolean>;
  archiveGroup(db: Executor, id: string): Promise<GroupRow | null>;
  countGroupMembers(db: Executor, groupId: string): Promise<number>;
  /** `created` is false when the farmer was already a member (a replay). */
  joinGroup(
    db: Executor,
    groupId: string,
    farmerId: string,
  ): Promise<{ membership: MembershipRow; created: boolean }>;
  leaveGroup(db: Executor, groupId: string, farmerId: string): Promise<boolean>;

  // Content Review (BR-59t)
  submitReview(
    db: Executor,
    type: 'articles' | 'videos' | 'trainings' | 'groups',
    id: string,
    note?: string | undefined,
  ): Promise<ArticleRow | VideoRow | TrainingRow | GroupRow | null>;
  reviewContent(
    db: Executor,
    type: 'articles' | 'videos' | 'trainings' | 'groups',
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewerId: string,
    note?: string | undefined,
  ): Promise<ArticleRow | VideoRow | TrainingRow | GroupRow | null>;
}

/**
 * BR-59r. DELETE-then-INSERT inside the caller's transaction, which is what
 * "replace the set" means: it is not a ledger, and nothing reads a half-applied
 * state because no other statement runs between the two.
 *
 * `SELECT ... WHERE id = ANY($2)` for the return value rather than
 * `INSERT ... RETURNING` joined back, so clearing to `[]` takes the same path
 * and returns `[]` instead of needing a special case.
 */
async function replaceContentCrops(
  db: Executor,
  joinTable: string,
  fkColumn: string,
  contentId: string,
  cropIds: string[],
): Promise<CropRefRow[]> {
  await db.query(`DELETE FROM ${joinTable} WHERE ${fkColumn} = $1`, [contentId]);
  if (cropIds.length === 0) return [];
  await db.query(
    `INSERT INTO ${joinTable} (${fkColumn}, crop_id) SELECT $1, unnest($2::uuid[])`,
    [contentId, cropIds],
  );
  const res = await db.query<CropRefRow>(
    `SELECT id, name, name_ta AS "nameTa" FROM crop_master WHERE id = ANY($1::uuid[]) ORDER BY name`,
    [cropIds],
  );
  return res.rows;
}

export const learningHubRepo: LearningHubRepo = {
  // ── Crop tagging (BR-59r) ──────────────────────────────────────────────────
  async findLiveCropIds(db, cropIds) {
    if (cropIds.length === 0) return [];
    const res = await db.query<{ id: string }>(
      `SELECT id FROM crop_master WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
      [cropIds],
    );
    return res.rows.map((r) => r.id);
  },

  async replaceArticleCrops(db, articleId, cropIds) {
    return replaceContentCrops(db, 'learning_article_crops', 'article_id', articleId, cropIds);
  },

  async replaceVideoCrops(db, videoId, cropIds) {
    return replaceContentCrops(db, 'learning_video_crops', 'video_id', videoId, cropIds);
  },

  // ── Articles ───────────────────────────────────────────────────────────────
  async findArticles(db, { page, limit, language, tag, publishedOnly = true, isPublished, q, reviewStatus }) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (publishedOnly) {
      conditions.push(`is_published = true`);
    } else if (typeof isPublished === 'boolean') {
      conditions.push(`is_published = $${idx++}`);
      params.push(isPublished);
    }
    if (reviewStatus) {
      conditions.push(`review_status = $${idx++}`);
      params.push(reviewStatus);
    }
    if (language) {
      conditions.push(`language = $${idx++}`);
      params.push(language);
    }
    if (tag) {
      conditions.push(`tag = $${idx++}`);
      params.push(tag);
    }
    if (q) {
      conditions.push(`title ILIKE $${idx++} ESCAPE '\\'`);
      params.push(`%${escapeIlike(q)}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countSql = `SELECT count(*)::int AS total FROM learning_articles ${whereClause}`;
    const countRes = await db.query<{ total: number }>(countSql, params);
    const total = countRes.rows[0]?.total ?? 0;

    const offset = (page - 1) * limit;
    const querySql = `
      SELECT id, title, snippet, read_time, author, tag, language,
             is_published, review_status, submitted_for_review_at, reviewed_by,
             reviewed_at, review_note, created_at, updated_at,
             ${ARTICLE_CROPS}
      FROM learning_articles
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const res = await db.query<ArticleSummaryRow>(querySql, params);
    return { rows: res.rows, total };
  },

  async findArticleById(db, id, publishedOnly = true) {
    const where = publishedOnly ? 'WHERE id = $1 AND is_published = true' : 'WHERE id = $1';
    const res = await db.query<ArticleRow>(
      `SELECT id, title, content, snippet, read_time, author, tag, language,
              is_published, review_status, submitted_for_review_at, reviewed_by,
              reviewed_at, review_note, created_at, updated_at,
              ${ARTICLE_CROPS}
       FROM learning_articles
       ${where}`,
      [id],
    );
    return res.rows[0] ?? null;
  },

  async createArticle(db, body) {
    const res = await db.query<ArticleRow>(
      `INSERT INTO learning_articles
       (title, content, snippet, read_time, author, tag, language, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, content, snippet, read_time, author, tag, language,
                 is_published, review_status, submitted_for_review_at, reviewed_by,
                 reviewed_at, review_note, created_at, updated_at,
                 ${ARTICLE_CROPS}`,
      [
        body.title,
        body.content,
        body.snippet ?? null,
        body.readTime,
        body.author,
        body.tag,
        body.language,
        body.isPublished,
      ],
    );
    return res.rows[0]!;
  },

  async updateArticle(db, id, patch) {
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
    if (patch.snippet !== undefined) {
      sets.push(`snippet = $${idx++}`);
      params.push(patch.snippet);
    }
    if (patch.readTime !== undefined) {
      sets.push(`read_time = $${idx++}`);
      params.push(patch.readTime);
    }
    if (patch.author !== undefined) {
      sets.push(`author = $${idx++}`);
      params.push(patch.author);
    }
    if (patch.tag !== undefined) {
      sets.push(`tag = $${idx++}`);
      params.push(patch.tag);
    }
    if (patch.language !== undefined) {
      sets.push(`language = $${idx++}`);
      params.push(patch.language);
    }
    if (patch.isPublished !== undefined) {
      sets.push(`is_published = $${idx++}`);
      params.push(patch.isPublished);
    }

    const res = await db.query<ArticleRow>(
      `UPDATE learning_articles
       SET ${sets.join(', ')}
       WHERE id = $1
       RETURNING id, title, content, snippet, read_time, author, tag, language,
                 is_published, review_status, submitted_for_review_at, reviewed_by,
                 reviewed_at, review_note, created_at, updated_at,
                 ${ARTICLE_CROPS}`,
      params,
    );
    return res.rows[0] ?? null;
  },

  async deleteArticle(db, id) {
    const res = await db.query(`DELETE FROM learning_articles WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  // ── Videos ─────────────────────────────────────────────────────────────────
  async findVideos(db, { page, limit, language, publishedOnly = true, isPublished, q, reviewStatus }) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (publishedOnly) {
      conditions.push(`is_published = true`);
    } else if (typeof isPublished === 'boolean') {
      conditions.push(`is_published = $${idx++}`);
      params.push(isPublished);
    }
    if (reviewStatus) {
      conditions.push(`review_status = $${idx++}`);
      params.push(reviewStatus);
    }
    if (language) {
      conditions.push(`language = $${idx++}`);
      params.push(language);
    }
    if (q) {
      conditions.push(`title ILIKE $${idx++} ESCAPE '\\'`);
      params.push(`%${escapeIlike(q)}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countSql = `SELECT count(*)::int AS total FROM learning_videos ${whereClause}`;
    const countRes = await db.query<{ total: number }>(countSql, params);
    const total = countRes.rows[0]?.total ?? 0;

    const offset = (page - 1) * limit;
    const querySql = `
      SELECT id, title, description, video_url, duration, author, language,
             is_featured, is_published, review_status, submitted_for_review_at,
             reviewed_by, reviewed_at, review_note, created_at, updated_at,
             ${VIDEO_CROPS}
      FROM learning_videos
      ${whereClause}
      ORDER BY is_featured DESC, created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const res = await db.query<VideoRow>(querySql, params);
    return { rows: res.rows, total };
  },

  async findVideoById(db, id) {
    const res = await db.query<VideoRow>(
      `SELECT id, title, description, video_url, duration, author, language,
              is_featured, is_published, review_status, submitted_for_review_at,
              reviewed_by, reviewed_at, review_note, created_at, updated_at,
              ${VIDEO_CROPS}
       FROM learning_videos
       WHERE id = $1`,
      [id],
    );
    return res.rows[0] ?? null;
  },

  async createVideo(db, body) {
    const res = await db.query<VideoRow>(
      `INSERT INTO learning_videos
       (title, description, video_url, duration, author, language, is_featured, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, description, video_url, duration, author, language,
                 is_featured, is_published, review_status, submitted_for_review_at,
                 reviewed_by, reviewed_at, review_note, created_at, updated_at,
                 ${VIDEO_CROPS}`,
      [
        body.title,
        body.description ?? null,
        body.videoUrl,
        body.duration,
        body.author,
        body.language,
        body.isFeatured,
        body.isPublished,
      ],
    );
    return res.rows[0]!;
  },

  async updateVideo(db, id, patch) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id];
    let idx = 2;

    if (patch.title !== undefined) {
      sets.push(`title = $${idx++}`);
      params.push(patch.title);
    }
    if (patch.description !== undefined) {
      sets.push(`description = $${idx++}`);
      params.push(patch.description);
    }
    if (patch.videoUrl !== undefined) {
      sets.push(`video_url = $${idx++}`);
      params.push(patch.videoUrl);
    }
    if (patch.duration !== undefined) {
      sets.push(`duration = $${idx++}`);
      params.push(patch.duration);
    }
    if (patch.author !== undefined) {
      sets.push(`author = $${idx++}`);
      params.push(patch.author);
    }
    if (patch.language !== undefined) {
      sets.push(`language = $${idx++}`);
      params.push(patch.language);
    }
    if (patch.isFeatured !== undefined) {
      sets.push(`is_featured = $${idx++}`);
      params.push(patch.isFeatured);
    }
    if (patch.isPublished !== undefined) {
      sets.push(`is_published = $${idx++}`);
      params.push(patch.isPublished);
    }

    const res = await db.query<VideoRow>(
      `UPDATE learning_videos
       SET ${sets.join(', ')}
       WHERE id = $1
       RETURNING id, title, description, video_url, duration, author, language,
                 is_featured, is_published, review_status, submitted_for_review_at,
                 reviewed_by, reviewed_at, review_note, created_at, updated_at,
                 ${VIDEO_CROPS}`,
      params,
    );
    return res.rows[0] ?? null;
  },

  async deleteVideo(db, id) {
    const res = await db.query(`DELETE FROM learning_videos WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  // ── Trainings ──────────────────────────────────────────────────────────────
  async findTrainings(db, { page, limit, language, publishedOnly = true, isPublished, farmerId, q, reviewStatus }) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (publishedOnly) {
      conditions.push(`t.is_published = true`);
    } else if (typeof isPublished === 'boolean') {
      conditions.push(`t.is_published = $${idx++}`);
      params.push(isPublished);
    }
    if (reviewStatus) {
      conditions.push(`t.review_status = $${idx++}`);
      params.push(reviewStatus);
    }
    if (language) {
      conditions.push(`t.language = $${idx++}`);
      params.push(language);
    }
    if (q) {
      conditions.push(`t.title ILIKE $${idx++} ESCAPE '\\'`);
      params.push(`%${escapeIlike(q)}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countSql = `SELECT count(*)::int AS total FROM learning_trainings t ${whereClause}`;
    const countRes = await db.query<{ total: number }>(countSql, params);
    const total = countRes.rows[0]?.total ?? 0;

    const offset = (page - 1) * limit;
    let enrolledSelect = 'false AS is_enrolled';
    if (farmerId) {
      params.push(farmerId);
      enrolledSelect = `EXISTS (
        SELECT 1 FROM learning_training_enrollments e
        WHERE e.training_id = t.id AND e.farmer_id = $${idx++}
      ) AS is_enrolled`;
    }

    const querySql = `
      SELECT t.id, t.title, t.description, t.training_date::text AS training_date,
             t.start_time, t.end_time, t.mode, t.location, t.instructor, t.capacity,
             t.language, t.is_published, t.review_status, t.submitted_for_review_at,
             t.reviewed_by, t.reviewed_at, t.review_note, t.created_at, t.updated_at,
             (SELECT count(*)::int FROM learning_training_enrollments e WHERE e.training_id = t.id) AS enrolled_count,
             ${enrolledSelect}
      FROM learning_trainings t
      ${whereClause}
      ORDER BY t.training_date ASC, t.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const res = await db.query<TrainingRow>(querySql, params);
    return { rows: res.rows, total };
  },

  async findTrainingById(db, id, farmerId) {
    const params: unknown[] = [id];
    let enrolledSelect = 'false AS is_enrolled';
    if (farmerId) {
      params.push(farmerId);
      enrolledSelect = `EXISTS (
        SELECT 1 FROM learning_training_enrollments e
        WHERE e.training_id = t.id AND e.farmer_id = $2
      ) AS is_enrolled`;
    }

    const res = await db.query<TrainingRow>(
      `SELECT t.id, t.title, t.description, t.training_date::text AS training_date,
              t.start_time, t.end_time, t.mode, t.location, t.instructor, t.capacity,
              t.language, t.is_published, t.review_status, t.submitted_for_review_at,
              t.reviewed_by, t.reviewed_at, t.review_note, t.created_at, t.updated_at,
              (SELECT count(*)::int FROM learning_training_enrollments e WHERE e.training_id = t.id) AS enrolled_count,
              ${enrolledSelect}
       FROM learning_trainings t
       WHERE t.id = $1`,
      params,
    );
    return res.rows[0] ?? null;
  },

  async createTraining(db, body) {
    const res = await db.query<TrainingRow>(
      `INSERT INTO learning_trainings
       (title, description, training_date, start_time, end_time, mode, location,
        instructor, capacity, language, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, title, description, training_date::text AS training_date,
                 start_time, end_time, mode, location, instructor, capacity,
                 language, is_published, review_status, submitted_for_review_at,
                 reviewed_by, reviewed_at, review_note, created_at, updated_at`,
      [
        body.title,
        body.description ?? null,
        body.trainingDate,
        body.startTime,
        body.endTime ?? null,
        body.mode,
        body.location,
        body.instructor,
        body.capacity ?? null,
        body.language,
        body.isPublished,
      ],
    );
    const row = res.rows[0]!;
    row.enrolled_count = 0;
    row.is_enrolled = false;
    return row;
  },

  async updateTraining(db, id, patch) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id];
    let idx = 2;

    if (patch.title !== undefined) {
      sets.push(`title = $${idx++}`);
      params.push(patch.title);
    }
    if (patch.description !== undefined) {
      sets.push(`description = $${idx++}`);
      params.push(patch.description);
    }
    if (patch.trainingDate !== undefined) {
      sets.push(`training_date = $${idx++}`);
      params.push(patch.trainingDate);
    }
    if (patch.startTime !== undefined) {
      sets.push(`start_time = $${idx++}`);
      params.push(patch.startTime);
    }
    if (patch.endTime !== undefined) {
      sets.push(`end_time = $${idx++}`);
      params.push(patch.endTime);
    }
    if (patch.mode !== undefined) {
      sets.push(`mode = $${idx++}`);
      params.push(patch.mode);
    }
    if (patch.location !== undefined) {
      sets.push(`location = $${idx++}`);
      params.push(patch.location);
    }
    if (patch.instructor !== undefined) {
      sets.push(`instructor = $${idx++}`);
      params.push(patch.instructor);
    }
    if (patch.capacity !== undefined) {
      sets.push(`capacity = $${idx++}`);
      params.push(patch.capacity);
    }
    if (patch.language !== undefined) {
      sets.push(`language = $${idx++}`);
      params.push(patch.language);
    }
    if (patch.isPublished !== undefined) {
      sets.push(`is_published = $${idx++}`);
      params.push(patch.isPublished);
    }

    const res = await db.query<TrainingRow>(
      `UPDATE learning_trainings
       SET ${sets.join(', ')}
       WHERE id = $1
       RETURNING id, title, description, training_date::text AS training_date,
                 start_time, end_time, mode, location, instructor, capacity,
                 language, is_published, review_status, submitted_for_review_at,
                 reviewed_by, reviewed_at, review_note, created_at, updated_at,
                 (SELECT count(*)::int FROM learning_training_enrollments WHERE training_id = $1) AS enrolled_count`,
      params,
    );
    return res.rows[0] ?? null;
  },

  async deleteTraining(db, id) {
    const res = await db.query(`DELETE FROM learning_trainings WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async countTrainingEnrollments(db, trainingId) {
    const res = await db.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM learning_training_enrollments WHERE training_id = $1`,
      [trainingId],
    );
    return res.rows[0]?.count ?? 0;
  },

  async lockTraining(db, trainingId) {
    const res = await db.query<TrainingLockRow>(
      `SELECT id, capacity, is_published FROM learning_trainings WHERE id = $1 FOR UPDATE`,
      [trainingId],
    );
    return res.rows[0] ?? null;
  },

  async findEnrollment(db, trainingId, farmerId) {
    const res = await db.query<EnrollmentRow>(
      `SELECT id, training_id, farmer_id, enrolled_at
       FROM learning_training_enrollments WHERE training_id = $1 AND farmer_id = $2`,
      [trainingId, farmerId],
    );
    return res.rows[0] ?? null;
  },

  // Plain INSERT: the caller holds the training row lock, so the unique
  // (training_id, farmer_id) constraint is only a backstop here.
  async enrollFarmerInTraining(db, trainingId, farmerId) {
    const res = await db.query<EnrollmentRow>(
      `INSERT INTO learning_training_enrollments (training_id, farmer_id)
       VALUES ($1, $2)
       RETURNING id, training_id, farmer_id, enrolled_at`,
      [trainingId, farmerId],
    );
    return res.rows[0]!;
  },

  async unenrollFarmerFromTraining(db, trainingId, farmerId) {
    const res = await db.query(
      `DELETE FROM learning_training_enrollments WHERE training_id = $1 AND farmer_id = $2`,
      [trainingId, farmerId],
    );
    return (res.rowCount ?? 0) > 0;
  },

  // ── Groups ─────────────────────────────────────────────────────────────────
  async findGroups(db, { page, limit, category, communityId, farmerId, q, sort, reviewStatus }) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (category) {
      conditions.push(`g.category = $${idx++}`);
      params.push(category);
    }
    if (communityId) {
      conditions.push(`g.community_id = $${idx++}`);
      params.push(communityId);
    }
    if (reviewStatus) {
      conditions.push(`g.review_status = $${idx++}`);
      params.push(reviewStatus);
    }
    if (q) {
      conditions.push(`g.name ILIKE $${idx++} ESCAPE '\\'`);
      params.push(`%${escapeIlike(q)}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countSql = `SELECT count(*)::int AS total FROM learning_groups g ${whereClause}`;
    const countRes = await db.query<{ total: number }>(countSql, params);
    const total = countRes.rows[0]?.total ?? 0;

    const offset = (page - 1) * limit;
    let joinedSelect = 'false AS is_joined';
    if (farmerId) {
      params.push(farmerId);
      joinedSelect = `EXISTS (
        SELECT 1 FROM learning_group_memberships m
        WHERE m.group_id = g.id AND m.farmer_id = $${idx++}
      ) AS is_joined`;
    }

    // Both sorts compare names the same way (LOWER: the database collates with "C", where
    // 'Beta' sorts before 'alpha'), and every order ends on the unique g.id so that equal keys
    // cannot reorder between pages. The default (no sort) stays newest first.
    let orderBy = 'g.created_at DESC, g.id ASC';
    if (sort === 'members') {
      orderBy = 'member_count DESC, LOWER(g.name) ASC, g.id ASC';
    } else if (sort === 'name') {
      orderBy = 'LOWER(g.name) ASC, g.id ASC';
    }

    const querySql = `
      SELECT g.id, g.name, g.description, g.category, g.archived_at, g.community_id,
             g.review_status, g.submitted_for_review_at, g.reviewed_by, g.reviewed_at, g.review_note,
             g.created_at, g.updated_at,
             (SELECT count(*)::int FROM learning_group_memberships m WHERE m.group_id = g.id) AS member_count,
             ${joinedSelect}
      FROM learning_groups g
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const res = await db.query<GroupRow>(querySql, params);
    return { rows: res.rows, total };
  },

  async findGroupById(db, id, farmerId) {
    const params: unknown[] = [id];
    let joinedSelect = 'false AS is_joined';
    if (farmerId) {
      params.push(farmerId);
      joinedSelect = `EXISTS (
        SELECT 1 FROM learning_group_memberships m
        WHERE m.group_id = g.id AND m.farmer_id = $2
      ) AS is_joined`;
    }

    const res = await db.query<GroupRow>(
      `SELECT g.id, g.name, g.description, g.category, g.archived_at, g.community_id,
              g.review_status, g.submitted_for_review_at, g.reviewed_by, g.reviewed_at, g.review_note,
              g.created_at, g.updated_at,
              (SELECT count(*)::int FROM learning_group_memberships m WHERE m.group_id = g.id) AS member_count,
              ${joinedSelect}
       FROM learning_groups g
       WHERE g.id = $1`,
      params,
    );
    return res.rows[0] ?? null;
  },

  async createGroup(db, body) {
    const res = await db.query<GroupRow>(
      `INSERT INTO learning_groups (name, description, category, community_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, category, archived_at, community_id,
                 review_status, submitted_for_review_at, reviewed_by, reviewed_at, review_note,
                 created_at, updated_at`,
      [body.name, body.description ?? null, body.category, body.communityId ?? null],
    );
    const row = res.rows[0]!;
    row.member_count = 0;
    row.is_joined = false;
    return row;
  },

  async updateGroup(db, id, patch) {
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
    if (patch.communityId !== undefined) {
      sets.push(`community_id = $${idx++}`);
      params.push(patch.communityId);
    }

    const res = await db.query<GroupRow>(
      `UPDATE learning_groups
       SET ${sets.join(', ')}
       WHERE id = $1
       RETURNING id, name, description, category, archived_at, community_id,
                 review_status, submitted_for_review_at, reviewed_by, reviewed_at, review_note,
                 created_at, updated_at,
                 (SELECT count(*)::int FROM learning_group_memberships WHERE group_id = $1) AS member_count`,
      params,
    );
    return res.rows[0] ?? null;
  },

  async deleteGroup(db, id) {
    const res = await db.query(`DELETE FROM learning_groups WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async archiveGroup(db, id) {
    const res = await db.query<GroupRow>(
      `UPDATE learning_groups
       SET archived_at = now(), updated_at = now()
       WHERE id = $1
       RETURNING id, name, description, category, archived_at, community_id,
                 review_status, submitted_for_review_at, reviewed_by, reviewed_at, review_note,
                 created_at, updated_at,
                 (SELECT count(*)::int FROM learning_group_memberships WHERE group_id = $1) AS member_count`,
      [id],
    );
    return res.rows[0] ?? null;
  },

  async countGroupMembers(db, groupId) {
    const res = await db.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM learning_group_memberships WHERE group_id = $1`,
      [groupId],
    );
    return res.rows[0]?.count ?? 0;
  },

  // DO NOTHING returns no row on a conflict, which is how a replay (or a
  // double-tap racing itself) is told apart from a real join.
  async joinGroup(db, groupId, farmerId) {
    const inserted = await db.query<MembershipRow>(
      `INSERT INTO learning_group_memberships (group_id, farmer_id)
       VALUES ($1, $2)
       ON CONFLICT (group_id, farmer_id) DO NOTHING
       RETURNING id, group_id, farmer_id, joined_at`,
      [groupId, farmerId],
    );
    if (inserted.rows[0] !== undefined) return { membership: inserted.rows[0], created: true };

    const existing = await db.query<MembershipRow>(
      `SELECT id, group_id, farmer_id, joined_at
       FROM learning_group_memberships WHERE group_id = $1 AND farmer_id = $2`,
      [groupId, farmerId],
    );
    return { membership: existing.rows[0]!, created: false };
  },

  async leaveGroup(db, groupId, farmerId) {
    const res = await db.query(
      `DELETE FROM learning_group_memberships WHERE group_id = $1 AND farmer_id = $2`,
      [groupId, farmerId],
    );
    return (res.rowCount ?? 0) > 0;
  },

  // ── Content Review (BR-59t) ────────────────────────────────────────────────
  async submitReview(db, type, id, note) {
    if (type === 'articles') {
      const res = await db.query<ArticleRow>(
        `UPDATE learning_articles
         SET review_status = 'PENDING_REVIEW',
             submitted_for_review_at = now(),
             review_note = COALESCE($2, review_note),
             updated_at = now()
         WHERE id = $1
         RETURNING id, title, content, snippet, read_time, author, tag, language,
                   is_published, review_status, submitted_for_review_at, reviewed_by,
                   reviewed_at, review_note, created_at, updated_at,
                   ${ARTICLE_CROPS}`,
        [id, note ?? null],
      );
      return res.rows[0] ?? null;
    }
    if (type === 'videos') {
      const res = await db.query<VideoRow>(
        `UPDATE learning_videos
         SET review_status = 'PENDING_REVIEW',
             submitted_for_review_at = now(),
             review_note = COALESCE($2, review_note),
             updated_at = now()
         WHERE id = $1
         RETURNING id, title, description, video_url, duration, author, language,
                   is_featured, is_published, review_status, submitted_for_review_at,
                   reviewed_by, reviewed_at, review_note, created_at, updated_at,
                   ${VIDEO_CROPS}`,
        [id, note ?? null],
      );
      return res.rows[0] ?? null;
    }
    if (type === 'trainings') {
      const res = await db.query<TrainingRow>(
        `UPDATE learning_trainings
         SET review_status = 'PENDING_REVIEW',
             submitted_for_review_at = now(),
             review_note = COALESCE($2, review_note),
             updated_at = now()
         WHERE id = $1
         RETURNING id, title, description, training_date::text AS training_date,
                   start_time, end_time, mode, location, instructor, capacity,
                   language, is_published, review_status, submitted_for_review_at,
                   reviewed_by, reviewed_at, review_note, created_at, updated_at,
                   (SELECT count(*)::int FROM learning_training_enrollments e WHERE e.training_id = learning_trainings.id) AS enrolled_count,
                   false AS is_enrolled`,
        [id, note ?? null],
      );
      return res.rows[0] ?? null;
    }
    const res = await db.query<GroupRow>(
      `UPDATE learning_groups
       SET review_status = 'PENDING_REVIEW',
           submitted_for_review_at = now(),
           review_note = COALESCE($2, review_note),
           updated_at = now()
       WHERE id = $1
       RETURNING id, name, description, category, archived_at, community_id,
                 review_status, submitted_for_review_at, reviewed_by, reviewed_at,
                 review_note, created_at, updated_at,
                 (SELECT count(*)::int FROM learning_group_memberships m WHERE m.group_id = learning_groups.id) AS member_count,
                 false AS is_joined`,
      [id, note ?? null],
    );
    return res.rows[0] ?? null;
  },

  async reviewContent(db, type, id, status, reviewerId, note) {
    if (type === 'articles') {
      const res = await db.query<ArticleRow>(
        `UPDATE learning_articles
         SET review_status = $2,
             reviewed_by = $3,
             reviewed_at = now(),
             review_note = $4,
             updated_at = now()
         WHERE id = $1
         RETURNING id, title, content, snippet, read_time, author, tag, language,
                   is_published, review_status, submitted_for_review_at, reviewed_by,
                   reviewed_at, review_note, created_at, updated_at,
                   ${ARTICLE_CROPS}`,
        [id, status, reviewerId, note ?? null],
      );
      return res.rows[0] ?? null;
    }
    if (type === 'videos') {
      const res = await db.query<VideoRow>(
        `UPDATE learning_videos
         SET review_status = $2,
             reviewed_by = $3,
             reviewed_at = now(),
             review_note = $4,
             updated_at = now()
         WHERE id = $1
         RETURNING id, title, description, video_url, duration, author, language,
                   is_featured, is_published, review_status, submitted_for_review_at,
                   reviewed_by, reviewed_at, review_note, created_at, updated_at,
                   ${VIDEO_CROPS}`,
        [id, status, reviewerId, note ?? null],
      );
      return res.rows[0] ?? null;
    }
    if (type === 'trainings') {
      const res = await db.query<TrainingRow>(
        `UPDATE learning_trainings
         SET review_status = $2,
             reviewed_by = $3,
             reviewed_at = now(),
             review_note = $4,
             updated_at = now()
         WHERE id = $1
         RETURNING id, title, description, training_date::text AS training_date,
                   start_time, end_time, mode, location, instructor, capacity,
                   language, is_published, review_status, submitted_for_review_at,
                   reviewed_by, reviewed_at, review_note, created_at, updated_at,
                   (SELECT count(*)::int FROM learning_training_enrollments e WHERE e.training_id = learning_trainings.id) AS enrolled_count,
                   false AS is_enrolled`,
        [id, status, reviewerId, note ?? null],
      );
      return res.rows[0] ?? null;
    }
    const res = await db.query<GroupRow>(
      `UPDATE learning_groups
       SET review_status = $2,
           reviewed_by = $3,
           reviewed_at = now(),
           review_note = $4,
           updated_at = now()
       WHERE id = $1
       RETURNING id, name, description, category, archived_at, community_id,
                 review_status, submitted_for_review_at, reviewed_by, reviewed_at,
                 review_note, created_at, updated_at,
                 (SELECT count(*)::int FROM learning_group_memberships m WHERE m.group_id = learning_groups.id) AS member_count,
                 false AS is_joined`,
      [id, status, reviewerId, note ?? null],
    );
    return res.rows[0] ?? null;
  },
};
