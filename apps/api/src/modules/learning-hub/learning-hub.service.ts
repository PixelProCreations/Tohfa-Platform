import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  learningHubRepo,
  type ArticleRow,
  type GroupRow,
  type LearningHubRepo,
  type TrainingRow,
  type VideoRow,
} from './learning-hub.repo.js';
import type {
  CreateArticleBody,
  CreateGroupBody,
  CreateTrainingBody,
  CreateVideoBody,
  LearningArticleResponse,
  LearningGroupResponse,
  LearningTrainingResponse,
  LearningVideoResponse,
  ListArticlesQuery,
  ListGroupsQuery,
  ListTrainingsQuery,
  ListVideosQuery,
  UpdateArticleBody,
  UpdateGroupBody,
  UpdateTrainingBody,
  UpdateVideoBody,
} from './learning-hub.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface LearningHubServiceDeps {
  repo: LearningHubRepo;
  db: Executor;
  runTx: TransactionRunner;
}

function mapArticle(row: ArticleRow): LearningArticleResponse {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    snippet: row.snippet,
    readTime: row.read_time,
    author: row.author,
    tag: row.tag,
    language: row.language,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVideo(row: VideoRow): LearningVideoResponse {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    videoUrl: row.video_url,
    duration: row.duration,
    author: row.author,
    language: row.language,
    isFeatured: row.is_featured,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTraining(row: TrainingRow): LearningTrainingResponse {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    trainingDate: row.training_date,
    startTime: row.start_time,
    endTime: row.end_time,
    mode: row.mode,
    location: row.location,
    instructor: row.instructor,
    capacity: row.capacity,
    enrolledCount: Number(row.enrolled_count ?? 0),
    isEnrolled: row.is_enrolled,
    language: row.language,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGroup(row: GroupRow): LearningGroupResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    memberCount: Number(row.member_count ?? 0),
    isJoined: row.is_joined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class LearningHubService {
  constructor(private readonly deps: LearningHubServiceDeps) {}

  // ── Articles ───────────────────────────────────────────────────────────────
  async listArticles(query: ListArticlesQuery) {
    const { rows, total } = await this.deps.repo.findArticles(this.deps.db, {
      ...query,
      publishedOnly: true,
    });
    return {
      items: rows.map(mapArticle),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getArticle(id: string) {
    const row = await this.deps.repo.findArticleById(this.deps.db, id, true);
    if (!row) {
      throw new AppError('NOT_FOUND', { detail: 'Learning article not found' });
    }
    return mapArticle(row);
  }

  async createArticle(scope: ResolvedScope, body: CreateArticleBody) {
    return this.deps.runTx(async (tx) => {
      const created = await this.deps.repo.createArticle(tx, body);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'learning.article.create',
        entityType: 'learning_article',
        entityId: created.id,
        after: created,
      });
      return mapArticle(created);
    });
  }

  async updateArticle(scope: ResolvedScope, id: string, patch: UpdateArticleBody) {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findArticleById(tx, id, false);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Learning article not found' });
      }
      const updated = await this.deps.repo.updateArticle(tx, id, patch);
      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: 'Learning article not found' });
      }
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'learning.article.update',
        entityType: 'learning_article',
        entityId: updated.id,
        before,
        after: updated,
        changedFields: changedFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
      });
      return mapArticle(updated);
    });
  }

  async deleteArticle(scope: ResolvedScope, id: string) {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findArticleById(tx, id, false);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Learning article not found' });
      }
      await this.deps.repo.deleteArticle(tx, id);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'learning.article.delete',
        entityType: 'learning_article',
        entityId: id,
        before,
      });
    });
  }

  // ── Videos ─────────────────────────────────────────────────────────────────
  async listVideos(query: ListVideosQuery) {
    const { rows, total } = await this.deps.repo.findVideos(this.deps.db, {
      ...query,
      publishedOnly: true,
    });
    return {
      items: rows.map(mapVideo),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async createVideo(scope: ResolvedScope, body: CreateVideoBody) {
    return this.deps.runTx(async (tx) => {
      const created = await this.deps.repo.createVideo(tx, body);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'learning.video.create',
        entityType: 'learning_video',
        entityId: created.id,
        after: created,
      });
      return mapVideo(created);
    });
  }

  async updateVideo(scope: ResolvedScope, id: string, patch: UpdateVideoBody) {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findVideoById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Learning video not found' });
      }
      const updated = await this.deps.repo.updateVideo(tx, id, patch);
      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: 'Learning video not found' });
      }
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'learning.video.update',
        entityType: 'learning_video',
        entityId: updated.id,
        before,
        after: updated,
        changedFields: changedFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
      });
      return mapVideo(updated);
    });
  }

  async deleteVideo(scope: ResolvedScope, id: string) {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findVideoById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Learning video not found' });
      }
      await this.deps.repo.deleteVideo(tx, id);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'learning.video.delete',
        entityType: 'learning_video',
        entityId: id,
        before,
      });
    });
  }

  // ── Trainings ──────────────────────────────────────────────────────────────
  async listTrainings(query: ListTrainingsQuery, farmerId?: string) {
    const { rows, total } = await this.deps.repo.findTrainings(this.deps.db, {
      ...query,
      publishedOnly: true,
      farmerId,
    });
    return {
      items: rows.map(mapTraining),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async createTraining(scope: ResolvedScope, body: CreateTrainingBody) {
    return this.deps.runTx(async (tx) => {
      const created = await this.deps.repo.createTraining(tx, body);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'learning.training.create',
        entityType: 'learning_training',
        entityId: created.id,
        after: created,
      });
      return mapTraining(created);
    });
  }

  async updateTraining(scope: ResolvedScope, id: string, patch: UpdateTrainingBody) {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findTrainingById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Learning training not found' });
      }
      const updated = await this.deps.repo.updateTraining(tx, id, patch);
      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: 'Learning training not found' });
      }
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'learning.training.update',
        entityType: 'learning_training',
        entityId: updated.id,
        before,
        after: updated,
        changedFields: changedFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
      });
      return mapTraining(updated);
    });
  }

  async deleteTraining(scope: ResolvedScope, id: string) {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findTrainingById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Learning training not found' });
      }
      await this.deps.repo.deleteTraining(tx, id);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'learning.training.delete',
        entityType: 'learning_training',
        entityId: id,
        before,
      });
    });
  }

  async enrollTraining(scope: ResolvedScope, trainingId: string) {
    const farmerId = scope.farmerId;
    if (!farmerId) {
      throw new AppError('FORBIDDEN', { detail: 'Only farmers can enroll in trainings' });
    }

    return this.deps.runTx(async (tx) => {
      const lockRes = await tx.query<{ id: string; capacity: number | null; is_published: boolean }>(
        `SELECT id, capacity, is_published FROM learning_trainings WHERE id = $1 FOR UPDATE`,
        [trainingId],
      );
      const training = lockRes.rows[0];
      if (!training || !training.is_published) {
        throw new AppError('NOT_FOUND', { detail: 'Training workshop not found' });
      }

      const alreadyEnrolled = await this.deps.repo.isFarmerEnrolled(tx, trainingId, farmerId);
      if (!alreadyEnrolled && training.capacity !== null) {
        const count = await this.deps.repo.countTrainingEnrollments(tx, trainingId);
        if (count >= training.capacity) {
          throw new AppError('TRAINING_FULL', { detail: 'Training has reached full capacity' });
        }
      }

      const enrollment = await this.deps.repo.enrollFarmerInTraining(tx, trainingId, farmerId);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'FARMER',
        actionCode: 'learning.training.enroll',
        entityType: 'learning_training_enrollment',
        entityId: enrollment.id,
        after: enrollment,
      });

      return {
        trainingId: enrollment.training_id,
        farmerId: enrollment.farmer_id,
        enrolledAt: enrollment.enrolled_at,
      };
    });
  }

  async unenrollTraining(scope: ResolvedScope, trainingId: string) {
    const farmerId = scope.farmerId;
    if (!farmerId) {
      throw new AppError('FORBIDDEN', { detail: 'Only farmers can unenroll from trainings' });
    }

    return this.deps.runTx(async (tx) => {
      const training = await this.deps.repo.findTrainingById(tx, trainingId);
      if (!training) {
        throw new AppError('NOT_FOUND', { detail: 'Training workshop not found' });
      }

      await this.deps.repo.unenrollFarmerFromTraining(tx, trainingId, farmerId);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'FARMER',
        actionCode: 'learning.training.unenroll',
        entityType: 'learning_training_enrollment',
        entityId: null,
        before: { trainingId, farmerId },
      });
    });
  }

  // ── Groups ─────────────────────────────────────────────────────────────────
  async listGroups(query: ListGroupsQuery, farmerId?: string) {
    const { rows, total } = await this.deps.repo.findGroups(this.deps.db, {
      ...query,
      farmerId,
    });
    return {
      items: rows.map(mapGroup),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async createGroup(scope: ResolvedScope, body: CreateGroupBody) {
    return this.deps.runTx(async (tx) => {
      const created = await this.deps.repo.createGroup(tx, body);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'learning.group.create',
        entityType: 'learning_group',
        entityId: created.id,
        after: created,
      });
      return mapGroup(created);
    });
  }

  async updateGroup(scope: ResolvedScope, id: string, patch: UpdateGroupBody) {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findGroupById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Learning group not found' });
      }
      const updated = await this.deps.repo.updateGroup(tx, id, patch);
      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: 'Learning group not found' });
      }
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'learning.group.update',
        entityType: 'learning_group',
        entityId: updated.id,
        before,
        after: updated,
        changedFields: changedFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
      });
      return mapGroup(updated);
    });
  }

  async deleteGroup(scope: ResolvedScope, id: string) {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findGroupById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Learning group not found' });
      }
      await this.deps.repo.deleteGroup(tx, id);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'TOHFA_ADMIN',
        actionCode: 'learning.group.delete',
        entityType: 'learning_group',
        entityId: id,
        before,
      });
    });
  }

  async joinGroup(scope: ResolvedScope, groupId: string) {
    const farmerId = scope.farmerId;
    if (!farmerId) {
      throw new AppError('FORBIDDEN', { detail: 'Only farmers can join community groups' });
    }

    return this.deps.runTx(async (tx) => {
      const group = await this.deps.repo.findGroupById(tx, groupId);
      if (!group) {
        throw new AppError('NOT_FOUND', { detail: 'Community group not found' });
      }

      const membership = await this.deps.repo.joinGroup(tx, groupId, farmerId);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'FARMER',
        actionCode: 'learning.group.join',
        entityType: 'learning_group_membership',
        entityId: membership.id,
        after: membership,
      });

      return {
        groupId: membership.group_id,
        farmerId: membership.farmer_id,
        joinedAt: membership.joined_at,
      };
    });
  }

  async leaveGroup(scope: ResolvedScope, groupId: string) {
    const farmerId = scope.farmerId;
    if (!farmerId) {
      throw new AppError('FORBIDDEN', { detail: 'Only farmers can leave community groups' });
    }

    return this.deps.runTx(async (tx) => {
      const group = await this.deps.repo.findGroupById(tx, groupId);
      if (!group) {
        throw new AppError('NOT_FOUND', { detail: 'Community group not found' });
      }

      await this.deps.repo.leaveGroup(tx, groupId, farmerId);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode ?? 'FARMER',
        actionCode: 'learning.group.leave',
        entityType: 'learning_group_membership',
        entityId: null,
        before: { groupId, farmerId },
      });
    });
  }
}

export function createLearningHubService(deps: LearningHubServiceDeps): LearningHubService {
  return new LearningHubService(deps);
}

export const learningHubService = new LearningHubService({
  repo: learningHubRepo,
  db: pool,
  runTx: withTransaction,
});
