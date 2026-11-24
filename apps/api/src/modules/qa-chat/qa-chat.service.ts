/**
 * Q&A Chat service (Antigravity Brief 03 / BR-59u).
 * Business logic layer for Q&A questions, answers, and moderation.
 */
import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  qaChatRepo,
  type QaAnswerRow,
  type QaAuthorRow,
  type QaChatRepo,
  type QaQuestionRow,
} from './qa-chat.repo.js';
import type {
  AskQuestionBody,
  ListQuestionsQuery,
  ListQuestionsResponse,
  ModerateContentBody,
  PostAnswerBody,
  QaAnswerResponse,
  QaAuthorResponse,
  QaQuestionDetailResponse,
  QaQuestionSummaryResponse,
  UpdateAnswerBody,
  UpdateQuestionBody,
} from './qa-chat.schema.js';

export const BLOCKED_MASKED_CONTENT = '[This message has been blocked by a moderator]';

export function isModeratorScope(scope?: ResolvedScope): boolean {
  if (!scope) return false;
  return (
    scope.roleCode === 'SUPER_ADMIN' ||
    scope.roleCode === 'TOHFA_ADMIN' ||
    scope.permission === 'community.group.moderate'
  );
}

export function mapAuthor(row: QaAuthorRow): QaAuthorResponse {
  return {
    id: row.author_user_id,
    displayName: row.author_name,
    role: row.author_role,
  };
}

