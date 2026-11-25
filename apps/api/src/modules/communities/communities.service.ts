/**
 * Communities service (Antigravity Brief 01 / BR-59s).
 * Business logic layer for WhatsApp-style community containers.
 */
import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type { LearningGroupResponse } from '../learning-hub/learning-hub.schema.js';
import type { GroupRow } from '../learning-hub/learning-hub.repo.js';
import {
  communitiesRepo,
  type CommunitiesRepo,
  type CommunityMemberRow,
  type CommunityRow,
} from './communities.repo.js';
import type {
  CommunitiesListResponse,
  CommunityGroupsListResponse,
  CommunityGroupsQuery,
  CommunityMemberResponse,
  CommunityMembersListResponse,
  CommunityMembersQuery,
  CommunityResponse,
  CreateCommunityBody,
  ListCommunitiesQuery,
  UpdateCommunityBody,
} from './communities.schema.js';

export function mapCommunity(row: CommunityRow): CommunityResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    rules: row.rules,
    isArchived: Boolean(row.is_archived || row.archived_at),
    archivedAt: row.archived_at,
    groupCount: Number(row.group_count ?? 0),
    memberCount: Number(row.member_count ?? 0),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCommunityGroup(row: GroupRow): LearningGroupResponse {
  const result: LearningGroupResponse = {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    memberCount: Number(row.member_count ?? 0),
    communityId: row.community_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.is_joined !== undefined) {
    result.isJoined = row.is_joined;
  }
  if (row.archived_at !== undefined) {
    result.archivedAt = row.archived_at;
    result.isArchived = Boolean(row.archived_at);
  }
  return result;
}

export function mapCommunityMember(row: CommunityMemberRow): CommunityMemberResponse {
  return {
    farmerId: row.farmer_id,
    farmerName: row.farmer_name,
    phone: row.phone,
    village: row.village,
    joinedAt: row.joined_at,
    groupCount: Number(row.group_count ?? 0),
    groups: row.groups ?? [],
  };
}

export interface CommunitiesServiceDeps {
  db: Executor;
  runTx: typeof withTransaction;
  repo: CommunitiesRepo;
}

export class CommunitiesService {
  constructor(
    private readonly deps: CommunitiesServiceDeps = {
      db: pool,
      runTx: withTransaction,
      repo: communitiesRepo,
    },
  ) {}

  async listCommunities(query: ListCommunitiesQuery): Promise<CommunitiesListResponse> {
    const { rows, total } = await this.deps.repo.findCommunities(this.deps.db, query);
    return {
      items: rows.map(mapCommunity),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getCommunity(id: string): Promise<CommunityResponse> {
    const row = await this.deps.repo.findCommunityById(this.deps.db, id);
    if (!row) {
      throw new AppError('NOT_FOUND', { detail: 'Community not found' });
    }
    return mapCommunity(row);
  }

  async createCommunity(
    scope: ResolvedScope,
    body: CreateCommunityBody,
  ): Promise<CommunityResponse> {
    return this.deps.runTx(async (tx) => {
      const created = await this.deps.repo.createCommunity(tx, body, scope.userId);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'community.create',
        entityType: 'community',
        entityId: created.id,
        after: created,
      });
      return mapCommunity(created);
    });
  }

  async updateCommunity(
    scope: ResolvedScope,
    id: string,
    patch: UpdateCommunityBody,
  ): Promise<CommunityResponse> {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findCommunityById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Community not found' });
      }

      const updated = await this.deps.repo.updateCommunity(tx, id, patch);
      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: 'Community not found' });
      }

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'community.update',
        entityType: 'community',
        entityId: id,
        before,
        after: updated,
        changedFields: changedFields(
          before as unknown as Record<string, unknown>,
          updated as unknown as Record<string, unknown>,
        ),
      });

      return mapCommunity(updated);
    });
  }

  async archiveCommunity(scope: ResolvedScope, id: string): Promise<CommunityResponse> {
    return this.deps.runTx(async (tx) => {
      const before = await this.deps.repo.findCommunityById(tx, id);
      if (!before) {
        throw new AppError('NOT_FOUND', { detail: 'Community not found' });
      }

      const updated = await this.deps.repo.archiveCommunity(tx, id);
      if (!updated) {
        throw new AppError('NOT_FOUND', { detail: 'Community not found' });
      }

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'community.archive',
        entityType: 'community',
        entityId: id,
        before,
        after: updated,
        changedFields: changedFields(
          before as unknown as Record<string, unknown>,
          updated as unknown as Record<string, unknown>,
        ),
      });

      return mapCommunity(updated);
    });
  }

  async listCommunityGroups(
    id: string,
    query: CommunityGroupsQuery,
  ): Promise<CommunityGroupsListResponse> {
    const community = await this.deps.repo.findCommunityById(this.deps.db, id);
    if (!community) {
      throw new AppError('NOT_FOUND', { detail: 'Community not found' });
    }

    const { rows, total } = await this.deps.repo.findCommunityGroups(this.deps.db, id, query);
    return {
      items: rows.map(mapCommunityGroup),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async listCommunityMembers(
    id: string,
    query: CommunityMembersQuery,
  ): Promise<CommunityMembersListResponse> {
    const community = await this.deps.repo.findCommunityById(this.deps.db, id);
    if (!community) {
      throw new AppError('NOT_FOUND', { detail: 'Community not found' });
    }

    const { rows, total } = await this.deps.repo.findCommunityMembers(this.deps.db, id, query);
    return {
      items: rows.map(mapCommunityMember),
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}

export const communitiesService = new CommunitiesService();
