import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  learningHubRepo,
  type ArticleRow,
  type ArticleSummaryRow,
  type EnrollmentRow,
  type GroupRow,
  type LearningHubRepo,
  type ReviewStatus,
  type TrainingRow,
  type VideoRow,
} from './learning-hub.repo.js';
import type {
  CreateArticleBody,
  CreateGroupBody,
  CreateTrainingBody,
  CreateVideoBody,
  LearningArticleResponse,
  LearningArticleSummaryResponse,
  LearningContentType,
  LearningGroupResponse,
  LearningTrainingResponse,
  LearningVideoResponse,
  ListAdminArticlesQuery,
  ListAdminGroupsQuery,
  ListAdminTrainingsQuery,
  ListAdminVideosQuery,
  ListArticlesQuery,
  ListGroupsQuery,
  ListTrainingsQuery,
  ListVideosQuery,
  ReviewContentBody,
  SubmitReviewBody,
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

function mapReviewFields(row: {
  review_status?: ReviewStatus | undefined;
  submitted_for_review_at?: string | null | undefined;
  reviewed_by?: string | null | undefined;
  reviewed_at?: string | null | undefined;
  review_note?: string | null | undefined;
}) {
  return {
    reviewStatus: row.review_status ?? 'NOT_SUBMITTED',
    submittedForReviewAt: row.submitted_for_review_at ?? null,
    reviewedBy: row.reviewed_by ?? null,
    reviewedAt: row.reviewed_at ?? null,
    reviewNote: row.review_note ?? null,
  };
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
    crops: row.crops ?? [],
    ...mapReviewFields(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapArticleSummary(row: ArticleSummaryRow): LearningArticleSummaryResponse {
  return {
    id: row.id,
    title: row.title,
    snippet: row.snippet,
    readTime: row.read_time,
    author: row.author,
    tag: row.tag,
    language: row.language,
    isPublished: row.is_published,
    crops: row.crops ?? [],
    ...mapReviewFields(row),
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
    crops: row.crops ?? [],
    ...mapReviewFields(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTraining(row: TrainingRow): LearningTrainingResponse {
  const result: LearningTrainingResponse = {
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
  if (row.review_status !== undefined) {
    Object.assign(result, mapReviewFields(row));
  }
  return result;
}

function mapAdminTraining(row: TrainingRow): LearningTrainingResponse {
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
    language: row.language,
    isPublished: row.is_published,
    ...mapReviewFields(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toEnrollmentResponse(row: EnrollmentRow) {
  return { trainingId: row.training_id, farmerId: row.farmer_id, enrolledAt: row.enrolled_at };
}

function mapGroup(row: GroupRow): LearningGroupResponse {
  const result: LearningGroupResponse = {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    memberCount: Number(row.member_count ?? 0),
    isJoined: row.is_joined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.community_id !== undefined) {
    result.communityId = row.community_id;
  }
  if (row.archived_at !== undefined) {
    result.archivedAt = row.archived_at;
    result.isArchived = Boolean(row.archived_at);
  }
  if (row.review_status !== undefined) {
    Object.assign(result, mapReviewFields(row));
  }
  return result;
}

function mapAdminGroup(row: GroupRow): LearningGroupResponse {
  const result: LearningGroupResponse = {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    memberCount: Number(row.member_count ?? 0),
    isArchived: Boolean(row.archived_at),
    archivedAt: row.archived_at ?? null,
    ...mapReviewFields(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.community_id !== undefined) {
    result.communityId = row.community_id;
  }
  return result;
}

export class LearningHubService {
  constructor(private readonly deps: LearningHubServiceDeps) {}

  /**
   * BR-59r: turns the request's `cropIds` into the set to store.
   *
   * Returns `undefined` when the caller omitted the field — the signal to leave
   * the existing tags untouched, the same contract every other optional field
   * in this module's PATCH bodies follows. `[]` means clear.
   *
   * Duplicates inside one request are collapsed (the join table's primary key
   * would reject them, and an admin picking the same chip twice means one tag,
   * not an error). An id that is not a live `crop_master` row is a 422 naming
   * the offenders: dropping it silently would show the admin a saved form with
   * fewer chips than they picked and no explanation.
   */
  private async resolveCropIds(db: Executor, cropIds: string[] | undefined): Promise<string[] | undefined> {
    if (cropIds === undefined) return undefined;
    const unique = [...new Set(cropIds)];
    if (unique.length === 0) return [];

    const live = new Set(await this.deps.repo.findLiveCropIds(db, unique));
    const unknown = unique.filter((id) => !live.has(id));
    if (unknown.length > 0) {
      throw new AppError('VALIDATION_FAILED', {
        detail: `Unknown or deleted crop id(s): ${unknown.join(', ')}`,
      });
    }
    return unique;
  }

  // ── Articles ───────────────────────────────────────────────────────────────
  async listArticles(query: ListArticlesQuery) {
    const { rows, total } = await this.deps.repo.findArticles(this.deps.db, {
      ...query,
      publishedOnly: true,
    });
    return {
      items: rows.map(mapArticleSummary),
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
      // Validated before the INSERT so a bad crop id costs one SELECT, not a
      // write that has to be rolled back.
      const cropIds = await this.resolveCropIds(tx, body.cropIds);
      const created = await this.deps.repo.createArticle(tx, body);
      const row = cropIds === undefined
        ? created
        : { ...created, crops: await this.deps.repo.replaceArticleCrops(tx, created.id, cropIds) };
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'learning.article.create',
        entityType: 'learning_article',
        entityId: row.id,
        after: row,
      });
      return mapArticle(row);
    });
  }

  async updateArticle(scope: ResolvedScope, id: string, patch: UpdateArticleBody) {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findArticleById(tx, id, false);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Learning article not found' });
      }
      const cropIds = await this.resolveCropIds(tx, patch.cropIds);
      const updated = await this.deps.repo.updateArticle(tx, id, patch);
      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: 'Learning article not found' });
      }
      // Omitted cropIds leaves the tags alone; `[]` clears them (BR-59r).
      const after = cropIds === undefined
        ? updated
        : { ...updated, crops: await this.deps.repo.replaceArticleCrops(tx, id, cropIds) };
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'learning.article.update',
        entityType: 'learning_article',
        entityId: after.id,
        before,
        after,
        changedFields: changedFields(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>),
      });
      return mapArticle(after);
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
        actorRole: scope.roleCode,
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
      const cropIds = await this.resolveCropIds(tx, body.cropIds);
      const created = await this.deps.repo.createVideo(tx, body);
      const row = cropIds === undefined
        ? created
        : { ...created, crops: await this.deps.repo.replaceVideoCrops(tx, created.id, cropIds) };
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'learning.video.create',
        entityType: 'learning_video',
        entityId: row.id,
        after: row,
      });
      return mapVideo(row);
    });
  }

  async updateVideo(scope: ResolvedScope, id: string, patch: UpdateVideoBody) {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findVideoById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Learning video not found' });
      }
      const cropIds = await this.resolveCropIds(tx, patch.cropIds);
      const updated = await this.deps.repo.updateVideo(tx, id, patch);
      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: 'Learning video not found' });
      }
      // Omitted cropIds leaves the tags alone; `[]` clears them (BR-59r).
      const after = cropIds === undefined
        ? updated
        : { ...updated, crops: await this.deps.repo.replaceVideoCrops(tx, id, cropIds) };
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'learning.video.update',
        entityType: 'learning_video',
        entityId: after.id,
        before,
        after,
        changedFields: changedFields(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>),
      });
      return mapVideo(after);
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
        actorRole: scope.roleCode,
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
        actorRole: scope.roleCode,
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
      // Same lock enrolment takes: an enrolment cannot slip in between the
      // headcount check below and the capacity UPDATE.
      const locked = await this.deps.repo.lockTraining(tx, id);
      if (!locked) {
        throw new AppError('NOT_FOUND', { detail: 'Learning training not found' });
      }
      const before = await this.deps.repo.findTrainingById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Learning training not found' });
      }
      if (typeof patch.capacity === 'number') {
        const enrolled = await this.deps.repo.countTrainingEnrollments(tx, id);
        if (patch.capacity < enrolled) {
          throw new AppError('CONFLICT', {
            detail: `Capacity cannot be lowered to ${patch.capacity}: ${enrolled} farmers are already enrolled`,
          });
        }
      }
      const updated = await this.deps.repo.updateTraining(tx, id, patch);
      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: 'Learning training not found' });
      }
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
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
        actorRole: scope.roleCode,
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
      const training = await this.deps.repo.lockTraining(tx, trainingId);
      if (!training || !training.is_published) {
        throw new AppError('NOT_FOUND', { detail: 'Training workshop not found' });
      }

      // A replay returns the original enrolment and writes nothing: no new row,
      // no audit entry, and no capacity check (the seat is already theirs).
      const existing = await this.deps.repo.findEnrollment(tx, trainingId, farmerId);
      if (existing) return toEnrollmentResponse(existing);

      if (training.capacity !== null) {
        const count = await this.deps.repo.countTrainingEnrollments(tx, trainingId);
        if (count >= training.capacity) {
          throw new AppError('TRAINING_FULL', { detail: 'Training has reached full capacity' });
        }
      }

      const enrollment = await this.deps.repo.enrollFarmerInTraining(tx, trainingId, farmerId);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'learning.training.enroll',
        entityType: 'learning_training_enrollment',
        entityId: enrollment.id,
        after: enrollment,
      });

      return toEnrollmentResponse(enrollment);
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

      // Only a real removal is audited; leaving a training you are not in is a no-op.
      const removed = await this.deps.repo.unenrollFarmerFromTraining(tx, trainingId, farmerId);
      if (!removed) return;
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
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
        actorRole: scope.roleCode,
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
        actorRole: scope.roleCode,
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
      const memberCount = await this.deps.repo.countGroupMembers(tx, id);
      if (memberCount > 0) {
        throw new AppError('CONFLICT', {
          detail: 'Cannot delete group with active members. Archive it instead.',
        });
      }
      await this.deps.repo.deleteGroup(tx, id);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'learning.group.delete',
        entityType: 'learning_group',
        entityId: id,
        before,
      });
    });
  }

  async archiveGroup(scope: ResolvedScope, id: string) {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findGroupById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Learning group not found' });
      }
      const updated = await this.deps.repo.archiveGroup(tx, id);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'learning.group.archive',
        entityType: 'learning_group',
        entityId: id,
        before,
        after: updated,
      });
      return mapAdminGroup(updated!);
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

      const { membership, created } = await this.deps.repo.joinGroup(tx, groupId, farmerId);
      // A replayed join returns the existing membership and is not audited.
      if (created) {
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'learning.group.join',
          entityType: 'learning_group_membership',
          entityId: membership.id,
          after: membership,
        });
      }

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

      const removed = await this.deps.repo.leaveGroup(tx, groupId, farmerId);
      if (!removed) return;
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'learning.group.leave',
        entityType: 'learning_group_membership',
        entityId: null,
        before: { groupId, farmerId },
      });
    });
  }

  // ── Admin Reads & Farmer Group Detail ──────────────────────────────────────
  async listAdminArticles(query: ListAdminArticlesQuery) {
    const { rows, total } = await this.deps.repo.findArticles(this.deps.db, {
      ...query,
      publishedOnly: false,
    });
    return {
      items: rows.map(mapArticleSummary),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getAdminArticle(id: string) {
    const row = await this.deps.repo.findArticleById(this.deps.db, id, false);
    if (!row) {
      throw new AppError('NOT_FOUND', { detail: 'Learning article not found' });
    }
    return mapArticle(row);
  }

  async listAdminVideos(query: ListAdminVideosQuery) {
    const { rows, total } = await this.deps.repo.findVideos(this.deps.db, {
      ...query,
      publishedOnly: false,
    });
    return {
      items: rows.map(mapVideo),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getAdminVideo(id: string) {
    const row = await this.deps.repo.findVideoById(this.deps.db, id);
    if (!row) {
      throw new AppError('NOT_FOUND', { detail: 'Learning video not found' });
    }
    return mapVideo(row);
  }

  async listAdminTrainings(query: ListAdminTrainingsQuery) {
    const { rows, total } = await this.deps.repo.findTrainings(this.deps.db, {
      ...query,
      publishedOnly: false,
    });
    return {
      items: rows.map(mapAdminTraining),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getAdminTraining(id: string) {
    const row = await this.deps.repo.findTrainingById(this.deps.db, id);
    if (!row) {
      throw new AppError('NOT_FOUND', { detail: 'Learning training not found' });
    }
    return mapAdminTraining(row);
  }

  async listAdminGroups(query: ListAdminGroupsQuery) {
    const { rows, total } = await this.deps.repo.findGroups(this.deps.db, {
      ...query,
    });
    return {
      items: rows.map(mapAdminGroup),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getAdminGroup(id: string) {
    const row = await this.deps.repo.findGroupById(this.deps.db, id);
    if (!row) {
      throw new AppError('NOT_FOUND', { detail: 'Learning group not found' });
    }
    return mapAdminGroup(row);
  }

  async getFarmerGroup(farmerId: string, id: string) {
    const row = await this.deps.repo.findGroupById(this.deps.db, id, farmerId);
    if (!row) {
      throw new AppError('NOT_FOUND', { detail: 'Learning group not found' });
    }
    return mapGroup(row);
  }

  // ── Content Review Workflow (BR-59t) ──────────────────────────────────────
  async submitReview(
    scope: ResolvedScope,
    type: LearningContentType,
    id: string,
    body?: SubmitReviewBody,
  ): Promise<LearningArticleResponse | LearningVideoResponse | LearningTrainingResponse | LearningGroupResponse> {
    return this.deps.runTx(async (tx) => {
      let before: ArticleRow | VideoRow | TrainingRow | GroupRow | null = null;
      if (type === 'articles') before = await this.deps.repo.findArticleById(tx, id, false);
      else if (type === 'videos') before = await this.deps.repo.findVideoById(tx, id);
      else if (type === 'trainings') before = await this.deps.repo.findTrainingById(tx, id);
      else if (type === 'groups') before = await this.deps.repo.findGroupById(tx, id);

      if (!before) {
        throw new AppError('NOT_FOUND', { detail: `${type.slice(0, -1)} not found` });
      }

      const updated = await this.deps.repo.submitReview(tx, type, id, body?.note);
      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: `${type.slice(0, -1)} not found` });
      }

      const singular = type === 'articles' ? 'article' : type === 'videos' ? 'video' : type === 'trainings' ? 'training' : 'group';
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: `learning.${singular}.submit_review`,
        entityType: `learning_${singular}`,
        entityId: id,
        before,
        after: updated,
        changedFields: changedFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
      });

      if (type === 'articles') return mapArticle(updated as ArticleRow);
      if (type === 'videos') return mapVideo(updated as VideoRow);
      if (type === 'trainings') return mapAdminTraining(updated as TrainingRow);
      return mapAdminGroup(updated as GroupRow);
    });
  }

  async reviewContent(
    scope: ResolvedScope,
    type: LearningContentType,
    id: string,
    body: ReviewContentBody,
  ): Promise<LearningArticleResponse | LearningVideoResponse | LearningTrainingResponse | LearningGroupResponse> {
    return this.deps.runTx(async (tx) => {
      let before: ArticleRow | VideoRow | TrainingRow | GroupRow | null = null;
      if (type === 'articles') before = await this.deps.repo.findArticleById(tx, id, false);
      else if (type === 'videos') before = await this.deps.repo.findVideoById(tx, id);
      else if (type === 'trainings') before = await this.deps.repo.findTrainingById(tx, id);
      else if (type === 'groups') before = await this.deps.repo.findGroupById(tx, id);

      if (!before) {
        throw new AppError('NOT_FOUND', { detail: `${type.slice(0, -1)} not found` });
      }

      const updated = await this.deps.repo.reviewContent(tx, type, id, body.status, scope.userId, body.note);
      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: `${type.slice(0, -1)} not found` });
      }

      const singular = type === 'articles' ? 'article' : type === 'videos' ? 'video' : type === 'trainings' ? 'training' : 'group';
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: `learning.${singular}.review`,
        entityType: `learning_${singular}`,
        entityId: id,
        before,
        after: updated,
        changedFields: changedFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
      });

      if (type === 'articles') return mapArticle(updated as ArticleRow);
      if (type === 'videos') return mapVideo(updated as VideoRow);
      if (type === 'trainings') return mapAdminTraining(updated as TrainingRow);
      return mapAdminGroup(updated as GroupRow);
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
