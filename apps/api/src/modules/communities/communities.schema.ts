/**
 * Communities schemas (Antigravity Brief 01 / BR-59s).
 * Single source of truth for community requests and responses.
 */
import { z } from 'zod';
import { learningGroupResponse } from '../learning-hub/learning-hub.schema.js';

export const communityIdParams = z
  .object({
    id: z.string().uuid('community id must be a UUID'),
  })
  .strict();
export type CommunityIdParams = z.infer<typeof communityIdParams>;

export const listCommunitiesQuery = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: z.string().trim().max(100).optional(),
    isArchived: z
      .preprocess((val) => {
        if (typeof val === 'string') {
          if (val === 'true') return true;
          if (val === 'false') return false;
        }
        return val;
      }, z.boolean().optional()),
    q: z.string().trim().min(1).max(80).optional(),
    sort: z.enum(['name', 'members', 'groups', 'createdAt']).optional(),
  })
  .strict();
export type ListCommunitiesQuery = z.infer<typeof listCommunitiesQuery>;

export const createCommunityBody = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).nullable().optional(),
    category: z.string().trim().min(1).max(100),
    rules: z.string().trim().max(4000).nullable().optional(),
  })
  .strict();
export type CreateCommunityBody = z.infer<typeof createCommunityBody>;

export const updateCommunityBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    category: z.string().trim().min(1).max(100).optional(),
    rules: z.string().trim().max(4000).nullable().optional(),
  })
  .strict();
export type UpdateCommunityBody = z.infer<typeof updateCommunityBody>;

export const communityResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  rules: z.string().nullable().optional(),
  isArchived: z.boolean(),
  archivedAt: z.string().nullable(),
  groupCount: z.number(),
  memberCount: z.number(),
  createdBy: z.string().uuid().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CommunityResponse = z.infer<typeof communityResponse>;

export const communitiesListResponse = z.object({
  items: z.array(communityResponse),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type CommunitiesListResponse = z.infer<typeof communitiesListResponse>;

export const communityGroupsQuery = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type CommunityGroupsQuery = z.infer<typeof communityGroupsQuery>;

export const communityGroupsListResponse = z.object({
  items: z.array(learningGroupResponse),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type CommunityGroupsListResponse = z.infer<typeof communityGroupsListResponse>;

export const communityMembersQuery = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().min(1).max(80).optional(),
  })
  .strict();
export type CommunityMembersQuery = z.infer<typeof communityMembersQuery>;

export const communityMemberGroupItem = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
export type CommunityMemberGroupItem = z.infer<typeof communityMemberGroupItem>;

export const communityMemberResponse = z.object({
  farmerId: z.string().uuid(),
  farmerName: z.string(),
  phone: z.string(),
  village: z.string().nullable(),
  joinedAt: z.string(),
  groupCount: z.number(),
  groups: z.array(communityMemberGroupItem),
});
export type CommunityMemberResponse = z.infer<typeof communityMemberResponse>;

export const communityMembersListResponse = z.object({
  items: z.array(communityMemberResponse),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type CommunityMembersListResponse = z.infer<typeof communityMembersListResponse>;
