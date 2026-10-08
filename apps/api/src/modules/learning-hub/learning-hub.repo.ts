import type { Executor } from '../../db/pool.js';
import type {
  CreateArticleBody,
  CreateGroupBody,
  CreateTrainingBody,
  CreateVideoBody,
  ListArticlesQuery,
  ListGroupsQuery,
  ListTrainingsQuery,
  ListVideosQuery,
  UpdateArticleBody,
  UpdateGroupBody,
  UpdateTrainingBody,
  UpdateVideoBody,
} from './learning-hub.schema.js';

export interface ArticleRow {
  id: string;
  title: string;
  content: string;
  snippet: string | null;
  read_time: string;
  author: string;
  tag: string;
  language: 'en' | 'ta';
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoRow {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration: string;
  author: string;
  language: 'en' | 'ta';
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingRow {
  id: string;
  title: string;
  description: string | null;
  training_date: string;
  start_time: string;
  end_time: string | null;
  mode: 'IN_FIELD' | 'ONLINE_WEBINAR';
  location: string;
  instructor: string;
  capacity: number | null;
  language: 'en' | 'ta';
  is_published: boolean;
  created_at: string;
  updated_at: string;
  enrolled_count?: string | number;
  is_enrolled?: boolean;
}

export interface GroupRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
  member_count?: string | number;
  is_joined?: boolean;
}

export interface EnrollmentRow {
  id: string;
  training_id: string;
  farmer_id: string;
  enrolled_at: string;
}

export interface MembershipRow {
  id: string;
  group_id: string;
  farmer_id: string;
  joined_at: string;
}

export interface LearningHubRepo {
  // Articles
  findArticles(
    db: Executor,
    params: ListArticlesQuery & { publishedOnly?: boolean },
  ): Promise<{ rows: ArticleRow[]; total: number }>;
  findArticleById(db: Executor, id: string, publishedOnly?: boolean): Promise<ArticleRow | null>;
  createArticle(db: Executor, body: CreateArticleBody): Promise<ArticleRow>;
  updateArticle(db: Executor, id: string, patch: UpdateArticleBody): Promise<ArticleRow | null>;
  deleteArticle(db: Executor, id: string): Promise<boolean>;

  // Videos
  findVideos(
    db: Executor,
    params: ListVideosQuery & { publishedOnly?: boolean },
  ): Promise<{ rows: VideoRow[]; total: number }>;
  findVideoById(db: Executor, id: string): Promise<VideoRow | null>;
  createVideo(db: Executor, body: CreateVideoBody): Promise<VideoRow>;
  updateVideo(db: Executor, id: string, patch: UpdateVideoBody): Promise<VideoRow | null>;
  deleteVideo(db: Executor, id: string): Promise<boolean>;

  // Trainings
  findTrainings(
    db: Executor,
    params: ListTrainingsQuery & { publishedOnly?: boolean | undefined; farmerId?: string | undefined },
  ): Promise<{ rows: TrainingRow[]; total: number }>;
  findTrainingById(db: Executor, id: string, farmerId?: string | undefined): Promise<TrainingRow | null>;
  createTraining(db: Executor, body: CreateTrainingBody): Promise<TrainingRow>;
  updateTraining(db: Executor, id: string, patch: UpdateTrainingBody): Promise<TrainingRow | null>;
  deleteTraining(db: Executor, id: string): Promise<boolean>;
  countTrainingEnrollments(db: Executor, trainingId: string): Promise<number>;
  isFarmerEnrolled(db: Executor, trainingId: string, farmerId: string): Promise<boolean>;
  enrollFarmerInTraining(db: Executor, trainingId: string, farmerId: string): Promise<EnrollmentRow>;
  unenrollFarmerFromTraining(db: Executor, trainingId: string, farmerId: string): Promise<boolean>;

  // Groups
  findGroups(
    db: Executor,
    params: ListGroupsQuery & { farmerId?: string | undefined },
  ): Promise<{ rows: GroupRow[]; total: number }>;
  findGroupById(db: Executor, id: string, farmerId?: string | undefined): Promise<GroupRow | null>;
  createGroup(db: Executor, body: CreateGroupBody): Promise<GroupRow>;
  updateGroup(db: Executor, id: string, patch: UpdateGroupBody): Promise<GroupRow | null>;
  deleteGroup(db: Executor, id: string): Promise<boolean>;
  isFarmerInGroup(db: Executor, groupId: string, farmerId: string): Promise<boolean>;
  joinGroup(db: Executor, groupId: string, farmerId: string): Promise<MembershipRow>;
  leaveGroup(db: Executor, groupId: string, farmerId: string): Promise<boolean>;
}

export const learningHubRepo: LearningHubRepo = {
  // ── Articles ───────────────────────────────────────────────────────────────
  async findArticles(db, { page, limit, language, tag, publishedOnly = true }) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (publishedOnly) {
      conditions.push(`is_published = true`);
    }
    if (language) {
      conditions.push(`language = $${idx++}`);
      params.push(language);
    }
    if (tag) {
      conditions.push(`tag = $${idx++}`);
      params.push(tag);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countSql = `SELECT count(*)::int AS total FROM learning_articles ${whereClause}`;
    const countRes = await db.query<{ total: number }>(countSql, params);
    const total = countRes.rows[0]?.total ?? 0;

    const offset = (page - 1) * limit;
    const querySql = `
      SELECT id, title, content, snippet, read_time, author, tag, language,
             is_published, created_at, updated_at
      FROM learning_articles
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(limit, offset);
    const res = await db.query<ArticleRow>(querySql, params);
    return { rows: res.rows, total };
  },

  async findArticleById(db, id, publishedOnly = true) {
    const where = publishedOnly ? 'WHERE id = $1 AND is_published = true' : 'WHERE id = $1';
    const res = await db.query<ArticleRow>(
      `SELECT id, title, content, snippet, read_time, author, tag, language,
              is_published, created_at, updated_at
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
                 is_published, created_at, updated_at`,
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
                 is_published, created_at, updated_at`,
      params,
    );
    return res.rows[0] ?? null;
  },