export function mapQuestionSummary(row: QaQuestionRow, isModerator: boolean): QaQuestionSummaryResponse {
  const content = row.is_blocked && !isModerator ? BLOCKED_MASKED_CONTENT : row.content;
  return {
    id: row.id,
    communityId: row.community_id,
    contentType: row.content_type,
    contentId: row.content_id,
    title: row.title,
    content,
    author: mapAuthor(row),
    answerCount: Number(row.answer_count ?? 0),
    isBlocked: row.is_blocked,
    blockReason: isModerator ? row.block_reason : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAnswer(row: QaAnswerRow, isModerator: boolean): QaAnswerResponse {
  const content = row.is_blocked && !isModerator ? BLOCKED_MASKED_CONTENT : row.content;
  return {
    id: row.id,
    questionId: row.question_id,
    content,
    author: mapAuthor(row),
    isBlocked: row.is_blocked,
    blockReason: isModerator ? row.block_reason : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface QaChatServiceDeps {
  repo: QaChatRepo;
  db: Executor;
  runTx<T>(fn: (tx: Executor) => Promise<T>): Promise<T>;
}

export class QaChatService {
  constructor(private readonly deps: QaChatServiceDeps) {}

  async listQuestions(scope: ResolvedScope, query: ListQuestionsQuery): Promise<ListQuestionsResponse> {
    const isMod = isModeratorScope(scope);
    const { rows, total } = await this.deps.repo.findQuestions(this.deps.db, {
      page: query.page,
      limit: query.limit,
      communityId: query.communityId,
      contentType: query.contentType,
      contentId: query.contentId,
      q: query.q,
      authorUserId: query.authorUserId,
    });

    return {
      items: rows.map((r) => mapQuestionSummary(r, isMod)),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getQuestion(scope: ResolvedScope, id: string): Promise<QaQuestionDetailResponse> {
    const isMod = isModeratorScope(scope);
    const question = await this.deps.repo.findQuestionById(this.deps.db, id);
    if (!question) {
      throw new AppError('NOT_FOUND', { detail: 'Question not found' });
    }

    const answers = await this.deps.repo.findAnswersByQuestionId(this.deps.db, id);

    return {
      ...mapQuestionSummary(question, isMod),
      answers: answers.map((a) => mapAnswer(a, isMod)),
    };
  }

  async askQuestion(scope: ResolvedScope, body: AskQuestionBody): Promise<QaQuestionSummaryResponse> {
    const created = await this.deps.repo.createQuestion(this.deps.db, {
      communityId: body.communityId,
      contentType: body.contentType,
      contentId: body.contentId,
      title: body.title,
      content: body.content,
      authorUserId: scope.userId,
    });
    return mapQuestionSummary(created, isModeratorScope(scope));
  }

  async updateQuestion(
    scope: ResolvedScope,
    id: string,
    patch: UpdateQuestionBody,
  ): Promise<QaQuestionSummaryResponse> {
    const existing = await this.deps.repo.findQuestionById(this.deps.db, id);
    if (!existing) {
      throw new AppError('NOT_FOUND', { detail: 'Question not found' });
    }

    // Ownership check: only author (or Super Admin) may edit
    if (existing.author_user_id !== scope.userId && scope.roleCode !== 'SUPER_ADMIN') {
      throw new AppError('FORBIDDEN', { detail: 'Cannot edit another user question' });
    }

    const updated = await this.deps.repo.updateQuestion(this.deps.db, id, patch);
    if (!updated) {
      throw new AppError('NOT_FOUND', { detail: 'Question not found' });
    }

    return mapQuestionSummary(updated, isModeratorScope(scope));
  }

  async deleteQuestion(scope: ResolvedScope, id: string): Promise<void> {
    const existing = await this.deps.repo.findQuestionById(this.deps.db, id);
    if (!existing) {
      throw new AppError('NOT_FOUND', { detail: 'Question not found' });
    }

    // Ownership or moderator check
    const isMod = isModeratorScope(scope);
    if (existing.author_user_id !== scope.userId && !isMod) {
      throw new AppError('FORBIDDEN', { detail: 'Cannot delete another user question' });
    }

    if (isMod && existing.author_user_id !== scope.userId) {
      // Admin moderation action: log audit
      await this.deps.runTx(async (tx) => {
        await this.deps.repo.softDeleteQuestion(tx, id);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'qa.question.delete',
          entityType: 'qa_question',
          entityId: id,
          before: existing,
        });
      });
    } else {
      await this.deps.repo.softDeleteQuestion(this.deps.db, id);
    }
  }

  async moderateQuestion(
    scope: ResolvedScope,
    id: string,
    patch: ModerateContentBody,
  ): Promise<QaQuestionSummaryResponse> {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findQuestionById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Question not found' });
      }

      const updated = await this.deps.repo.moderateQuestion(tx, id, {
        isBlocked: patch.isBlocked,
        blockReason: patch.blockReason,
        softDelete: patch.softDelete,
        moderatorUserId: scope.userId,
      });

      if (!updated && patch.softDelete) {
        // If soft-deleted, it was deleted
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'qa.question.moderate',
          entityType: 'qa_question',
          entityId: id,
          before,
        });
        return {
          ...mapQuestionSummary(before, true),
          isBlocked: patch.isBlocked ?? before.is_blocked,
        };
      }

      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: 'Question not found' });
      }

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'qa.question.moderate',
        entityType: 'qa_question',
        entityId: id,
        before,
        after: updated,
        changedFields: changedFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
      });

      return mapQuestionSummary(updated, true);
    });
  }

  async postAnswer(scope: ResolvedScope, questionId: string, body: PostAnswerBody): Promise<QaAnswerResponse> {
    const question = await this.deps.repo.findQuestionById(this.deps.db, questionId);
    if (!question) {
      throw new AppError('NOT_FOUND', { detail: 'Question not found' });
    }

    const created = await this.deps.repo.createAnswer(this.deps.db, {
      questionId,
      content: body.content,
      authorUserId: scope.userId,
    });
    return mapAnswer(created, isModeratorScope(scope));
  }

  async updateAnswer(
    scope: ResolvedScope,
    id: string,
    patch: UpdateAnswerBody,
  ): Promise<QaAnswerResponse> {
    const existing = await this.deps.repo.findAnswerById(this.deps.db, id);
    if (!existing) {
      throw new AppError('NOT_FOUND', { detail: 'Answer not found' });
    }

    // Ownership check: only author (or Super Admin) may edit
    if (existing.author_user_id !== scope.userId && scope.roleCode !== 'SUPER_ADMIN') {
      throw new AppError('FORBIDDEN', { detail: 'Cannot edit another user answer' });
    }

    const updated = await this.deps.repo.updateAnswer(this.deps.db, id, patch);
    if (!updated) {
      throw new AppError('NOT_FOUND', { detail: 'Answer not found' });
    }

    return mapAnswer(updated, isModeratorScope(scope));
  }

  async deleteAnswer(scope: ResolvedScope, id: string): Promise<void> {
    const existing = await this.deps.repo.findAnswerById(this.deps.db, id);
    if (!existing) {
      throw new AppError('NOT_FOUND', { detail: 'Answer not found' });
    }

    // Ownership or moderator check
    const isMod = isModeratorScope(scope);
    if (existing.author_user_id !== scope.userId && !isMod) {
      throw new AppError('FORBIDDEN', { detail: 'Cannot delete another user answer' });
    }

    if (isMod && existing.author_user_id !== scope.userId) {
      // Admin moderation action: log audit
      await this.deps.runTx(async (tx) => {
        await this.deps.repo.softDeleteAnswer(tx, id);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'qa.answer.delete',
          entityType: 'qa_answer',
          entityId: id,
          before: existing,
        });
      });
    } else {
      await this.deps.repo.softDeleteAnswer(this.deps.db, id);
    }
  }

  async moderateAnswer(
    scope: ResolvedScope,
    id: string,
    patch: ModerateContentBody,
  ): Promise<QaAnswerResponse> {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findAnswerById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Answer not found' });
      }

      const updated = await this.deps.repo.moderateAnswer(tx, id, {
        isBlocked: patch.isBlocked,
        blockReason: patch.blockReason,
        softDelete: patch.softDelete,
        moderatorUserId: scope.userId,
      });

      if (!updated && patch.softDelete) {
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'qa.answer.moderate',
          entityType: 'qa_answer',
          entityId: id,
          before,
        });
        return {
          ...mapAnswer(before, true),
          isBlocked: patch.isBlocked ?? before.is_blocked,
        };
      }

      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: 'Answer not found' });
      }

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'qa.answer.moderate',
        entityType: 'qa_answer',
        entityId: id,
        before,
        after: updated,
        changedFields: changedFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
      });

      return mapAnswer(updated, true);
    });
  }
}

export function createQaChatService(overrides?: Partial<QaChatServiceDeps>): QaChatService {
  return new QaChatService({
    repo: overrides?.repo ?? qaChatRepo,
    db: overrides?.db ?? pool,
    runTx: overrides?.runTx ?? withTransaction,
  });
}

export const qaChatService = createQaChatService();