  async deleteArticle(db, id) {
    const res = await db.query(`DELETE FROM learning_articles WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  // ── Videos ─────────────────────────────────────────────────────────────────
  async findVideos(db, { page, limit, language, publishedOnly = true }) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (publishedOnly) {
      conditions.push(`is_published = true`);
    }
    if (language) {
      conditions.push(`language = $${idx++}`);
      params.push(language);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countSql = `SELECT count(*)::int AS total FROM learning_videos ${whereClause}`;
    const countRes = await db.query<{ total: number }>(countSql, params);
    const total = countRes.rows[0]?.total ?? 0;

    const offset = (page - 1) * limit;
    const querySql = `
      SELECT id, title, description, video_url, duration, author, language,
             is_featured, is_published, created_at, updated_at
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
              is_featured, is_published, created_at, updated_at
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
                 is_featured, is_published, created_at, updated_at`,
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
                 is_featured, is_published, created_at, updated_at`,
      params,
    );
    return res.rows[0] ?? null;
  },

  async deleteVideo(db, id) {
    const res = await db.query(`DELETE FROM learning_videos WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  // ── Trainings ──────────────────────────────────────────────────────────────
  async findTrainings(db, { page, limit, language, publishedOnly = true, farmerId }) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (publishedOnly) {
      conditions.push(`t.is_published = true`);
    }
    if (language) {
      conditions.push(`t.language = $${idx++}`);
      params.push(language);
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
             t.language, t.is_published, t.created_at, t.updated_at,
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
              t.language, t.is_published, t.created_at, t.updated_at,
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
                 language, is_published, created_at, updated_at`,
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
                 language, is_published, created_at, updated_at,
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

  async isFarmerEnrolled(db, trainingId, farmerId) {
    const res = await db.query(
      `SELECT 1 FROM learning_training_enrollments WHERE training_id = $1 AND farmer_id = $2`,
      [trainingId, farmerId],
    );
    return (res.rowCount ?? 0) > 0;
  },

  async enrollFarmerInTraining(db, trainingId, farmerId) {
    const res = await db.query<EnrollmentRow>(
      `INSERT INTO learning_training_enrollments (training_id, farmer_id)
       VALUES ($1, $2)
       ON CONFLICT (training_id, farmer_id) DO UPDATE SET enrolled_at = learning_training_enrollments.enrolled_at
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
  async findGroups(db, { page, limit, category, farmerId }) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (category) {
      conditions.push(`g.category = $${idx++}`);
      params.push(category);
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

    const querySql = `
      SELECT g.id, g.name, g.description, g.category, g.created_at, g.updated_at,
             (SELECT count(*)::int FROM learning_group_memberships m WHERE m.group_id = g.id) AS member_count,
             ${joinedSelect}
      FROM learning_groups g
      ${whereClause}
      ORDER BY g.created_at DESC
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
      `SELECT g.id, g.name, g.description, g.category, g.created_at, g.updated_at,
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
      `INSERT INTO learning_groups (name, description, category)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, category, created_at, updated_at`,
      [body.name, body.description ?? null, body.category],
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

    const res = await db.query<GroupRow>(
      `UPDATE learning_groups
       SET ${sets.join(', ')}
       WHERE id = $1
       RETURNING id, name, description, category, created_at, updated_at,
                 (SELECT count(*)::int FROM learning_group_memberships WHERE group_id = $1) AS member_count`,
      params,
    );
    return res.rows[0] ?? null;
  },

  async deleteGroup(db, id) {
    const res = await db.query(`DELETE FROM learning_groups WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async isFarmerInGroup(db, groupId, farmerId) {
    const res = await db.query(
      `SELECT 1 FROM learning_group_memberships WHERE group_id = $1 AND farmer_id = $2`,
      [groupId, farmerId],
    );
    return (res.rowCount ?? 0) > 0;
  },

  async joinGroup(db, groupId, farmerId) {
    const res = await db.query<MembershipRow>(
      `INSERT INTO learning_group_memberships (group_id, farmer_id)
       VALUES ($1, $2)
       ON CONFLICT (group_id, farmer_id) DO UPDATE SET joined_at = learning_group_memberships.joined_at
       RETURNING id, group_id, farmer_id, joined_at`,
      [groupId, farmerId],
    );
    return res.rows[0]!;
  },

  async leaveGroup(db, groupId, farmerId) {
    const res = await db.query(
      `DELETE FROM learning_group_memberships WHERE group_id = $1 AND farmer_id = $2`,
      [groupId, farmerId],
    );
    return (res.rowCount ?? 0) > 0;
  },
};
